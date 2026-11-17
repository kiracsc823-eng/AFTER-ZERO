/* ============================================================
   AFTER ZERO — audioManager.js
   Everything is synthesised with WebAudio, so the game has sound with zero
   files. If AZ.assets.audio lists a file for a slot (music_<mood>, amb_<name>,
   sfx_<name>) it is used instead and falls back to the synth if it fails.
   Every public function is wrapped so audio can never crash the game
   (autoplay blocks, missing WebAudio and missing files are all harmless).
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ;
  const N = { C1: 32.7, D1: 36.7, E1: 41.2, F1: 43.7, G1: 49, A1: 55, B1: 61.7 };
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);                     // midi -> Hz

  const A = AZ.Audio = {
    ctx: null, master: null, musicG: null, sfxG: null, ambG: null, noiseBuf: null,
    ready: false, curMusic: null, curAmb: null, music: null, amb: null, _musicTimer: null, _lastType: 0, files: {},

    /** Call from any user gesture (browsers block audio before one). */
    unlock() {
      try {
        if (!A.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
          A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.connect(A.ctx.destination);
          A.musicG = A.ctx.createGain(); A.sfxG = A.ctx.createGain(); A.ambG = A.ctx.createGain();
          [A.musicG, A.sfxG, A.ambG].forEach((g) => g.connect(A.master));
          const len = A.ctx.sampleRate * 2, b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          A.noiseBuf = b;
        }
        if (A.ctx.state === 'suspended') A.ctx.resume();
        A.ready = true; A.applyVolumes();
        if (A.pendingMusic) { const m = A.pendingMusic; A.pendingMusic = null; A.setMusic(m); }
        if (A.pendingAmb) { const a = A.pendingAmb; A.pendingAmb = null; A.setAmbience(a); }
      } catch (e) { AZ.warn('Audio unavailable: ' + e.message); }
    },

    applyVolumes() {
      try {
        if (!A.ready) return;
        const s = AZ.State.getSettings(), t = A.ctx.currentTime;
        A.master.gain.setTargetAtTime(s.muted ? 0 : 1, t, 0.05);
        A.musicG.gain.setTargetAtTime(s.musicVol * 0.5, t, 0.05);
        A.sfxG.gain.setTargetAtTime(s.sfxVol * 0.8, t, 0.05);
        A.ambG.gain.setTargetAtTime(s.sfxVol * 0.55, t, 0.05);
        if (A.fileMusic) A.fileMusic.volume = s.muted ? 0 : s.musicVol * 0.6;
        if (A.fileAmb) A.fileAmb.volume = s.muted ? 0 : s.sfxVol * 0.5;
      } catch (e) { /* ignore */ }
    },

    /* ---------- building blocks ---------- */
    tone(type, f0, f1, dur, vol, when, dest) {
      const c = A.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (when || 0);
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || A.sfxG); o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, type, f0, f1, when, q, dest) {
      const c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + (when || 0);
      s.buffer = A.noiseBuf; fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f0 || 800, t); if (f1) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); fl.Q.value = q || 1;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(dest || A.sfxG); s.start(t); s.stop(t + dur + 0.05);
    },

    /* ---------- sound effects ---------- */
    sfx(name) {
      try {
        if (A.playFile('sfx_' + name)) return;
        if (!A.ready) return;
        const f = SFX[name]; if (f) f();
      } catch (e) { /* never crash on audio */ }
    },

    /* ---------- ambience & music ---------- */
    setAmbience(name) {
      try {
        if (name === A.curAmb) return;
        if (!A.ready) { A.pendingAmb = name; return; }
        A.curAmb = name; A.stopAmb();
        if (A.playLoop('amb_' + name, 'fileAmb')) return;
        const f = AMB[name]; if (f) A.amb = f();
      } catch (e) { /* ignore */ }
    },
    stopAmb() {
      try { if (A.amb) { A.amb.stop(); A.amb = null; } if (A.fileAmb) { A.fileAmb.pause(); A.fileAmb = null; } } catch (e) { /* ignore */ }
    },
    setMusic(mood) {
      try {
        if (mood === A.curMusic) return;
        if (!A.ready) { A.pendingMusic = mood; return; }
        A.curMusic = mood; A.stopMusic();
        if (A.playLoop('music_' + mood, 'fileMusic')) return;
        const m = MUSIC[mood] || MUSIC.calm; let i = 0;
        const step = () => { try { m.play(i++); } catch (e) { /* ignore */ } };
        step(); A._musicTimer = setInterval(step, m.every * 1000);
      } catch (e) { /* ignore */ }
    },
    stopMusic() { clearInterval(A._musicTimer); A._musicTimer = null; try { if (A.fileMusic) { A.fileMusic.pause(); A.fileMusic = null; } } catch (e) { /* ignore */ } },
    stopAll() { A.stopMusic(); A.stopAmb(); A.curMusic = null; A.curAmb = null; },

    /* ---------- optional audio files (only those listed in assets/manifest.js are ever requested) ---------- */
    fileUrl(slot) { return AZ.assets && AZ.assets.audio && AZ.assets.audio[slot] && A.files[slot] !== 'bad' ? AZ.assets.audio[slot] : null; },
    playFile(slot) {
      const url = A.fileUrl(slot); if (!url) return false;
      try { const a = new Audio(url); a.volume = AZ.State.getSettings().sfxVol; a.addEventListener('error', () => { A.files[slot] = 'bad'; }); const p = a.play(); if (p && p.catch) p.catch(() => { A.files[slot] = 'bad'; }); return true; } catch (e) { A.files[slot] = 'bad'; return false; }
    },
    playLoop(slot, prop) {
      const url = A.fileUrl(slot); if (!url) return false;
      try {
        const a = new Audio(url); a.loop = true; A[prop] = a; A.applyVolumes();
        a.addEventListener('error', () => { A.files[slot] = 'bad'; A[prop] = null; if (prop === 'fileMusic') { const m = A.curMusic; A.curMusic = null; A.setMusic(m); } else { const n = A.curAmb; A.curAmb = null; A.setAmbience(n); } });
        const p = a.play(); if (p && p.catch) p.catch(() => { /* blocked until gesture */ });
        return true;
      } catch (e) { return false; }
    }
  };

  /* ---------- synthesised sound effects ---------- */
  const SFX = {
    click() { A.tone('square', 520, 380, 0.07, 0.25); },
    hover() { A.tone('square', 900, 900, 0.03, 0.06); },
    type() { const n = performance.now(); if (n - A._lastType < 45) return; A._lastType = n; A.tone('square', 260 + Math.random() * 120, 0, 0.025, 0.05); },
    steps() { A.noise(0.09, 0.4, 'lowpass', 300, 120); A.noise(0.09, 0.35, 'lowpass', 260, 110, 0.28); A.noise(0.09, 0.4, 'lowpass', 300, 120, 0.56); A.noise(0.09, 0.35, 'lowpass', 260, 110, 0.84); },
    alarm() { for (let i = 0; i < 3; i++) { A.tone('square', 620, 620, 0.16, 0.14, i * 0.4); A.tone('square', 460, 460, 0.16, 0.14, i * 0.4 + 0.2); } },
    death() { A.tone('sine', 140, 28, 1.8, 0.7); A.noise(0.9, 0.6, 'lowpass', 1800, 80); A.tone('sawtooth', 70, 35, 1.6, 0.25); },
    hit() { A.tone('sine', 110, 40, 0.3, 0.6); A.noise(0.15, 0.5, 'lowpass', 900, 100); },
    rewind() { A.tone('sawtooth', 60, 2400, 1.6, 0.22); A.tone('sine', 120, 3200, 1.6, 0.18); A.noise(1.6, 0.35, 'bandpass', 200, 5000, 0, 3); for (let i = 0; i < 8; i++) A.tone('square', 900 + i * 220, 0, 0.05, 0.08, i * 0.18); },
    powerup() { [0, 4, 7, 12, 16, 19].forEach((n, i) => A.tone('square', hz(48 + n), 0, 0.22, 0.12, i * 0.1)); A.noise(0.9, 0.25, 'lowpass', 200, 1400); },
    radio() { A.noise(0.5, 0.3, 'bandpass', 2400, 1200, 0, 5); A.tone('sine', 1000, 1000, 0.1, 0.12, 0.45); },
    use() { A.tone('triangle', hz(76), 0, 0.25, 0.25); A.tone('triangle', hz(83), 0, 0.35, 0.2, 0.1); },
    rest() { [0, 7, 12].forEach((n, i) => A.tone('sine', hz(55 + n), 0, 1.4, 0.2, i * 0.25)); },
    learn() { A.tone('sine', hz(79), 0, 0.5, 0.25); A.tone('sine', hz(86), 0, 0.8, 0.22, 0.12); A.tone('triangle', hz(91), 0, 1, 0.12, 0.25); },
    checkpoint() { [0, 4, 7, 12].forEach((n, i) => A.tone('triangle', hz(67 + n), 0, 0.6, 0.2, i * 0.12)); },
    ability() { [0, 5, 9, 14].forEach((n, i) => A.tone('square', hz(72 + n), 0, 0.3, 0.1, i * 0.08)); },
    warn() { A.tone('square', 220, 180, 0.3, 0.15); },
    save() { A.tone('triangle', hz(72), 0, 0.15, 0.2); A.tone('triangle', hz(79), 0, 0.25, 0.2, 0.1); }
  };

  /* ---------- synthesised ambience ---------- */
  function loopNoise(type, f, q, vol) {
    const c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(A.ambG); s.start();
    return { s, fl, g };
  }
  function lfo(param, rate, depth, base) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); param.value = base; return o;
  }
  function osc(type, f, vol) { const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(A.ambG); o.start(); return { o, g }; }
  const stopper = (nodes, timers) => ({ stop() { (timers || []).forEach(clearInterval); nodes.forEach((n) => { try { (n.s || n.o || n).stop(); } catch (e) { /* ignore */ } }); } });

  const AMB = {
    hum() { const a = osc('sine', 50, 0.2), b = osc('sine', 100, 0.1), c = osc('sine', 150, 0.04), n = loopNoise('lowpass', 220, 1, 0.12); return stopper([a, b, c, n]); },
    drone() { const a = osc('sawtooth', 55, 0.06), f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; a.g.disconnect(); a.g.connect(f); f.connect(A.ambG); const l = lfo(f.frequency, 0.1, 60, 160); const b = osc('sine', 41, 0.2); return stopper([a, b, { o: l }]); },
    wind() { const n = loopNoise('bandpass', 500, 0.8, 0.35), l = lfo(n.fl.frequency, 0.12, 280, 500), l2 = lfo(n.g.gain, 0.07, 0.15, 0.3); return stopper([n, { o: l }, { o: l2 }]); },
    static() { const n = loopNoise('highpass', 3200, 0.5, 0.1), l = lfo(n.g.gain, 7, 0.07, 0.1), h = osc('sine', 60, 0.05); return stopper([n, { o: l }, h]); },
    drip() { const n = loopNoise('lowpass', 120, 1, 0.08), t = setInterval(() => { try { A.tone('sine', 1400 + Math.random() * 400, 700, 0.12, 0.12, 0, A.ambG); } catch (e) { /* ignore */ } }, 2300 + Math.random() * 1500); return stopper([n], [t]); },
    crowd() { const n = loopNoise('bandpass', 700, 0.6, 0.12), l = lfo(n.g.gain, 0.2, 0.05, 0.12); return stopper([n, { o: l }]); }
  };

  /* ---------- generative music ---------- */
  function pad(notes, dur, vol, type) {
    const c = A.ctx, t = c.currentTime;
    notes.forEach((m) => [-4, 4].forEach((det) => {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = type || 'triangle'; o.frequency.value = hz(m); o.detune.value = det; f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.1);
      o.connect(f); f.connect(g); g.connect(A.musicG); o.start(t); o.stop(t + dur * 1.2);
    }));
  }
  function bell(m, when, vol) { A.tone('sine', hz(m), 0, 1.6, vol, when, A.musicG); A.tone('sine', hz(m + 12), 0, 1, vol * 0.3, when, A.musicG); }
  const MUSIC = {
    calm: { every: 6, play(i) { const ch = [[45, 52, 57], [41, 48, 53], [43, 50, 55], [40, 47, 52]][i % 4]; pad(ch, 6, 0.09); if (i % 2) bell(ch[2] + 12, 1.5, 0.05); } },
    dread: { every: 7, play(i) { const ch = [[38, 44], [37, 43], [34, 40], [38, 45]][i % 4]; pad(ch, 7, 0.12, 'sawtooth'); if (i % 3 === 0) A.tone('sine', 40, 36, 3, 0.2, 0, A.musicG); } },
    tense: { every: 4, play(i) { pad([34, 41], 4, 0.1, 'sawtooth'); for (let k = 0; k < 8; k++) A.tone('square', hz(34 + (k % 4 ? 0 : 12)), 0, 0.06, 0.035, k * 0.5, A.musicG); } },
    hope: { every: 6, play(i) { const ch = [[48, 55, 59, 62], [45, 52, 55, 60], [41, 48, 53, 57], [43, 50, 55, 59]][i % 4]; pad(ch, 6, 0.08); [0, 1, 2, 3, 2, 1].forEach((k, j) => bell(ch[k] + 12, j * 0.9, 0.05)); } },
    mystery: { every: 6, play(i) { const ch = [[52, 55, 58], [53, 57, 59], [50, 54, 57], [52, 56, 60]][i % 4]; pad(ch, 6, 0.08); bell(ch[(i * 2) % 3] + 12, 2, 0.06); bell(ch[(i * 2 + 1) % 3] + 24, 3.4, 0.04); } }
  };
})();
