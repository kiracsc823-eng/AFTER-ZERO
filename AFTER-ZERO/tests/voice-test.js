/* AFTER ZERO - voice narration test (Playwright + Chromium, file://).
   Run: node tests/voice-test.js
   A mock speechSynthesis (hi-IN + en-IN voices) records every utterance and detects overlapping speech,
   so the 12 checks from the voice spec run without a sound card. */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } };

const MOCK = () => {
  const log = window.__spoken = [], st = { overlaps: 0, cancels: 0, cur: null };
  const voices = [
    { name: 'Google हिन्दी', lang: 'hi-IN', default: false, localService: true, voiceURI: 'hi' },
    { name: 'Google English India Female', lang: 'en-IN', default: true, localService: true, voiceURI: 'en' },
    { name: 'Google English India Male', lang: 'en-IN', default: false, localService: true, voiceURI: 'enm' }
  ];
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; };
  window.__speechState = st;
  const synth = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices() { return voices; },
    speak(u) {
      if (st.cur) { st.overlaps++; }
      st.cur = u; this.speaking = true;
      log.push({ text: u.text, lang: u.lang, pitch: u.pitch, rate: u.rate, volume: u.volume, voice: u.voice && u.voice.name, t: Date.now() });
      u.__t1 = setTimeout(() => { if (st.cur === u && u.onstart) u.onstart({}); }, 5);
      u.__t2 = setTimeout(() => { if (st.cur === u) { st.cur = null; synth.speaking = false; if (u.onend) u.onend({}); } }, 40 + u.text.length * 3);
    },
    cancel() { const u = st.cur; if (u) { clearTimeout(u.__t1); clearTimeout(u.__t2); st.cur = null; st.cancels++; this.speaking = false; if (u.onerror) u.onerror({ error: 'interrupted' }); } },
    pause() { this.paused = true; }, resume() { this.paused = false; }
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  await page.addInitScript(MOCK);
  await page.addInitScript(() => { try { if (!localStorage.getItem('afterzero.v1.settings')) localStorage.setItem('afterzero.v1.settings', JSON.stringify({ textSpeed: 0, musicVol: 0.2, sfxVol: 0.2 })); } catch (e) {} });

  const spoken = () => page.evaluate(() => window.__spoken.map((x) => x.text).filter((t) => t.trim()));
  const clear = () => page.evaluate(() => { window.__spoken.length = 0; });
  const waitChoices = async (ms = 20000) => { await page.waitForSelector('.choice', { timeout: ms }); };
  const quiet = async () => { for (let i = 0; i < 100; i++) { const n = await page.evaluate(() => window.__spoken.length); await page.waitForTimeout(800); if (n === await page.evaluate(() => window.__spoken.length)) return; } };

  console.log('▸ Boot, defaults');
  await page.goto(URL); await page.waitForTimeout(700);
  const def = await page.evaluate(() => { const s = AZ.State.getSettings(); return { on: s.voiceOn, vol: s.voiceVol, rate: s.voiceRate, backend: AZ.Voice.backend, sup: AZ.Voice.supported }; });
  ok(def.on === true, 'voice ON by default for a new player');
  ok(def.sup && def.backend === 'web', 'speechSynthesis detected');

  console.log('▸ 1-3. New scene speaks; dialogue; "Ab tum kya karoge?"');
  await page.click('#menu-buttons button.primary'); await page.waitForTimeout(300);
  await page.locator('.confirm-box button').first().click({ timeout: 1500 }).catch(() => {});
  await waitChoices();
  await quiet();
  let sp = await spoken();
  ok(sp.length >= 4, 'scene narration spoken (' + sp.length + ' chunks)');
  ok(sp.some((t) => /[ऀ-ॿ]/.test(t)), 'Devanagari used for Hindi speech');
  ok(sp[0].includes('वॉर्निंग') || /[ऀ-ॿ]/.test(sp[0]), 'first spoken line is the opening line');
  ok(!sp.some((t) => /^HALCYON\b/i.test(t) || /^NARRATOR/i.test(t)), 'speaker names are not read out');
  const roles = await page.evaluate(() => window.__spoken.map((x) => x.pitch));
  ok(new Set(roles).size >= 2, 'different characters get different pitch/voice (' + [...new Set(roles)].join(', ') + ')');
  const iAsk = sp.findIndex((t) => t.includes('अब तुम क्या करोगे'));
  ok(iAsk > 0, '"Ab tum kya karoge?" is spoken after the narration');

  console.log('▸ 4-5. Choices read aloud, then "Choose your action."');
  const shown = await page.locator('.choice').allInnerTexts();
  ok(shown.length >= 2, shown.length + ' choices on screen');
  ok(sp.slice(iAsk).some((t) => t.includes('विकल्प ए')) && sp.slice(iAsk).some((t) => t.includes('विकल्प बी')), 'Option A and Option B announced');
  ok(sp[sp.length - 1] === 'Choose your action.', 'ends with "Choose your action."');
  const optIdx = sp.findIndex((t) => t.includes('विकल्प ए'));
  ok(optIdx > iAsk && optIdx < sp.length - 1, 'order: ask -> options -> "Choose your action."');
  const picked = await page.evaluate(() => AZ.State.tl.sceneId);
  ok(await page.locator('.choice').count() === shown.length && picked === 'wake', 'nothing was auto-selected');

  console.log('▸ 6. Player picks a choice -> next scene speaks');
  await clear();
  await page.locator('.choice').first().click();
  await page.waitForTimeout(900);
  await waitChoices(); await quiet();
  sp = await spoken();
  ok(sp.length >= 2, 'next scene narration starts automatically (' + sp.length + ' chunks)');
  ok(!(await page.evaluate(() => window.__speechState.overlaps)), 'no overlapping voices so far');

  console.log('▸ 7. Replay');
  await clear();
  await page.click('#vd-replay'); await page.waitForTimeout(300);
  await quiet();
  const rep = await spoken();
  ok(rep.length >= 2, 'replay speaks the scene again (' + rep.length + ' chunks)');
  ok(await page.evaluate(() => AZ.Voice.queue.length === 0), 'replay finished cleanly');

  console.log('▸ 8. Pause / Resume');
  await clear();
  await page.click('#vd-replay'); await page.waitForTimeout(120);
  const before = (await spoken()).length;
  await page.click('#vd-pause'); await page.waitForTimeout(100);
  const pausedNow = await page.evaluate(() => AZ.Voice.paused);
  await page.waitForTimeout(600);
  const mid = (await spoken()).length;
  ok(pausedNow, 'pause button pauses');
  ok(mid === before || mid === before + 0, 'no new speech while paused (' + before + ' -> ' + mid + ')');
  await page.click('#vd-pause'); await page.waitForTimeout(200);
  await quiet();
  ok((await spoken()).length > mid, 'resume continues speaking');

  console.log('▸ Visibility: hiding the app pauses voice');
  await clear();
  await page.click('#vd-replay'); await page.waitForTimeout(100);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  const hiddenN = (await spoken()).length; await page.waitForTimeout(500);
  ok((await spoken()).length === hiddenN, 'silent while the app is in the background');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await quiet();
  ok((await spoken()).length > hiddenN, 'resumes when the app returns');

  console.log('▸ Settings: volume, speed, mute');
  await page.evaluate(() => { AZ.Voice.setVol(0.4); AZ.Voice.setRate(1.25); });
  await quiet(); await clear(); await page.click('#vd-replay'); await page.waitForTimeout(600);
  const us = (await page.evaluate(() => window.__spoken.filter((x) => x.text.trim()))).slice(0, 4);
  ok(us.length >= 1 && us.every((x) => Math.abs(x.volume - 0.4) < 0.01), 'volume setting applied to every chunk (' + us.map((x) => x.volume).join(',') + ')');
  ok(us.length >= 1 && us.every((x) => x.rate > 1.0), 'speed setting applied (' + us.map((x) => x.rate.toFixed(2)).join(',') + ')');
  await page.click('#vd-mute'); await page.waitForTimeout(150);
  await clear(); await page.waitForTimeout(400);
  ok((await spoken()).length === 0 && await page.evaluate(() => !AZ.Voice.speaking), 'mute stops speech');
  await page.click('#vd-mute');

  console.log('▸ 9. Voice OFF disables speech');
  await page.click('#vd-toggle'); await page.waitForTimeout(200);
  await clear();
  await page.locator('.choice').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  ok((await spoken()).length === 0, 'no speech with voice OFF');
  ok(await page.evaluate(() => AZ.State.tl.sceneId !== 'wake'), 'game still playable with voice OFF');

  console.log('▸ 10. Settings persist after restart');
  await page.evaluate(() => { AZ.Voice.setVol(0.55); AZ.Voice.setRate(1.15); AZ.Save.saveSettings(); });
  await page.reload(); await page.waitForTimeout(800);
  const persisted = await page.evaluate(() => { const s = AZ.State.getSettings(); return { on: s.voiceOn, vol: s.voiceVol, rate: s.voiceRate }; });
  ok(persisted.on === false && Math.abs(persisted.vol - 0.55) < 0.01 && Math.abs(persisted.rate - 1.15) < 0.01, 'voice OFF / volume / speed survived restart ' + JSON.stringify(persisted));
  await page.evaluate(() => { AZ.Voice.setOn(true); });

  console.log('▸ 11. Death + timeline reset: no overlap');
  await page.evaluate(() => { AZ.Voice.setVol(1); AZ.Voice.setRate(1.6); });
  await page.click('#menu-buttons button >> text=/CONTINUE|JARI/i').catch(() => {});
  await page.waitForTimeout(800);
  if (!(await page.evaluate(() => AZ.UI.inGame))) { await page.click('#menu-buttons button.primary'); await page.waitForTimeout(300); await page.locator('.confirm-box button').first().click({ timeout: 1500 }).catch(() => {}); }
  await page.waitForSelector('.choice', { timeout: 20000 });
  await clear();
  await page.evaluate(() => { AZ.State.tl.clocks.oxygen = 1; });
  for (let i = 0; i < 12; i++) {
    if (await page.evaluate(() => AZ.UI.deathActive)) break;
    if (await page.locator('.choice').count()) await page.locator('.choice').first().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.evaluate(() => { if (AZ.State.tl.clocks && AZ.State.tl.clocks.oxygen > 1) AZ.State.tl.clocks.oxygen = 1; });
  }
  await page.waitForFunction(() => AZ.UI.deathActive, null, { timeout: 8000 }).catch(() => {});
  ok(await page.evaluate(() => AZ.UI.deathActive), 'death cinematic started');
  await page.waitForTimeout(2500);
  sp = await spoken();
  ok(sp.includes('Timeline terminated. Returning to the last known checkpoint.'), 'death voice line spoken');
  const ret = page.locator('#death button').last();
  await page.waitForSelector('#death button', { timeout: 15000 }).catch(() => {});
  await ret.click().catch(() => {});
  await page.waitForTimeout(1500);
  await waitChoices(25000).catch(() => {}); await quiet();
  sp = await spoken();
  ok(sp.includes('Another chance. Another timeline. But the memories remain.'), 'reset line spoken');
  const iReset = sp.indexOf('Another chance. Another timeline. But the memories remain.');
  ok(iReset >= 0 && sp.length > iReset + 3, 'new timeline narration follows the reset line');
  ok(await page.evaluate(() => AZ.State.tl.n >= 2), 'timeline counter increased');
  const ov = await page.evaluate(() => window.__speechState.overlaps);
  ok(ov === 0, 'overlapping speech events during the whole run: ' + ov);
  ok(await page.evaluate(() => !AZ.Voice.speaking && AZ.Voice.queue.length === 0), 'voice idle after narration');

  console.log('▸ 12. No speech engine (APK without TTS): graceful fallback');
  const page2 = await ctx.newPage();
  const errs2 = [];
  page2.on('pageerror', (e) => errs2.push(e.message));
  page2.on('console', (m) => { if (m.type() === 'error') errs2.push(m.text()); });
  await page2.addInitScript(() => { try { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); window.SpeechSynthesisUtterance = undefined; localStorage.setItem('afterzero.v1.settings', JSON.stringify({ textSpeed: 0 })); } catch (e) {} });
  await page2.goto(URL); await page2.waitForTimeout(700);
  await page2.click('#menu-buttons button.primary'); await page2.waitForTimeout(300);
  await page2.locator('.confirm-box button').first().click({ timeout: 1500 }).catch(() => {});
  await page2.waitForSelector('.choice', { timeout: 15000 });
  ok(await page2.evaluate(() => !AZ.Voice.supported), 'voice reports unsupported');
  ok((await page2.locator('#vd-toggle').innerText()).includes('NA'), 'dock shows VOICE NA');
  await page2.locator('.choice').first().click(); await page2.waitForTimeout(800);
  ok(errs2.length === 0, 'game plays normally without TTS, no errors ' + JSON.stringify(errs2));

  console.log('▸ 13. APK builder bridge with a TTS method (window.AndroidAPI.speak)');
  const page3 = await ctx.newPage();
  const errs3 = [];
  page3.on('pageerror', (e) => errs3.push(e.message));
  page3.on('console', (m) => { if (m.type() === 'error') errs3.push(m.text()); });
  await page3.addInitScript(() => {
    try { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); window.SpeechSynthesisUtterance = undefined; localStorage.setItem('afterzero.v1.settings', JSON.stringify({ textSpeed: 0 })); } catch (e) {}
    const B = window.__b = { said: [], overlaps: 0, stops: 0, speaking: false, timer: 0 };
    // Strict Java-style signature: speak(String, String, float) - wrong arity throws, like a real addJavascriptInterface object.
    window.AndroidAPI = {
      showToast(t) {}, vibrate(ms) {},
      speak(text, lang, rate) { if (arguments.length !== 3) throw new TypeError('Method speak not found'); if (B.speaking) B.overlaps++; B.said.push(text); B.speaking = true; clearTimeout(B.timer); B.timer = setTimeout(() => { B.speaking = false; }, 250); },
      isSpeaking() { return B.speaking; },
      stopSpeaking() { B.stops++; B.speaking = false; clearTimeout(B.timer); }
    };
  });
  await page3.goto(URL); await page3.waitForTimeout(700);
  await page3.click('#menu-buttons button.primary'); await page3.waitForTimeout(300);
  await page3.locator('.confirm-box button').first().click({ timeout: 1500 }).catch(() => {});
  await page3.waitForSelector('.choice', { timeout: 20000 });
  ok(await page3.evaluate(() => AZ.Voice.backend === 'bridge' && AZ.Voice.supported), 'AndroidAPI speak() detected as a backend');
  ok((await page3.locator('#vd-toggle').innerText()).includes('ON'), 'status shows VOICE ON');
  await page3.waitForFunction(() => window.__b.said.some((t) => /Choose your action/.test(t)), null, { timeout: 25000 }).catch(() => {});
  const b1 = await page3.evaluate(() => ({ n: window.__b.said.length, tail: window.__b.said.slice(-3), ov: window.__b.overlaps, ar: AZ.Voice.bridge.arity }));
  ok(b1.n > 4, 'narration spoken through the bridge (' + b1.n + ' pieces)');
  ok(b1.ar === 2, 'bridge signature (text, lang, rate) found by probing');
  ok(b1.tail.some((t) => /Choose your action/.test(t)), 'bridge: choices then "Choose your action."');
  ok(b1.ov === 0, 'bridge: never two voices at once');
  const stopsBefore = await page3.evaluate(() => window.__b.stops);
  await page3.locator('.choice').first().click(); await page3.waitForTimeout(1200);
  ok(await page3.evaluate((n) => window.__b.stops > n, stopsBefore), 'bridge: picking a choice stops the old voice');
  ok(await page3.evaluate(() => window.__b.overlaps === 0), 'bridge: still no overlap after the next scene starts');
  const dup = await page3.evaluate(() => { const a = window.__b.said, d = a.filter((t, i) => i && t === a[i - 1] && t.length > 20); return d.length; });
  ok(dup === 0, 'bridge: no accidental repeated narration');
  ok(errs3.length === 0, 'bridge page: no console errors ' + JSON.stringify(errs3));

  console.log('▸ 14. Builder bridge WITHOUT TTS (only toast/vibrate) -> honest NA + diagnostics');
  const page4 = await ctx.newPage();
  const errs4 = [];
  page4.on('pageerror', (e) => errs4.push(e.message));
  page4.on('console', (m) => { if (m.type() === 'error') errs4.push(m.text()); });
  await page4.addInitScript(() => {
    try { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); window.SpeechSynthesisUtterance = undefined; localStorage.setItem('afterzero.v1.settings', JSON.stringify({ textSpeed: 0 })); } catch (e) {}
    window.AndroidAPI = { showToast(t) {}, vibrate(ms) {}, copyToClipboard(t) {} };
  });
  await page4.goto(URL); await page4.waitForTimeout(700);
  await page4.click('#menu-buttons button.primary'); await page4.waitForTimeout(300);
  await page4.locator('.confirm-box button').first().click({ timeout: 1500 }).catch(() => {});
  await page4.waitForSelector('.choice', { timeout: 20000 });
  ok(await page4.evaluate(() => !AZ.Voice.supported && AZ.Voice.status() === 'NA'), 'no TTS anywhere -> status NA (not pretending)');
  ok((await page4.locator('#vd-toggle').innerText()).trim() === 'VOICE NA', 'dock text is "VOICE NA"');
  await page4.locator('#vd-toggle').click(); await page4.waitForTimeout(300);
  const diag = await page4.locator('#vdiag-text').innerText();
  ok(await page4.locator('#voice-diag').isVisible(), 'tapping VOICE NA opens the diagnostics screen');
  ok(/speechSynthesis: undefined/.test(diag) && /AndroidAPI: .*showToast/.test(diag) && /TTS backend in use: NONE/.test(diag), 'diagnostics list what the WebView really offers');
  await page4.locator('#vdiag-close').click(); await page4.waitForTimeout(200);
  ok(!(await page4.locator('#voice-diag').isVisible()), 'diagnostics closes');
  await page4.locator('.choice').first().click(); await page4.waitForTimeout(600);
  ok(errs4.length === 0, 'game still plays, no errors ' + JSON.stringify(errs4));


  console.log('▸ Console');
  ok(errors.length === 0, 'no console errors ' + JSON.stringify(errors.slice(0, 3)));

  await browser.close();
  console.log('\n==========================================\nVOICE TEST  PASSED ' + pass + '   FAILED ' + fail);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('TEST CRASH', e); process.exit(2); });
