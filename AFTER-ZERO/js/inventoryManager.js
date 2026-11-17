/* AFTER ZERO — inventoryManager.js : items, stacks, using consumables. */
(function () {
  'use strict';
  const AZ = window.AZ, S = () => AZ.State, items = () => AZ.data.config.items;

  const Inv = AZ.Inventory = {
    def(id) { return items()[id]; },
    name(id) { return items()[id] ? items()[id].name : id; },
    qty(id) { return S().tl.inventory[id] || 0; },
    has(id) { return Inv.qty(id) > 0; },

    /** Add items; returns how many were actually added (stack caps respected). Unknown items are refused. */
    add(id, n) {
      n = n === undefined ? 1 : n;
      const d = items()[id];
      if (!d) { AZ.warn('Unknown item "' + id + '"'); return 0; }
      const cap = d.stack || (d.type === 'quest' || d.type === 'artifact' || d.type === 'weapon' || d.type === 'tool' ? 1 : 9);
      const cur = Inv.qty(id), next = Math.min(cap, cur + n);
      S().tl.inventory[id] = next;
      return next - cur;
    },

    /** Remove items; returns true if anything was removed. */
    remove(id, n) {
      n = n === undefined ? 1 : n;
      const cur = Inv.qty(id);
      if (cur <= 0) return false;
      const next = cur - n;
      if (next <= 0) delete S().tl.inventory[id]; else S().tl.inventory[id] = next;
      return true;
    },

    /** Sorted list for UI: [{id, def, qty}] */
    list() {
      const order = { food: 0, water: 1, medical: 2, tool: 3, weapon: 4, quest: 5, artifact: 6 };
      return Object.keys(S().tl.inventory).filter((id) => items()[id])
        .map((id) => ({ id, def: items()[id], qty: S().tl.inventory[id] }))
        .sort((a, b) => (order[a.def.type] - order[b.def.type]) || a.def.name.localeCompare(b.def.name));
    },

    /** Consumables only. Real effect via the shared effects engine. */
    canUse(id) { const d = items()[id]; return !!(d && d.use && Inv.has(id)); },

    use(id) {
      if (!Inv.canUse(id)) return null;
      const d = items()[id];
      Inv.remove(id, 1);
      const ctx = AZ.Choice.apply(d.use);
      AZ.State.log({ t: 'note', text: d.name + ' istemaal kiya.' });
      AZ.bus.emit('cue', { sfx: 'use' });
      // Using medicine on the brink can still be too late, but never kill silently:
      AZ.Story && AZ.Story.afterEffects && AZ.Story.afterEffects(ctx);
      return { note: d.use.note || '', ctx };
    }
  };
})();
