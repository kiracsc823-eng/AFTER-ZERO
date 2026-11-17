/* ============================================================
   AFTER ZERO — memoryManager.js
   PERMANENT PROGRESSION. Everything here lives in state.meta and is
   written to its own storage key immediately (a "memory checkpoint"),
   so it can never be lost by dying, by loading an older save, or by
   reloading the page.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, S = () => AZ.State, cfg = () => AZ.data.config;

  const Memory = AZ.Memory = {
    /** Learn a permanent fact. Returns its definition if NEW, otherwise null. */
    learn(id) {
      const def = cfg().knowledge[id];
      if (!def) { AZ.warn('Unknown knowledge "' + id + '"'); return null; }
      if (S().meta.knowledge[id]) return null;
      S().meta.knowledge[id] = { timeline: S().tl ? S().tl.n : 0, time: Date.now() };
      S().meta.memories.push({ id: 'm_' + id, timeline: S().tl ? S().tl.n : 0, text: def.title + ' — ' + def.text, time: Date.now(), knowledge: id });
      if (def.grants) Memory.unlockAbility(def.grants);
      if (Object.keys(S().meta.knowledge).length >= 8) Memory.achieve('knowledge_8');
      Memory.persist();
      AZ.bus.emit('memory', { id, def });
      return def;
    },

    /** Free-form permanent memory (story beats that should be recalled later). */
    remember(text) {
      const tl = S().tl ? S().tl.n : 0;
      if (S().meta.memories.some((m) => m.text === text)) return;
      S().meta.memories.push({ id: 'm_' + S().meta.memories.length, timeline: tl, text, time: Date.now() });
      Memory.persist();
    },

    unlockAbility(id) {
      if (!cfg().abilities[id] || S().meta.abilities[id]) return false;
      S().meta.abilities[id] = true;
      Memory.persist();
      AZ.bus.emit('ability', { id });
      return true;
    },

    achieve(id) {
      if (!cfg().achievements[id] || S().meta.achievements[id]) return false;
      S().meta.achievements[id] = { time: Date.now() };
      Memory.persist();
      AZ.bus.emit('achievement', { id });
      return true;
    },

    /** Write permanent state right now (independent from timeline save slots). */
    persist() { if (AZ.Save) AZ.Save.saveMeta(); },

    list() { return S().meta.memories.slice(); },
    knowledgeList() {
      return Object.keys(S().meta.knowledge).map((id) => Object.assign({ id }, cfg().knowledge[id], S().meta.knowledge[id]));
    }
  };
})();
