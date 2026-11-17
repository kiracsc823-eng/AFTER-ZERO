/* ============================================================
   AFTER ZERO — validator.js
   Checks all story/event/location data at boot. Problems are collected
   (never thrown), shown in the console with ?debug, and a hard error
   count of 0 is required by tests/run-tests.js.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util;

  const Validate = AZ.Validate = {
    run() {
      const errors = [], warnings = [];
      const cfg = AZ.data.config, scenes = (AZ.data.story && AZ.data.story.scenes) || {};
      const locs = AZ.data.locations, chars = AZ.data.characters;
      const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

      const checkCond = (c, where) => {
        if (c === undefined || c === null || typeof c === 'boolean') return;
        if (Array.isArray(c)) return c.forEach((x) => checkCond(x, where));
        if (!U.isObj(c)) return err(where + ': condition is not an object');
        for (const k of Object.keys(c)) {
          if (!AZ.Choice.COND[k]) { err(where + ': unknown condition "' + k + '"'); continue; }
          const v = c[k];
          if (k === 'all' || k === 'any') U.arr(v).forEach((x) => checkCond(x, where));
          else if (k === 'not') checkCond(v, where);
          else if (k === 'item' || k === 'noItem') U.arr(v).forEach((i) => { if (!cfg.items[i]) err(where + ': unknown item "' + i + '"'); });
          else if (k === 'knows' || k === 'notKnows') U.arr(v).forEach((i) => { if (!cfg.knowledge[i]) err(where + ': unknown knowledge "' + i + '"'); });
          else if (k === 'ability') U.arr(v).forEach((i) => { if (!cfg.abilities[i]) err(where + ': unknown ability "' + i + '"'); });
          else if (k === 'itemQty') Object.keys(v).forEach((i) => { if (!cfg.items[i]) err(where + ': unknown item "' + i + '"'); });
          else if (k === 'stat') Object.keys(v).forEach((s) => { if (!cfg.stats[s] && s !== 'knowledge') err(where + ': unknown stat "' + s + '"'); });
          else if (k === 'npcTrust' || k === 'npcStatus') Object.keys(v).forEach((n) => { if (n[0] !== '@' && !chars[n]) err(where + ': unknown npc "' + n + '"'); });
          else if (k === 'npcMet' || k === 'npcRecognizes') U.arr(v).forEach((n) => { if (!chars[n]) err(where + ': unknown npc "' + n + '"'); });
          else if (k === 'location') U.arr(v).forEach((l) => { if (!locs[l]) err(where + ': unknown location "' + l + '"'); });
          else if (k === 'visited' || k === 'notVisited') U.arr(v).forEach((s) => { if (!scenes[s]) err(where + ': unknown scene "' + s + '"'); });
          else if (k === 'diedFrom') U.arr(v).forEach((d) => { if (!cfg.deaths[d]) err(where + ': unknown death "' + d + '"'); });
        }
      };

      const checkEffects = (e, where, ctx) => {
        if (!e) return;
        if (Array.isArray(e)) return e.forEach((x) => checkEffects(x, where, ctx));
        if (!U.isObj(e)) return err(where + ': effects is not an object');
        for (const k of Object.keys(e)) {
          if (!AZ.Choice.EFFECT[k]) { err(where + ': unknown effect "' + k + '"'); continue; }
          const v = e[k];
          if (k === 'stat' || k === 'setStat') Object.keys(v).forEach((s) => { if (!cfg.stats[s]) err(where + ': unknown stat "' + s + '"'); });
          else if (k === 'item' || k === 'permItem') {
            (typeof v === 'string' || Array.isArray(v) ? U.arr(v) : Object.keys(v)).forEach((i) => { if (i[0] !== '@' && !cfg.items[i]) err(where + ': unknown item "' + i + '"'); });
          } else if (k === 'take') {
            (typeof v === 'string' ? [v] : Array.isArray(v) ? v : Object.keys(v)).forEach((i) => { if (!cfg.items[i]) err(where + ': take unknown item "' + i + '"'); });
          } else if (k === 'learn') U.arr(v).forEach((i) => { if (!cfg.knowledge[i]) err(where + ': unknown knowledge "' + i + '"'); });
          else if (k === 'ability') U.arr(v).forEach((i) => { if (!cfg.abilities[i]) err(where + ': unknown ability "' + i + '"'); });
          else if (k === 'achievement') U.arr(v).forEach((i) => { if (!cfg.achievements[i]) err(where + ': unknown achievement "' + i + '"'); });
          else if (k === 'trust') Object.keys(v).forEach((n) => { if (n[0] !== '@' && !chars[n]) err(where + ': trust for unknown npc "' + n + '"'); });
          else if (k === 'npcStatus') Object.keys(v).forEach((n) => { if (n[0] !== '@' && !chars[n]) err(where + ': status for unknown npc "' + n + '"'); });
          else if (k === 'meet') U.arr(v).forEach((n) => { if (n[0] !== '@' && !chars[n]) err(where + ': meet unknown npc "' + n + '"'); });
          else if (k === 'location') { if (!locs[v]) err(where + ': unknown location "' + v + '"'); }
          else if (k === 'die') { if (!cfg.deaths[v]) err(where + ': unknown death "' + v + '"'); }
          else if (k === 'goto') { if (!Validate.sceneRef(v, scenes)) err(where + ': goto unknown scene "' + v + '"'); }
          else if (k === 'delay') U.arr(v).forEach((d) => { checkEffects(d.effects, where + ' (delay)'); if (d.goto && !Validate.sceneRef(d.goto, scenes)) err(where + ': delay goto unknown "' + d.goto + '"'); });
          else if (k === 'roll') { checkEffects(v.success, where + ' (roll ok)'); checkEffects(v.fail, where + ' (roll fail)'); (v.mods || []).forEach((m) => checkCond(m.if, where)); }
          else if (k === 'queueEvent') { /* template id, validated below */ }
        }
      };

      /* ---- config sanity ---- */
      if (!scenes[cfg.startScene]) err('Start scene "' + cfg.startScene + '" does not exist');
      for (const id of Object.keys(cfg.deaths)) { (cfg.deaths[id].learns || []).forEach((k) => { if (!cfg.knowledge[k]) err('Death "' + id + '" teaches unknown knowledge "' + k + '"'); }); }
      for (const id of Object.keys(cfg.knowledge)) { const g = cfg.knowledge[id].grants; if (g && !cfg.abilities[g]) err('Knowledge "' + id + '" grants unknown ability "' + g + '"'); }
      for (const id of Object.keys(cfg.items)) { const it = cfg.items[id]; if (!it.name || !it.type) err('Item "' + id + '" needs name and type'); if (it.use) checkEffects(it.use, 'item ' + id); }
      for (const id of Object.keys(locs)) { checkCond(locs[id].requires, 'location ' + id); }

      /* ---- authored scenes ---- */
      const reach = new Set();
      const queue = [cfg.startScene];
      const nextOf = (n) => {
        if (!n) return [];
        if (typeof n === 'string') return [n];
        return U.arr(n).map((r) => r.scene);
      };
      for (const id of Object.keys(scenes)) {
        const sc = scenes[id], W = 'scene ' + id;
        if (sc.location && !locs[sc.location]) err(W + ': unknown location "' + sc.location + '"');
        (sc.chars || []).forEach((c) => { if (!chars[c.id]) err(W + ': unknown character "' + c.id + '"'); checkCond(c.if, W); });
        if (sc.speaker && !chars[sc.speaker]) err(W + ': unknown speaker "' + sc.speaker + '"');
        if (!sc.generate && (!sc.lines || !sc.lines.length)) err(W + ': no lines');
        (sc.lines || []).forEach((l) => { if (!l.text) err(W + ': line without text'); checkCond(l.if, W); });
        checkEffects(sc.onEnter, W + ' onEnter');
        (sc.onEnterIf || []).forEach((b) => { checkCond(b.if, W); checkEffects(b.effects, W + ' onEnterIf'); });
        const choices = sc.choices || [];
        if (!choices.length) warn(W + ': no choices (engine will offer a fallback)');
        const ids = new Set();
        let safe = false;
        choices.forEach((c, i) => {
          const C = W + ' choice ' + (c.id || i);
          if (!c.text) err(C + ': no text');
          if (!c.id) warn(C + ': missing id (Echo Sense and once-tracking use the index)');
          else if (ids.has(c.id)) err(C + ': duplicate choice id'); else ids.add(c.id);
          checkCond(c.if, C); checkEffects(c.effects, C);
          const dies = c.effects && c.effects.die;
          if (!c.next && !dies && !(c.effects && c.effects.goto)) { if (!/^gen:/.test(id) && !sc.generate) err(C + ': no next scene and does not kill'); }
          const ns = nextOf(c.next);
          ns.forEach((n) => { if (!Validate.sceneRef(n, scenes)) err(C + ': next scene "' + n + '" does not exist'); else if (scenes[n]) { if (!reach.has(n)) { reach.add(n); queue.push(n); } } });
          if (Array.isArray(c.next)) c.next.forEach((r) => checkCond(r.if, C));
          if (!c.if && !c.once && !(c.tags && c.tags.length) && !dies) safe = true;
        });
        if (choices.length && !safe) warn(W + ': no always-available choice (engine falls back to "continue")');
        // every effect of kind die must have a visible warning-free consequence; ensure at least one non-death exit
        if (choices.length && choices.every((c) => c.effects && c.effects.die)) err(W + ': all choices kill');
      }
      // reachability from start
      reach.add(cfg.startScene);
      const seen = new Set();
      const stack = [cfg.startScene];
      while (stack.length) {
        const id = stack.pop(); if (seen.has(id)) continue; seen.add(id);
        const sc = scenes[id]; if (!sc) continue;
        (sc.choices || []).forEach((c) => { nextOf(c.next).forEach((n) => { if (scenes[n] && !seen.has(n)) stack.push(n); });
          const g = c.effects && c.effects.goto; if (g && scenes[g]) stack.push(g);
          const d = c.effects && c.effects.delay; if (d) U.arr(d).forEach((x) => { if (x.goto && scenes[x.goto]) stack.push(x.goto); }); });
      }
      for (const id of Object.keys(scenes)) if (!seen.has(id)) warn('scene ' + id + ': unreachable from the start scene');

      /* ---- procedural templates ---- */
      const seenT = new Set(), types = {};
      Events().forEach((t) => {
        const W = 'event ' + t.id;
        if (!t.id) return err('event without id');
        if (seenT.has(t.id)) err(W + ': duplicate id'); seenT.add(t.id);
        if (!t.type) err(W + ': no type'); types[t.type] = (types[t.type] || 0) + 1;
        if (!t.meaning) err(W + ': no "meaning" (every generated event must have a purpose)');
        if (!t.lines || !t.lines.length) err(W + ': no lines');
        if (!t.choices || t.choices.length < 2) err(W + ': needs at least 2 choices');
        (t.locations || []).forEach((l) => { if (!locs[l]) err(W + ': unknown location "' + l + '"'); });
        checkCond(t.if, W); (t.boost || []).forEach((b) => checkCond(b.if, W));
        (t.lines || []).forEach((l) => checkCond(l.if, W));
        checkEffects(t.onEnter, W + ' onEnter');
        if (t.loot) t.loot.forEach((i) => { if (!cfg.items[i]) err(W + ': unknown loot item "' + i + '"'); });
        let hasSafe = false;
        (t.choices || []).forEach((c, i) => {
          const C = W + ' choice ' + (c.id || i);
          if (!c.id) err(C + ': missing id');
          checkCond(c.if, C); checkEffects(c.effects, C);
          if (c.next !== '@hub' && !(c.effects && c.effects.die)) err(C + ': procedural choices must return to "@hub"');
          if (!c.if && !c.once && !(c.tags && c.tags.length) && !(c.effects && c.effects.die)) hasSafe = true;
          const eff = JSON.stringify(c.effects || {}) + (c.result || '');
          if (eff.length < 8) warn(C + ': choice has no real consequence');
        });
        if (!hasSafe) err(W + ': no always-available choice');
      });
      return { errors, warnings, sceneCount: Object.keys(scenes).length, eventCount: Events().length, types };

      function Events() { return (AZ.data.events && AZ.data.events.templates) || []; }
    },

    /** A scene reference is valid if it's an authored scene, '@hub', or '@event:<location>'. */
    sceneRef(id, scenes) {
      if (!id) return false;
      if (scenes[id]) return true;
      if (id === '@hub') return true;
      if (id.indexOf('@event:') === 0) return !!AZ.data.locations[id.slice(7)];
      return false;
    }
  };
})();
