/* ============================================================
   AFTER ZERO — util.js
   Namespace, seeded RNG, helpers, tiny event bus.
   Classic script (no ES modules) so the game runs from file://.
   ============================================================ */
(function (root) {
  'use strict';

  const AZ = root.AZ = root.AZ || {};
  AZ.data = AZ.data || {};
  AZ.VERSION = '1.0.0';

  /** Register a data file (JSON-compatible object) under AZ.data[name]. */
  AZ.defineData = function (name, obj) {
    AZ.data[name] = obj;
  };

  /** Merge extra scene definitions into AZ.data.story.scenes (story is split over several files). */
  AZ.addScenes = function (scenes) {
    const st = AZ.data.story = AZ.data.story || { scenes: {} };
    st.scenes = st.scenes || {};
    for (const id of Object.keys(scenes)) {
      if (st.scenes[id]) AZ.warn('Duplicate scene id: ' + id);
      scenes[id].id = id;
      st.scenes[id] = scenes[id];
    }
  };

  /** Register procedural event templates (data/events_*.js). */
  AZ.addEvents = function (list) {
    AZ.data.events = AZ.data.events || [];
    for (const ev of list) AZ.data.events.push(ev);
  };

  /** Register procedural event templates (data/events_*.js). */
  AZ.addEvents = function (list) {
    const ev = AZ.data.events = AZ.data.events || { templates: [] };
    list.forEach(function (t) { ev.templates.push(t); });
  };

  /** Non-throwing warn (data problems are reported, never crash). */
  AZ.warn = function (msg) {
    AZ._warnings = AZ._warnings || [];
    AZ._warnings.push(String(msg));
    if (AZ.debug && root.console) root.console.warn('[AZ] ' + msg);
  };

  const U = AZ.util = {};

  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  U.isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
  U.arr = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);

  /** FNV-1a 32-bit string hash -> unsigned int. */
  U.hash = function (str) {
    let h = 0x811c9dc5;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  };

  /** mulberry32: small, fast, deterministic PRNG. Returns function -> [0,1). */
  U.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** Build an RNG from any string seed. */
  U.rng = (seedStr) => U.mulberry32(U.hash(seedStr));

  U.pick = function (rng, list) {
    if (!list || !list.length) return undefined;
    return list[Math.floor(rng() * list.length) % list.length];
  };

  /** Weighted pick. items: array, weightFn(item) -> number >= 0. Returns item or undefined. */
  U.weightedPick = function (rng, items, weightFn) {
    let total = 0;
    const ws = items.map((it) => {
      const w = Math.max(0, weightFn ? weightFn(it) : 1);
      total += w;
      return w;
    });
    if (total <= 0) return undefined;
    let r = rng() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  };

  U.shuffle = function (rng, list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /** Replace {{name}} / {name.sub} placeholders from a vars object. Unknown keys are left empty. */
  U.tpl = function (str, vars) {
    if (typeof str !== 'string') return str;
    return str.replace(/\{\{?\s*([\w.]+)\s*\}?\}/g, (m, key) => {
      const parts = key.split('.');
      let v = vars;
      for (const p of parts) {
        if (v === undefined || v === null) return '';
        v = v[p];
      }
      return v === undefined || v === null ? '' : String(v);
    });
  };

  U.uid = (() => { let n = 0; return (p) => (p || 'id') + '_' + (++n) + '_' + Date.now().toString(36); })();
  U.now = () => Date.now();

  /** Minimal publish/subscribe bus. */
  const handlers = {};
  AZ.bus = {
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); return () => AZ.bus.off(evt, fn); },
    off(evt, fn) { handlers[evt] = (handlers[evt] || []).filter((f) => f !== fn); },
    emit(evt, payload) {
      for (const fn of (handlers[evt] || []).slice()) {
        try { fn(payload); } catch (e) { AZ.warn('Handler for "' + evt + '" failed: ' + (e && e.message)); if (AZ.debug && root.console) root.console.warn(e); }
      }
    },
    clear() { for (const k of Object.keys(handlers)) delete handlers[k]; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
