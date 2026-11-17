/* ============================================================
   AFTER ZERO — npcManager.js
   NPC state is split in two to avoid contradictory states:
     tl.npcs[id]      timeline-specific: trust, status (alive/dead/...), met
     meta.npcMemory   permanent: how often met, whether they "recognize" the hero
   An NPC who dies in one timeline is simply alive again after the reset,
   because tl.npcs is rebuilt from the checkpoint snapshot.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State;

  const STATES = [
    { max: 15, id: 'hostile', label: 'Dushman' },
    { max: 35, id: 'wary', label: 'Shaki' },
    { max: 55, id: 'neutral', label: 'Tatasth' },
    { max: 75, id: 'friendly', label: 'Dost' },
    { max: 101, id: 'trusted', label: 'Bharosemand' }
  ];

  const NPC = AZ.NPC = {
    def(id) { return AZ.data.characters[id]; },
    name(id) { const d = NPC.def(id); return d ? d.name : (S().tl.survivors[id] ? S().tl.survivors[id].name : id); },
    state(id) { return S().tl.npcs[id]; },

    /** Relationship label derived from trust, so label and number can never disagree. */
    relation(id) {
      const st = S().tl.npcs[id]; if (!st) return 'Anjaan';
      if (st.status === 'dead') return 'Mrit';
      if (st.status === 'missing') return 'Laapata';
      const t = st.trust;
      return (STATES.find((s) => t < s.max) || STATES[STATES.length - 1]).label;
    },

    meet(id) {
      const st = S().tl.npcs[id]; if (!st) return;
      if (!st.met) {
        st.met = true;
        const m = S().meta.npcMemory[id] || (S().meta.npcMemory[id] = { metCount: 0, recognized: false, secrets: [], lastTimeline: 0 });
        if (m.lastTimeline !== S().tl.n) { m.metCount++; m.lastTimeline = S().tl.n; }
        S().log({ t: 'note', text: 'Tum ' + NPC.name(id) + ' se milte ho.' });
      }
    },

    /** Change trust, clamped 0..100. Dead NPCs cannot change. Returns the actual delta. */
    changeTrust(id, delta) {
      const st = S().tl.npcs[id]; if (!st || st.status === 'dead') return 0;
      const before = st.trust;
      st.trust = U.clamp(st.trust + delta, 0, 100);
      if (id === 'kael' && st.trust >= 60 && AZ.Memory) AZ.Memory.achieve('kael_trusted');
      return st.trust - before;
    },

    setStatus(id, status, ctx) {
      const st = S().tl.npcs[id]; if (!st) { AZ.warn('npcStatus on unknown npc "' + id + '"'); return; }
      st.status = status;
      if (ctx) ctx.notes.push({ kind: 'npc', text: NPC.name(id) + ' — ' + status });
      S().log({ t: 'note', text: NPC.name(id) + ' ab ' + status + ' hai.' });
    },

    /** Does this NPC recognise strange cross-timeline behaviour? Needs deaths, and an NPC that perceives it. */
    recognizes(id) {
      const d = NPC.def(id), st = S().tl.npcs[id];
      if (!d || !st || st.status === 'dead') return false;
      const rule = d.recognizes; if (!rule) return false;
      return S().meta.deaths >= rule.afterDeaths && (st.met || id === 'halcyon');
    },

    /** Permanent bookkeeping on each rewind: who has noticed. */
    updateRecognition() {
      for (const id of Object.keys(S().tl.npcs)) {
        const m = S().meta.npcMemory[id];
        const d = NPC.def(id);
        if (m && d && d.recognizes && S().meta.deaths >= d.recognizes.afterDeaths) m.recognized = true;
      }
    },

    /** Everyone the player has met (this timeline OR in any previous one) for the Relationships panel. */
    known() {
      const out = [];
      for (const id of Object.keys(S().tl.npcs)) {
        const mem = S().meta.npcMemory[id], st = S().tl.npcs[id], d = NPC.def(id);
        if (!d) continue;
        if (!st.met && !mem) continue;
        out.push({ id, def: d, state: st, mem: mem || null, relation: NPC.relation(id), recognized: !!(mem && mem.recognized) });
      }
      // procedural survivors met on the road (profile in tl.survivors, state in tl.npcs)
      for (const id of Object.keys(S().tl.survivors)) {
        const sv = S().tl.survivors[id], st = S().tl.npcs[id];
        if (!st || !st.met) continue;
        out.push({ id, def: { id, name: sv.name, title: sv.title, personality: sv.personality, background: sv.background, portrait: sv.portrait, secrets: [] }, state: st, mem: null, relation: NPC.relation(id), recognized: false });
      }
      return out;
    },
    relation2(sv) { if (sv.status === 'dead') return 'Mrit'; const t = sv.trust; return (STATES.find((s) => t < s.max) || STATES[4]).label; }
  };
})();
