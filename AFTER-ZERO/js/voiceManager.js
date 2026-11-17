/* ============================================================
   AFTER ZERO — voiceManager.js : voice narration (text-to-speech).
   * Uses the device's own speech engine (speechSynthesis) — no internet, no paid API.
   * Reads each line, then "Ab tum kya karoge?", then every available choice as Option A/B/C,
     then "Choose your action."  It never picks a choice for the player.
   * Reads the Devanagari version from AZ.narr (data/narration.js) when it has one, so a Hindi voice
     pronounces it properly. The text shown on screen is never changed.
   * Exactly one voice at a time: every start/stop goes through one queue guarded by a generation number.
   * Backends, in order: window.AZ_NativeTTS (custom bridge) -> a TTS method on a builder bridge such as
     window.AndroidAPI (only if the APK really exposes one) -> speechSynthesis (browsers / Chrome) -> cordova TTS.
     If none exists the status shows NA and the game keeps working with text only. A device report
     (diagnostics screen) shows exactly what the WebView offers.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ;
  const DEV = /[ऀ-ॿ]/;

  const PHRASES = {
    ask: { text: 'अब तुम क्या करोगे?', lang: 'hi-IN' },
    choose: { text: 'Choose your action.', lang: 'en-IN' },
    died: { text: 'Timeline terminated. Returning to the last known checkpoint.', lang: 'en-IN' },
    again: { text: 'Another chance. Another timeline. But the memories remain.', lang: 'en-IN' },
    optionHi: ['विकल्प ए', 'विकल्प बी', 'विकल्प सी', 'विकल्प डी', 'विकल्प ई', 'विकल्प एफ'],
    optionEn: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E', 'Option F'],
    askEn: 'Ab tum kya karoge?'
  };

  /* Voice "characters": pitch/rate shape one system voice into several. gender picks among installed voices. */
  const ROLES = {
    narrator: { pitch: 0.82, rate: 0.92, gender: 'm' },
    hero: { pitch: 1.0, rate: 1.0, gender: 'm' },
    mara: { pitch: 1.35, rate: 1.0, gender: 'f' },
    kael: { pitch: 0.72, rate: 0.95, gender: 'm' },
    halcyon: { pitch: 0.55, rate: 0.86, gender: 'm' },
    listener: { pitch: 0.42, rate: 0.78, gender: 'm' },
    system: { pitch: 0.7, rate: 0.9, gender: 'm' }
  };
  const FEMALE = /swara|heera|kalpana|neerja|aditi|raveena|priya|female|woman|hia|hif|ena|\bf\b/i;
  const MALE = /madhur|hemant|ravi|prabhat|rishi|male|hic|hid|enb|\bm\b/i;

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function S() { return AZ.State; }

  const V = AZ.Voice = {
    supported: false, backend: 'none', voices: [], gen: 0,
    queue: [], cur: null, speaking: false, paused: false, autoPaused: false,
    doneCb: null, doneTimer: 0, watchdog: 0, protect: false, failures: 0,
    learned: new Map(), lastLine: null, lastRole: 'narrator', el: {}, _warned: false,

    /* ------------------------------------------------------------ settings (persisted with the other settings) */
    cfg() {
      const s = S().getSettings();
      if (s.voiceOn === undefined) s.voiceOn = true;
      if (s.voiceVol === undefined) s.voiceVol = 1;
      if (s.voiceRate === undefined) s.voiceRate = 1;
      if (s.voiceMuted === undefined) s.voiceMuted = false;
      if (!s.voiceLang) s.voiceLang = 'auto';
      return s;
    },
    save() { try { AZ.Save.saveSettings(); } catch (e) { /* ignore */ } },
    /** True when the game should speak right now. */
    active() { return V.supported && V.cfg().voiceOn && !V.cfg().voiceMuted && !V.disabledForSession; },

    /* ------------------------------------------------------------ backend detection */
    init() {
      try {
        const nat = window.AZ_NativeTTS;                       // optional custom bridge: {speak(text,lang,rate,pitch,vol,done), stop()}
        const br = V.findBridge();                             // APK builder bridge that happens to have a speak/TTS method
        if (nat && typeof nat.speak === 'function') { V.backend = 'native'; V.supported = true; }
        else if (br) { V.backend = 'bridge'; V.bridge = br; V.supported = true; }
        else if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') { V.backend = 'web'; V.supported = true; V.loadVoices(); try { speechSynthesis.onvoiceschanged = V.loadVoices; } catch (e) { /* ignore */ } }
        else if (window.TTS && typeof window.TTS.speak === 'function') { V.backend = 'cordova'; V.supported = true; }  // cordova-plugin-tts
      } catch (e) { V.supported = false; }
      V.buildDock();
      V.refreshUi();
      // Autoplay rules: browsers only allow speech after a tap. The first tap "unlocks" it.
      document.addEventListener('pointerdown', V.unlock, { once: true, capture: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) V.suspend(); else V.wake(); });
      window.addEventListener('pagehide', () => V.suspend());
      window.addEventListener('pageshow', () => V.wake());
      window.addEventListener('blur', () => { /* keep talking if only focus moved */ });
    },
    /* ------------------------------------------------------------ builder bridge (e.g. window.AndroidAPI) */
    BRIDGE_NAMES: ['AndroidAPI', 'Android', 'AndroidInterface', 'AndroidBridge', 'NativeBridge', 'JSInterface', 'AndroidTTS', 'NativeTTS', 'AppInterface', 'Bridge'],
    methodsOf(o) {
      const out = [];
      try { for (const k in o) { try { if (typeof o[k] === 'function') out.push(k); } catch (e) { /* ignore */ } } } catch (e) { /* ignore */ }
      try { Object.getOwnPropertyNames(o).forEach((k) => { try { if (out.indexOf(k) < 0 && typeof o[k] === 'function') out.push(k); } catch (e) { /* ignore */ } }); } catch (e) { /* ignore */ }
      return out;
    },
    /** Looks for a text-to-speech method on the known bridge objects. Returns null when there is none (the normal case). */
    findBridge() {
      for (const n of V.BRIDGE_NAMES) {
        let o; try { o = window[n]; } catch (e) { continue; }
        if (!o || (typeof o !== 'object' && typeof o !== 'function') || n === 'TTS') continue;
        const m = V.methodsOf(o);
        const sp = m.find((k) => /^(speak|tts|ttsspeak|texttospeech|speaktext|say|saytext|talk|readaloud)$/i.test(k))
          || m.find((k) => /speak|tts|texttospeech/i.test(k) && !/stop|shutdown|isspeaking|set(lang|rate|pitch)|init/i.test(k));
        if (!sp) continue;
        const st = m.find((k) => /^(stop|stopspeak\w*|ttsstop|stoptts|stopspeaking|cancelspeech|silence)$/i.test(k)) || m.find((k) => /stop/i.test(k) && /speak|tts/i.test(k));
        const is = m.find((k) => /^(isspeaking|ttsisspeaking|isttsspeaking)$/i.test(k));
        return { name: n, obj: o, speak: sp, stop: st || null, isSpeaking: is || null, arity: -1 };
      }
      return null;
    },
    bridgeSpeak(text, lang, rate, pitch) {
      const b = V.bridge, tries = [[text, lang], [text], [text, lang, rate], [text, lang, rate, pitch]];
      if (b.arity >= 0) { b.obj[b.speak].apply(b.obj, tries[b.arity]); return; }
      let lastErr = null;
      for (let i = 0; i < tries.length; i++) { try { b.obj[b.speak].apply(b.obj, tries[i]); b.arity = i; return; } catch (e) { lastErr = e; } }
      throw lastErr || new Error('bridge speak failed');
    },
    bridgeStop() { const b = V.bridge; if (b && b.stop) { try { b.obj[b.stop](); } catch (e) { /* ignore */ } } },

    /** Everything we can learn about speech support on this device (shown on the diagnostics screen). */
    report() {
      const t = (f) => { try { return typeof f(); } catch (e) { return 'error'; } };
      const r = [];
      const ua = navigator.userAgent || '';
      r.push('Page: ' + location.protocol + '//' + (location.host || '(local file)'));
      r.push('WebView: ' + (/; wv\)/.test(ua) ? 'YES (Android System WebView)' : 'no / unknown') + '  ' + ((/Chrome\/([\d.]+)/.exec(ua) || [])[1] || ''));
      r.push('speechSynthesis: ' + t(() => window.speechSynthesis));
      r.push('SpeechSynthesisUtterance: ' + t(() => window.SpeechSynthesisUtterance));
      let vs = []; try { vs = (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { /* ignore */ }
      r.push('voices: ' + vs.length + (vs.length ? '  (' + vs.slice(0, 6).map((v) => v.lang).join(', ') + (vs.length > 6 ? ', ...' : '') + ')' : ''));
      r.push('window.TTS (cordova): ' + t(() => window.TTS));
      r.push('window.AZ_NativeTTS: ' + t(() => window.AZ_NativeTTS));
      V.BRIDGE_NAMES.forEach((n) => { let o; try { o = window[n]; } catch (e) { o = undefined; } if (o && (typeof o === 'object' || typeof o === 'function')) r.push('window.' + n + ': ' + V.methodsOf(o).join(', ')); });
      if (!V.BRIDGE_NAMES.some((n) => { try { return !!window[n]; } catch (e) { return false; } })) r.push('builder bridges (AndroidAPI, Android, ...): none found');
      r.push('');
      r.push('TTS backend in use: ' + (V.supported ? V.backend + (V.bridge ? ' (' + V.bridge.name + '.' + V.bridge.speak + ')' : '') : 'NONE'));
      r.push('Status: ' + V.status() + (V.disabledForSession ? '  (speech failed twice, switched off)' : ''));
      if (!V.supported) r.push('', 'This WebView has no text-to-speech. Open the game in Chrome instead (see README).');
      return r.join('\n');
    },
    /** 'ON' | 'OFF' | 'NA' — the single source of truth for the indicator. */
    status() { if (!V.supported || V.disabledForSession) return 'NA'; return V.cfg().voiceOn ? 'ON' : 'OFF'; },
    showDiag() {
      const d = document.getElementById('voice-diag'), pre = document.getElementById('vdiag-text'); if (!d || !pre) return;
      pre.textContent = V.report(); d.classList.remove('hidden');
    },

    unlock() {
      if (V.backend !== 'web') return;
      try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* ignore */ }
    },
    loadVoices() { try { V.voices = speechSynthesis.getVoices() || []; } catch (e) { V.voices = []; } },
    hasHindiVoice() { return !V.voices.length || V.voices.some((v) => /^hi/i.test(v.lang)); },   // unknown list => assume the engine copes

    pickVoice(lang, role) {
      if (V.backend !== 'web' || !V.voices.length) return null;
      const base = lang.slice(0, 2).toLowerCase();
      let list = V.voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase());
      if (!list.length) list = V.voices.filter((v) => v.lang && v.lang.toLowerCase().indexOf(base) === 0);
      if (!list.length && base === 'en') list = V.voices.filter((v) => /^en/i.test(v.lang));
      if (!list.length) return null;
      const prof = ROLES[role] || null;
      const want = prof ? prof.gender : (hash(role) % 2 ? 'f' : 'm');
      const re = want === 'f' ? FEMALE : MALE, other = want === 'f' ? MALE : FEMALE;
      const match = list.filter((v) => re.test(v.name) && !other.test(v.name));
      if (match.length) return match[hash(role) % match.length];
      const neutral = list.filter((v) => !other.test(v.name));
      const pool = neutral.length ? neutral : list;
      return pool[hash(role) % pool.length];
    },

    profile(role) {
      if (ROLES[role]) return ROLES[role];
      const h = hash(role || 'x');            // survivors & strangers: a stable, distinct voice each
      return { pitch: 0.7 + (h % 70) / 100, rate: 0.9 + ((h >> 8) % 15) / 100, gender: (h >> 4) % 2 ? 'f' : 'm' };
    },

    /* ------------------------------------------------------------ narration text */
    lookup(t) { return V.learned.get(t) || (AZ.narr && AZ.narr[t]) || null; },
    learn(orig, narr) { if (orig && narr) { if (V.learned.size > 3000) V.learned.clear(); V.learned.set(orig, narr); } },

    clean(t) {
      return String(t).replace(/\{\{[^}]*\}\}/g, '').replace(/…/g, '.').replace(/\.{2,}/g, '.').replace(/[—–]/g, ', ').replace(/[☠◆★▼]/g, '').replace(/\s+/g, ' ').trim();
    },
    sentences(t) { return (t.match(/[^।.!?]+[।.!?]*["”')\]]*\s*/g) || [t]).map((s) => s.trim()).filter(Boolean); },

    /** What to say for one displayed string -> [{text, lang}] */
    itemsFor(displayed) {
      const mode = V.cfg().voiceLang;
      const useDev = mode !== 'en' && (mode === 'hi' || V.hasHindiVoice());
      const out = [];
      const push = (text, lang) => { text = V.clean(text); if (text) out.push({ text, lang }); };
      const whole = useDev ? V.lookup(displayed) : null;
      if (whole) { V.split(whole).forEach((p) => push(p, DEV.test(p) ? 'hi-IN' : 'en-IN')); return out; }
      V.sentences(displayed).forEach((s) => {              // dynamic text: translate what we can, sentence by sentence
        const n = useDev ? V.lookup(s) : null;
        const m = useDev && !n ? /^(.+?) ki taraf chalo[.!]?$/i.exec(s) : null;   // hub destinations: "<place> ki taraf chalo."
        if (n) V.split(n).forEach((p) => push(p, DEV.test(p) ? 'hi-IN' : 'en-IN'));
        else if (m) { push(m[1], 'en-IN'); push('की तरफ़ चलो।', 'hi-IN'); }
        else push(s, 'en-IN');
      });
      return out;
    },
    /** Break long text into engine-friendly chunks (Chrome/Android cut off long utterances). */
    split(t) {
      const parts = V.sentences(t), out = []; let buf = '';
      parts.forEach((p) => { if ((buf + ' ' + p).length > 170 && buf) { out.push(buf); buf = p; } else buf = buf ? buf + ' ' + p : p; });
      if (buf) out.push(buf);
      return out.length ? out : [t];
    },

    roleOf(who, sid) {
      if (!who) return 'narrator';
      const w = String(who).toLowerCase().replace(/[^a-z ]/g, '').trim();
      if (w === 'you' || w === 'tum') return 'hero';
      if (w === 'voice' || w === 'awaaz' || w === 'recording' || w === 'radio') return 'listener';
      if (sid) return sid === 'protagonist' ? 'hero' : sid;
      return w || 'narrator';
    },

    /* ------------------------------------------------------------ public flow API (called by the UI) */
    /** A new scene begins: silence whatever was playing (unless a protected cinematic line is still going). */
    newScene() { if (!V.protect) V.stop(); V.doneCb = null; clearTimeout(V.doneTimer); },

    /** Speak one dialogue line. Names are never spoken. */
    line(line, sid) {
      V.lastLine = { line, sid };
      if (!V.active()) { V.refreshUi(); return; }
      const key = String(line.text), now = Date.now();           // same line asked twice in a row (double render) = say it once
      if (V._lastKey === key && now - (V._lastAt || 0) < 400) return;
      V._lastKey = key; V._lastAt = now;
      if (!V.protect) V.stop();
      const role = V.roleOf(line.who, sid); V.lastRole = role;
      V.enqueue(V.itemsFor(line.text).map((it) => Object.assign(it, { role })));
    },

    /** After the narration: "Ab tum kya karoge?", each option, "Choose your action." — choices are never auto-picked. */
    announceChoices(choices) {
      if (!V.active() || !choices || !choices.length) return;
      const items = [Object.assign({}, V.cfg().voiceLang === 'en' || !V.hasHindiVoice() ? { text: PHRASES.askEn, lang: 'en-IN' } : PHRASES.ask, { role: 'narrator', pause: 250 })];
      const hi = V.cfg().voiceLang !== 'en' && V.hasHindiVoice();
      choices.forEach((c, i) => {
        items.push({ text: (hi ? PHRASES.optionHi : PHRASES.optionEn)[i] || ('Option ' + (i + 1)), lang: hi ? 'hi-IN' : 'en-IN', role: 'system', pause: 120 });
        V.itemsFor(c.text).forEach((it) => items.push(Object.assign(it, { role: 'hero' })));
      });
      items.push(Object.assign({}, PHRASES.choose, { role: 'narrator' }));
      V.enqueue(items);
    },

    /** Run cb once the current speech has finished (or right away if nothing is playing). Only one waiter at a time. */
    afterLine(cb, delay) {
      clearTimeout(V.doneTimer); V.doneCb = null;
      if (!V.active() || (!V.speaking && !V.queue.length && !V.paused)) { cb(); return; }
      const g = V.gen;
      V.doneCb = () => { V.doneTimer = setTimeout(() => { if (g === V.gen || !V.speaking) cb(); }, delay === undefined ? 380 : delay); };
    },

    /** Death cinematic: the death lines, then the system line. */
    death(def, lines) {
      V.stop(); V.protect = false;
      if (!V.active()) return;
      const items = [];
      (lines || []).forEach((l) => V.itemsFor(l).forEach((it) => items.push(Object.assign(it, { role: 'narrator' }))));
      items.push(Object.assign({}, PHRASES.died, { role: 'system' }));
      V.enqueue(items);
    },
    /** Timeline reset: say it, and keep it protected so the next scene's narration waits its turn. */
    reset() {
      V.stop();
      if (!V.active()) return;
      V.protect = true;
      V.enqueue([Object.assign({}, PHRASES.again, { role: 'system' })]);
    },

    stop() {
      V.gen++; V.queue = []; V.cur = null; V.speaking = false; V.paused = false; V.autoPaused = false; V.protect = false;
      clearTimeout(V.watchdog); clearTimeout(V.doneTimer); clearInterval(V.poll); V.doneCb = null; V._lastKey = '';
      try {
        if (V.backend === 'web') { speechSynthesis.cancel(); V.cancelAt = Date.now(); }
        else if (V.backend === 'native') window.AZ_NativeTTS.stop && window.AZ_NativeTTS.stop();
        else if (V.backend === 'bridge') V.bridgeStop();
        else if (V.backend === 'cordova') window.TTS.speak({ text: '' }, function () {}, function () {});
      } catch (e) { /* ignore */ }
      V.refreshUi();
    },

    replay() {
      if (!V.supported) return;
      if (AZ.UI && AZ.UI.replayScene) AZ.UI.replayScene();
    },

    pause() {
      if (!V.speaking || V.paused) return;
      V.paused = true; V.gen++;
      clearTimeout(V.watchdog); clearTimeout(V.doneTimer); clearInterval(V.poll);
      if (V.cur) V.queue.unshift(V.cur);                    // speak the interrupted chunk again on resume
      V.cur = null; V.speaking = false;
      try { if (V.backend === 'web') { speechSynthesis.cancel(); V.cancelAt = Date.now(); } else if (V.backend === 'native' && window.AZ_NativeTTS.stop) window.AZ_NativeTTS.stop(); else if (V.backend === 'bridge') V.bridgeStop(); } catch (e) { /* ignore */ }
      V.refreshUi();
    },
    resume() {
      if (!V.paused) return;
      V.paused = false; V.autoPaused = false;
      if (V.queue.length) V.pump();
      else if (V.doneCb) { const cb = V.doneCb; V.doneCb = null; cb(); }
      V.refreshUi();
    },
    togglePause() { if (V.paused) V.resume(); else V.pause(); },

    /** Game hidden / app suspended: stop talking, remember where we were. */
    suspend() { if (V.speaking && !V.paused) { V.pause(); V.autoPaused = true; } },
    wake() { if (V.autoPaused) V.resume(); },

    setOn(on) { V.cfg().voiceOn = !!on; V.save(); if (!on) V.stop(); else if (AZ.UI && AZ.UI.inGame && !AZ.UI.deathActive) V.replay(); V.refreshUi(); },
    setMuted(m) { V.cfg().voiceMuted = !!m; V.save(); if (m) V.stop(); V.refreshUi(); },
    setVol(v) { V.cfg().voiceVol = clamp(+v, 0, 1); V.save(); },
    setRate(v) { V.cfg().voiceRate = clamp(+v, 0.6, 1.5); V.save(); },
    setLang(l) { V.cfg().voiceLang = l; V.save(); },
    applySettings() { const c = V.cfg(); if ((!c.voiceOn || c.voiceMuted) && (V.speaking || V.queue.length || V.paused)) V.stop(); V.refreshUi(); },

    /* ------------------------------------------------------------ the queue */
    enqueue(items) {
      if (!items.length) return;
      V.queue.push.apply(V.queue, items);
      if (!V.speaking && !V.paused) V.pump();
    },

    pump() {
      if (V.paused) return;
      const item = V.queue.shift();
      if (!item) {
        V.cur = null; V.speaking = false; V.protect = false; V.refreshUi();
        if (V.doneCb) { const cb = V.doneCb; V.doneCb = null; cb(); }
        return;
      }
      V.cur = item; V.speaking = true; V.refreshUi();
      const g = V.gen, prof = V.profile(item.role);
      let finished = false, started = false;
      const done = (ok) => {
        if (finished || g !== V.gen) return; finished = true; clearTimeout(V.watchdog); clearInterval(V.poll);
        if (!ok && !started) V.noteFailure(); else if (started) V.failures = 0;
        V.cur = null;
        if (item.pause) setTimeout(() => { if (g === V.gen) V.pump(); }, item.pause); else V.pump();
      };
      const rate = clamp(prof.rate * V.cfg().voiceRate, 0.5, 2), vol = clamp(V.cfg().voiceVol, 0, 1);
      // Safety net: if the engine never reports "end" (some WebViews), move on instead of freezing the game.
      const est = Math.max(3500, (item.text.length / (9 * rate)) * 1000 + 3000);
      V.watchdog = setTimeout(() => { done(started); }, est + 4000);
      try {
        if (V.backend === 'web') {
          const u = new SpeechSynthesisUtterance(item.text);
          u.lang = item.lang; u.rate = rate; u.pitch = clamp(prof.pitch, 0, 2); u.volume = vol;
          const voice = V.pickVoice(item.lang, item.role); if (voice) u.voice = voice;
          u.onstart = () => { started = true; };
          u.onend = () => { started = true; done(true); };
          u.onerror = (e) => { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; done(false); };
          // a stale queue in the engine would make two voices overlap — always clear first
          if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); V.cancelAt = Date.now(); }
          // some Chrome/Android builds drop a speak() issued right after cancel(): leave a short gap
          const gap = Math.max(0, 90 - (Date.now() - (V.cancelAt || 0)));
          if (gap) setTimeout(() => { if (g === V.gen && !finished) { try { speechSynthesis.speak(u); } catch (e) { done(false); } } }, gap);
          else speechSynthesis.speak(u);
        } else if (V.backend === 'native') {
          window.AZ_NativeTTS.speak(item.text, item.lang, rate, prof.pitch, vol, () => { started = true; done(true); });
        } else if (V.backend === 'bridge') {
          // A bridge has no "finished" event: poll isSpeaking() when it exists, otherwise estimate from the text length.
          V.bridgeSpeak(item.text, item.lang, rate, prof.pitch);
          started = true; const t0 = Date.now(), b = V.bridge;
          if (b.isSpeaking) {
            V.poll = setInterval(() => { let sp = true; try { sp = !!b.obj[b.isSpeaking](); } catch (e) { sp = false; } if (!sp && Date.now() - t0 > 700) done(true); }, 220);
          } else {
            const ms = Math.max(900, (item.text.length / (11 * rate)) * 1000 + 350);
            V.poll = setTimeout(() => done(true), ms);
          }
        } else if (V.backend === 'cordova') {
          window.TTS.speak({ text: item.text, locale: item.lang.replace('-', '_'), rate: rate }, () => { started = true; done(true); }, () => done(false));
        }
      } catch (e) { AZ.warn('Voice error: ' + (e && e.message)); done(false); }
    },

    /** Speech silently failing twice in a row (typical for WebViews without a TTS engine) switches voice off for this session. */
    noteFailure() {
      V.failures++;
      if (V.failures >= 2 && !V.disabledForSession) {
        V.disabledForSession = true; V.stop();
        if (AZ.UI && AZ.UI.toast && !V._warned) { V._warned = true; AZ.UI.toast('Is device par voice nahi chal rahi — game text se khelo.', 'warn'); }
        V.refreshUi();
      }
    },

    /* ------------------------------------------------------------ small control dock + indicators */
    buildDock() {
      const d = document.getElementById('voice-dock'); if (!d) return;
      const $ = (id) => document.getElementById(id);
      V.el = { dock: d, toggle: $('vd-toggle'), bars: $('vd-bars'), replay: $('vd-replay'), pause: $('vd-pause'), mute: $('vd-mute'), more: $('vd-more'), pop: $('vd-pop'), vol: $('vd-vol'), rate: $('vd-rate'), lang: $('vd-lang') };
      const click = (el, fn) => { if (el) el.addEventListener('click', (e) => { e.stopPropagation(); try { AZ.Audio.unlock(); } catch (x) { /* ignore */ } fn(); }); };
      click(V.el.toggle, () => {
        if (!V.supported || V.disabledForSession) { V.showDiag(); return; }
        V.setOn(!V.cfg().voiceOn);
      });
      click(V.el.replay, () => V.replay());
      click(V.el.pause, () => V.togglePause());
      click(V.el.mute, () => V.setMuted(!V.cfg().voiceMuted));
      click(V.el.more, () => V.el.pop.classList.toggle('hidden'));
      click($('vd-diag'), () => V.showDiag());
      const dg = document.getElementById('voice-diag');
      if (dg) dg.addEventListener('click', (ev) => ev.stopPropagation());
      click($('vdiag-close'), () => dg && dg.classList.add('hidden'));
      click($('vdiag-test'), () => { if (!V.supported) return; V.stop(); V.disabledForSession = false; V.failures = 0; V.refreshUi(); V.enqueue([{ text: 'यह आवाज़ की जाँच है। अगर तुम मुझे सुन रहे हो, तो आवाज़ चल रही है।', lang: 'hi-IN', role: 'narrator' }, { text: 'Voice test. Can you hear me?', lang: 'en-IN', role: 'system' }]); });
      click($('vdiag-copy'), () => { const txt = V.report(); try { if (navigator.clipboard) navigator.clipboard.writeText(txt); } catch (x) { /* ignore */ } try { if (window.AndroidAPI && AndroidAPI.copyToClipboard) AndroidAPI.copyToClipboard(txt); } catch (x) { /* ignore */ } try { AZ.UI.toast('Report copy ho gayi (ya screen se padh lo).', 'item'); } catch (x) { /* ignore */ } });
      const c = V.cfg();
      if (V.el.vol) { V.el.vol.value = c.voiceVol; V.el.vol.addEventListener('input', () => V.setVol(V.el.vol.value)); }
      if (V.el.rate) { V.el.rate.value = c.voiceRate; V.el.rate.addEventListener('input', () => V.setRate(V.el.rate.value)); }
      if (V.el.lang) { V.el.lang.value = c.voiceLang; V.el.lang.addEventListener('change', () => { V.setLang(V.el.lang.value); V.replay(); }); }
      d.addEventListener('click', (e) => e.stopPropagation());
    },

    refreshUi() {
      const e = V.el; if (!e.dock) return;
      const c = V.cfg(), on = c.voiceOn && V.supported && !V.disabledForSession;
      e.toggle.textContent = 'VOICE ' + V.status();
      e.toggle.classList.toggle('off', !on);
      e.mute.textContent = c.voiceMuted ? 'UNMUTE' : 'MUTE';
      e.mute.classList.toggle('off', !!c.voiceMuted);
      e.pause.textContent = V.paused ? '▶' : '❚❚';
      e.pause.title = V.paused ? 'Resume' : 'Pause';
      e.dock.classList.toggle('na', !V.supported || !!V.disabledForSession);
      const talking = V.speaking && !V.paused;
      e.dock.classList.toggle('talking', talking);
      const st = document.getElementById('stage');
      if (st) st.classList.toggle('voice-talking', talking);
      if (e.vol) e.vol.value = c.voiceVol;
      if (e.rate) e.rate.value = c.voiceRate;
      if (e.lang) e.lang.value = c.voiceLang;
    },
    showDock(show) { if (V.el.dock) V.el.dock.classList.toggle('hidden', !show); if (!show && V.el.pop) V.el.pop.classList.add('hidden'); }
  };
})();
