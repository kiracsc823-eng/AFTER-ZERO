/* ============================================================
   AFTER ZERO — eventGenerator.js : the endless Ash Road

   makeHub()          builds a "where next?" scene (3 destinations + camp + scavenge)
   makeEvent(locId)   picks a template for that place and compiles it into a normal scene

   HOW A TEMPLATE IS CHOSEN (so events feel connected, not random):
     1. eligible   : `if` condition passes, `unique` not used yet, location matches
     2. weighted   : base weight × location/tag match × stat/relationship boosts
     3. anti-repeat: same template in last 4 events = excluded, last 8 = ×0.2,
                     same type 2x in a row = ×0.4, per-template cooldown honoured
     4. seeded     : RNG seed = worldSeed + timeline + step + eventCount, so a loaded
                     save reproduces exactly the same events.
   Active quests pull their resolution event toward their target location.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State;

  const RECENT_BLOCK = 4, RECENT_PENALTY = 8;
  const SKIES = ['Subah ki roshni patli aur taambe jaisi hai.', 'Dopahar. Roshni sapaat aur berehem hai.', 'Shaam ka laal rang murda kshitij par bah raha hai.', 'Raat. Taare kisi cheez mein bane chhedon jaise lagte hain.'];

  function rngFor(tag) {
    const tl = S().tl;
    return U.rng(S().meta.worldSeed + ':' + tl.n + ':' + tl.step + ':' + tl.eventCount + ':' + tag);
  }

  /** Is a location currently reachable? (secret places need clues/rumours) */
  function open(loc) { return AZ.Choice.check(loc.requires); }

  const Events = AZ.Events = {
    RECENT_BLOCK, RECENT_PENALTY,

    templates() { return (AZ.data.events && AZ.data.events.templates) || []; },

    /* ---------- survivors (persist across the timeline so they can recur) ---------- */
    makeSurvivor(rng) {
      const tl = S().tl, P = AZ.data.characters._pools;
      const used = new Set(Object.values(tl.survivors).map((s) => s.first));
      let first = U.pick(rng, P.firstNames.filter((n) => !used.has(n)));
      if (!first) first = U.pick(rng, P.firstNames) + ' ' + (Object.keys(tl.survivors).length + 1);
      const epi = rng() < 0.7 ? U.pick(rng, P.epithets) : '';
      const trait = U.pick(rng, P.traits), want = U.pick(rng, P.wants);
      const id = 'sv_' + U.hash(S().meta.worldSeed + first + tl.n + tl.eventCount).toString(36);
      const skin = U.pick(rng, ['#e0b898', '#c89878', '#a07858', '#7a5a42', '#5a4030']);
      const sv = {
        id, first, name: epi ? first + ' ' + epi : first, title: U.pick(rng, ['musafir', 'kabaadi', 'purana courier', 'ex-mechanic', 'baagh ka rakhwala', 'ex-nurse', 'bhatakta raahi']),
        trait: trait.text, traitId: trait.id, mood: trait.mood, want,
        personality: first + ' ' + trait.text + '.', background: 'Ash Road par mila. Chahta hai: ' + want + '.',
        portrait: { kind: 'human', skin, hair: U.pick(rng, ['#1c1c1c', '#4a3020', '#8a6a3a', '#c0c0c0', '#6a2a1a']), hairStyle: U.pick(rng, ['short', 'bun', 'long', 'bald']),
          eyes: U.pick(rng, ['#3a5a4a', '#6a4a2a', '#4a5a7a', '#2a2a2a']), accent: U.pick(rng, ['#a06030', '#4a6a8a', '#8a4a4a', '#6a7a50']),
          scar: rng() < 0.3, mask: rng() < 0.3, glasses: rng() < 0.2 }
      };
      tl.survivors[id] = sv;
      tl.npcs[id] = { trust: trait.id === 'kind' ? 40 : trait.id === 'cunning' ? 20 : 30, status: 'alive', met: false, flags: {}, notes: [] };
      return sv;
    },

    /** Reuse an existing living survivor ~35% of the time (relationships that recur), else new. */
    survivorFor(tpl, rng) {
      const tl = S().tl;
      if (tpl.bindQuest && tl.quests[tpl.bindQuest] && tl.quests[tpl.bindQuest].data) {
        const sv = tl.survivors[tl.quests[tpl.bindQuest].data.sv];
        if (sv) return sv;
      }
      if (tpl.type !== 'quest') {
        const alive = Object.values(tl.survivors).filter((s) => tl.npcs[s.id] && tl.npcs[s.id].status === 'alive' && !(tl.quests.q_water && tl.quests.q_water.data && tl.quests.q_water.data.sv === s.id));
        if (alive.length && rng() < 0.35) return U.pick(rng, alive);
      }
      return Events.makeSurvivor(rng);
    },

    /* ---------- template selection ---------- */
    weightOf(tpl, locId) {
      const tl = S().tl, loc = AZ.data.locations[locId] || {};
      if (tpl.unique && tl.recent.includes('U:' + tpl.id)) return 0;
      if (!AZ.Choice.check(tpl.if)) return 0;
      let w = tpl.weight === undefined ? 1 : tpl.weight;
      if (tpl.locations && tpl.locations.length) {
        if (!tpl.locations.includes(locId)) return 0;
        w *= 2;
      } else if (tpl.tags && tpl.tags.length) {
        const m = tpl.tags.filter((t) => (loc.tags || []).includes(t)).length;
        if (!m) return 0;
        w *= 1 + m;
      }
      for (const b of (tpl.boost || [])) if (AZ.Choice.check(b.if)) w *= (b.mul === undefined ? 1 : b.mul);
      // anti-repetition
      const idx = tl.recent.lastIndexOf(tpl.id);
      if (idx !== -1) {
        const age = tl.recent.length - idx;       // 1 = most recent
        if (age <= RECENT_BLOCK) return 0;
        if (age <= RECENT_PENALTY) w *= 0.2;
      }
      const lastTypes = tl.typeRecent.slice(-2);
      if (lastTypes.length === 2 && lastTypes[0] === tpl.type && lastTypes[1] === tpl.type) w *= 0.15;
      else if (lastTypes[lastTypes.length - 1] === tpl.type) w *= 0.4;
      return w;
    },

    pickTemplate(locId, rng) {
      const all = Events.templates();
      let t = U.weightedPick(rng, all, (x) => Events.weightOf(x, locId));
      if (!t) {   // everything blocked by anti-repeat: relax the recency window rather than fail
        const saved = S().tl.recent; S().tl.recent = [];
        t = U.weightedPick(rng, all, (x) => Events.weightOf(x, locId));
        S().tl.recent = saved;
      }
      return t || null;
    },

    /* ---------- compile a template into a scene ---------- */
    substitute(json, map) {
      return json.replace(/@(svname|sv|itemname|item|allyname|ally|loc)\b/g, (m, k) => (map[k] === undefined ? '' : map[k]));
    },

    compile(tpl, locId, rng) {
      const tl = S().tl, loc = AZ.data.locations[locId] || { name: locId };
      let sv = null, ally = null;
      if (tpl.slot === 'survivor' || tpl.bindQuest) sv = Events.survivorFor(tpl, rng);
      if (tl.flags.has_ally && tl.survivors[tl.flags.ally_id]) ally = tl.survivors[tl.flags.ally_id];
      let item = null;
      if (tpl.loot) item = U.pick(rng, tpl.loot);

      const map = {
        sv: sv ? sv.id : '', svname: sv ? sv.first : '', item: item || '', itemname: item ? AZ.Inventory.name(item) : '',
        ally: ally ? ally.id : '', allyname: ally ? ally.first : '', loc: locId
      };
      const vars = { sv: sv || {}, ally: ally || {}, loc: loc.name, itemname: map.itemname, locname: loc.name };

      const base = {
        lines: tpl.lines, choices: tpl.choices, onEnter: tpl.onEnter, chars: tpl.chars, mood: tpl.mood
      };
      let json = JSON.stringify(base);
      json = Events.substitute(json, map);
      // seeded [a|b|c] picks — quotes excluded so JSON arrays are never touched
      json = json.replace(/\[([^\[\]|"]+(?:\|[^\[\]|"]+)+)\]/g, (m, body) => U.pick(rng, body.split('|')));
      json = U.tpl(json, vars);
      const b = JSON.parse(json);

      const id = 'gen:' + tl.eventCount;
      return {
        id, generated: true, location: locId, templateId: tpl.id, type: tpl.type,
        lines: b.lines, choices: b.choices, onEnter: b.onEnter,
        chars: (b.chars || []).map((c) => (c.slot === 'survivor' && sv ? { id: sv.id, pos: c.pos || 'center', expr: sv.mood } : c)),
        mood: b.mood || { music: 'tense', ambience: loc.ambience || 'wind', particles: 'dust' },
        speaker: sv ? sv.id : null, title: ''
      };
    },

    /** The main entry point for exploring a place. Always returns a playable scene. */
    makeEvent(locId) {
      const tl = S().tl;
      const rng = rngFor('event:' + locId);
      const tpl = Events.pickTemplate(locId, rng);
      tl.location = AZ.data.locations[locId] ? locId : tl.location;
      let scene;
      if (!tpl) scene = Events.quietScene(locId);
      else {
        try { scene = Events.compile(tpl, locId, rng); }
        catch (e) { AZ.warn('Event compile failed (' + tpl.id + '): ' + e.message); scene = Events.quietScene(locId); }
      }
      if (tpl && scene.templateId) {
        tl.recent.push(tpl.id); if (tpl.unique) tl.recent.push('U:' + tpl.id);
        if (tl.recent.length > 24) tl.recent.splice(0, tl.recent.length - 24);
        tl.typeRecent.push(tpl.type); if (tl.typeRecent.length > 8) tl.typeRecent.shift();
      }
      tl.lastEvent = scene.templateId || 'quiet';
      tl.eventCount++;
      S().meta.counters.eventsResolved = (S().meta.counters.eventsResolved || 0) + 1;
      if (S().meta.counters.eventsResolved >= 10) AZ.Memory.achieve('wanderer');
      return scene;
    },

    /** Fallback: a short, meaningful beat (never an empty loop). */
    quietScene(locId) {
      const loc = AZ.data.locations[locId] || {};
      return {
        id: 'gen:' + S().tl.eventCount, generated: true, location: locId, templateId: null, type: 'quiet',
        lines: [{ who: '', text: (loc.desc || 'Raasta shaant hai.') + ' Is baar kuch nahi hota. Tum is khamoshi ka fayda uthate ho.' }],
        choices: [
          { id: 'rest', text: 'Ek gehri saans lo aur khud ko sambhalo.', time: 1, effects: { stat: { fear: -5, fatigue: -5 } }, next: '@hub' }
        ],
        mood: { music: 'calm', ambience: loc.ambience || 'wind', particles: 'dust' }
      };
    },

    /* ---------- the hub ---------- */
    makeHub() {
      const tl = S().tl, rng = rngFor('hub');
      const here = AZ.data.locations[tl.location] || {};
      const phase = tl.eventCount % 4;
      const lines = [{ who: '', text: SKIES[phase] + ' ' + (tl.eventCount === 0 ? 'Ash Road har taraf ek saath faili hui hai.' : 'Raasta chalta rehta hai.') }];
      const st = tl.stats;
      if (st.hunger >= 70) lines.push({ who: '', text: 'Bhookh pet ko mutthi mein kas rahi hai.' });
      if (st.thirst >= 70) lines.push({ who: '', text: 'Zubaan chamde ki patti ban gayi hai.' });
      if (st.fatigue >= 70) lines.push({ who: '', text: 'Tumhari taangein ab tumhara saath nahi de rahin.' });
      if (st.health <= 35) lines.push({ who: '', text: 'Har saans ek chhoti, tez yaad dilati hai ki tum toot jaane wali cheez se bane ho.' });
      if (tl.flags.has_ally && tl.survivors[tl.flags.ally_id]) lines.push({ who: '', text: tl.survivors[tl.flags.ally_id].first + ' tumhare saath chal raha hai, chup aur zinda.' });
      if (tl.flags.ally_lost) lines.push({ who: '', text: 'Tumhare bagal ki wo jagah, jahan koi chalta tha, bahut shor machati hai.' });
      const q = Object.keys(tl.quests).map((k) => tl.quests[k]).filter((x) => x.state === 'active' && x.data && !x.main);
      q.forEach((x) => lines.push({ who: '', text: 'Dimaag mein: ' + x.title + '.' }));
      if (S().meta.deaths > 0 && rng() < 0.25) lines.push({ who: '', text: 'Ajeeb sa ehsaas hai ki tum is raaste par pehle bhi chale ho, aur wo bura khatam hua tha.' });

      // destinations: quest targets are guaranteed, then weighted random without repeating recently visited places
      const locs = Object.values(AZ.data.locations).filter((l) => l.procedural && l.id !== tl.location && open(l));
      const quests = Object.keys(tl.quests).map((k) => tl.quests[k]).filter((x) => x.state === 'active' && x.data && x.data.loc);
      const targets = [];
      quests.forEach((x) => { const l = AZ.data.locations[x.data.loc]; if (l && open(l) && l.id !== tl.location && !targets.includes(l)) targets.push(l); });
      const recentLocs = tl.visitedLocs || (tl.visitedLocs = []);
      const dests = targets.slice(0, 2);
      const pool = locs.filter((l) => !dests.includes(l));
      while (dests.length < 3 && pool.length) {
        const pick = U.weightedPick(rng, pool, (l) => (recentLocs.slice(-3).includes(l.id) ? 0.15 : 1) * (l.tags.includes('secret') ? 1.3 : 1));
        if (!pick) break;
        dests.push(pick); pool.splice(pool.indexOf(pick), 1);
      }

      const choices = dests.map((l, i) => ({
        id: 'd' + i, tags: ['physical'], time: 2,
        text: l.name + ' ki taraf chalo.  ' + '▮'.repeat(l.danger) + '▯'.repeat(Math.max(0, 5 - l.danger)),
        effects: { location: l.id, stat: { fatigue: 4 }, sfx: 'steps' },
        next: '@event:' + l.id
      }));
      choices.push({
        id: 'camp', text: 'Camp lagao aur aaram karo.', time: 3,
        effects: { stat: { fatigue: -45, health: 8, fear: -4 }, sfx: 'rest' }, next: '@hub',
        result: 'Tum chhoti, halki neend sote ho, ek haath pehre par. Jaagne par raasta ab bhi wahin hai.'
      });
      choices.push({
        id: 'scav', text: 'Raaste ke kinare kaam ki cheezein dhundo.', time: 1,
        effects: { roll: { key: 'scav', chance: 0.55, success: { item: { scrap: 2 } }, fail: { stat: { health: -8, fatigue: 4 } }, successText: 'Band pade engine mein mutthi bhar scrap mila.', failText: 'Zang laga lohe ne dastane ke aar-paar kaat liya.' } }, next: '@hub'
      });
      return {
        id: 'gen:h' + tl.eventCount, generated: true, hub: true, location: tl.location,
        lines, choices, mood: { music: 'calm', ambience: here.ambience || 'wind', particles: 'ash' }, title: 'ASH ROAD'
      };
    },

    /** Used by the visitedLocs anti-repeat memory (called when entering an event). */
    noteVisit(locId) { const tl = S().tl; (tl.visitedLocs = tl.visitedLocs || []).push(locId); if (tl.visitedLocs.length > 12) tl.visitedLocs.shift(); }
  };

  // keep a short history of visited places
  AZ.bus.on('choice', function () {
    const tl = S().tl; if (tl && tl.location) { const l = AZ.data.locations[tl.location]; if (l && l.procedural) Events.noteVisit(tl.location); }
  });
})();
