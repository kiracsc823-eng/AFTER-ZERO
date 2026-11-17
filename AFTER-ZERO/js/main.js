/* ============================================================
   AFTER ZERO — main.js : boot sequence.
   1. validate all story data  2. load permanent profile + settings
   3. start the UI.  Any problem becomes a visible message, never a blank screen.
   Add ?debug to the URL to log warnings to the console.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ;
  AZ.debug = /[?&]debug\b/.test(location.search);

  function showProblem(title, lines) {
    const menu = document.getElementById('menu-note');
    if (menu) { menu.innerHTML = ''; const d = document.createElement('div'); d.className = 'errbox'; d.innerHTML = '<b>' + title + '</b><br>' + lines.map((l) => String(l).replace(/</g, '&lt;')).join('<br>'); menu.appendChild(d); }
  }

  function boot() {
    let report = { errors: [], warnings: [] };
    try { report = AZ.Validate.run(); } catch (e) { report.errors.push('Validator crashed: ' + e.message); }
    AZ.validation = report;
    if (AZ.debug) { report.errors.forEach((e) => console.warn('[AZ data error] ' + e)); report.warnings.forEach((w) => console.warn('[AZ data warning] ' + w)); }

    AZ.Save.boot();                       // settings + permanent profile (if any)
    if (!AZ.State.meta) AZ.State.meta = AZ.State.newMeta();

    try { AZ.UI.init(); } catch (e) { showProblem('The game could not start', [e.message]); throw e; }
    if (report.errors.length) showProblem('Story data has problems (the game will still try to run):', report.errors.slice(0, 6));
  }

  window.addEventListener('error', function (ev) {
    AZ.warn('Uncaught: ' + (ev && ev.message));
    try { if (AZ.UI && AZ.UI.toast) AZ.UI.toast('Chhoti si gadbad hui — progress surakshit hai.', 'warn'); } catch (e) { /* ignore */ }
  });
  window.addEventListener('unhandledrejection', function (ev) { AZ.warn('Unhandled promise: ' + (ev && ev.reason)); });

  // On phones: first tap tries fullscreen + landscape lock (silently ignored where unsupported).
  document.addEventListener('pointerdown', function once() {
    document.removeEventListener('pointerdown', once);
    try {
      const el = document.documentElement;
      const fs = el.requestFullscreen ? el.requestFullscreen() : null;
      const lock = function () { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* ignore */ } };
      if (fs && fs.then) fs.then(lock).catch(function () {}); else lock();
    } catch (e) { /* ignore */ }
  });

  // Installable + offline when served over http(s) (Chrome "Add to Home screen"). Ignored on file:// and in APK wrappers.
  try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) { /* ignore */ }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
