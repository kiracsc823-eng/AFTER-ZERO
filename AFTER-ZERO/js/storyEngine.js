/* ============================================================
   AFTER ZERO — storyEngine.js
   Runs scenes. A scene is JSON:
     { id, location, mood, chars:[{id,pos,expr}],
       lines:[{who,text,if,fearText}], onEnter:{effects}, onEnterIf:[{if,effects}],
       choices:[{id,text,if,tags,once,time,effects,next,result}] }
   Scenes come from data/story_*.js (authored) or from AZ.Events (procedural).
   The engine never assumes which; it only needs the shape above.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State, cfg = () => AZ.data.config;

  const Story = AZ.Story = {
    view: null,

    /** Find a scene by id: authored first, then the current generated scene. */
    resolve(id) {
      const tl = S().tl;
      if (tl.genScene && tl.genScene.id === id) return tl.genScene;
      return AZ.data.story.scenes[id] || null;
    },

    /** Begin / resume play with whatever state is live. */
    start(resume) {
      const tl = S().tl;
      Story.enterScene(tl.sceneId, { resume: !!resume });
    },

    /** Safe place to land when a scene id is missing. */
    fallbackScene() {
      const tl = S().tl;
      if (tl.chapter >= 2 || tl.flags.chapter1_done) return '@hub';
      if (S().checkpoint && Story.resolve(S().checkpoint.sceneId)) return S().checkpoint.sceneId;
      return cfg().startScene;
    },

    enterScene(id, opts) {
      opts = opts || {};
      const tl = S().tl;

      // Procedural entry points.
      if (id === '@hub') { tl.genScene = AZ.Events.makeHub(); id = tl.genScene.id; }
      else if (typeof id === 'string' && id.indexOf('@event:') === 0) { tl.genScene = AZ.Events.makeEvent(id.slice(7)); id = tl.genScene.id; }

      let scene = Story.resolve(id);
      if (!scene) {
        AZ.warn('Missing scene "' + id + '" — using fallback.');
        const fb = Story.fallbackScene();
        if (fb === id) { return Story._emergency(); }
        return Story.enterScene(fb, opts);
      }
      if (scene.generate === 'hub' && !opts.resume) { return Story.enterScene('@hub', opts); }

      tl.sceneId = id;
      tl.visited[id] = true;
      S().meta.seenScenes[id] = (S().meta.seenScenes[id] || 0) + 1;
      if (scene.location && AZ.data.locations[scene.location]) tl.location = scene.location;

      if (!opts.resume) {
        const ctx = AZ.Choice.apply(scene.onEnter);
        (scene.onEnterIf || []).forEach((b) => { if (AZ.Choice.check(b.if)) AZ.Choice.apply(b.effects, ctx); });
        Story._after(ctx, null, false);
        if (tl.dying) return;                        // died during entry effects
        if (ctx.goto) return Story.enterScene(ctx.goto, {});
        Story._emitNotes(ctx);
        if (ctx.checkpoint) AZ.Checkpoint.activate(ctx.checkpoint.id, ctx.checkpoint.kind);
      }

      Story.view = Story.buildView(scene);
      // Log each scene's lines once (a resume/reload of the same scene must not duplicate history).
      const logKey = id + '@' + tl.step;
      if (tl.loggedKey !== logKey) {
        for (const l of Story.view.lines) S().log({ t: 'line', who: l.who, text: l.text });
        tl.loggedKey = logKey;
      }
      AZ.bus.emit('scene', Story.view);
      if (!opts.resume && !tl.dying) AZ.Save.autosave();
    },

    /** Build what the UI needs: filtered lines, visible choices, mood. */
    buildView(scene) {
      const tl = S().tl, rules = cfg().rules;
      const vars = { deaths: S().meta.deaths, timeline: tl.n, knowledge: S().knowledgeCount(), oxygen: tl.clocks.oxygen === undefined ? '—' : tl.clocks.oxygen };
      const panic = tl.stats.fear >= rules.panicFear;
      const lines = [];
      (tl.intro || []).forEach((t) => lines.push({ who: '', text: U.tpl(t, vars), narration: true }));
      (scene.lines || []).forEach((l) => {
        if (!AZ.Choice.check(l.if)) return;
        let text = (panic && l.fearText) ? l.fearText : l.text;
        lines.push({ who: l.who || '', text: U.tpl(text, vars), sfx: l.sfx, glitch: panic && !!l.fearText, expr: l.expr });
      });
      if (!lines.length) lines.push({ who: '', text: '…', narration: true });

      const echoOn = S().getSettings().echoSense && S().meta.abilities.ab_echo;
      let choices = AZ.Choice.visible(scene).map((v) => ({
        index: v.index, key: v.key, id: v.choice.id || String(v.index),
        text: U.tpl(v.choice.text, vars),
        memory: /"(knows|ability)"/.test(JSON.stringify(v.choice.if || {})),
        echo: !!(echoOn && S().meta.fatalChoices[v.key]),
        tags: v.choice.tags || []
      }));
      if (!choices.length) {
        choices = [{ index: -1, key: scene.id + '#_continue', id: '_continue', text: 'Khud ko sambhalo aur aage badho.', memory: false, echo: false, tags: [] }];
      }
      const loc = AZ.data.locations[tl.location] || {};
      const mood = Object.assign({ music: 'calm', ambience: loc.ambience || 'wind', particles: 'dust' }, scene.mood || {});
      return {
        sceneId: scene.id, title: scene.title || '', location: tl.location, locationName: loc.name || '',
        bg: scene.bg || loc.scene || 'ruins', bgSeed: scene.bgSeed || tl.location,
        chars: (scene.chars || []).filter((c) => AZ.Choice.check(c.if)),
        lines, choices, mood, chapter: tl.chapter, panic, speaker: scene.speaker || null,
        generated: !!scene.generated, hub: !!scene.hub, ending: scene.ending || null
      };
    },

    /** Player picked the choice at view index `vi`. */
    choose(vi) {
      const view = Story.view, tl = S().tl;
      if (!view || tl.dying) return { ok: false };
      const vc = view.choices[vi];
      if (!vc) return { ok: false };
      const scene = Story.resolve(view.sceneId);
      if (!scene) return { ok: false };

      let choice = null;
      if (vc.index >= 0) choice = scene.choices[vc.index];
      // Defensive: re-validate (state may have changed since the view was built).
      if (choice && !AZ.Choice.available(scene, choice, vc.index)) return { ok: false };

      const key = vc.key;
      if (choice && choice.once) tl.once[key] = true;
      tl.lastChoiceKey = key;
      tl.intro = [];
      S().log({ t: 'choice', text: vc.text, scene: scene.id });

      const ctx = AZ.Choice.apply(choice ? choice.effects : null);
      Story.tick(choice ? (choice.time || 0) : 0, ctx);
      tl.step++;
      Story._runPending(ctx);

      let next = ctx.goto || (choice ? AZ.Choice.route(choice.next) : null) || (choice ? null : (scene.fallback || Story.fallbackScene()));
      if (choice && choice.result) tl.intro = [choice.result];
      if (ctx.texts && ctx.texts.length) tl.intro = (tl.intro || []).concat(ctx.texts);
      if (!next) next = scene.id;                      // stay on the same scene (hub-style)

      const died = Story._after(ctx, key, true);
      AZ.bus.emit('choice', { key, text: vc.text });
      if (died) return { ok: true, died: true };
      Story._emitNotes(ctx);
      Story.enterScene(next, {});
      return { ok: true, next };
    },

    /** Time passes: hunger/thirst/fatigue grow, oxygen drains. */
    tick(n, ctx) {
      if (!n) return;
      const tl = S().tl, d = cfg().decay;
      for (const k of Object.keys(d)) S().setStat(k, tl.stats[k] + d[k] * n);
      for (const c of Object.keys(cfg().clocks)) {
        if (tl.clocks[c] !== undefined) {
          const before = tl.clocks[c];
          tl.clocks[c] = Math.max(0, before - n);
          const warn = cfg().clocks[c].warn;
          if (before > warn && tl.clocks[c] <= warn && tl.clocks[c] > 0 && ctx) ctx.notes.push({ kind: 'warn', text: cfg().clocks[c].label + ' khatre mein: ' + tl.clocks[c] + ' cycle bache' });
        }
      }
    },

    _runPending(ctx) {
      const tl = S().tl;
      const due = tl.pending.filter((p) => p.due <= tl.step);
      if (!due.length) return;
      tl.pending = tl.pending.filter((p) => p.due > tl.step);
      for (const p of due) {
        if (p.label) ctx.notes.push({ kind: 'delayed', text: p.label });
        AZ.Choice.apply(p.effects, ctx);
        if (p.goto && !ctx.goto) ctx.goto = p.goto;
      }
    },

    /** Handles death, endings and checkpoints after effects. Returns true if the hero died. */
    _after(ctx, choiceKey, direct) {
      const tl = S().tl;
      if (ctx.ending) {
        const meta = S().meta;
        meta.endings[ctx.ending] = (meta.endings[ctx.ending] || 0) + 1;
        meta.timelineSummaries.push({ timeline: tl.n, outcome: 'survived', text: 'Adhyay 01 poora hua (' + ctx.ending + ').' });
        AZ.Memory.persist();
        AZ.bus.emit('ending', { id: ctx.ending });
      }
      const cause = ctx.die || AZ.Timeline.checkVitals();
      if (cause) {
        // Echo Sense memory: direct kills, plus deaths by wounds/hollowing right after a choice (time-drain deaths blame nobody).
        const blame = direct && (ctx.die || cause === 'wounds' || cause === 'hollowed');
        Story._die(cause, blame ? choiceKey : null, ctx); return true;
      }
      return false;
    },

    _die(cause, fatalKey, ctx) {
      const tl = S().tl;
      if (tl.dying) return;
      tl.dying = true;
      Story._emitNotes(ctx);
      const info = AZ.Timeline.die(cause, fatalKey);      // permanent record first
      const resumeScene = AZ.Timeline.rewind();           // THEN swap in the checkpoint timeline
      info.resumeScene = resumeScene;
      info.newTimeline = S().tl.n;
      Story.view = null;
      AZ.bus.emit('death', info);
    },

    /** Called by the UI when the death cinematic ends. */
    resumeAfterDeath() {
      S().tl.dying = false;
      Story.enterScene(S().tl.sceneId, { resume: true });
    },

    _emitNotes(ctx) { if (ctx && ctx.notes && ctx.notes.length) AZ.bus.emit('notes', ctx.notes); },

    /** Used by item use: apply consequences (death etc.) without changing scene. */
    afterEffects(ctx) {
      const cause = ctx.die || AZ.Timeline.checkVitals();
      if (cause) { Story._die(cause, null, ctx); return true; }
      Story._emitNotes(ctx);
      return false;
    },

    /** Re-render the current scene (after loading, using an item, etc.). */
    refresh() {
      const scene = Story.resolve(S().tl.sceneId);
      if (!scene) return Story.enterScene(Story.fallbackScene(), {});
      Story.view = Story.buildView(scene);
      AZ.bus.emit('scene', Story.view);
    },

    _emergency() {
      AZ.warn('Emergency reset to start scene.');
      S().tl.sceneId = cfg().startScene;
      const sc = AZ.data.story.scenes[cfg().startScene];
      if (!sc) throw new Error('Start scene missing');
      Story.view = Story.buildView(sc);
      AZ.bus.emit('scene', Story.view);
    }
  };
})();
