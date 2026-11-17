/* ============================================================
   AFTER ZERO — uiManager.js : menu, dialogue, choices, HUD, toasts,
   keyboard, confirm dialogs and the death / rewind cinematic.
   (Panels such as Inventory & Journal live in panels.js.)
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State, cfg = () => AZ.data.config;
  const $ = (id) => document.getElementById(id);

  const UI = AZ.UI = {
    el: {}, view: null, idx: 0, typing: false, typeTimer: null, fullText: '', locked: false, inGame: false, panelOpen: false, deathActive: false,
    lastTitle: '', timers: [], speakerId: null,

    init() {
      ['stage', 'scene', 'hud', 'statbar', 'hud-chapter', 'hud-location', 'hud-timeline', 'hud-oxygen', 'objective', 'navbar', 'choices', 'dialog', 'speaker-portrait', 'speaker-name', 'dialog-text',
        'continue', 'toasts', 'chapter-card', 'menu', 'menu-buttons', 'menu-note', 'panel', 'confirm', 'confirm-text', 'confirm-buttons', 'death', 'death-inner', 'fade']
        .forEach((id) => { UI.el[id] = $(id); });
      AZ.Renderer.init(UI.el.scene);
      UI.buildStatBar();
      UI.applySettings();
      UI.bind();
      UI.subscribe();
      UI.showMenu();
    },

    /* ---------------------------------------------------------------- wiring */
    bind() {
      const E = UI.el;
      E.dialog.addEventListener('click', () => UI.advance());
      E.continue.addEventListener('click', (e) => { e.stopPropagation(); UI.advance(); });
      E.navbar.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { AZ.Audio.sfx('click'); AZ.Panels.open(b.dataset.panel); }));
      document.addEventListener('pointerdown', () => AZ.Audio.unlock(), { once: false });
      document.addEventListener('keydown', (e) => UI.onKey(e));
      document.addEventListener('visibilitychange', () => { if (document.hidden && UI.inGame && !UI.deathActive) AZ.Save.autosave(); });
      window.addEventListener('beforeunload', () => { if (UI.inGame && !UI.deathActive) AZ.Save.autosave(); });
      // button feedback sounds for any .btn
      document.addEventListener('mouseover', (e) => { if (e.target.closest && e.target.closest('.btn, .choice, #navbar button')) AZ.Audio.sfx('hover'); });
    },

    subscribe() {
      AZ.bus.on('scene', (v) => UI.onScene(v));
      AZ.bus.on('notes', (n) => UI.onNotes(n));
      AZ.bus.on('death', (d) => UI.playDeath(d));
      AZ.bus.on('cue', (c) => { if (c.sfx) AZ.Audio.sfx(c.sfx === 'die' ? 'hit' : c.sfx); if (c.shake) { AZ.Renderer.shake(); AZ.Audio.sfx('hit'); } });
      AZ.bus.on('checkpoint', (c) => { if (c.kind === 'major') { UI.toast('CHECKPOINT MILA — timeline anchor ho gayi', 'checkpoint'); AZ.Audio.sfx('checkpoint'); } });
      AZ.bus.on('achievement', (a) => { const d = cfg().achievements[a.id]; if (d) { UI.toast('★ ' + d.name + ' — ' + d.desc, 'ability'); AZ.Audio.sfx('ability'); } });
      AZ.bus.on('ability', (a) => { const d = cfg().abilities[a.id]; if (d) UI.toast('Kaabiliyat: ' + d.name, 'ability'); });
      AZ.bus.on('memory', () => AZ.Audio.sfx('learn'));
      AZ.bus.on('saved', (s) => { if (s.slot !== 'auto') { UI.toast('Game save ho gaya', 'item'); AZ.Audio.sfx('save'); } });
    },

    applySettings() {
      const s = S().getSettings();
      UI.el.stage.classList.toggle('noscan', !s.scanlines);
      AZ.Renderer.enabledParticles = !!s.particles;
      AZ.Audio.applyVolumes();
    },

    /* ---------------------------------------------------------------- menu */
    showMenu() {
      UI.inGame = false; UI.closePanel();
      UI.el.menu.classList.remove('hidden');
      UI.el.hud.classList.add('hidden'); UI.el.dialog.classList.add('hidden'); UI.el.choices.classList.add('hidden');
      AZ.Renderer.setView({ bg: 'ruins', bgSeed: 'menu', mood: { particles: 'ash' }, chars: [] });
      AZ.Audio.setMusic('mystery'); AZ.Audio.setAmbience('wind');
      const box = UI.el['menu-buttons']; box.innerHTML = '';
      const add = (label, fn, cls) => { const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label; b.addEventListener('click', () => { AZ.Audio.unlock(); AZ.Audio.sfx('click'); fn(); }); box.appendChild(b); return b; };
      const hasSave = AZ.Save.hasAnySave() && AZ.Save.latestSlot();
      if (hasSave) add('JAARI RAKHO', () => UI.continueGame(), 'primary');
      add('NAYA GAME', () => UI.newGame(), hasSave ? '' : 'primary');
      if (hasSave) add('LOAD GAME', () => AZ.Panels.open('saves'));
      add('SETTINGS', () => AZ.Panels.open('settings'));
      const note = UI.el['menu-note'];
      const m = S().meta;
      const parts = [];
      if (m && m.deaths) parts.push(m.deaths + ' maut yaad hain · ' + Object.keys(m.knowledge).length + ' sthayi yaadein');
      if (!AZ.Save.storageOk) parts.push('⚠ Browser storage band hai — tab band karte hi progress kho jayegi.');
      note.textContent = parts.join('   ');
    },

    continueGame() {
      const slot = AZ.Save.latestSlot();
      const r = slot ? AZ.Save.load(slot) : { ok: false, error: 'Koi save nahi mila.' };
      if (!r.ok) return UI.confirm(r.error + ' Uski jagah naya game shuru karein?', 'NAYA GAME', () => UI.newGame(true), 'RADD KARO');
      UI.beginGame(true);
    },

    newGame(skipConfirm) {
      const go = () => { AZ.Save.newProfile(); UI.beginGame(false); };
      if (!skipConfirm && AZ.Save.hasAnySave()) UI.confirm('Naya game shuru karein?\n\nTumhari sthayi yaadein aur saare save slots badal jayenge. (Purana profile browser mein backup ke taur par rakha jayega.)', 'NAYA GAME SHURU KARO', go, 'RADD KARO');
      else go();
    },

    /** Enter the game screen. */
    beginGame(resume) {
      UI.closePanel();
      AZ.Audio.unlock();
      UI.el.menu.classList.add('hidden');
      UI.el.hud.classList.remove('hidden');
      UI.inGame = true; UI.deathActive = false; UI.locked = false; UI.lastTitle = '';
      if (AZ.TTS) { AZ.TTS.stop(); AZ.TTS.reset(); }
      if (!resume) { S().meta = S().meta || S().newMeta(); }
      AZ.Story.start(!!resume);
    },

    quitToMenu() { if (AZ.TTS) AZ.TTS.stop(); AZ.Save.autosave(); AZ.Audio.stopAll(); UI.clearTimers(); UI.showMenu(); },

    /* ---------------------------------------------------------------- scene flow */
    onScene(view) {
      if (!UI.inGame) return;
      UI.view = view; UI.idx = 0; UI.locked = false;
      const E = UI.el;
      AZ.Renderer.setView(view);
      AZ.Audio.setMusic(view.mood.music || 'calm'); AZ.Audio.setAmbience(view.mood.ambience || 'wind');
      E.choices.classList.add('hidden'); E.choices.innerHTML = '';
      E.dialog.classList.remove('hidden');
      UI.updateHud();
      if (view.title && view.title !== UI.lastTitle && !S().tl.flags.rewound) UI.chapterCard(view.title);
      if (view.title) UI.lastTitle = view.title;
      UI.showLine(0);
    },

    chapterCard(title) {
      const c = UI.el['chapter-card'], parts = title.split(':');
      c.innerHTML = '<div class="t1">' + UI.esc(parts[0]) + '</div><div class="t2">' + UI.esc((parts[1] || '').trim()) + '</div>';
      c.classList.remove('hidden'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
      UI.later(4200, () => c.classList.add('hidden'));
    },

    /** Map a speaker label ("Mara", "Voice", "HALCYON") to a character id. */
    speakerId(who) {
      if (!who) return null;
      const w = who.toLowerCase().replace(/[^a-z ]/g, '').trim();
      if (!w || w === 'you') return null;
      if (w === 'voice') return 'listener';
      const chars = AZ.data.characters;
      for (const id of Object.keys(chars)) {
        if (id === 'protagonist' || id[0] === '_') continue;
        const n = chars[id].name.toLowerCase();
        if (w === id || n === w || n.split(' ')[0] === w) return id;
      }
      const sv = S().tl.survivors;
      for (const id of Object.keys(sv)) if (sv[id].first.toLowerCase() === w) return id;
      return null;
    },

    showLine(i) {
      const v = UI.view, E = UI.el; if (!v) return;
      UI.idx = i;
      const line = v.lines[i];
      const sid = UI.speakerId(line.who) || (line.narration || !line.who ? null : null);
      UI.speakerId_ = sid;
      AZ.Renderer.setSpeaker(sid);
      const nameEl = E['speaker-name'];
      nameEl.textContent = line.who ? line.who.toUpperCase() : '';
      nameEl.classList.toggle('narr', !line.who);
      const pc = E['speaker-portrait'], def = sid && AZ.Renderer.defFor(sid);
      if (def && def.portrait) { pc.classList.remove('none'); const f = AZ.Portraits.face(def, 48); const x = pc.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 48, 48); x.drawImage(f, 0, 0); }
      else pc.classList.add('none');
      E['dialog-text'].classList.toggle('glitch-text', !!line.glitch);
      E['dialog-text'].style.fontStyle = line.who ? 'normal' : 'italic';
      E['dialog-text'].style.color = line.who ? '' : '#bdb7a6';
      if (line.sfx) AZ.Audio.sfx(line.sfx);
      UI.typeText(line.text);
      if (AZ.TTS) {
        const view = v, at = i;
        AZ.TTS.stop();
        AZ.TTS.sayLine(line).then((ok) => { if (ok) UI.autoNext(view, at); });
      }
    },

    /** Optional hands-free mode: after a line is read, move on by itself. */
    autoNext(view, at) {
      if (!S().getSettings().ttsAuto) return;
      let tries = 0;
      const step = () => {
        if (UI.view !== view || UI.idx !== at || UI.deathActive) return;
        if (UI.typing || UI.locked || UI.panelOpen) { if (++tries < 60) setTimeout(step, 250); return; }
        if (at < view.lines.length - 1) UI.advance();
      };
      setTimeout(step, 700);
    },

    typeText(text) {
      const E = UI.el; clearInterval(UI.typeTimer);
      UI.fullText = text; UI.typing = true;
      E.continue.classList.add('hidden');
      const speed = S().getSettings().textSpeed;
      if (!speed || speed >= 200) { UI.finishTyping(); return; }
      let n = 0; const per = Math.max(1, Math.round(speed / 30));
      UI.typeTimer = setInterval(() => {
        n += per; E['dialog-text'].textContent = text.slice(0, n);
        if (n % 3 < per) AZ.Audio.sfx('type');
        if (n >= text.length) UI.finishTyping();
      }, 1000 / 30);
    },
    finishTyping() {
      clearInterval(UI.typeTimer); UI.typing = false;
      UI.el['dialog-text'].textContent = UI.fullText;
      const last = UI.idx >= UI.view.lines.length - 1;
      if (last) UI.showChoices(); else UI.el.continue.classList.remove('hidden');
    },

    /** Click / Space / Enter: finish the typewriter, or go to the next line. */
    advance() {
      if (!UI.view || UI.locked || UI.panelOpen || UI.deathActive) return;
      if (UI.typing) { UI.finishTyping(); return; }
      if (UI.idx < UI.view.lines.length - 1) { AZ.Audio.sfx('click'); UI.showLine(UI.idx + 1); }
    },

    showChoices() {
      const v = UI.view, box = UI.el.choices; box.innerHTML = '';
      v.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'choice' + (c.echo ? ' echo' : '');
        b.style.animationDelay = (i * 70) + 'ms';
        b.innerHTML = '<span class="num">' + (i + 1) + '</span>' + UI.esc(c.text)
          + (c.memory ? '<span class="badge mem">◆ YAAD</span>' : '') + (c.echo ? '<span class="badge echo">☠ GOONJ</span>' : '')
          + (c.tags.includes('physical') ? '<span class="badge phys">SHARIRIK</span>' : '');
        b.addEventListener('click', () => UI.pick(i, b));
        box.appendChild(b);
      });
      box.classList.remove('hidden');
      if (AZ.TTS) AZ.TTS.askChoices(v.choices);
    },

    pick(i, btn) {
      if (UI.locked || UI.panelOpen || UI.deathActive) return;
      UI.locked = true;
      if (AZ.TTS) AZ.TTS.stop();
      if (btn) btn.classList.add('picked');
      AZ.Audio.sfx('click');
      UI.later(180, () => {
        try { AZ.Story.choose(i); } catch (e) { UI.fatal(e); }
      });
    },

    /* ---------------------------------------------------------------- HUD */
    buildStatBar() {
      const box = UI.el.statbar; box.innerHTML = '';
      const defs = Object.assign({}, cfg().stats, { knowledge: { label: 'Gyaan', color: '#4fd0e0', tip: 'Sthayi baatein jo tumhe har timeline mein yaad rehti hain.' } });
      for (const k of Object.keys(defs)) {
        const d = defs[k], el = document.createElement('div'); el.className = 'stat'; el.dataset.stat = k;
        el.innerHTML = '<div class="lab"><span>' + d.label + '</span><span class="val">0</span></div><div class="bar"><div class="fill" style="--c:' + d.color + '"></div></div><div class="tip">' + UI.esc(d.tip) + '</div>';
        box.appendChild(el);
      }
    },

    updateHud() {
      if (!S().tl) return;
      const tl = S().tl, st = tl.stats;
      UI.el.statbar.querySelectorAll('.stat').forEach((el) => {
        const k = el.dataset.stat; let v = k === 'knowledge' ? S().knowledgeCount() : st[k];
        const max = k === 'knowledge' ? Object.keys(cfg().knowledge).length : 100;
        el.querySelector('.val').textContent = v;
        el.querySelector('.fill').style.width = Math.min(100, v / max * 100) + '%';
        const d = cfg().stats[k]; let crit = false;
        if (d) crit = d.good === 'high' ? (k === 'health' ? v <= 25 : false) : v >= 80;
        el.classList.toggle('crit', crit);
      });
      const loc = AZ.data.locations[tl.location];
      UI.el['hud-chapter'].textContent = 'ADH ' + String(tl.chapter).padStart(2, '0');
      UI.el['hud-location'].textContent = loc ? loc.name : '';
      UI.el['hud-timeline'].textContent = 'TIMELINE ' + String(tl.n).padStart(2, '0') + (S().meta.deaths ? ' · ' + S().meta.deaths + ' ☠' : '');
      const ox = UI.el['hud-oxygen'];
      if (tl.clocks.oxygen !== undefined) { ox.classList.remove('hidden'); ox.textContent = 'O₂ ' + tl.clocks.oxygen + ' CYCLE'; ox.classList.toggle('low', tl.clocks.oxygen <= cfg().clocks.oxygen.warn); }
      else ox.classList.add('hidden');
      UI.el.objective.textContent = tl.objective || '';
    },

    onNotes(list) {
      list.forEach((n) => {
        let cls = n.kind;
        if (n.kind === 'stat') { const good = n.stat && cfg().stats[n.stat] ? cfg().stats[n.stat].good : 'high'; cls = (n.delta > 0) === (good === 'high') ? 'stat-up' : 'stat-down'; }
        UI.toast(n.text, cls);
        if (n.kind === 'knowledge') AZ.Audio.sfx('learn'); else if (n.kind === 'warn') AZ.Audio.sfx('warn');
      });
      UI.updateHud();
    },

    toast(text, cls) {
      const box = UI.el.toasts; if (!box) return;
      const t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.textContent = text; box.appendChild(t);
      while (box.children.length > 6) box.removeChild(box.firstChild);
      setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 4000);
    },

    /* ---------------------------------------------------------------- death & rewind cinematic */
    playDeath(info) {
      if (UI.deathActive) return;
      UI.deathActive = true; UI.locked = true; UI.clearTimers(); clearInterval(UI.typeTimer);
      if (AZ.TTS) AZ.TTS.stop();
      const E = UI.el, def = info.def;
      UI.closePanel();
      E.choices.classList.add('hidden'); E.dialog.classList.add('hidden');
      AZ.Audio.stopMusic(); AZ.Audio.sfx('death'); AZ.Renderer.shake(); AZ.Renderer.flash(250);
      const d = E.death; d.className = 'overlay'; d.style.background = '#000';
      E['death-inner'].innerHTML = '<div id="death-title">' + UI.esc(def.title) + '</div><div id="death-lines"></div><div id="death-sub">TUM MAR GAYE · MAUT № ' + info.deathNumber + '</div>';
      const linesEl = $('death-lines');
      def.lines.forEach((l, i) => UI.later(1500 + i * 1700, () => { const p = document.createElement('p'); p.textContent = l; linesEl.appendChild(p); }));
      const rewindAt = 1500 + def.lines.length * 1700 + 1400;
      let skipped = false;
      const rewind = () => {
        if (skipped) return; skipped = true; UI.clearTimers();
        d.classList.add('rewinding'); E.stage.classList.add('rewind-scan');
        AZ.Audio.sfx('rewind'); AZ.Renderer.setView(AZ.Story.view || { bg: 'cryo', bgSeed: 'x', mood: {}, chars: [] }); AZ.Renderer.rewind(1500);
        UI.later(1800, () => { E.stage.classList.remove('rewind-scan'); UI.showMemorySummary(info); });
      };
      UI.deathSkip = () => { if (!skipped) rewind(); };
      UI.later(rewindAt, rewind);
    },

    showMemorySummary(info) {
      const d = UI.el.death, inner = UI.el['death-inner'];
      d.classList.remove('rewinding'); d.style.background = '#02060a';
      const parts = AZ.Timeline.memorySummary(info);
      let html = '<div id="death-title" style="color:var(--cyan);font-size:2.4em;text-shadow:0 0 1.2cqw rgba(79,208,224,.7)">TIMELINE ' + String(info.newTimeline).padStart(2, '0') + '</div>';
      html += '<div id="death-memory"><h4>◆ TUMHE KYA YAAD HAI</h4>';
      parts.forEach((p) => { html += '<p>' + UI.esc(p) + '</p>'; });
      info.learned.forEach((l) => { html += '<p class="newk">+ ' + UI.esc(l.title) + ': ' + UI.esc(l.text) + '</p>'; });
      if (!info.learned.length) html += '<p class="newk">Kuch naya nahi seekha — par tum abhi bhi yahan ho, aur abhi bhi ginti kar rahe ho.</p>';
      html += '</div><div style="margin-top:1.6cqw"><button class="btn primary" id="death-return" style="padding:.8cqw 3cqw;font-size:1em;letter-spacing:.3em">WAPAS</button></div>';
      inner.innerHTML = html; AZ.Audio.sfx('checkpoint');
      UI.deathSkip = null;
      const btn = $('death-return'); btn.focus();
      btn.addEventListener('click', () => UI.returnFromDeath());
    },

    returnFromDeath() {
      if (!UI.deathActive) return;
      AZ.Audio.sfx('click');
      UI.fadeOut(() => {
        UI.deathActive = false; UI.el.death.classList.add('hidden'); UI.el.death.style.background = '';
        UI.updateHud();
        AZ.Story.resumeAfterDeath();
        UI.fadeIn();
        UI.toast('Checkpoint wapas aa gaya. Tumhe sab yaad hai.', 'knowledge');
      });
    },

    /* ---------------------------------------------------------------- helpers */
    onKey(e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.key !== 'Escape') return;
      const k = e.key;
      if (UI.deathActive) { if ((k === ' ' || k === 'Enter') && UI.deathSkip) { e.preventDefault(); UI.deathSkip(); } return; }
      if (!UI.el.confirm.classList.contains('hidden')) { if (k === 'Escape') UI.closeConfirm(); return; }
      if (!UI.inGame) { if (k === 'Escape' && UI.panelOpen) UI.closePanel(); return; }
      if (k === 'Escape') { e.preventDefault(); if (UI.panelOpen) UI.closePanel(); else AZ.Panels.open('pause'); return; }
      const hot = { i: 'inventory', j: 'journal', m: 'memories', p: 'people', s: 'saves', h: 'history' }[k.toLowerCase()];
      if (hot && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); if (UI.panelOpen && AZ.Panels.current === hot) UI.closePanel(); else AZ.Panels.open(hot); return; }
      if (UI.panelOpen) return;
      if (k === ' ' || k === 'Enter') {
        if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('choice')) return;
        e.preventDefault(); UI.advance(); return;
      }
      if (/^[1-9]$/.test(k) && UI.view && !UI.typing) {
        const i = +k - 1, btn = UI.el.choices.children[i];
        if (btn && !UI.el.choices.classList.contains('hidden')) UI.pick(i, btn);
      }
    },

    closePanel() { UI.panelOpen = false; UI.el.panel.classList.add('hidden'); AZ.Panels && (AZ.Panels.current = null); },

    confirm(text, yesLabel, onYes, noLabel) {
      const E = UI.el; E['confirm-text'].textContent = text; E['confirm-text'].style.whiteSpace = 'pre-line';
      const box = E['confirm-buttons']; box.innerHTML = '';
      const y = document.createElement('button'); y.className = 'btn primary'; y.textContent = yesLabel || 'THEEK HAI';
      y.addEventListener('click', () => { UI.closeConfirm(); onYes && onYes(); });
      box.appendChild(y);
      if (noLabel) { const n = document.createElement('button'); n.className = 'btn'; n.textContent = noLabel; n.addEventListener('click', () => UI.closeConfirm()); box.appendChild(n); }
      E.confirm.classList.remove('hidden'); y.focus();
    },
    closeConfirm() { UI.el.confirm.classList.add('hidden'); },

    fadeOut(cb) { UI.el.fade.classList.add('on'); setTimeout(cb, 480); },
    fadeIn() { setTimeout(() => UI.el.fade.classList.remove('on'), 60); },
    later(ms, fn) { const t = setTimeout(fn, ms); UI.timers.push(t); return t; },
    clearTimers() { UI.timers.forEach(clearTimeout); UI.timers = []; },
    esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },

    /** Last-resort error handler: keep the game alive and tell the player. */
    fatal(e) {
      AZ.warn('Runtime error: ' + (e && e.message));
      if (AZ.debug && window.console) window.console.warn(e);
      UI.locked = false;
      UI.toast('Kuch gadbad ho gayi — progress surakshit hai. Dobara try karo ya reload karo.', 'warn');
      try { AZ.Story.refresh(); } catch (err) { /* ignore */ }
    }
  };
})();
