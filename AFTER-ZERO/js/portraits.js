/* ============================================================
   AFTER ZERO — portraits.js : pixel character busts, faces and item icons,
   all drawn in code (no image files needed). Optional PNG override through
   AZ.assets.portraits[characterId].
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util;
  const BW = 64, BH = 88;

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const shade = (c, t) => { const a = hex(c); return 'rgb(' + a.map((v) => Math.max(0, Math.min(255, v + (t < 0 ? v * t : (255 - v) * t))) | 0).join(',') + ')'; };

  function R(ctx, c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0)); }
  function disc(ctx, c, cx, cy, rx, ry) { for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry))); R(ctx, c, cx - w, cy + y, w * 2 + 1, 1); } }

  /* ----- human ----- */
  function human(ctx, p, expr) {
    const skin = p.skin, sk2 = shade(skin, -0.22), hair = p.hair || '#222', coat = p.accent || '#556';
    // torso / coat
    R(ctx, shade(coat, -0.45), 3, 66, 58, 22); R(ctx, coat, 5, 64, 54, 24); R(ctx, shade(coat, 0.15), 5, 64, 54, 2);
    R(ctx, shade(coat, -0.3), 30, 70, 4, 18); R(ctx, shade(coat, -0.5), 26, 62, 12, 5);
    for (let i = 0; i < 6; i++) R(ctx, shade(coat, -0.25), 8 + i * 9, 72 + (i % 2) * 6, 2, 2);
    // neck
    R(ctx, sk2, 26, 52, 12, 14); R(ctx, shade(skin, -0.35), 26, 58, 12, 4);
    if (p.mask) { R(ctx, '#3a4238', 22, 56, 20, 9); R(ctx, '#566050', 22, 56, 20, 2); R(ctx, '#222a22', 26, 60, 3, 3); R(ctx, '#222a22', 35, 60, 3, 3); }
    // head
    disc(ctx, skin, 32, 35, 15, 18);
    R(ctx, sk2, 40, 24, 7, 24); R(ctx, shade(skin, -0.12), 38, 30, 3, 18);
    R(ctx, shade(skin, 0.1), 21, 28, 3, 12);
    // ears
    R(ctx, sk2, 16, 34, 3, 6); R(ctx, sk2, 46, 34, 3, 6);
    // hair
    const style = p.hairStyle || 'short';
    if (style !== 'bald') {
      disc(ctx, hair, 32, 24, 16, 11); R(ctx, skin, 19, 25, 26, 7);
      R(ctx, hair, 15, 20, 5, 14); R(ctx, hair, 44, 20, 5, 14);
      R(ctx, shade(hair, 0.35), 24, 14, 10, 2);
      if (style === 'bun') { disc(ctx, hair, 32, 8, 6, 5); R(ctx, shade(hair, 0.3), 30, 5, 4, 2); }
      if (style === 'long') { R(ctx, hair, 12, 22, 6, 44); R(ctx, hair, 46, 22, 6, 44); }
      R(ctx, hair, 20, 25, 24, 3);                                  // fringe line
      R(ctx, shade(hair, -0.2), 20, 28, 3, 3); R(ctx, shade(hair, -0.2), 41, 28, 3, 3);
    } else { R(ctx, shade(skin, 0.12), 26, 18, 12, 2); }
    // face
    const eye = p.eyes || '#333';
    const wary = expr === 'wary' || expr === 'grave' || expr === 'angry';
    R(ctx, '#e8e2d4', 23, 35, 6, 3); R(ctx, '#e8e2d4', 35, 35, 6, 3);
    R(ctx, eye, 25, 35, 3, 3); R(ctx, eye, 37, 35, 3, 3); R(ctx, '#000', 26, 36, 1, 1); R(ctx, '#000', 38, 36, 1, 1);
    R(ctx, shade(hair, -0.1), 22, wary ? 31 : 32, 8, 2); R(ctx, shade(hair, -0.1), 34, wary ? 31 : 32, 8, 2);
    if (wary) { R(ctx, shade(hair, -0.1), 28, 32, 2, 2); R(ctx, shade(hair, -0.1), 34, 32, 2, 2); }
    R(ctx, sk2, 31, 38, 3, 6); R(ctx, shade(skin, -0.4), 30, 44, 5, 1);
    if (!p.mask) { R(ctx, shade(skin, -0.45), 27, 48, 10, 1); if (expr === 'grave') R(ctx, shade(skin, -0.45), 28, 49, 8, 1); }
    if (p.scar) { for (let i = 0; i < 9; i++) R(ctx, '#c08070', 40 - i, 36 + i, 1, 1); R(ctx, '#e0b0a0', 41, 35, 1, 1); }
    if (p.glasses) { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1; ctx.strokeRect(22.5, 33.5, 8, 6); ctx.strokeRect(34.5, 33.5, 8, 6); R(ctx, '#2a2a2a', 30, 36, 5, 1); R(ctx, 'rgba(255,255,255,.5)', 24, 34, 2, 1); }
  }

  /* ----- machine (HALCYON) ----- */
  function machine(ctx, p, expr) {
    const g = p.glow || '#4fd0e0';
    R(ctx, '#0a141a', 14, 0, 36, 88); R(ctx, '#102a34', 18, 0, 28, 88); R(ctx, shade(g, -0.55), 24, 0, 16, 88); R(ctx, shade(g, -0.2), 28, 0, 8, 88); R(ctx, '#e8fcff', 31, 0, 2, 88);
    for (let y = 6; y < 86; y += 12) { R(ctx, '#1a3a46', 10, y, 44, 3); R(ctx, g, 12, y + 1, 4, 1); R(ctx, g, 48, y + 1, 4, 1); }
    disc(ctx, '#05090c', 32, 36, 12, 12); disc(ctx, shade(g, -0.4), 32, 36, 9, 9); disc(ctx, g, 32, 36, 5, 5); disc(ctx, '#fff', 32, 36, 2, 2);
    if (expr === 'glow') R(ctx, g, 26, 36, 12, 1);
  }

  /* ----- shadow (the Listener) ----- */
  function shadow(ctx, p) {
    const g = p.glow || '#c04a4a';
    disc(ctx, '#020204', 32, 28, 11, 14); R(ctx, '#020204', 28, 40, 8, 26); R(ctx, '#020204', 6, 62, 52, 26); disc(ctx, '#020204', 32, 64, 26, 10);
    R(ctx, '#0a0a10', 38, 18, 3, 24);
    R(ctx, g, 26, 26, 4, 2); R(ctx, g, 35, 26, 4, 2); R(ctx, shade(g, 0.5), 27, 26, 2, 1); R(ctx, shade(g, 0.5), 36, 26, 2, 1);
    for (let i = 0; i < 12; i++) R(ctx, 'rgba(192,74,74,.25)', 4 + Math.random() * 56, Math.random() * 88, 1, 6);
  }

  const cache = {};
  const Portraits = AZ.Portraits = {
    BW, BH,
    /** Character bust 64x88 (transparent background). */
    bust(def, expr) {
      if (!def || !def.portrait) return null;
      const key = (def.id || '?') + ':' + (expr || '');
      if (cache[key]) return cache[key];
      const c = mk(BW, BH), ctx = c.getContext('2d');
      const p = def.portrait;
      try {
        if (p.kind === 'machine') machine(ctx, p, expr); else if (p.kind === 'shadow') shadow(ctx, p); else human(ctx, p, expr);
        if (expr === 'radio') { for (let y = 0; y < BH; y += 3) R(ctx, 'rgba(60,255,120,.18)', 0, y, BW, 1); }
      } catch (e) { AZ.warn('Portrait failed for ' + def.id + ': ' + e.message); }
      const url = AZ.assets && AZ.assets.portraits && AZ.assets.portraits[def.id];
      if (url) { const img = new Image(); img.onload = () => { try { ctx.clearRect(0, 0, BW, BH); ctx.drawImage(img, 0, 0, BW, BH); } catch (e) { /* keep */ } }; img.onerror = () => AZ.warn('Missing portrait asset: ' + url); img.src = url; }
      cache[key] = c;
      return c;
    },
    /** Square face crop for the dialogue box and panels. */
    face(def, px, expr) {
      const out = mk(px, px), ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = def && def.portrait && def.portrait.kind === 'machine' ? '#07141a' : '#0e1118'; ctx.fillRect(0, 0, px, px);
      const b = Portraits.bust(def, expr);
      if (b) ctx.drawImage(b, 8, 6, 48, 58, 0, 0, px, px);
      return out;
    },

    /* ----- item icons (16x16 painted with a few rects) ----- */
    icon(id, size) {
      const d = AZ.data.config.items[id] || { icon: 'scrap', color: '#888' };
      const c = mk(16, 16), x = c.getContext('2d'), col = d.color || '#aaa', dk = shade(col, -0.45), lt = shade(col, 0.4);
      const A = {
        brick: () => { R(x, dk, 2, 5, 12, 7); R(x, col, 2, 5, 12, 5); R(x, lt, 2, 5, 12, 1); R(x, dk, 7, 5, 1, 5); },
        can: () => { R(x, dk, 4, 3, 8, 11); R(x, col, 4, 4, 8, 9); R(x, lt, 5, 4, 1, 9); R(x, '#e8e0c0', 4, 7, 8, 3); },
        bottle: () => { R(x, '#888', 7, 1, 2, 2); R(x, dk, 5, 3, 6, 12); R(x, col, 6, 4, 4, 10); R(x, lt, 6, 4, 1, 9); },
        cross: () => { R(x, '#eee', 2, 2, 12, 12); R(x, col, 7, 4, 2, 8); R(x, col, 4, 7, 8, 2); },
        syringe: () => { R(x, '#ccc', 3, 7, 9, 3); R(x, col, 4, 8, 6, 1); R(x, '#888', 12, 8, 3, 1); R(x, '#888', 1, 6, 1, 5); R(x, '#ddd', 2, 8, 1, 1); },
        light: () => { R(x, '#444', 2, 6, 8, 5); R(x, '#222', 3, 7, 6, 3); R(x, col, 10, 5, 3, 7); R(x, lt, 13, 3, 2, 11); R(x, 'rgba(255,240,150,.5)', 13, 2, 3, 13); },
        wrench: () => { R(x, '#999', 3, 11, 9, 2); R(x, dk, 3, 12, 9, 1); R(x, col, 10, 2, 4, 5); R(x, '#06080c', 11, 2, 2, 3); R(x, '#999', 11, 6, 2, 6); },
        crowbar: () => { R(x, col, 12, 2, 3, 2); R(x, col, 11, 4, 2, 2); for (let i = 0; i < 8; i++) R(x, col, 10 - i, 5 + i, 2, 2); R(x, dk, 2, 12, 3, 2); },
        knife: () => { for (let i = 0; i < 9; i++) R(x, '#ccd', 4 + i, 10 - i, 2, 2); R(x, dk, 2, 11, 3, 3); R(x, '#654', 3, 12, 2, 2); },
        pistol: () => { R(x, col, 2, 5, 11, 3); R(x, dk, 2, 8, 6, 2); R(x, dk, 5, 8, 3, 6); R(x, lt, 2, 5, 11, 1); },
        mask: () => { R(x, col, 3, 4, 10, 9); R(x, dk, 5, 6, 2, 2); R(x, dk, 9, 6, 2, 2); R(x, lt, 5, 10, 6, 2); R(x, '#222', 1, 6, 2, 2); R(x, '#222', 13, 6, 2, 2); },
        card: () => { R(x, '#123', 2, 4, 12, 9); R(x, col, 3, 5, 10, 7); R(x, '#000', 3, 8, 10, 2); R(x, '#fff', 4, 6, 2, 1); },
        chip: () => { R(x, '#222', 4, 4, 8, 8); R(x, col, 5, 5, 6, 6); for (let i = 0; i < 4; i++) { R(x, '#aaa', 2, 5 + i * 2, 2, 1); R(x, '#aaa', 12, 5 + i * 2, 2, 1); } },
        scrap: () => { R(x, '#555', 3, 8, 6, 4); R(x, col, 5, 5, 7, 5); R(x, lt, 6, 5, 3, 1); R(x, '#777', 9, 10, 4, 3); },
        battery: () => { R(x, '#333', 4, 3, 8, 11); R(x, col, 5, 5, 6, 8); R(x, '#aaa', 6, 2, 4, 2); R(x, '#111', 7, 7, 2, 4); },
        tape: () => { R(x, '#222', 2, 4, 12, 9); R(x, col, 3, 5, 10, 7); disc(x, '#111', 6, 9, 2, 2); disc(x, '#111', 10, 9, 2, 2); },
        watch: () => { disc(x, '#c8b060', 8, 9, 5, 5); disc(x, '#1a1612', 8, 9, 4, 4); R(x, '#e8e0c0', 8, 6, 1, 3); R(x, '#e8e0c0', 8, 9, 3, 1); R(x, '#c8b060', 7, 2, 2, 3); R(x, '#800', 4, 6, 1, 4); R(x, '#800', 11, 11, 1, 1); },
        pouch: () => { disc(x, '#ddd', 8, 10, 5, 4); R(x, '#aaa', 5, 4, 6, 3); R(x, '#876', 5, 6, 6, 1); },
        radio: () => { R(x, '#222', 4, 4, 8, 11); R(x, col, 5, 6, 6, 3); R(x, '#aaa', 11, 0, 1, 5); R(x, '#555', 6, 11, 4, 2); },
      };
      (A[d.icon] || A.scrap)();
      if (size === 16) return c;
      const out = mk(size, size), o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, size, size);
      return out;
    }
  };
})();
