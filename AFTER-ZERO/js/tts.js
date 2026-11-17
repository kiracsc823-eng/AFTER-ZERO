/* ============================================================
   AFTER ZERO — tts.js : text-to-speech ("Awaaz se padhna").
   * Android app (Capacitor): uses the phone's real TTS engine through the
     @capacitor-community/text-to-speech plugin.
   * Browser: uses the Web Speech API (speechSynthesis).
   Reads every story line, then asks "Ab kya karoge?" and reads the options.
   If no voice is available the game keeps working silently.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ;
  const ORD = ['Pehla', 'Doosra', 'Teesra', 'Chautha', 'Paanchva', 'Chhatha', 'Saatva', 'Aathva', 'Nauva'];
  const PLUGIN = 'TextToSpeech';

  const T = AZ.TTS = {
    token: 0, chain: Promise.resolve(), lastWho: null, webVoices: [],

    /* ------------------------------------------------------ environment */
    cap() { return window.Capacitor || null; },
    isNative() {
      const C = T.cap();
      try {
        if (!C || !C.isNativePlatform || !C.isNativePlatform()) return false;
        return C.isPluginAvailable ? C.isPluginAvailable(PLUGIN) : true;
      } catch (e) { return false; }
    },
    hasWeb() { return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined'; },
    supported() { return T.isNative() || T.hasWeb(); },
    mode() { return T.isNative() ? 'native' : (T.hasWeb() ? 'web' : 'none'); },
    cfg() { return AZ.State.getSettings(); },
    enabled() { const s = T.cfg(); return !!s.ttsOn && !s.muted && T.supported(); },

    call(method, opts) {
      const C = T.cap();
      if (C.Plugins && C.Plugins[PLUGIN] && C.Plugins[PLUGIN][method]) return C.Plugins[PLUGIN][method](opts || {});
      if (C.nativePromise) return C.nativePromise(PLUGIN, method, opts || {});
      return Promise.reject(new Error('TTS plugin missing'));
    },

    /* ------------------------------------------------------ web voices */
    loadWebVoices() {
      if (!T.hasWeb()) return [];
      try { T.webVoices = window.speechSynthesis.getVoices() || []; } catch (e) { T.webVoices = []; }
      return T.webVoices;
    },
    pickWebVoice() {
      const s = T.cfg(), list = T.loadWebVoices();
      if (!list.length) return null;
      if (s.ttsVoice) { const f = list.find((v) => v.name === s.ttsVoice); if (f) return f; }
      const lang = (s.ttsLang || 'en-IN').toLowerCase(), base = lang.split('-')[0];
      return list.find((v) => v.lang.toLowerCase().replace('_', '-') === lang)
        || list.find((v) => v.lang.toLowerCase().startsWith(base)) || null;
    },

    /* ------------------------------------------------------ text prep */
    clean(text) {
      return String(text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[◆☠★▶▼·•]/g, ' ')
        .replace(/\s*[—–]+\s*/g, ', ')
        .replace(/\.{2,}|…/g, '... ')
        .replace(/\s+/g, ' ').trim();
    },
    pitchFor(who) {
      if (!who) return 0.9;                       // narrator: a little deeper
      let h = 0; const w = String(who).toLowerCase();
      for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) >>> 0;
      return +(0.8 + (h % 9) * 0.06).toFixed(2);  // 0.80 – 1.28, stable per character
    },

    /* ------------------------------------------------------ speaking */
    speakOne(text, pitch) {
      const s = T.cfg(), rate = s.ttsRate || 0.95, lang = s.ttsLang || 'en-IN';
      if (T.isNative()) {
        return T.call('speak', { text, lang, rate, pitch: pitch || 1, volume: 1, category: 'ambient', queueStrategy: 0 });
      }
      return new Promise((resolve) => {
        let done = false;
        const fin = () => { if (!done) { done = true; resolve(); } };
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang; u.rate = rate; u.pitch = pitch || 1; u.volume = 1;
          const v = T.pickWebVoice(); if (v) { u.voice = v; u.lang = v.lang; }
          u.onend = fin; u.onerror = fin;
          window.speechSynthesis.speak(u);
          setTimeout(fin, 4000 + text.length * 160 / Math.max(0.5, rate)); // safety net
        } catch (e) { fin(); }
      });
    },

    /** Queue a line. Resolves true when it finished naturally, false if skipped/stopped. */
    say(text, opts) {
      if (!T.enabled()) return Promise.resolve(false);
      const clean = T.clean(text); if (!clean) return Promise.resolve(false);
      const my = T.token, pitch = (opts && opts.pitch) || 1;
      const p = T.chain.then(() => {
        if (my !== T.token || !T.enabled()) return false;
        return T.speakOne(clean, pitch).then(() => my === T.token, () => false);
      });
      T.chain = p.catch(() => false);
      return p;
    },

    stop() {
      T.token++;
      let wait = Promise.resolve();
      try {
        if (T.isNative()) wait = Promise.resolve(T.call('stop')).catch(() => {});
        else if (T.hasWeb()) { window.speechSynthesis.cancel(); wait = new Promise((r) => setTimeout(r, 60)); }
      } catch (e) { /* ignore */ }
      T.chain = wait;
    },

    /* ------------------------------------------------------ game hooks */
    /** A story line. Returns a promise that resolves true when it was read to the end. */
    sayLine(line) {
      if (!T.enabled() || !line) return Promise.resolve(false);
      const who = line.who ? String(line.who) : '';
      let text = line.text;
      if (who && who !== T.lastWho) text = who + ': ' + text;
      T.lastWho = who;
      return T.say(text, { pitch: T.pitchFor(who) });
    },

    /** "Ab kya karoge?" + the numbered options. */
    askChoices(choices) {
      if (!T.enabled()) return;
      T.say('Ab kya karoge?', { pitch: 0.9 });
      if (!T.cfg().ttsChoices) return;
      (choices || []).forEach((c, i) => T.say((ORD[i] || ('Vikalp ' + (i + 1))) + ' vikalp. ' + c.text, { pitch: 1 }));
    },

    reset() { T.lastWho = null; },
    test() { T.stop(); T.reset(); return T.say('Awaaz chal rahi hai. Ab kya karoge?', { pitch: 1 }); }
  };

  if (T.hasWeb()) {
    try { window.speechSynthesis.getVoices(); window.speechSynthesis.addEventListener('voiceschanged', () => T.loadWebVoices()); } catch (e) { /* ignore */ }
  }
})();
