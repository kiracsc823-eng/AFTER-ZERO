/* ============================================================
   AFTER ZERO — timelineManager.js : RETURN BY DEATH

   die(cause)   -> records the death PERMANENTLY, returns a description
                   for the cinematic. The live timeline is left as-is so
                   the UI can still show the final moment.
   rewind()     -> replaces ONLY state.tl with the checkpoint copy,
                   bumps the timeline counter, restores permanent artifacts.

   Why permanent knowledge cannot be lost: rewind() never assigns to
   state.meta. It only reads from it.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State, cfg = () => AZ.data.config;

  const TM = AZ.Timeline = {
    /** Cause of death from raw stats / clocks, or null if the hero lives. */
    checkVitals() {
      const tl = S().tl, st = tl.stats;
      if (st.health <= 0) return 'wounds';
      if (st.thirst >= 100) return 'dehydrated';
      if (st.hunger >= 100) return 'starved';
      if (st.humanity <= 0) return 'hollowed';
      for (const c of Object.keys(cfg().clocks)) {
        if (tl.clocks[c] !== undefined && tl.clocks[c] <= 0) return cfg().clocks[c].deathId;
      }
      return null;
    },

    /** Record the death. `choiceKey` (optional) marks a directly-fatal choice for Echo Sense. */
    die(cause, choiceKey) {
      const meta = S().meta, tl = S().tl;
      const def = cfg().deaths[cause] || cfg().deaths.unknown;
      meta.deaths++;
      const trail = tl.log.filter((e) => e.t === 'choice').slice(-4).map((e) => e.text);
      const rec = {
        timeline: tl.n, cause: cfg().deaths[cause] ? cause : 'unknown', title: def.title, summary: def.summary,
        scene: tl.sceneId, location: tl.location, trail, time: Date.now()
      };
      meta.deathLog.push(rec);
      if (meta.deathLog.length > 200) meta.deathLog.shift();
      meta.timelineSummaries.push({ timeline: tl.n, outcome: 'died', text: def.summary + (trail.length ? ' Aakhri faisle: ' + trail.join(' → ') + '.' : '') });
      if (choiceKey) meta.fatalChoices[choiceKey] = (meta.fatalChoices[choiceKey] || 0) + 1;

      // PERMANENT lessons from this death.
      const learned = [];
      for (const k of (def.learns || [])) { const d = AZ.Memory.learn(k); if (d) learned.push(d); }

      if (meta.deaths >= 1) AZ.Memory.achieve('first_death');
      if (meta.deaths >= 3) { AZ.Memory.achieve('three_deaths'); AZ.Memory.unlockAbility('ab_echo'); }
      if (meta.deaths >= 10) AZ.Memory.achieve('ten_deaths');
      AZ.NPC.updateRecognition();
      AZ.Memory.persist();
      return { cause: rec.cause, def, record: rec, learned, deathNumber: meta.deaths };
    },

    /** Restore the last checkpoint as a NEW timeline. Returns the scene id to resume at. */
    rewind() {
      const meta = S().meta;
      let snap = AZ.Checkpoint.snapshot();
      if (!snap) snap = S().newTimeline(meta.timelineCount, meta);          // failsafe: no checkpoint yet
      meta.timelineCount++;
      snap.n = meta.timelineCount;
      // Timeline-specific scratch is rebuilt, never carried over.
      snap.pending = snap.pending || [];
      snap.recent = []; snap.typeRecent = [];
      snap.queued = [];
      snap.genScene = snap.genScene || null;
      // Death leaves a scar: a little more fear, never beyond a gentle cap.
      snap.stats.fear = U.clamp(Math.max(snap.stats.fear, Math.min(40, snap.stats.fear + 4)), 0, 100);
      // Permanent artifacts always return with the hero.
      for (const id of Object.keys(meta.permItems)) snap.inventory[id] = 1;
      S().tl = snap;
      S().tl.flags.rewound = true;
      S().tl.log.push({ t: 'note', text: 'Timeline ' + snap.n + ' shuru hui.', step: snap.step });
      AZ.NPC.updateRecognition();
      AZ.Memory.persist();
      AZ.Save.autosave();
      AZ.bus.emit('rewound', { timeline: snap.n });
      return snap.sceneId;
    },

    /** One-paragraph "what you remember" screen shown during the rewind. */
    memorySummary(deathInfo) {
      const meta = S().meta, parts = [];
      parts.push('Timeline ' + deathInfo.record.timeline + ' khatam hui: ' + deathInfo.def.summary);
      if (deathInfo.learned.length) parts.push('Tumhare paas bacha: ' + deathInfo.learned.map((l) => l.title).join(', ') + '.');
      parts.push('Sthayi yaadein: ' + AZ.State.knowledgeCount() + '. Mautein: ' + meta.deaths + '.');
      return parts;
    }
  };
})();
