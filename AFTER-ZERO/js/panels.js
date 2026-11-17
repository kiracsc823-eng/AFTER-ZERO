/* ============================================================
   AFTER ZERO — panels.js : Inventory, Journal, Memories, Relationships,
   Save/Load, Settings, History and the Pause menu.
   Everything shown here is read straight from game state.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util, S = () => AZ.State, cfg = () => AZ.data.config, UI = () => AZ.UI;
  const esc = (s) => AZ.UI.esc(s);

  const TITLES = { inventory: 'SAMAAN', journal: 'DIARY', memories: 'YAADEIN', people: 'LOG', saves: 'SAVE / LOAD', settings: 'SETTINGS', history: 'BAATCHEET', pause: 'RUKA HUA' };
  const TABS = {
    inventory: [['all', 'SAB'], ['supplies', 'RASAD'], ['gear', 'AUZAAR & HATHIYAAR'], ['special', 'KHAAS CHEEZEIN']],
    journal: [['story', 'KAHANI'], ['quests', 'QUESTS'], ['clues', 'SURAAG'], ['timelines', 'TIMELINES']],
    memories: [['mem', 'PAKKI YAADEIN'], ['timelines', 'PICHHLI TIMELINES'], ['abilities', 'SHAKTIYAN'], ['achievements', 'UPLABDHIYAN']]
  };

  const P = AZ.Panels = {
    current: null, tab: null,

    open(name, tab) {
      if (!TITLES[name]) return;
      const E = UI().el;
      if (UI().deathActive) return;
      P.current = name; P.tab = tab || (TABS[name] ? TABS[name][0][0] : null);
      UI().panelOpen = true;
      E.panel.classList.remove('hidden');
      E.panel.onclick = (e) => { if (e.target === E.panel) UI().closePanel(); };
      document.getElementById('panel-close').onclick = () => { AZ.Audio.sfx('click'); UI().closePanel(); };
      P.render();
      document.getElementById('panel-close').focus();
    },

    refresh() { if (P.current) P.render(true); },

    render(keepScroll) {
      const body = document.getElementById('panel-body'), tabs = document.getElementById('panel-tabs'), top = keepScroll ? body.scrollTop : 0;
      document.getElementById('panel-title').textContent = TITLES[P.current];
      tabs.innerHTML = '';
      (TABS[P.current] || []).forEach(([id, label]) => {
        const b = document.createElement('button'); b.textContent = label; b.className = id === P.tab ? 'on' : '';
        b.addEventListener('click', () => { AZ.Audio.sfx('click'); P.tab = id; P.render(); }); tabs.appendChild(b);
      });
      body.innerHTML = '';
      try { R[P.current](body); } catch (e) { body.innerHTML = '<div class="errbox">Yeh page dikh nahi paya: ' + esc(e.message) + '</div>'; AZ.warn('Panel ' + P.current + ' failed: ' + e.message); }
      body.scrollTop = P.current === 'history' && !keepScroll ? body.scrollHeight : top;
    }
  };

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function empty(body, text) { body.appendChild(el('div', 'empty', text)); }
  function btn(label, cls, fn) { const b = el('button', 'btn ' + (cls || ''), label); b.addEventListener('click', () => { AZ.Audio.sfx('click'); fn(b); }); return b; }
  const inGame = () => UI().inGame && S().tl;

  /* ---------------- renderers ---------------- */
  const R = {
    inventory(body) {
      const items = AZ.Inventory.list();
      const filt = { all: () => true, supplies: (i) => ['food', 'water', 'medical'].includes(i.def.type), gear: (i) => ['tool', 'weapon'].includes(i.def.type), special: (i) => ['quest', 'artifact'].includes(i.def.type) }[P.tab];
      const list = items.filter(filt);
      const tl = S().tl;
      const bar = el('div', 'card', '<span class="meta">HAALAT</span> Sehat ' + tl.stats.health + ' · Bhookh ' + tl.stats.hunger + ' · Pyaas ' + tl.stats.thirst + ' · Thakaan ' + tl.stats.fatigue
        + (AZ.Choice.isWeak() ? ' <span class="tag red">JISMANI KAAM KE LIYE BAHUT KAMZOR</span>' : ''));
      body.appendChild(bar); bar.style.marginBottom = '1cqw';
      if (!list.length) return empty(body, 'YAHAN KUCH NAHI');
      const g = el('div', 'grid cols2'); body.appendChild(g);
      list.forEach((it) => {
        const c = el('div', 'card item'); c.appendChild(AZ.Portraits.icon(it.id, 16));
        const t = el('div'); t.style.flex = '1';
        t.innerHTML = '<h3>' + esc(it.def.name) + (it.qty > 1 ? ' ×' + it.qty : '') + '</h3><span class="tag ' + (it.def.type === 'artifact' ? 'cyan' : it.def.type === 'quest' ? 'main' : '') + '">' + it.def.type.toUpperCase() + '</span>' + (it.def.permanent ? '<span class="tag cyan">MAUT KE BAAD BHI SAATH</span>' : '') + '<p>' + esc(it.def.desc) + '</p>';
        if (AZ.Inventory.canUse(it.id)) t.appendChild(btn('USE KARO', 'primary', () => {
          const r = AZ.Inventory.use(it.id);
          if (r && r.note) UI().toast(r.note, 'item');
          UI().updateHud(); if (UI().panelOpen) P.refresh();
        }));
        c.appendChild(t); g.appendChild(c);
      });
    },

    journal(body) {
      const tl = S().tl, meta = S().meta;
      if (P.tab === 'story') {
        body.appendChild(el('div', 'sect', 'ABHI KA CHAPTER'));
        const ch = cfg().chapterTitles[tl.chapter] || ('CHAPTER ' + tl.chapter);
        const loc = AZ.data.locations[tl.location];
        body.appendChild(el('div', 'card', '<h3>' + esc(ch) + '</h3><p>Jagah: ' + esc(loc ? loc.name : '') + '</p><p><span class="tag main">MAKSAD</span>' + esc(tl.objective) + '</p>'));
        body.appendChild(el('div', 'sect', 'ABHI TAK KI KAHANI'));
        const e = meta.endings, lines = [];
        lines.push('Tum Shelter 7 ke andar jaage, bina naam ke, ek band pocket watch aur khatam hoti hawa ke saath. Surface hatch par koi sabar se khatkhata raha hai.');
        if (tl.flags.power_on) lines.push('Tumne shelter ki power wapas chalu ki aur thoda waqt kharid liya.');
        if (tl.flags.heard_mara) lines.push('Mara Voss naam ki aurat ne Kessler Street se tumhari radio call ka jawab diya. Usne kaha HALCYON ne har survivor ko bola tha ki neeche koi zinda nahi bacha.');
        if (tl.flags.path_halcyon) lines.push('Tumne HALCYON ka Survival Protocol maan liya, jisne tumhe akele Relay Tower ki taraf bhej diya.');
        if (e.e_trust) lines.push('Bharosa ka Raasta: Mara ke ledger mein 311 pichhle jaagran hain — sab uski apni likhawat mein, kisi ko yaad nahi. Tum number 312 ho.');
        if (e.e_solo) lines.push('Tower ka Raasta: Relay Tower tumhari hi awaaz "Cycle 312" se bajata hai, jo tumhe HALCYON par bharosa na karne ki chetawani deti hai.');
        if (meta.deaths) lines.push('Tum ' + meta.deaths + ' baar mar chuke ho aur har baar laut aaye, jo seekha wo saath rakhkar.');
        lines.forEach((l) => body.appendChild(el('p', 'hist-line', '◆ ' + esc(l))));
        body.appendChild(el('div', 'sect', 'PAHUNCHE HUE ENDINGS'));
        const names = { e_trust: 'Ledger (Bharosa ka Raasta)', e_solo: 'Tower (Tower ka Raasta)' };
        const got = Object.keys(e).map((k) => '<span class="tag green">' + esc(names[k] || k) + ' ×' + e[k] + '</span>').join('');
        body.appendChild(el('div', '', got || '<span class="tag">ABHI KOI NAHI</span>'));
      } else if (P.tab === 'quests') {
        const qs = Object.keys(tl.quests).map((k) => Object.assign({ id: k }, tl.quests[k]));
        if (!qs.length) return empty(body, 'ABHI KOI QUEST NAHI');
        ['active', 'done', 'failed'].forEach((state) => {
          const l = qs.filter((q) => q.state === state); if (!l.length) return;
          body.appendChild(el('div', 'sect', state === 'active' ? 'CHALU' : state === 'done' ? 'POORE HUE' : 'FAIL HUE'));
          const g = el('div', 'grid'); l.forEach((q) => g.appendChild(el('div', 'card quest ' + state, '<h3>' + (q.main ? '<span class="tag main">MUKHYA</span>' : '') + esc(q.title) + '</h3><p>' + esc(q.desc) + '</p>'))); body.appendChild(g);
        });
      } else if (P.tab === 'clues') {
        const k = AZ.Memory.knowledgeList().sort((a, b) => a.time - b.time);
        if (!k.length) return empty(body, 'KOI SURAAG NAHI MILA');
        const g = el('div', 'grid cols2'); k.forEach((x) => g.appendChild(el('div', 'card', '<h3>' + esc(x.title) + '</h3><span class="tag ' + (x.cat === 'clue' ? 'cyan' : x.cat === 'skill' ? 'green' : '') + '">' + x.cat.toUpperCase() + '</span><span class="meta">timeline mein seekha: ' + x.timeline + '</span><p>' + esc(x.text) + '</p>')));
        body.appendChild(g);
      } else R.timelines(body);
    },

    timelines(body) {
      const m = S().meta;
      body.appendChild(el('div', 'sect', 'ABHI KI TIMELINE: ' + S().tl.n));
      if (!m.timelineSummaries.length) return empty(body, 'PICHHLI TIMELINE NAHI — ABHI TAK');
      body.appendChild(el('div', 'sect', 'PICHHLI TIMELINES (' + m.timelineSummaries.length + ')'));
      m.timelineSummaries.slice().reverse().forEach((t, i) => {
        const dl = m.deathLog.filter((d) => d.timeline === t.timeline)[0];
        body.appendChild(el('div', 'card', '<h3>Timeline ' + t.timeline + ' <span class="tag ' + (t.outcome === 'died' ? 'red' : 'green') + '">' + t.outcome.toUpperCase() + '</span></h3><p>' + esc(t.text) + '</p>' + (dl ? '<p class="meta">' + esc(dl.title) + ' · ' + esc((AZ.data.locations[dl.location] || {}).name || dl.location) + '</p>' : '')));
        body.lastChild.style.marginBottom = '.6cqw';
      });
    },

    memories(body) {
      const m = S().meta;
      if (P.tab === 'mem') {
        const mem = m.memories.slice().reverse();
        if (!mem.length) return empty(body, 'ABHI TAK KUCH YAAD NAHI');
        body.appendChild(el('p', 'hist-line', 'Yeh maut, reload aur har reset ke baad bhi bachi rehti hain.'));
        mem.forEach((x) => { const c = el('div', 'card', '<span class="meta">TIMELINE ' + x.timeline + (x.knowledge ? ' · SACH' : ' · YAAD') + '</span><p style="color:var(--ink)">' + esc(x.text) + '</p>'); c.style.marginBottom = '.6cqw'; body.appendChild(c); });
      } else if (P.tab === 'timelines') R.timelines(body);
      else if (P.tab === 'abilities') {
        const g = el('div', 'grid cols3');
        Object.keys(cfg().abilities).forEach((id) => { const a = cfg().abilities[id], on = m.abilities[id]; g.appendChild(el('div', 'card', '<h3>' + (on ? esc(a.name) : '???') + '</h3><span class="tag ' + (on ? 'green' : '') + '">' + (on ? 'KHULI HUI' : 'BAND') + '</span><p>' + (on ? esc(a.desc) : 'Kuch jo tumne abhi jiya nahi hai.') + '</p>')); });
        body.appendChild(g);
      } else {
        const g = el('div', 'grid cols3');
        Object.keys(cfg().achievements).forEach((id) => { const a = cfg().achievements[id], on = m.achievements[id]; g.appendChild(el('div', 'card', '<h3>' + (on ? '★ ' : '☆ ') + esc(a.name) + '</h3><p>' + esc(a.desc) + '</p>')); g.lastChild.style.opacity = on ? 1 : .45; });
        body.appendChild(g);
      }
    },

    people(body) {
      const list = AZ.NPC.known();
      if (!list.length) return empty(body, 'ABHI TAK KISI SE MILE NAHI');
      const g = el('div', 'grid cols2'); body.appendChild(g);
      list.forEach((n) => {
        const d = n.def, c = el('div', 'card person'); c.appendChild(AZ.Portraits.face(d, 56));
        const t = el('div'); t.style.flex = '1';
        const trust = n.state.trust;
        let h = '<h3>' + esc(d.name) + '</h3><span class="meta">' + esc(d.title || '') + '</span><div><span class="tag ' + (n.state.status === 'dead' ? 'red' : 'green') + '">' + esc(n.relation.toUpperCase()) + '</span><span class="tag">' + esc(String(n.state.status).toUpperCase()) + '</span></div>';
        h += '<div class="trustbar"><i style="width:' + trust + '%"></i></div><p class="meta">BHAROSA ' + trust + ' / 100</p><p>' + esc(d.personality || '') + '</p><p>' + esc(d.background || '') + '</p>';
        if (AZ.NPC.recognizes && n.recognized && d.recognizes) h += '<p style="color:var(--cyan)">◆ ' + esc(d.name) + ' ko tumhare baare mein kuch ajeeb mehsoos hota hai: "' + esc(d.recognizes.line) + '"</p>';
        if (d.secrets && d.secrets.length) h += (trust >= 70 || n.recognized) ? '<p style="color:var(--amber)">Raaz: ' + esc(d.secrets.join(' ')) + '</p>' : '<p class="meta">RAAZ: ??? (aur bharosa kamao)</p>';
        t.innerHTML = h; c.appendChild(t); g.appendChild(c);
      });
    },

    saves(body) {
      const slots = AZ.Save.list();
      if (!AZ.Save.storageOk) body.appendChild(el('div', 'errbox', 'Browser storage band hai, isliye save sirf is tab band hone tak rahenge.'));
      slots.forEach(({ slot, info }) => {
        const row = el('div', 'slot');
        const name = slot === 'auto' ? 'AUTOSAVE' : 'SLOT ' + slot;
        const meta = info ? 'Timeline ' + info.timeline + ' · Chapter ' + info.chapter + ' · ' + esc(info.location) + '<br>' + info.deaths + ' maut · ' + info.knowledge + ' yaadein · ' + new Date(info.savedAt).toLocaleString() : 'Khaali';
        row.innerHTML = '<div class="info"><b>' + name + '</b><div>' + meta + '</div></div>';
        const acts = el('div', 'acts');
        if (slot !== 'auto' && inGame() && !UI().deathActive) acts.appendChild(btn('SAVE', 'primary', () => {
          const doSave = () => { AZ.Save.save(slot, 'Manual save'); P.refresh(); };
          if (info) UI().confirm(name + ' par overwrite karein?', 'OVERWRITE', doSave, 'RADD'); else doSave();
        }));
        if (info) acts.appendChild(btn('LOAD', '', () => {
          const go = () => { const r = AZ.Save.load(slot); if (!r.ok) { UI().toast(r.error, 'warn'); return; } UI().closePanel(); UI().beginGame(true); UI().toast('Game load ho gaya', 'item'); };
          if (inGame()) UI().confirm(name + ' load karein? Pichhle save ke baad ka progress kho jayega (pakki yaadein kabhi nahi khotin).', 'LOAD', go, 'RADD'); else go();
        }));
        if (info && slot !== 'auto') acts.appendChild(btn('DELETE', 'danger', () => UI().confirm(name + ' delete karein?', 'DELETE', () => { AZ.Save.remove(slot); P.refresh(); }, 'RADD')));
        row.appendChild(acts); body.appendChild(row);
      });
      body.appendChild(el('p', 'hist-line note-l', 'Save mein tumhari abhi ki timeline aur checkpoint rehta hai. Pakki yaadein alag profile mein rehti hain, load ya maut se kabhi nahi mitti.'));
    },

    settings(body) {
      const s = S().getSettings();
      const apply = () => { AZ.Save.saveSettings(); UI().applySettings(); };
      const slider = (label, key, min, max, step, fmt) => {
        const row = el('div', 'row'); row.appendChild(el('label', '', label));
        const inp = el('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = s[key];
        const val = el('span', '', fmt(s[key])); val.style.width = '6cqw'; val.style.textAlign = 'right';
        inp.addEventListener('input', () => { s[key] = +inp.value; val.textContent = fmt(s[key]); apply(); });
        inp.addEventListener('change', () => AZ.Audio.sfx('click'));
        row.appendChild(inp); row.appendChild(val); body.appendChild(row);
      };
      const toggle = (label, key, note) => {
        const row = el('div', 'row'); row.appendChild(el('label', '', label + (note ? '<br><span class="meta">' + note + '</span>' : '')));
        const inp = el('input'); inp.type = 'checkbox'; inp.checked = !!s[key];
        inp.addEventListener('change', () => { s[key] = inp.checked; apply(); AZ.Audio.sfx('click'); if (UI().view) AZ.Story.refresh && inGame() && 0; });
        row.appendChild(inp); body.appendChild(row);
      };
      body.appendChild(el('div', 'sect', 'AWAAZ'));
      slider('Music volume', 'musicVol', 0, 1, 0.05, (v) => Math.round(v * 100) + '%');
      slider('Sound aur mahaul volume', 'sfxVol', 0, 1, 0.05, (v) => Math.round(v * 100) + '%');
      toggle('Saari awaaz band', 'muted');
      body.appendChild(el('div', 'sect', 'VOICE NARRATION (KAHANI SUNO)'));
      toggle('Voice ON', 'voiceOn', 'Har scene bolkar sunaya jata hai. Phone ki apni TTS awaaz use hoti hai, internet nahi chahiye.');
      slider('Voice volume', 'voiceVol', 0, 1, 0.05, (v) => Math.round(v * 100) + '%');
      slider('Voice speed', 'voiceRate', 0.6, 1.5, 0.05, (v) => v.toFixed(2) + 'x');
      toggle('Voice mute', 'voiceMuted');
      body.appendChild(el('div', 'sect', 'TEXT AUR DISPLAY'));
      slider('Text ki speed', 'textSpeed', 10, 200, 5, (v) => v >= 200 ? 'TURANT' : v + ' cps');
      toggle('Mahaul ke kan (particles)', 'particles');
      toggle('CRT scanlines', 'scanlines');
      toggle('Screen hilna', 'shake');
      toggle('Echo Sense ishaare', 'echoSense', '3 maut ke baad khulta hai; jo choices tumhe pehle maar chuki hain wo laal jhilmilati hain.');
      body.appendChild(el('div', 'sect', 'KONTROL'));
      body.appendChild(el('dl', 'kv', '<dt>Space / Enter / Click</dt><dd>Text aage badhao</dd><dt>1 – 9</dt><dd>Choice chuno</dd><dt>I J M P S H</dt><dd>Samaan · Diary · Yaadein · Log · Save/Load · Baatcheet</dd><dt>Esc</dt><dd>Menu / window band</dd>'));
      body.appendChild(el('div', 'sect', 'DATA'));
      const row = el('div', 'row'); row.appendChild(el('label', '', 'Sab mitao<br><span class="meta">Is browser ke save, yaadein aur settings delete ho jayengi.</span>'));
      row.appendChild(btn('SAB DATA MITAO', 'danger', () => UI().confirm('Is browser ka SAARA AFTER ZERO data mita dein?\nYeh wapas nahi hoga.', 'MITAO', () => { AZ.Save.wipeAll(); location.reload(); }, 'RADD')));
      body.appendChild(row);
    },

    history(body) {
      const log = S().tl.log.filter((e) => e.t === 'line' || e.t === 'choice' || e.t === 'note').slice(-90);
      if (!log.length) return empty(body, 'ABHI KUCH KAHA NAHI GAYA');
      log.forEach((e) => {
        if (e.t === 'line') body.appendChild(el('p', 'hist-line', (e.who ? '<b>' + esc(e.who.toUpperCase()) + '</b>' : '') + esc(e.text)));
        else if (e.t === 'choice') body.appendChild(el('p', 'hist-line choice-l', '▶ ' + esc(e.text)));
        else body.appendChild(el('p', 'hist-line note-l', '· ' + esc(e.text)));
      });
    },

    pause(body) {
      const box = el('div', 'pause-buttons');
      box.appendChild(btn('JARI RAKHO', 'primary', () => UI().closePanel()));
      box.appendChild(btn('SAVE / LOAD', '', () => P.open('saves')));
      box.appendChild(btn('SETTINGS', '', () => P.open('settings')));
      box.appendChild(btn('YAADEIN', '', () => P.open('memories')));
      box.appendChild(btn('MENU PAR JAO', 'danger', () => UI().confirm('Main menu par wapas jaana hai? Progress autosave ho chuka hai.', 'JAO', () => UI().quitToMenu(), 'RADD')));
      body.appendChild(box);
      body.appendChild(el('p', 'hist-line note-l', 'Timeline ' + S().tl.n + ' · ' + S().meta.deaths + ' maut · ' + S().knowledgeCount() + ' pakki yaadein'));
    }
  };
})();
