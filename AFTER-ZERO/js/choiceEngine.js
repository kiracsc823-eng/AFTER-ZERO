/* ============================================================
   AFTER ZERO — choiceEngine.js
   Two jobs:
     1. CONDITIONS  — decide whether a choice / line / scene variant is visible.
     2. EFFECTS     — apply every kind of consequence a choice can have.
   Both are plain-JSON "mini languages" so story data stays declarative.
   Add a new condition or effect by adding one entry to COND / EFFECT.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State, cfg = () => AZ.data.config;

  const cmp = (val, spec) => {
    if (typeof spec === 'number') return val === spec;
    if (spec.gte !== undefined && !(val >= spec.gte)) return false;
    if (spec.lte !== undefined && !(val <= spec.lte)) return false;
    if (spec.gt !== undefined && !(val > spec.gt)) return false;
    if (spec.lt !== undefined && !(val < spec.lt)) return false;
    if (spec.eq !== undefined && !(val === spec.eq)) return false;
    return true;
  };

  /* ---------------- CONDITIONS ---------------- */
  const COND = {
    all:   (v) => U.arr(v).every(check),
    any:   (v) => U.arr(v).some(check),
    not:   (v) => !check(v),
    flag:  (v) => U.arr(v).every((f) => !!S().tl.flags[f]),
    noFlag:(v) => U.arr(v).every((f) => !S().tl.flags[f]),
    stat:  (v) => Object.keys(v).every((k) => cmp(S().stat(k), v[k])),
    item:  (v) => U.arr(v).every((i) => AZ.Inventory.has(i)),
    noItem:(v) => U.arr(v).every((i) => !AZ.Inventory.has(i)),
    itemQty:(v) => Object.keys(v).every((i) => cmp(AZ.Inventory.qty(i), v[i])),
    knows: (v) => U.arr(v).every((k) => !!S().meta.knowledge[k]),
    notKnows:(v) => U.arr(v).every((k) => !S().meta.knowledge[k]),
    ability:(v) => U.arr(v).every((a) => !!S().meta.abilities[a]),
    npcTrust:(v) => Object.keys(v).every((id) => S().tl.npcs[id] && cmp(S().tl.npcs[id].trust, v[id])),
    npcStatus:(v) => Object.keys(v).every((id) => S().tl.npcs[id] && S().tl.npcs[id].status === v[id]),
    npcMet:(v) => U.arr(v).every((id) => S().tl.npcs[id] && S().tl.npcs[id].met),
    npcRecognizes:(v) => U.arr(v).every((id) => AZ.NPC.recognizes(id)),
    timeline:(v) => cmp(S().tl.n, v),
    deaths:(v) => cmp(S().meta.deaths, v),
    diedFrom:(v) => U.arr(v).every((c) => S().meta.deathLog.some((d) => d.cause === c)),
    quest: (v) => Object.keys(v).every((id) => (S().tl.quests[id] ? S().tl.quests[id].state : 'none') === v[id]),
    location:(v) => U.arr(v).includes(S().tl.location),
    visited:(v) => U.arr(v).every((id) => !!S().tl.visited[id]),
    notVisited:(v) => U.arr(v).every((id) => !S().tl.visited[id]),
    seenEver:(v) => U.arr(v).every((id) => !!S().meta.seenScenes[id]),
    clock: (v) => Object.keys(v).every((c) => S().tl.clocks[c] !== undefined && cmp(S().tl.clocks[c], v[c])),
    chapter:(v) => cmp(S().tl.chapter, v),
    weak:  (v) => AZ.Choice.isWeak() === !!v,
    panic: (v) => (S().stat('fear') >= cfg().rules.panicFear) === !!v,
    ending:(v) => U.arr(v).every((e) => !!S().meta.endings[e]),
    step:  (v) => cmp(S().tl.step, v)
  };

  /** Evaluate a condition. undefined/null => true. Arrays mean "all of". Unknown keys fail safe (false). */
  function check(cond) {
    if (cond === undefined || cond === null || cond === true) return true;
    if (cond === false) return false;
    if (Array.isArray(cond)) return cond.every(check);
    for (const k of Object.keys(cond)) {
      const fn = COND[k];
      if (!fn) { AZ.warn('Unknown condition key "' + k + '"'); return false; }
      try { if (!fn(cond[k])) return false; } catch (e) { AZ.warn('Condition "' + k + '" threw: ' + e.message); return false; }
    }
    return true;
  }

  /* ---------------- EFFECTS ---------------- */
  const STAT_NOTE = { health: 'Sehat', hunger: 'Bhookh', thirst: 'Pyaas', fatigue: 'Thakaan', trust: 'Bharosa', fear: 'Darr', humanity: 'Insaniyat' };

  const EFFECT = {
    stat(v, ctx) {
      for (const k of Object.keys(v)) {
        if (!(k in S().tl.stats)) { AZ.warn('Effect stat "' + k + '" unknown'); continue; }
        const before = S().tl.stats[k];
        S().setStat(k, before + v[k]);
        const d = S().tl.stats[k] - before;
        if (d !== 0) ctx.notes.push({ kind: 'stat', stat: k, delta: d, text: STAT_NOTE[k] + ' ' + (d > 0 ? '+' : '') + d });
      }
    },
    setStat(v) { for (const k of Object.keys(v)) S().setStat(k, v[k]); },
    flag(v) { U.arr(v).forEach((f) => { S().tl.flags[f] = true; }); },
    flags(v) { Object.assign(S().tl.flags, v); },
    clearFlag(v) { U.arr(v).forEach((f) => { delete S().tl.flags[f]; }); },
    item(v, ctx) {
      for (const id of Object.keys(v)) {
        const got = AZ.Inventory.add(id, v[id]);
        if (got > 0) ctx.notes.push({ kind: 'item', text: '+ ' + AZ.Inventory.name(id) + (got > 1 ? ' ×' + got : '') });
      }
    },
    take(v, ctx) {
      const map = typeof v === 'string' ? { [v]: 1 } : Array.isArray(v) ? Object.fromEntries(v.map((i) => [i, 1])) : v;
      for (const id of Object.keys(map)) {
        if (AZ.Inventory.remove(id, map[id])) ctx.notes.push({ kind: 'item', text: '− ' + AZ.Inventory.name(id) });
      }
    },
    trust(v, ctx) {
      for (const id of Object.keys(v)) {
        const d = AZ.NPC.changeTrust(id, v[id]);
        if (d) ctx.notes.push({ kind: 'trust', text: AZ.NPC.name(id) + ' par bharosa ' + (d > 0 ? '+' : '') + d });
      }
    },
    npcStatus(v, ctx) { for (const id of Object.keys(v)) AZ.NPC.setStatus(id, v[id], ctx); },
    meet(v) { U.arr(v).forEach((id) => AZ.NPC.meet(id)); },
    learn(v, ctx) {
      U.arr(v).forEach((id) => {
        const r = AZ.Memory.learn(id);
        if (r) ctx.notes.push({ kind: 'knowledge', text: 'Sthayi yaad: ' + r.title });
      });
    },
    memory(v, ctx) { U.arr(v).forEach((t) => { AZ.Memory.remember(t); ctx.notes.push({ kind: 'knowledge', text: 'Ek yaad ban rahi hai.' }); }); },
    ability(v, ctx) { U.arr(v).forEach((a) => { if (AZ.Memory.unlockAbility(a)) ctx.notes.push({ kind: 'ability', text: 'Kaabiliyat mili: ' + cfg().abilities[a].name }); }); },
    achievement(v, ctx) { U.arr(v).forEach((a) => { if (AZ.Memory.achieve(a)) ctx.notes.push({ kind: 'ability', text: 'Uplabdhi: ' + cfg().achievements[a].name }); }); },
    quest(v, ctx) {
      for (const id of Object.keys(v)) {
        const spec = typeof v[id] === 'string' ? { state: v[id] } : v[id];
        const q = S().tl.quests[id] || (S().tl.quests[id] = { title: spec.title || id, desc: spec.desc || '', state: 'active', main: !!spec.main, started: S().tl.step });
        if (spec.title) q.title = spec.title;
        if (spec.desc) q.desc = spec.desc;
        if (spec.data) q.data = spec.data;
        const prev = q.state;
        q.state = spec.state || q.state;
        if (prev !== q.state || spec.title) ctx.notes.push({ kind: 'quest', text: 'Mission ' + (q.state === 'active' ? 'shuru' : q.state) + ': ' + q.title });
      }
    },
    location(v) { if (AZ.data.locations[v]) S().tl.location = v; else AZ.warn('Effect location "' + v + '" unknown'); },
    objective(v) { S().tl.objective = v; },
    chapter(v) { S().tl.chapter = v; },
    clock(v, ctx) {
      for (const c of Object.keys(v)) {
        if (S().tl.clocks[c] === undefined) S().tl.clocks[c] = 0;
        S().tl.clocks[c] = Math.max(0, S().tl.clocks[c] + v[c]);
        if (c === 'oxygen' && v[c] > 0) ctx.notes.push({ kind: 'stat', text: 'Oxygen +' + v[c] });
      }
    },
    setClock(v) { Object.assign(S().tl.clocks, v); },
    removeClock(v) { U.arr(v).forEach((c) => { delete S().tl.clocks[c]; }); },
    delay(v) {
      U.arr(v).forEach((d) => S().tl.pending.push({ due: S().tl.step + (d.steps || 1), effects: d.effects || {}, goto: d.goto || null, label: d.label || '' }));
    },
    die(v, ctx) { ctx.die = ctx.die || v; },
    checkpoint(v, ctx) { ctx.checkpoint = typeof v === 'string' ? { id: v, kind: 'major' } : v; },
    ending(v, ctx) { ctx.ending = v; },
    goto(v, ctx) { ctx.goto = v; },
    queueEvent(v) { (S().tl.queued = S().tl.queued || []).push(v); },
    log(v) { S().log({ t: 'note', text: v }); },
    note(v, ctx) { ctx.notes.push({ kind: 'info', text: v }); },
    sfx(v) { AZ.bus.emit('cue', { sfx: v }); },
    shake(v) { AZ.bus.emit('cue', { shake: v === true ? 1 : v }); },
    /** Seeded chance. {chance, mods:[{if,add}], success, fail, key}. Outcome never shown beforehand. */
    roll(v, ctx) {
      let p = v.chance === undefined ? 0.5 : v.chance;
      (v.mods || []).forEach((m) => { if (check(m.if)) p += m.add; });
      const st = S().tl.stats;
      if (st.fear >= cfg().rules.panicFear) p -= 0.1;
      if (st.health < 35) p -= 0.1;
      if (st.fatigue >= 80) p -= 0.1;
      p = U.clamp(p, 0.05, 0.95);
      const r = U.rng(S().meta.worldSeed + ':' + S().tl.n + ':' + S().tl.step + ':' + (v.key || 'roll'))();
      const ok = r < p;
      apply(ok ? v.success : v.fail, ctx);
      const txt = ok ? v.successText : v.failText;
      if (txt) (ctx.texts = ctx.texts || []).push(txt);
      S().tl.flags['last_roll_' + (v.key || 'roll')] = ok ? 1 : 0;
    },
    permItem(v, ctx) {
      U.arr(v).forEach((id) => { S().meta.permItems[id] = true; EFFECT.item({ [id]: 1 }, ctx); });
    }
  };

  /** Apply an effects object (or array of them). Returns ctx {notes, goto, die, checkpoint, ending}. */
  function apply(effects, ctx) {
    ctx = ctx || { notes: [], goto: null, die: null, checkpoint: null, ending: null };
    if (!effects) return ctx;
    if (Array.isArray(effects)) { effects.forEach((e) => apply(e, ctx)); return ctx; }
    for (const k of Object.keys(effects)) {
      const fn = EFFECT[k];
      if (!fn) { AZ.warn('Unknown effect key "' + k + '"'); continue; }
      try { fn(effects[k], ctx); } catch (e) { AZ.warn('Effect "' + k + '" failed: ' + e.message); }
    }
    return ctx;
  }

  const Choice = AZ.Choice = {
    check, apply, COND, EFFECT,

    /** Too exhausted/starved for strenuous action? */
    isWeak() {
      const r = cfg().rules, st = S().tl.stats;
      return st.hunger >= r.weakHunger || st.fatigue >= r.weakFatigue;
    },

    /** Stable key of a choice, used for 'once' tracking and Echo Sense. */
    key(scene, choice, idx) { return scene.id + '#' + (choice.id || idx); },

    /** Is this choice allowed to be shown right now? Never shows a choice whose requirements fail. */
    available(scene, choice, idx) {
      if (choice.once && S().tl.once[Choice.key(scene, choice, idx)]) return false;
      if (!check(choice.if)) return false;
      const tags = choice.tags || [];
      if (tags.includes('physical') && Choice.isWeak()) return false;
      if (tags.includes('risky') && S().tl.stats.health < cfg().rules.riskyHealth) return false;
      return true;
    },

    /** Visible choices for a scene, each with its original index. */
    visible(scene) {
      const out = [];
      (scene.choices || []).forEach((c, i) => {
        if (Choice.available(scene, c, i)) out.push({ choice: c, index: i, key: Choice.key(scene, c, i) });
      });
      return out;
    },

    /** Pick the next scene id from a choice's `next` (string or ordered conditional routes). */
    route(next) {
      if (!next) return null;
      if (typeof next === 'string') return next;
      for (const r of next) if (check(r.if)) return r.scene;
      return null;
    }
  };
})();
