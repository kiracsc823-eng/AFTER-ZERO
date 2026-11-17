/* ============================================================
   AFTER ZERO — checkpointManager.js
   A checkpoint is a frozen deep-copy of the TIMELINE layer only.
   It never contains (and restoring it never touches) state.meta.

   kinds:  'start'  — automatic anchor at the beginning of a timeline
           'major'  — story milestone (shown to the player)
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State;

  const CP = AZ.Checkpoint = {
    /** Freeze the current timeline. Called by the story engine after a scene's onEnter has run. */
    activate(id, kind) {
      const snap = U.clone(S().tl);
      S().checkpoint = { id, kind: kind || 'major', sceneId: snap.sceneId, time: Date.now(), timeline: snap.n, tl: snap };
      S().meta.checkpointsReached[id] = (S().meta.checkpointsReached[id] || 0) + 1;
      AZ.Memory.persist();
      AZ.bus.emit('checkpoint', { id, kind: kind || 'major' });
      if (AZ.Save) AZ.Save.autosave();
      return S().checkpoint;
    },

    /** A fresh deep copy of the checkpoint's timeline, ready to become the live timeline. */
    snapshot() { return S().checkpoint ? U.clone(S().checkpoint.tl) : null; },

    has() { return !!S().checkpoint; },
    label() { return S().checkpoint ? S().checkpoint.id : null; }
  };
})();
