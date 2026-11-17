/* ============================================================
   AFTER ZERO — art.js : procedural pixel-art backgrounds (320x180).
   Every location "family" has a painter that draws a static image once
   (cached) and returns light sources that the renderer animates.
   If AZ.assets.backgrounds[family] lists a PNG, that is used instead
   and the painter is only the fallback.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util;
  const W = 320, H = 180;

  /* ---------- tiny drawing toolkit ---------- */
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgb = (a) => 'rgb(' + a.map((v) => Math.max(0, Math.min(255, v | 0))).join(',') + ')';
  const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return rgb(a.map((v, i) => v + (b[i] - v) * t)); };
  const lerp = (a, b, t) => a + (b - a) * t;

  function Pen(ctx, rng) {
    const P = {
      ctx, rng, lights: [],
      r(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); },
      p(x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); },
      /** vertical gradient in dithered bands */
      vgrad(x, y, w, h, c0, c1, bands) {
        bands = bands || Math.max(4, h / 5 | 0);
        for (let i = 0; i < bands; i++) {
          const y0 = y + h * i / bands, y1 = y + h * (i + 1) / bands;
          P.r(x, y0, w, y1 - y0 + 1, mix(c0, c1, i / Math.max(1, bands - 1)));
          if (i > 0) for (let xx = x + (i % 2); xx < x + w; xx += 2) P.p(xx, y0, mix(c0, c1, (i - 1) / Math.max(1, bands - 1)));
        }
      },
      poly(pts, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(Math.round(pts[0][0]), Math.round(pts[0][1])); for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.round(pts[i][0]), Math.round(pts[i][1])); ctx.closePath(); ctx.fill(); },
      speckle(x, y, w, h, c, n) { for (let i = 0; i < n; i++) P.p(x + rng() * w, y + rng() * h, c); },
      light(x, y, rad, c, flick, a) { P.lights.push({ x, y, r: rad, c, f: flick || 0, a: a === undefined ? 0.5 : a }); },
      circle(cx, cy, rad, c) { for (let yy = -rad; yy <= rad; yy++) { const w = Math.floor(Math.sqrt(rad * rad - yy * yy)); P.r(cx - w, cy + yy, w * 2 + 1, 1, c); } },
      ring(cx, cy, rad, c) { for (let a = 0; a < 360; a += 2) P.p(cx + Math.cos(a * Math.PI / 180) * rad, cy + Math.sin(a * Math.PI / 180) * rad, c); },
      /** one-point-perspective hallway shell */
      hall(i0, wall, floor, ceil, back) {
        const [x0, y0, x1, y1] = i0;
        P.r(0, 0, W, H, wall);
        P.r(x0, y0, x1 - x0, y1 - y0, back);
        P.poly([[0, 0], [W, 0], [x1, y0], [x0, y0]], ceil);
        P.poly([[0, H], [W, H], [x1, y1], [x0, y1]], floor);
        P.poly([[0, 0], [x0, y0], [x0, y1], [0, H]], wall);
        P.poly([[W, 0], [x1, y0], [x1, y1], [W, H]], mix(wall, '#000000', 0.12));
      }
    };
    return P;
  }

  /* ---------- painters ---------- */
  const painters = {};

  painters.cryo = (P, seedRng) => {
    P.vgrad(0, 0, W, 110, '#06121a', '#0e2230', 14);
    P.r(0, 110, W, 70, '#0a1219');
    for (let x = 0; x < W; x += 20) P.r(x, 0, 1, 110, '#0a1a24');           // wall panels
    for (let y = 22; y < 110; y += 22) P.r(0, y, W, 1, '#0a1a24');
    P.r(0, 18, W, 5, '#14303d'); P.r(0, 20, W, 1, '#1e4656');                // ceiling pipe
    for (let x = 6; x < W; x += 52) P.r(x, 14, 3, 12, '#0c1a22');
    // floor tiles in perspective
    for (let i = 0; i < 8; i++) { const y = 110 + Math.pow(i / 8, 1.6) * 70; P.r(0, y, W, 1, '#13222d'); }
    for (let i = -8; i <= 8; i++) P.poly([[160 + i * 4, 110], [160 + i * 4 + 1, 110], [160 + i * 45 + 1, H], [160 + i * 45, H]], '#101d27');
    // rows of pods receding toward the vanishing point (far -> near so near ones overlap)
    for (let row = 0; row < 2; row++) for (let k = 5; k >= 0; k--) {
      const sc = 1.5 - k * 0.17, base = 116 + (5 - k) * 11, cx = row ? 262 - k * 15 : 58 + k * 15;
      const w = 54 * sc, h = 34 * sc, x = cx - w / 2, top = base - h;
      const open = (row === 0 && k === 0), shade = k / 6;
      P.r(x, base - h * 0.42, w, h * 0.42, mix('#1c3a48', '#0a1820', shade)); P.r(x, base - h * 0.42, w, 2, mix('#3a7088', '#12303c', shade));
      if (!open) {
        P.r(x + 2, top, w - 4, h * 0.62, mix('#0c2434', '#061018', shade)); P.r(x + 4, top + 2, w - 8, h * 0.42, mix('#1a5470', '#0a2230', shade));
        P.r(x + 6, top + 3, 8 * sc, 2, mix('#8ad0e8', '#2a5a70', shade)); P.r(x + 4, top + 2, 2, h * 0.42, mix('#5ab0cc', '#1a4a60', shade));
      } else {
        P.r(x + 2, top - h * 0.55, w - 4, 7 * sc, '#2a4a5a'); P.r(x + 4, top - h * 0.55 + 7 * sc, 3, h * 0.55, '#1a3440'); P.r(x + w - 7, top - h * 0.55 + 7 * sc, 3, h * 0.55, '#1a3440');
        P.r(x + 4, top + 2, w - 8, h * 0.55, '#050e14'); P.r(x + 8, top + 8, w - 16, 5, '#0e2a3a'); P.light(cx, top + 14, 55, '#ff3a2a', 0.5, 0.5);
        P.r(x + w * 0.2, top + h * 0.55, 14, 3, '#7a8a90'); P.r(x + w * 0.2 + 14, top + h * 0.55 + 2, 20, 2, '#566a74');   // trailing cables
      }
    }
    // alarm beacons
    P.r(150, 4, 20, 6, '#3a0c0c'); P.r(154, 5, 12, 4, '#ff3a2a'); P.light(160, 8, 130, '#ff2a1a', 0.7, 0.55);
    P.light(60, 40, 70, '#2a8aa8', 0.1, 0.25); P.light(260, 44, 70, '#2a8aa8', 0.1, 0.25);
    P.speckle(0, 0, W, H, '#1f3a48', 90);
  };

  painters.corridor = (P, R) => {
    P.hall([118, 50, 202, 118], '#0e1822', '#0a1018', '#0b141c', '#05090d');
    const lx = (k) => 118 * (1 - Math.pow(0.66, k)), ys = (x) => ({ t: 50 * x / 118, b: H - 62 * x / 118 });
    for (let k = 0; k < 7; k++) {
      const x = lx(k), nx = lx(k + 1), yy = ys(x), ny = ys(nx);
      P.r(x, yy.t, 1, yy.b - yy.t, '#152330'); P.r(W - x - 1, yy.t, 1, yy.b - yy.t, '#101a26');
      if (k % 2 === 1) { // doors
        const dx = (x + nx) / 2 - 4 * (1 - k / 8), dh = (ny.b - ny.t) * 0.7;
        P.poly([[x + 2, yy.b - dh * 1.1 - 8], [nx - 2, ny.b - dh * 0.96 - 8], [nx - 2, ny.b - 8], [x + 2, yy.b - 8]], '#162634');
        P.poly([[W - x - 2, yy.b - dh * 1.1 - 8], [W - nx + 2, ny.b - dh * 0.96 - 8], [W - nx + 2, ny.b - 8], [W - x - 2, yy.b - 8]], '#12202c');
        P.r(x + 5, yy.b - dh - 4, 2, 2, k === 3 ? '#e04030' : '#2fd070');
      }
      // ceiling strip light
      const cy = lerp(0, 50, 1 - Math.pow(0.66, k)) + 2;
      P.r(160 - 22 * (1 - k / 9), cy, 44 * (1 - k / 9), 2, '#c8e8f0'); P.light(160, cy + 4, 60 * (1 - k / 9) + 10, k % 3 === 1 ? '#ff3a2a' : '#9ad8f0', k === 2 ? 0.8 : 0.1, 0.1);
    }
    P.r(150, 118, 20, 4, '#0e1a24'); P.r(158, 122, 4, 58, '#10202c');       // centre floor line
    P.r(146, 70, 28, 44, '#0d1c28'); P.r(148, 72, 24, 40, '#08121a'); P.r(158, 72, 4, 40, '#0d1c28');   // far door
    P.speckle(0, 0, W, H, '#1c2c3a', 80);
  };

  painters.engine = (P, R) => {
    P.vgrad(0, 0, W, 120, '#120a08', '#1e1410', 12); P.r(0, 120, W, 60, '#0a0807');
    for (let x = 0; x < W; x += 16) for (let y = 128; y < H; y += 8) P.r(x + (y / 8 % 2) * 8, y, 7, 1, '#2a1e18'); // grating
    P.r(0, 30, W, 6, '#3a2a22'); P.r(0, 32, W, 1, '#6a4a3a'); P.r(0, 70, W, 4, '#2e2018');
    for (let x = 20; x < W; x += 70) { P.r(x, 0, 6, 120, '#2a1c16'); P.r(x + 1, 0, 1, 120, '#4a342a'); }
    // reactor core in glass
    P.r(112, 34, 96, 100, '#0a1418'); P.r(116, 38, 88, 92, '#06101a');
    for (let i = 0; i < 14; i++) { P.r(120 + (i % 2) * 2, 44 + i * 6, 80 - (i % 2) * 4, 2, mix('#1a6a8a', '#0a2a3a', i / 14)); }
    P.circle(160, 84, 20, '#0e3a4e'); P.circle(160, 84, 13, '#1a7a96'); P.circle(160, 84, 6, '#8ae8f8');
    P.light(160, 84, 120, '#2ab8d8', 0.25, 0.5);
    P.r(112, 34, 96, 3, '#4a6a76'); P.r(112, 131, 96, 3, '#4a6a76');
    // breaker panel
    P.r(232, 52, 76, 96, '#1c1c20'); P.r(234, 54, 72, 92, '#101014'); P.r(232, 52, 76, 2, '#5a5a62');
    const cols = ['#3a6ae0', '#e0a43a', '#3ac05a'];
    cols.forEach((c, i) => { P.r(242 + i * 20, 64, 10, 40, '#08080a'); P.r(243 + i * 20, 66 + i * 4, 8, 14, c); P.r(240 + i * 20, 60, 14, 3, '#3a3a42'); P.light(248 + i * 20, 80, 18, c, 0.1, 0.25); });
    P.r(240, 114, 54, 22, '#2a0c0c'); P.r(244, 118, 46, 14, '#c0281c'); P.r(246, 120, 42, 3, '#ff6a5a'); P.light(267, 125, 30, '#ff2a1a', 0.5, 0.4);
    P.r(0, 118, 16, 62, '#2a1c16'); P.r(300, 150, 20, 30, '#2a1c16');
    P.speckle(0, 0, W, H, '#3a2a22', 100);
  };

  painters.comm = (P, R) => {
    P.vgrad(0, 0, W, 130, '#0a1410', '#101c18', 12); P.r(0, 130, W, 50, '#0a100e');
    for (let x = 0; x < W; x += 40) P.r(x, 0, 2, 130, '#0c1814');
    // console banks
    for (let b = 0; b < 4; b++) {
      const x = 14 + b * 74, y = 40;
      P.r(x, y, 64, 80, '#161e1c'); P.r(x + 2, y + 2, 60, 76, '#0c1412');
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const on = R() < 0.25; P.r(x + 6 + i * 9, y + 8 + j * 12, 5, 5, on ? (R() < 0.5 ? '#2fd070' : '#e0a43a') : '#1a2622'); }
      for (let i = 0; i < 3; i++) { P.circle(x + 14 + i * 18, y + 62, 4, '#26322e'); P.r(x + 14 + i * 18, y + 58, 1, 4, '#8aa08a'); }
    }
    P.light(100, 70, 50, '#2fd070', 0.4, 0.3); P.light(250, 80, 50, '#e0a43a', 0.5, 0.2);
    // desk + speaker + screen
    P.r(0, 128, W, 8, '#2a2f2c'); P.r(0, 136, W, 44, '#0c1210');
    P.r(120, 100, 80, 28, '#0a0e0c'); P.r(124, 103, 72, 22, '#0c2418'); for (let i = 0; i < 10; i++) P.r(128 + i * 7, 118 - R() * 12, 4, 6 + R() * 8, '#2fd070');
    P.light(160, 114, 70, '#2fd070', 0.3, 0.35);
    P.circle(280, 150, 16, '#1a1e1c'); P.circle(280, 150, 11, '#0a0c0b'); P.circle(280, 150, 4, '#2a2e2c');
    P.r(30, 0, 1, 30, '#3a3a36'); P.r(34, 0, 1, 24, '#3a3a36');
    P.speckle(0, 0, W, H, '#1a2a24', 80);
  };

  painters.hatch = (P, R) => {
    P.vgrad(0, 0, W, H, '#0c0e12', '#07080b', 10);
    for (let x = 0; x < W; x += 24) P.r(x, 0, 1, H, '#10141a');
    P.circle(160, 88, 72, '#1a1e24'); P.circle(160, 88, 66, '#0c0f13'); P.circle(160, 88, 58, '#1e242c');
    for (let a = 0; a < 12; a++) { // iris blades
      const ang = a * Math.PI / 6;
      for (let r = 8; r < 58; r++) P.p(160 + Math.cos(ang + r * 0.012) * r, 88 + Math.sin(ang + r * 0.012) * r, '#2a323c');
    }
    P.circle(160, 88, 8, '#0a0c10'); P.ring(160, 88, 62, '#3a424e');
    for (let a = 0; a < 16; a++) { const ang = a * Math.PI / 8; P.circle(160 + Math.cos(ang) * 68, 88 + Math.sin(ang) * 68, 2, '#3a424e'); }
    for (let x = 0; x < 60; x += 14) { P.poly([[x, 150], [x + 7, 150], [x - 3, 180], [x - 10, 180]], x % 28 ? '#d6a830' : '#101010'); P.poly([[W - x, 150], [W - x - 7, 150], [W - x + 3, 180], [W - x + 10, 180]], x % 28 ? '#d6a830' : '#101010'); }
    P.r(150, 6, 20, 5, '#3a0c0c'); P.r(154, 7, 12, 3, '#ff3a2a'); P.light(160, 9, 150, '#ff2a1a', 0.7, 0.4);
    P.speckle(0, 0, W, H, '#222832', 100);
  };

  painters.core = (P, R) => {
    P.vgrad(0, 0, W, H, '#050a12', '#0a1624', 12);
    for (let i = 0; i < 6; i++) { P.r(0, 20 + i * 26, W, 1, '#0e1c2c'); }
    P.vgrad(0, 140, W, 40, '#0a1624', '#102a40', 6);
    for (let r = 78; r > 20; r -= 14) { P.ring(160, 90, r, '#16405c'); }
    P.r(144, 0, 32, 180, '#0e2a40'); P.r(148, 0, 24, 180, '#1a5a80'); P.r(154, 0, 12, 180, '#7adaf8'); P.r(158, 0, 4, 180, '#e8fcff');
    P.light(160, 90, 150, '#4fd0e0', 0.2, 0.6);
    for (let i = 0; i < 12; i++) { const y = 14 + i * 14; P.r(130, y, 8, 3, '#2a8ab0'); P.r(182, y + 5, 8, 3, '#2a8ab0'); }
    P.r(0, 150, W, 2, '#1a5a80');
    P.speckle(0, 0, W, H, '#2a6a90', 70);
  };

  painters.tunnel = (P, R) => {
    P.hall([112, 56, 208, 122], '#0e1210', '#0a0d0c', '#0c100e', '#020303');
    P.r(104, 54, 8, 70, '#1a1e1c'); P.r(208, 54, 8, 70, '#1a1e1c');
    for (let k = 0; k < 6; k++) { // ribs
      const x = 112 * (1 - Math.pow(0.68, k));
      P.r(x, 50 * x / 112, 2, H - 62 * x / 112 - 50 * x / 112, '#18201c'); P.r(W - x - 2, 50 * x / 112, 2, H - 62 * x / 112 - 50 * x / 112, '#161c18');
    }
    for (let k = 0; k < 4; k++) { const y = 24 + k * 6 + k * k * 2; P.poly([[0, y], [112, 58 + k * 3], [112, 61 + k * 3], [0, y + 6]], '#2a3a34'); P.poly([[W, y], [208, 58 + k * 3], [208, 61 + k * 3], [W, y + 6]], '#25332e'); }
    P.vgrad(0, 126, W, 54, '#0a0f0d', '#06090a', 5); P.r(110, 150, 100, 4, '#143036'); P.r(130, 152, 60, 1, '#4a8a94');   // puddle
    P.r(150, 70, 20, 52, '#000'); P.r(158, 124, 4, 6, '#143036');
    P.light(160, 96, 90, '#8aa8a0', 0.4, 0.22);
    P.speckle(0, 0, W, H, '#1c2a24', 120);
  };

  painters.clinic = (P, R) => {
    P.vgrad(0, 0, W, 130, '#1c130e', '#2a1c14', 12); P.r(0, 130, W, 50, '#150e0a');
    for (let x = 0; x < W; x += 16) P.r(x, 0, 1, 130, '#241812');
    P.r(210, 20, 80, 70, '#0e1220'); P.vgrad(214, 24, 72, 62, '#4a2a3a', '#d08a4a', 8); P.r(248, 20, 3, 70, '#1c130e'); P.r(210, 54, 80, 3, '#1c130e'); P.light(250, 56, 100, '#e0983a', 0.1, 0.3);
    for (let i = 0; i < 4; i++) { const x = 20 + i * 52, y = 112; P.r(x, y, 44, 10, '#3a2c22'); P.r(x, y - 8, 14, 8, '#d8d0c0'); P.r(x, y + 10, 3, 12, '#2a1e16'); P.r(x + 41, y + 10, 3, 12, '#2a1e16'); }
    P.r(100, 78, 70, 8, '#3a2a1e'); P.r(106, 86, 4, 30, '#2a1c14'); P.r(160, 86, 4, 30, '#2a1c14');
    P.r(118, 64, 34, 14, '#16110e'); P.r(122, 67, 26, 8, '#0c2418'); P.r(130, 58, 2, 8, '#6a6a60'); P.light(135, 70, 30, '#2fd070', 0.3, 0.2);
    [[40, 90], [180, 76], [290, 120], [90, 150]].forEach(([x, y]) => { P.r(x, y, 4, 8, '#e8dcc0'); P.r(x + 1, y - 3, 2, 3, '#ffd070'); P.light(x + 2, y - 2, 70, '#ffa840', 0.8, 0.5); });
    P.speckle(0, 0, W, H, '#3a2a20', 80);
  };

  painters.ruins = (P, R) => {
    P.vgrad(0, 0, W, 120, '#241830', '#8a4a3a', 18);
    P.circle(236, 78, 18, '#e8a060'); P.circle(236, 78, 14, '#f4c080');
    P.light(236, 78, 140, '#e8a060', 0.05, 0.3);
    const layers = [['#3a2a40', 76, 40], ['#241a2e', 96, 52], ['#120e18', 116, 66]];
    layers.forEach(([c, base, hh], li) => {
      let x = -10;
      while (x < W + 10) {
        const w = 18 + R() * 28, h = hh * (0.5 + R() * 0.9), top = base - h;
        P.r(x, top, w, base + 40 - top, c);
        P.r(x + (R() < 0.5 ? 0 : w - 6), top - 4 - R() * 6, 6 + R() * 6, 6, c);          // broken crown
        for (let wy = top + 6; wy < base; wy += 8) for (let wx = x + 3; wx < x + w - 3; wx += 6) if (R() < 0.45) P.r(wx, wy, 3, 4, li === 2 ? '#000' : mix(c, '#000000', 0.5));
        if (li === 2) for (let wy = top + 6; wy < base; wy += 8) for (let wx = x + 3; wx < x + w - 3; wx += 6) if (R() < 0.04) { P.r(wx, wy, 3, 4, '#e8a040'); P.light(wx + 1, wy + 2, 14, '#e8a040', 0.6, 0.3); }
        x += w + R() * 4;
      }
    });
    P.vgrad(0, 120, W, 60, '#14101a', '#08060c', 8);
    for (let i = 0; i < 40; i++) P.r(R() * W, 122 + R() * 56, 2 + R() * 8, 1 + R() * 3, '#1e1824');
    P.poly([[130, 180], [190, 180], [168, 122], [152, 122]], '#0e0b13');
    for (let k = 0; k < 5; k++) P.r(158 + (k % 2) * 2, 126 + k * 11, 3, 4 + k, '#2a2430');
    P.r(0, 100, W, 22, 'rgba(120,70,70,0.10)');
  };

  painters.wasteland = (P, R) => {
    P.vgrad(0, 0, W, 112, '#2a1a28', '#c08050', 22);
    P.circle(200, 98, 30, '#e8b070'); P.circle(200, 98, 25, '#f6cc90'); P.light(200, 98, 180, '#f0b070', 0.05, 0.35);
    for (let i = 0; i < 3; i++) P.r(0, 70 + i * 14, W, 2, 'rgba(60,30,50,0.4)');
    let x = 0; const hills = []; for (let i = 0; i <= 16; i++) hills.push(104 + Math.sin(i * 0.9) * 5 + R() * 4);
    for (let i = 0; i < 16; i++) P.poly([[i * 20, hills[i]], [i * 20 + 20, hills[i + 1]], [i * 20 + 20, 120], [i * 20, 120]], '#3a2226');
    P.r(264, 52, 2, 52, '#1a1014'); P.r(260, 70, 10, 1, '#1a1014'); P.r(262, 60, 6, 1, '#1a1014'); P.r(265, 50, 1, 4, '#e04030'); P.light(265, 51, 12, '#ff3a2a', 0.8, 0.5);
    P.vgrad(0, 112, W, 68, '#3a2a2a', '#120c0e', 12);
    P.poly([[140, 180], [230, 180], [188, 112], [182, 112]], '#1c1416'); for (let k = 0; k < 6; k++) P.poly([[184 + k * 0.3, 114 + k * 11], [186 + k * 0.3, 114 + k * 11], [187 + k * 2, 120 + k * 11], [185 + k * 2, 120 + k * 11]], '#8a7a50');
    for (let i = 0; i < 5; i++) { const cx = 40 + R() * 100, cy = 126 + R() * 40, s = 0.7 + (cy - 120) / 60; P.r(cx, cy, 26 * s, 8 * s, '#0e0a0c'); P.r(cx + 4 * s, cy - 5 * s, 16 * s, 6 * s, '#0e0a0c'); P.r(cx + 3 * s, cy + 8 * s, 4 * s, 3 * s, '#06040a'); P.r(cx + 18 * s, cy + 8 * s, 4 * s, 3 * s, '#06040a'); }
    P.speckle(0, 112, W, 68, '#4a3a38', 60);
  };

  painters.tower = (P, R) => {
    P.vgrad(0, 0, W, 130, '#06080e', '#2a1a2a', 16);
    for (let i = 0; i < 40; i++) P.p(R() * W, R() * 80, i % 4 ? '#6a6a8a' : '#e8e8ff');
    P.vgrad(0, 130, W, 50, '#14101a', '#05040a', 6);
    P.poly([[0, 150], [60, 128], [130, 140], [200, 126], [W, 142], [W, 180], [0, 180]], '#0a080e');
    // lattice spire
    for (let y = 8; y < 150; y += 6) { const half = 5 + (y - 8) * 0.14; P.r(160 - half, y, 2, 6, '#0a0a10'); P.r(160 + half - 2, y, 2, 6, '#0a0a10'); const d = (y / 6) % 2; P.poly([[160 - half, y], [160 + half, y + 6], [160 + half - 2, y + 6], [160 - half + 2, y]], '#0e0e16'); if (d) P.r(160 - half, y + 3, half * 2, 1, '#14141c'); }
    P.r(158, 0, 4, 10, '#16161e'); P.r(159, 2, 2, 2, '#ff3a2a'); P.light(160, 3, 70, '#ff2a1a', 0.7, 0.55);
    for (let i = 0; i < 6; i++) { const y = 30 + i * 18; P.r(160 - 24, y, 48, 1, '#14141c'); P.r(160 - 24, y, 1, 4, '#14141c'); P.r(160 + 23, y, 1, 4, '#14141c'); }
    P.r(110, 138, 100, 30, '#0c0a12'); P.r(116, 144, 88, 16, '#04030a'); P.r(150, 146, 20, 10, '#0c2a1c'); P.light(160, 152, 80, '#2fd070', 0.3, 0.35);
    P.speckle(0, 128, W, 52, '#1c1624', 50);
  };

  /* ---------- public API ---------- */
  const cache = {};
  const Art = AZ.Art = {
    W, H, mix, hex, rgb,
    /** Returns {canvas, lights}. Cached per family+seed. */
    background(family, seed) {
      const key = family + ':' + (seed || '');
      if (cache[key]) return cache[key];
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      const rng = U.rng('bg:' + key);
      const P = Pen(ctx, rng);
      const fn = painters[family] || painters.ruins;
      try { fn(P, rng); } catch (e) { AZ.warn('Background painter failed (' + family + '): ' + e.message); ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H); }
      const out = { canvas: c, lights: P.lights, family };
      // optional user-supplied image replaces the painted canvas when it loads
      const url = AZ.assets && AZ.assets.backgrounds && AZ.assets.backgrounds[family];
      if (url) { const img = new Image(); img.onload = () => { try { ctx.drawImage(img, 0, 0, W, H); } catch (e) { /* keep painted */ } }; img.onerror = () => AZ.warn('Missing background asset: ' + url); img.src = url; }
      cache[key] = out;
      return out;
    },
    families: Object.keys(painters)
  };
})();
