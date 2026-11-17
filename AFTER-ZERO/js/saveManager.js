/* ============================================================
   AFTER ZERO — saveManager.js
   Storage layout (localStorage, all keys prefixed "afterzero.v1."):
     meta          permanent profile   (written on every discovery)
     meta.prev     previous profile    (kept when a New Game replaces it)
     settings      options
     slot.auto     autosave            slot.1 .. slot.3  manual saves
   Slots hold ONLY {tl, checkpoint}. Loading a slot never rewrites meta,
   so loading an old save can never delete newer memories.

   Every record is wrapped {sum, body}; a checksum mismatch (corruption)
   falls back to the ".bak" copy written before the previous save.
   If localStorage is unavailable the game keeps working in memory.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State;
  const PREFIX = 'afterzero.v1.';
  const SLOTS = ['auto', '1', '2', '3'];
  const mem = {};   // in-memory fallback store

  const store = {
    ok: (function () { try { const k = PREFIX + '__t'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch (e) { return false; } })(),
    get(k) { try { return this.ok ? window.localStorage.getItem(PREFIX + k) : (mem[k] === undefined ? null : mem[k]); } catch (e) { return mem[k] === undefined ? null : mem[k]; } },
    set(k, v) { try { if (this.ok) window.localStorage.setItem(PREFIX + k, v); else mem[k] = v; return true; } catch (e) { mem[k] = v; return false; } },
    del(k) { try { if (this.ok) window.localStorage.removeItem(PREFIX + k); delete mem[k]; } catch (e) { delete mem[k]; } }
  };

  function wrap(obj) { const body = JSON.stringify(obj); return JSON.stringify({ sum: U.hash(body), body }); }
  function unwrap(text) {
    if (!text) return null;
    try {
      const env = JSON.parse(text);
      if (!env || typeof env.body !== 'string' || U.hash(env.body) !== env.sum) return null;
      return JSON.parse(env.body);
    } catch (e) { return null; }
  }
  /** Write with a backup of the previous good copy. */
  function put(key, obj) {
    const prev = store.get(key);
    if (prev && prev.charAt(0) === '{' && prev !== undefined) store.set(key + '.bak', prev);   // cheap check; full checksum is verified on load
    return store.set(key, wrap(obj));
  }
  function take(key) { return unwrap(store.get(key)) || unwrap(store.get(key + '.bak')); }

  /** Fill gaps in older/damaged timelines so the engine never meets undefined. */
  function sanitizeTimeline(tl) {
    if (!U.isObj(tl)) return null;
    const base = S().newTimeline(tl.n || 1, null);
    const out = Object.assign({}, base, tl);
    out.stats = Object.assign({}, base.stats, tl.stats || {});
    out.npcs = Object.assign({}, base.npcs, tl.npcs || {});
    for (const k of ['flags', 'inventory', 'quests', 'clocks', 'visited', 'once', 'survivors']) if (!U.isObj(out[k])) out[k] = {};
    for (const k of ['pending', 'log', 'recent', 'typeRecent']) if (!Array.isArray(out[k])) out[k] = [];
    if (!AZ.data.story.scenes[out.sceneId] && !out.genScene) out.sceneId = AZ.data.config.startScene;
    return out;
  }
  function sanitizeMeta(m) {
    if (!U.isObj(m)) return null;
    const out = Object.assign(S().newMeta(), m);
    for (const k of ['knowledge', 'abilities', 'achievements', 'npcMemory', 'endings', 'checkpointsReached', 'fatalChoices', 'seenScenes', 'permItems', 'counters']) if (!U.isObj(out[k])) out[k] = {};
    for (const k of ['memories', 'deathLog', 'timelineSummaries']) if (!Array.isArray(out[k])) out[k] = [];
    out.deaths = Math.max(0, out.deaths | 0); out.timelineCount = Math.max(1, out.timelineCount | 0);
    return out;
  }

  const Save = AZ.Save = {
    SLOTS, storageOk: store.ok,

    saveMeta() { if (S().meta) put('meta', S().meta); },
    loadMeta() { const m = sanitizeMeta(take('meta')); return m; },
    saveSettings() { store.set('settings', JSON.stringify(S().getSettings())); },
    loadSettings() { try { const s = JSON.parse(store.get('settings')); S().settings = Object.assign(S().defaultSettings(), s || {}); } catch (e) { S().settings = S().defaultSettings(); } },

    /** Build a slot record from the live game. */
    _record(label) {
      const tl = S().tl, loc = AZ.data.locations[tl.location];
      return {
        savedAt: Date.now(), label: label || '',
        timeline: tl.n, chapter: tl.chapter, location: loc ? loc.name : tl.location,
        objective: tl.objective, deaths: S().meta.deaths, knowledge: S().knowledgeCount(),
        tl: U.clone(tl), checkpoint: S().checkpoint ? U.clone(S().checkpoint) : null
      };
    },

    save(slot, label) {
      if (!S().started || !S().tl) return false;
      const ok = put('slot.' + slot, Save._record(label));
      if (slot !== 'auto') Save.saveMeta();     // meta is already written at every discovery
      AZ.bus.emit('saved', { slot });
      return ok;
    },
    autosave() { if (S().started && S().tl && !S().tl.dead) return Save.save('auto', 'Autosave'); return false; },

    /** Slot summaries for the Save/Load screen (never throws). */
    slotInfo(slot) {
      const rec = take('slot.' + slot);
      if (!rec || !rec.tl) return null;
      return { slot, savedAt: rec.savedAt, label: rec.label, timeline: rec.timeline, chapter: rec.chapter, location: rec.location, objective: rec.objective, deaths: rec.deaths, knowledge: rec.knowledge };
    },
    list() { return SLOTS.map((s) => ({ slot: s, info: Save.slotInfo(s) })); },
    latestSlot() {
      const l = Save.list().filter((x) => x.info).sort((a, b) => b.info.savedAt - a.info.savedAt);
      return l.length ? l[0].slot : null;
    },
    hasAnySave() { return !!Save.latestSlot() || !!take('meta'); },

    /** Load a slot's TIMELINE layer. Permanent meta stays as-is (and only ever grows). */
    load(slot) {
      const rec = take('slot.' + slot);
      if (!rec) return { ok: false, error: 'Wo save khaali ya kharab hai.' };
      const tl = sanitizeTimeline(rec.tl);
      if (!tl) return { ok: false, error: 'Wo save padha nahi ja saka.' };
      if (!S().meta) S().meta = Save.loadMeta() || S().newMeta();
      S().tl = tl;
      S().checkpoint = rec.checkpoint && rec.checkpoint.tl ? Object.assign({}, rec.checkpoint, { tl: sanitizeTimeline(rec.checkpoint.tl) }) : null;
      if (!S().checkpoint || !S().checkpoint.tl) S().checkpoint = null;
      S().started = true;
      // permanent artifacts are never lost
      for (const id of Object.keys(S().meta.permItems)) if (!S().tl.inventory[id]) S().tl.inventory[id] = 1;
      return { ok: true };
    },
    remove(slot) { store.del('slot.' + slot); store.del('slot.' + slot + '.bak'); },

    /** Start a brand new profile; the old one is kept under meta.prev. */
    newProfile() {
      const old = store.get('meta');
      if (old) store.set('meta.prev', old);
      for (const s of SLOTS) Save.remove(s);
      S().newGame(false);
      Save.saveMeta();
    },

    /** Called on boot. Loads settings + meta (if any). Returns true if a profile exists. */
    boot() {
      Save.loadSettings();
      const m = Save.loadMeta();
      if (m) { S().meta = m; return true; }
      return false;
    },

    wipeAll() { for (const k of ['meta', 'meta.prev', 'settings']) { store.del(k); store.del(k + '.bak'); } for (const s of SLOTS) Save.remove(s); },
    _store: store
  };
})();
