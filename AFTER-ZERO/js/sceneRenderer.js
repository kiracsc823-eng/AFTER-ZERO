/* ============================================================
   AFTER ZERO — sceneRenderer.js
   Draws the cinematic scene on a 320x180 canvas (scaled up by CSS with
   crisp pixels): cached background, flickering lights, alarm pulse,
   character busts, weather particles, fade transitions, fear glitch and
   the rewind effect. Runs at ~30 fps and pauses when the tab is hidden.
   ============================================================ */
(function () {
  'use strict';
  const AZ = window.AZ, U = AZ.util;
  const W = 320, H = 180;

  const R = AZ.Renderer = {
    canvas: null, ctx: null, t: 0, last: 0, running: false,
    bg: null, bgKey: '', chars: [], speaker: null, mood: { particles: 'dust' }, particles: [],
    fade: 0, panic: false, rewindUntil: 0, flashUntil: 0, enabledParticles: true, _glitch: 0,

    init(canvas) {
      R.canvas = canvas; R.ctx = canvas.getContext('2d');
      R.ctx.imageSmoothingEnabled = false;
      R.setView(null);
      if (!R.running) { R.running = true; R.last = performance.now(); requestAnimationFrame(R.loop); }
    },

    /** Show a scene (view = Story.view). Pass null for the neutral menu backdrop. */
    setView(view) {
      const family = view ? view.bg : 'ruins', seed = view ? view.bgSeed : 'menu';
      const key = family + ':' + seed;
      const changed = key !== R.bgKey;
      R.bg = AZ.Art.background(family, seed); R.bgKey = key;
      R.mood = (view && view.mood) || { particles: 'ash' };
      R.panic = !!(view && view.panic);
      R.chars = ((view && view.chars) || []).map((c, i, arr) => ({ id: c.id, expr: c.expr, pos: c.pos || (arr.length > 1 ? (i ? 'right' : 'left') : 'center'), def: R.defFor(c.id) })).filter((c) => c.def);
      if (changed) R.fade = 1;
      R.seedParticles();
    },

    defFor(id) {
      const d = AZ.data.characters[id];
      if (d) return d;
      const tl = AZ.State && AZ.State.tl;
      return tl && tl.survivors && tl.survivors[id] ? Object.assign({ id }, tl.survivors[id]) : null;
    },

    setSpeaker(id) { R.speaker = id || null; },
    shake() { const st = document.getElementById('stage'); if (!st || !AZ.State.getSettings().shake) return; st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); },
    flash(ms) { R.flashUntil = performance.now() + (ms || 200); },
    rewind(ms) { R.rewindUntil = performance.now() + ms; },

    seedParticles() {
      const kind = R.mood.particles || 'dust', rng = Math.random;
      const n = { dust: 28, ash: 70, embers: 26, sparks: 10, none: 0 }[kind];
      R.particles = [];
      for (let i = 0; i < (n === undefined ? 20 : n); i++) R.particles.push(R.newParticle(kind, true));
    },
    newParticle(kind, anywhere) {
      const r = Math.random;
      const p = { x: r() * W, y: anywhere ? r() * H : (kind === 'embers' ? H + 2 : -2), vx: 0, vy: 0, life: r() * 100, c: '#fff', s: 1 };
      if (kind === 'dust') { p.vx = (r() - 0.3) * 4; p.vy = (r() - 0.5) * 2; p.c = 'rgba(210,200,170,0.35)'; }
      else if (kind === 'ash') { p.vx = 14 + r() * 14; p.vy = 8 + r() * 12; p.c = r() < 0.2 ? 'rgba(220,150,100,0.7)' : 'rgba(170,165,160,0.55)'; p.s = r() < 0.2 ? 2 : 1; }
      else if (kind === 'embers') { p.vx = (r() - 0.5) * 6; p.vy = -(6 + r() * 14); p.c = r() < 0.5 ? 'rgba(255,170,60,0.85)' : 'rgba(255,100,40,0.7)'; }
      else if (kind === 'sparks') { p.x = 120 + r() * 120; p.y = 40 + r() * 80; p.life = 0; p.vx = (r() - 0.5) * 60; p.vy = (r() - 0.7) * 50; p.c = 'rgba(255,230,150,0.95)'; p.max = 0.3 + r() * 0.4; }
      p.kind = kind; return p;
    },

    loop(now) {
      requestAnimationFrame(R.loop);
      if (document.hidden) { R.last = now; return; }
      const dt = Math.min(0.1, (now - R.last) / 1000);
      if (now - R.last < 33) return;                // ~30 fps
      R.last = now; R.t += dt;
      try { R.draw(dt, now); } catch (e) { AZ.warn('Render error: ' + e.message); }
    },

    draw(dt, now) {
      const ctx = R.ctx;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
      if (!R.bg) return;
      ctx.drawImage(R.bg.canvas, 0, 0);

      // animated lights
      ctx.globalCompositeOperation = 'lighter';
      R.bg.lights.forEach((l, i) => {
        const flick = l.f ? 1 - l.f * (0.5 + 0.5 * Math.sin(R.t * (11 + i * 3.1) + i) * Math.sin(R.t * 5.3 + i * 2)) : 1;
        const a = l.a * flick, g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        g.addColorStop(0, R.rgba(l.c, a)); g.addColorStop(1, R.rgba(l.c, 0));
        ctx.fillStyle = g; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      });
      ctx.globalCompositeOperation = 'source-over';
      if (R.mood.alarm) { ctx.fillStyle = 'rgba(255,30,20,' + (0.05 + 0.07 * (0.5 + 0.5 * Math.sin(R.t * 4.2))) + ')'; ctx.fillRect(0, 0, W, H); }

      // characters (integer 2x scale so pixels stay crisp)
      const spots = { left: 22, center: 96, right: 170 };
      R.chars.forEach((c) => {
        const b = AZ.Portraits.bust(c.def, c.expr); if (!b) return;
        const dim = R.speaker && R.speaker !== c.id;
        const bob = Math.round(Math.sin(R.t * 1.6 + c.pos.length) * 1.2);
        if (dim) ctx.filter = 'brightness(0.55)';
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(spots[c.pos] + 64, 178, 54, 8, 0, 0, 7); ctx.fill();
        ctx.drawImage(b, spots[c.pos], 12 + bob, b.width * 2, b.height * 2);
        ctx.filter = 'none';
      });

      // particles
      if (R.enabledParticles && AZ.State.getSettings().particles) {
        for (let i = 0; i < R.particles.length; i++) {
          const p = R.particles[i];
          p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
          if (p.kind === 'sparks') { p.vy += 60 * dt; if (p.life > p.max) { R.particles[i] = R.newParticle('sparks'); R.particles[i].life = -Math.random() * 3; continue; } if (p.life < 0) continue; }
          else if (p.x > W + 2 || p.x < -2 || p.y > H + 2 || p.y < -2) { R.particles[i] = R.newParticle(p.kind); if (p.kind === 'ash') R.particles[i].x = -2 - Math.random() * 40, R.particles[i].y = Math.random() * H; continue; }
          ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
        }
      }

      // fear glitch (slices shift sideways now and then)
      if (R.panic && Math.random() < 0.08) {
        for (let i = 0; i < 3; i++) { const y = (Math.random() * H) | 0, h = 2 + (Math.random() * 8 | 0), dx = ((Math.random() - 0.5) * 12) | 0; ctx.drawImage(R.canvas, 0, y, W, h, dx, y, W, h); }
      }
      // rewind effect
      if (now < R.rewindUntil) {
        const k = 1 - (R.rewindUntil - now) / 1500;
        ctx.fillStyle = 'rgba(79,208,224,' + (0.15 + 0.25 * Math.sin(k * 20) ** 2) + ')'; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 10; i++) { const y = (Math.random() * H) | 0, h = 1 + (Math.random() * 6 | 0), dx = ((Math.random() - 0.5) * 80) | 0; ctx.drawImage(R.canvas, 0, y, W, h, dx, y, W, h); }
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, (H * (k * 3 % 1)) | 0, W, 1);
      }
      if (now < R.flashUntil) { ctx.fillStyle = 'rgba(255,255,255,' + 0.6 * (R.flashUntil - now) / 250 + ')'; ctx.fillRect(0, 0, W, H); }
      if (R.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + R.fade + ')'; ctx.fillRect(0, 0, W, H); R.fade = Math.max(0, R.fade - dt * 2.4); }
    },

    rgba(c, a) { const n = parseInt(c.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + Math.max(0, a).toFixed(3) + ')'; }
  };
})();
