/* ============================================================
   AFTER ZERO — gameState.js
   The single source of truth.

   THREE LAYERS (this separation is what keeps memories safe):
     meta        PERMANENT. Knowledge, memories, abilities, achievements,
                 death log, NPC recognition. NEVER reset by dying.
     tl          TIMELINE. Stats, inventory, flags, NPC states, location...
                 Replaced from the checkpoint snapshot on death.
     checkpoint  A frozen copy of `tl` taken at the last checkpoint.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util;
  const cfg = () => AZ.data.config;

  const State = AZ.State = {
    meta: null,
    tl: null,
    checkpoint: null,
    settings: null,
    started: false
  };

  State.defaultSettings = function () {
    return { musicVol: 0.5, sfxVol: 0.7, textSpeed: 28, muted: false, echoSense: true, particles: true, scanlines: true, shake: true, ttsOn: true, ttsChoices: true, ttsAuto: false, ttsRate: 0.95, ttsLang: 'en-IN', ttsVoice: '' };
  };

  /** Brand-new permanent profile. */
  State.newMeta = function () {
    return {
      version: cfg().saveVersion,
      created: U.now(),
      worldSeed: 'AZ-' + Math.floor(Math.random() * 1e9).toString(36),
      deaths: 0,
      timelineCount: 1,
      knowledge: {},        // id -> { timeline, time }
      memories: [],         // { id, timeline, text, time }
      abilities: {},        // id -> true
      achievements: {},     // id -> { time }
      deathLog: [],         // { timeline, cause, title, summary, scene, location, trail:[...] }
      timelineSummaries: [],// { timeline, outcome, text }
      npcMemory: {},        // id -> { metCount, recognized, secrets:[], lastTimeline }
      endings: {},          // id -> count
      checkpointsReached: {},
      fatalChoices: {},     // "sceneId#choiceId" -> deaths caused (powers Echo Sense)
      seenScenes: {},
      permItems: {},        // permanent artifacts re-granted after every reset
      counters: { eventsResolved: 0 }
    };
  };

  /** Fresh timeline (the state at the very beginning of a new game). */
  State.newTimeline = function (n, meta) {
    const tl = {
      n: n || 1,
      sceneId: cfg().startScene,
      genScene: null,
      location: 'cryo_ward',
      chapter: 1,
      objective: 'Pata lagao tum kahan ho.',
      step: 0,
      stats: {},
      flags: {},
      inventory: {},
      npcs: {},
      quests: {},
      clocks: { oxygen: 12 },
      pending: [],
      visited: {},
      once: {},
      log: [],              // [{t:'line'|'choice'|'note'|'scene', ...}] for history + death summary
      recent: [],           // anti-repetition memory for procedural events
      typeRecent: [],
      eventCount: 0,
      survivors: {},
      lastEvent: null
    };
    for (const k of Object.keys(cfg().stats)) tl.stats[k] = cfg().stats[k].start;
    // NPCs start from their authored defaults.
    const chars = AZ.data.characters;
    for (const id of Object.keys(chars)) {
      const c = chars[id];
      if (id === 'protagonist' || id[0] === '_') continue;
      tl.npcs[id] = { trust: c.trust || 0, status: c.status || 'alive', met: false, flags: {}, notes: [] };
    }
    // Permanent artifacts always follow the protagonist.
    if (meta) for (const it of Object.keys(meta.permItems || {})) tl.inventory[it] = 1;
    return tl;
  };

  State.newGame = function (keepMeta) {
    State.meta = keepMeta ? State.meta : State.newMeta();
    State.tl = State.newTimeline(State.meta.timelineCount, State.meta);
    State.checkpoint = null;
    State.started = true;
  };

  /** Derived knowledge stat = number of permanent facts learned. */
  State.knowledgeCount = function () { return Object.keys(State.meta.knowledge).length; };

  State.stat = function (name) {
    if (name === 'knowledge') return State.knowledgeCount();
    return State.tl.stats[name];
  };

  State.setStat = function (name, v) {
    if (!(name in State.tl.stats)) return;
    State.tl.stats[name] = U.clamp(Math.round(v), 0, 100);
  };

  State.getSettings = function () { return State.settings || (State.settings = State.defaultSettings()); };

  /** Append to the readable timeline log (kept bounded). */
  State.log = function (entry) {
    const tl = State.tl;
    if (!tl) return;
    entry.step = tl.step;
    tl.log.push(entry);
    if (tl.log.length > 400) tl.log.splice(0, tl.log.length - 400);
  };
})();
