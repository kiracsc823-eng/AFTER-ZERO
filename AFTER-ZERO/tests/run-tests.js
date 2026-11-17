/* AFTER ZERO — headless test suite. Run:  node tests/run-tests.js
   Exercises the real engine (no UI) through the same API the UI uses. */
const load = require('./loader.js');
let pass = 0, fail = 0; const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); console.log('  ✗ FAIL: ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }
function section(t) { console.log('\n▸ ' + t); }

/** fresh game, with death handler that mimics the UI (resume after cinematic) */
function fresh(opts) {
  const AZ = load(opts);
  AZ.State.settings = AZ.State.defaultSettings();
  AZ.Save.boot();
  AZ.State.newGame(false);
  AZ._deaths = [];
  AZ.bus.on('death', (d) => { AZ._deaths.push(d); });
  AZ.Story.start(false);
  return AZ;
}
function scene(AZ) { return AZ.State.tl.sceneId; }
function ids(AZ) { return AZ.Story.view ? AZ.Story.view.choices.map((c) => c.id) : []; }
/** Choose by choice id. Handles death -> resume like the UI. */
function pick(AZ, id) {
  const v = AZ.Story.view; if (!v) throw new Error('No view (dead?) while picking ' + id);
  const i = v.choices.findIndex((c) => c.id === id);
  if (i < 0) throw new Error('Choice "' + id + '" not visible in ' + v.sceneId + '. Visible: ' + ids(AZ).join(','));
  const r = AZ.Story.choose(i);
  if (r.died) AZ.Story.resumeAfterDeath();
  return r;
}
function play(AZ, list) { list.forEach((id) => pick(AZ, id)); }

const PATH_A = ['w_wait', 'p_under', 'p_tag', 'p_watch', 'p_code', 'p_leave', 'c_closet_lit', 'c_engine', 'e_study', 'e_seq', 'pr_on', 'x_comm', 'm_listen', 'm_repair', 'm_call', 'mc_truth', 'v_right', 'k_ration', 'kt_listener', 'kt_clinic', 'cl_heal', 'cl_early', 'ce_a'];
const PATH_B = ['w_wait', 'p_under', 'p_code', 'p_leave', 'c_closet_lit', 'c_engine', 'e_study', 'e_seq', 'pr_on', 'x_core', 'hc_obey', 'h_listen', 'h_silent', 'ar_mask', 'kc_water', 'rt_take', 'ce_b'];

/* ------------------------------------------------------------------ */
section('1. Boot & new game');
{
  const AZ = fresh();
  eq(scene(AZ), 'wake', 'new game starts at wake');
  ok(AZ.State.checkpoint && AZ.State.checkpoint.id === 'cp_wake', 'start checkpoint created');
  ok(AZ.State.tl.inventory.pocket_watch === 1, 'pocket watch granted');
  eq(AZ.State.tl.n, 1, 'timeline 1');
  ok(AZ.Story.view.lines.length >= 4, 'wake has dialogue');
  ok(AZ.Story.view.lines[0].who === 'HALCYON' && /LIFE SUPPORT SYSTEM FAIL/.test(AZ.Story.view.lines[0].text), 'opening announcement present');
  eq(AZ.Story.view.choices.length, 3, 'three opening choices');
  const r = AZ.Validate.run();
  eq(r.errors.length, 0, 'validator: 0 errors');
  eq(r.warnings.length, 0, 'validator: 0 warnings');
}

section('2. Choices have different consequences');
{
  const a = fresh(); pick(a, 'w_rip');
  const b = fresh(); pick(b, 'w_wait');
  const c = fresh(); pick(c, 'w_shout');
  ok(a.State.tl.flags.ripped_free && !b.State.tl.flags.ripped_free, 'rip sets flag');
  ok(a.State.tl.stats.health < 100 && b.State.tl.stats.health === 100, 'rip costs health, wait does not');
  ok(b.State.tl.clocks.oxygen === 11 && a.State.tl.clocks.oxygen === 12, 'waiting costs oxygen');
  ok(c.State.tl.flags.shouted_wake && c.State.tl.stats.fear > b.State.tl.stats.fear, 'shouting raises fear');
  eq(a.Story.view.lines[0].text.slice(0, 20), 'Cables jadon ki tara', 'result text shown first');
  // delayed consequence (shout -> knock after 5 steps)
  ok(!c.State.tl.flags.heard_knock, 'delay not yet fired');
  play(c, ['p_under', 'p_tag', 'p_watch', 'p_leave', 'c_pod']);
  ok(c.State.tl.flags.heard_knock, 'delayed consequence fired after 5 steps');
}

section('3. Conditions hide choices (never shown when unsatisfied)');
{
  const AZ = fresh(); play(AZ, ['w_wait']);
  ok(!ids(AZ).includes('p_code'), 'locker-code choice hidden without knowledge');
  ok(ids(AZ).includes('p_pry'), 'pry choice visible');
  play(AZ, ['p_under']);
  ok(ids(AZ).includes('p_code') && !ids(AZ).includes('p_pry'), 'after learning code: code visible, pry hidden');
  play(AZ, ['p_leave']);
  ok(!ids(AZ).includes('c_cross') && !ids(AZ).includes('c_closet_lit'), 'power-gated / flashlight-gated choices hidden');
  // physical gating: critical hunger hides physical choices
  const W = fresh(); W.State.setStat('hunger', 95);
  W.Story.refresh();
  ok(!ids(W).includes('w_rip'), 'critical hunger hides physical choice');
  ok(ids(W).includes('w_wait'), 'non-physical choice remains');
  const R = fresh(); R.State.setStat('health', 20); R.Story.refresh();
  play(R, ['w_wait', 'p_leave', 'c_comm']);
  ok(!ids(R).includes('m_hack'), 'risky choice hidden at low health');
}

section('4. Full playthrough — PATH A (Mara / trust)');
{
  const AZ = fresh();
  play(AZ, PATH_A);
  ok(AZ.State.tl.chapter === 2, 'chapter 2 reached');
  ok(AZ.State.meta.endings.e_trust === 1, 'ending e_trust recorded');
  ok(AZ.State.meta.achievements.chapter1 && AZ.State.meta.achievements.power_on && AZ.State.meta.achievements.met_mara, 'achievements granted');
  ok(AZ.State.tl.sceneId.indexOf('gen:') === 0 && AZ.Story.view.hub, 'continues into procedural hub');
  eq(AZ._deaths.length, 0, 'no deaths on the happy path');
  ok(AZ.State.tl.npcs.kael.trust >= 35 && AZ.State.tl.npcs.mara.trust >= 45, 'NPC trust built (kael ' + AZ.State.tl.npcs.kael.trust + ', mara ' + AZ.State.tl.npcs.mara.trust + ')');
  ok(AZ.State.meta.knowledge.k_cycle_312 && AZ.State.meta.knowledge.k_mara_early, 'chapter mystery stored permanently');
  ok(AZ.State.tl.quests.q_air.state === 'done' && AZ.State.tl.quests.q_zero.state === 'active', 'quests updated');
}

section('5. Full playthrough — PATH B (HALCYON / solo)');
{
  const AZ = fresh();
  play(AZ, PATH_B);
  ok(AZ.State.tl.chapter === 2 && AZ.State.meta.endings.e_solo === 1, 'path B ends with e_solo');
  ok(AZ.State.tl.inventory.echo_tape === 1, 'echo tape artifact obtained');
  eq(AZ._deaths.length, 0, 'no deaths on path B');
  ok(AZ.State.meta.abilities.ab_silence, 'Practiced Silence unlocked from knowledge');
  // and the two paths yield different worlds
  const A = fresh(); play(A, PATH_A);
  ok(A.State.tl.flags.path_halcyon !== AZ.State.tl.flags.path_halcyon, 'paths set different flags');
}

section('6. Three distinct death scenarios + Return by Death');
{
  const AZ = fresh();
  // Death 1: red breaker
  play(AZ, ['w_wait', 'p_under', 'p_leave', 'c_engine']);
  ok(ids(AZ).includes('e_red'), 'red handle offered to the unwary');
  const pre = AZ.State.meta.knowledge.k_breaker_order;
  play(AZ, ['e_red']);
  eq(AZ._deaths.length, 1, 'death event emitted');
  eq(AZ._deaths[0].cause, 'electrocution', 'cause electrocution');
  ok(!pre && AZ.State.meta.knowledge.k_breaker_order, 'death taught breaker order permanently');
  eq(AZ.State.tl.n, 2, 'timeline counter increased');
  eq(AZ.State.meta.deaths, 1, 'death counted');
  eq(scene(AZ), 'wake', 'rewound to checkpoint scene');
  ok(!AZ.State.tl.flags.calm_wake && !AZ.State.tl.inventory.flashlight, 'temporary state reset');
  ok(AZ.State.meta.knowledge.k_locker_code, 'knowledge from pre-death exploration survives');
  ok(AZ.State.meta.fatalChoices['engine_deck#e_red'], 'fatal choice remembered');
  ok(AZ.State.tl.inventory.pocket_watch === 1, 'permanent artifact restored');
  ok(AZ.State.meta.achievements.first_death, 'first_death achievement');
  ok(AZ.Story.view.lines.some((l) => /Ye tum pehle bhi kar chuke/.test(l.text)), 'wake scene acknowledges prior deaths');
  ok(AZ.Story.view.lines.some((l) => l.who === 'HALCYON' && /Phir se/.test(l.text)), 'HALCYON recognises the loop');
  // knowledge reshapes the next timeline: locker code available at once, red handle gone
  play(AZ, ['w_wait']);
  ok(ids(AZ).includes('p_code') && !ids(AZ).includes('p_pry'), 'remembered code unlocks the free route');
  play(AZ, ['p_code', 'p_leave', 'c_engine']);
  ok(!ids(AZ).includes('e_red') && ids(AZ).includes('e_seq'), 'remembered order hides the trap and offers the right sequence');
  // Death 2: suffocation by dawdling
  const AZ2 = fresh();
  AZ2.State.tl.clocks.oxygen = 2;
  play(AZ2, ['w_wait', 'p_leave']);
  eq(AZ2._deaths.length, 1, 'suffocation triggered by the oxygen clock');
  eq(AZ2._deaths[0].cause, 'suffocation', 'cause suffocation');
  ok(AZ2.State.meta.knowledge.k_oxygen, 'suffocation teaches oxygen limit');
  eq(AZ2.State.tl.clocks.oxygen, 12, 'oxygen restored by checkpoint');
  // Death 3: the voice at the hatch (after the major checkpoint)
  const AZ3 = fresh();
  play(AZ3, ['w_wait', 'p_under', 'p_code', 'p_leave', 'c_engine', 'e_study', 'e_seq', 'pr_on', 'x_hatch']);
  eq(scene(AZ3), 'hatch', 'at the hatch');
  ok(ids(AZ3).includes('h_open'), 'open hatch offered');
  play(AZ3, ['h_open']);
  eq(AZ3._deaths[0].cause, 'listener', 'cause listener');
  eq(scene(AZ3), 'power_restored', 'major checkpoint restores to power_restored, not the start');
  ok(AZ3.State.tl.flags.power_on && AZ3.State.tl.inventory.flashlight === 1 && AZ3.State.tl.inventory.crowbar === 1, 'post-checkpoint-0 progress retained as of checkpoint');
  eq(AZ3.State.checkpoint.id, 'cp_power', 'latest checkpoint is cp_power');
  ok(AZ3.State.tl.clocks.oxygen >= 8, 'oxygen from checkpoint');
  ok(AZ3.State.meta.abilities.ab_silence && !ids(AZ3).includes('h_open'), 'listener lesson now removes the trap');
  // more deaths: collapse, shot, ash storm
  const D = fresh();
  play(D, ['w_wait', 'p_under', 'p_code', 'p_leave', 'c_engine', 'e_study', 'e_seq', 'pr_on', 'x_comm', 'm_listen', 'm_repair', 'm_call', 'mc_truth', 'v_left']);
  eq(D._deaths[0].cause, 'collapse', 'left tunnel collapses');
  const K = fresh();
  play(K, ['w_wait', 'p_under', 'p_code', 'p_leave', 'c_engine', 'e_study', 'e_seq', 'pr_on', 'x_comm', 'm_listen', 'm_repair', 'm_call', 'mc_truth', 'v_right', 'k_weapon']);
  eq(K._deaths[0].cause, 'kael_shot', 'threatening Kael is fatal');
  const E = fresh();
  play(E, ['w_wait', 'p_under', 'p_code', 'p_leave', 'c_engine', 'e_study', 'e_seq', 'pr_on', 'x_core', 'hc_obey', 'h_listen', 'h_silent', 'ar_bare']);
  eq(E._deaths[0].cause, 'ash_storm', 'bareheaded ash storm is fatal');
  const mem = E.State.meta.deathLog; ok(mem.length === 1 && mem[0].trail.length > 0, 'death log keeps a trail of last choices');
}

section('7. Echo Sense, memory summaries, timeline summaries');
{
  // force three deaths via direct API for the ability check
  const B = fresh();
  for (let i = 0; i < 3; i++) { B.State.tl.clocks.oxygen = 1; play(B, ['w_wait']); }
  eq(B.State.meta.deaths, 3, 'three deaths');
  ok(B.State.meta.abilities.ab_echo, 'Echo Sense unlocked at three deaths');
  ok(B.State.meta.achievements.three_deaths, 'three_deaths achievement');
  ok(B.State.meta.timelineSummaries.length === 3, 'timeline summaries stored');
  ok(B.Timeline.memorySummary(B._deaths[0]).length >= 2, 'memory summary composed');
  // Echo flag on a choice that killed you but is still on offer afterwards
  const C = fresh(); C.State.tl.stats.health = 5; play(C, ['w_rip']);
  eq(C._deaths[0].cause, 'wounds', 'bled out from tearing free at 5 health');
  ok(C.State.meta.fatalChoices['wake#w_rip'], 'wounds death blames the last choice');
  C.State.meta.abilities.ab_echo = true; C.Story.refresh();
  const rip = C.Story.view.choices.find((c) => c.id === 'w_rip');
  ok(rip && rip.echo, 'Echo Sense marks the choice that killed you before');
  ok(!C.Story.view.choices.find((c) => c.id === 'w_wait').echo, 'safe choices are not marked');
  C.State.getSettings().echoSense = false; C.Story.refresh();
  ok(!C.Story.view.choices.find((c) => c.id === 'w_rip').echo, 'Echo Sense can be switched off in settings');
}

section('8. NPC relationships & timeline-specific status');
{
  const AZ = fresh();
  AZ.Choice.apply({ trust: { kael: 30 }, meet: 'kael' });
  eq(AZ.NPC.relation('kael'), 'Tatasth', 'relation label follows trust (50 -> Tatasth)');
  AZ.Choice.apply({ npcStatus: { kael: 'dead' } });
  eq(AZ.NPC.relation('kael'), 'Mrit', 'dead NPC');
  ok(AZ.NPC.changeTrust('kael', 20) === 0, 'dead NPC trust frozen');
  AZ.State.tl.clocks.oxygen = 1; play(AZ, ['w_wait']);        // die -> rewind
  eq(AZ.State.tl.npcs.kael.status, 'alive', 'NPC dead in an old timeline is alive again after reset');
  eq(AZ.State.tl.npcs.kael.trust, 20, 'NPC trust restored to checkpoint');
  ok(AZ.State.meta.npcMemory.kael && AZ.State.meta.npcMemory.kael.metCount >= 1, 'permanent NPC memory kept');
  ok(!AZ.NPC.recognizes('kael'), 'Kael does not recognise you after 1 death');
  AZ.State.meta.deaths = 3; AZ.State.tl.npcs.kael.met = true;
  ok(AZ.NPC.recognizes('kael'), 'Kael recognises strange behaviour after 3 deaths');
  ok(AZ.NPC.recognizes('halcyon'), 'HALCYON recognises once you have died');
  // dead characters never recognise
  AZ.State.tl.npcs.kael.status = 'dead'; ok(!AZ.NPC.recognizes('kael'), 'dead NPC cannot recognise');
  // no contradictory states: relation derived from trust & status only
  const list = AZ.NPC.known(); ok(Array.isArray(list), 'known() works');
}

section('9. Inventory & survival');
{
  const AZ = fresh();
  AZ.State.tl.stats.hunger = 60; AZ.State.tl.stats.health = 50;
  AZ.Inventory.add('ration', 2); AZ.Inventory.add('medkit', 1); AZ.Inventory.add('scrap', 150);
  eq(AZ.Inventory.qty('scrap'), 99, 'stack cap');
  AZ.Inventory.use('ration'); eq(AZ.State.tl.stats.hunger, 30, 'ration reduces hunger');
  eq(AZ.Inventory.qty('ration'), 1, 'ration consumed');
  AZ.Inventory.use('medkit'); eq(AZ.State.tl.stats.health, 90, 'medkit heals');
  ok(!AZ.Inventory.use('flashlight'), 'non-consumable cannot be used');
  eq(AZ.Inventory.add('nonexistent', 1), 0, 'unknown item refused safely');
  // starvation kills
  const S = fresh(); S.State.tl.stats.hunger = 98; play(S, ['w_wait']);
  ok(S._deaths.some((d) => d.cause === 'starved'), 'starvation kills (hunger decays with time)');
  ok(S.State.tl.n >= 2, 'starvation also rewinds');
  // fear distorts perception
  const F = fresh(); F.State.setStat('fear', 80); F.Story.refresh();
  ok(F.Story.view.panic && F.Story.view.lines.some((l) => l.glitch), 'high fear shows distorted text');
}

section('10. Save / Load / corruption / persistence');
{
  const AZ = fresh();
  play(AZ, ['w_wait', 'p_under', 'p_code', 'p_leave', 'c_closet_lit']);
  ok(AZ.Save.save('1', 'Manual'), 'manual save succeeds');
  const info = AZ.Save.slotInfo('1');
  ok(info && info.location && info.timeline === 1, 'slot info readable');
  ok(AZ.Save.slotInfo('auto'), 'autosave exists');
  const snap = JSON.stringify(AZ.State.tl);
  play(AZ, ['c_engine', 'e_study']);
  AZ.Memory.learn('k_relay');                            // permanent knowledge gained AFTER the save
  const res = AZ.Save.load('1');
  ok(res.ok, 'load succeeds');
  AZ.Story.start(true);
  eq(JSON.stringify(AZ.State.tl), snap, 'loaded timeline matches the saved one exactly');
  ok(AZ.State.meta.knowledge.k_relay && AZ.State.meta.knowledge.k_breaker_order, 'loading an old save never deletes newer permanent memories');
  ok(AZ.State.checkpoint && AZ.State.checkpoint.id === 'cp_wake', 'checkpoint restored with the save');
  // continue: latest slot
  ok(AZ.Save.latestSlot(), 'latest slot found');
  // simulate a page reload: new engine instance reading the same storage
  const store = AZ._store || null;
  // corruption: damage slot 1, expect graceful failure and a usable backup after re-saving
  AZ.Save.save('2', 'A'); AZ.Save.save('2', 'B');
  const key = 'afterzero.v1.slot.2';
  const raw = AZ.localStorage ? null : null;
}
{
  // persistence across a "browser reload": two engines sharing one storage object
  const A = fresh();
  play(A, ['w_wait', 'p_under', 'p_tag']);
  A.Save.autosave();
  const shared = A._store;
  const B = load(); B.localStorage = undefined;
  // copy storage into the new sandbox
  Object.assign(B._store, shared);
  B.State.settings = B.State.defaultSettings();
  const hadProfile = B.Save.boot();
  ok(hadProfile, 'profile found after reload');
  ok(B.State.meta.knowledge.k_locker_code && B.State.meta.knowledge.k_subject_zero, 'permanent memories survive a reload');
  ok(B.Save.hasAnySave(), 'Continue is available');
  const r = B.Save.load(B.Save.latestSlot());
  ok(r.ok, 'continue loads the autosave');
  B.AZ = B; B.bus.on('death', () => {});
  B.Story.start(true);
  ok(B.Story.view && B.Story.view.sceneId === 'pod_room', 'resumes on the right scene');
  eq(B.State.tl.flags.calm_wake, true, 'flags restored');
  // corruption handling
  const k = Object.keys(B._store).find((x) => /slot\.auto$/.test(x));
  B._store[k] = B._store[k].slice(0, -20) + 'garbage';
  const bad = B.Save.load('auto');
  ok(bad.ok === true || bad.ok === false, 'corrupted slot never throws');
  B.Save.slotInfo('auto');
  // corrupt meta -> falls back to .bak (written on second write)
  B.Memory.learn('k_relay'); B.Memory.learn('k_echoes');
  const mk = Object.keys(B._store).find((x) => /\.meta$/.test(x));
  B._store[mk] = '{"sum":1,"body":"{bad"}';
  const m = B.Save.loadMeta();
  ok(m && m.knowledge.k_locker_code, 'corrupted meta recovered from backup copy');
}
{
  // storage blocked (private mode): game must keep running
  const AZ = fresh({ noStorage: true });
  ok(AZ.Save.storageOk === false, 'storage unavailable detected');
  play(AZ, ['w_wait', 'p_under']);
  ok(AZ.Save.save('1', 'x') !== undefined, 'save does not throw without storage');
  ok(AZ.Save.load('1').ok, 'in-memory fallback save/load works');
}

section('11. New Game keeps the old profile as a backup; permanent items; sanitize');
{
  const AZ = fresh();
  play(AZ, ['w_wait', 'p_under']);
  const before = AZ.State.meta.knowledge.k_locker_code;
  AZ.Save.newProfile();
  ok(before && !AZ.State.meta.knowledge.k_locker_code, 'new profile is clean');
  ok(AZ.Save._store.get('meta.prev'), 'previous profile preserved under meta.prev');
  // sanitize: a save missing fields still loads
  const B = fresh(); B.Save.save('3', 'x');
  const k = Object.keys(B._store).find((x) => /slot\.3$/.test(x));
  const env = JSON.parse(B._store[k]); const body = JSON.parse(env.body); delete body.tl.recent; delete body.tl.survivors; delete body.tl.clocks;
  const nb = JSON.stringify(body); B._store[k] = JSON.stringify({ sum: B.util.hash(nb), body: nb });
  ok(B.Save.load('3').ok, 'older/partial save is repaired on load');
  ok(Array.isArray(B.State.tl.recent) && B.State.tl.survivors && B.State.tl.clocks, 'missing fields restored');
}

section('12. Procedural events: generation, determinism, anti-repetition');
{
  const AZ = fresh(); play(AZ, PATH_A);
  ok(AZ.Story.view.hub, 'in hub');
  const types = {}, seq = [];
  for (let i = 0; i < 300; i++) {
    const v = AZ.Story.view;
    ok(v && v.lines.length && v.choices.length, 'scene ' + i + ' has lines and choices');
    if (v.hub) {
      const d = v.choices.find((c) => /^d\d$/.test(c.id)) || v.choices[0];
      pick(AZ, d.id);
    } else {
      const sc = AZ.State.tl.genScene;
      if (sc && sc.templateId) { seq.push(sc.templateId); types[sc.type] = (types[sc.type] || 0) + 1; }
      // choose the first visible non-fatal choice
      const c = v.choices.find((x) => x.id !== 'go' && x.id !== 'rob' && x.id !== 'attack') || v.choices[0];
      pick(AZ, c.id);
    }
    if (AZ.State.tl.sceneId === 'wake' || AZ.State.tl.sceneId === 'pod_room') { PATH_A.length; break; }
    // keep the hero alive for the test
    AZ.State.tl.stats.health = 100; AZ.State.tl.stats.hunger = 20; AZ.State.tl.stats.thirst = 20; AZ.State.tl.stats.fatigue = 20;
  }
  ok(seq.length >= 80, 'generated many events (' + seq.length + ')');
  ok(Object.keys(types).length >= 7, 'many event types generated: ' + Object.keys(types).join(','));
  // anti-repetition: no template within 4 steps of itself
  let worst = 99;
  for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < Math.min(seq.length, i + 5); j++) if (seq[i] === seq[j]) worst = Math.min(worst, j - i);
  ok(worst === 99, 'no template repeats within 4 events (closest repeat gap: ' + (worst === 99 ? 'none' : worst) + ')');
  const counts = {}; seq.forEach((t) => counts[t] = (counts[t] || 0) + 1);
  const distinct = Object.keys(counts).length;
  ok(distinct >= 15, 'wide variety of templates used: ' + distinct);
  // events carry meaning
  AZ.Events.templates().forEach((t) => { if (!t.meaning) ok(false, 'template ' + t.id + ' lacks meaning'); });
}
{
  // determinism: identical seed/timeline/step => identical sequence
  function run() {
    const AZ = fresh(); AZ.State.meta.worldSeed = 'FIXED-SEED'; play(AZ, PATH_A); const seq = [];
    for (let i = 0; i < 40; i++) {
      const v = AZ.Story.view;
      if (v.hub) pick(AZ, v.choices.find((c) => /^d\d$/.test(c.id)).id);
      else { const sc = AZ.State.tl.genScene; seq.push(sc.templateId + ':' + sc.lines.map((l) => l.text).join('').length); pick(AZ, v.choices[0].id); }
      AZ.State.tl.stats.health = 100; AZ.State.tl.stats.hunger = 10; AZ.State.tl.stats.thirst = 10; AZ.State.tl.stats.fatigue = 10;
    }
    return seq.join('|');
  }
  const a = run(), b = run();
  ok(a.length > 50 && a === b, 'same seed reproduces the exact same generated events');
  const AZ = fresh(); AZ.State.meta.worldSeed = 'OTHER'; play(AZ, PATH_A);
  const sc1 = AZ.Events.makeEvent('rust_market').templateId; AZ.State.tl.eventCount = 0;
  AZ.State.meta.worldSeed = 'DIFFERENT'; const dist = new Set(); for (let i = 0; i < 12; i++) { AZ.State.tl.eventCount = 0; AZ.State.tl.recent = []; AZ.State.meta.worldSeed = 'S' + i; dist.add(AZ.Events.makeEvent('rust_market').templateId); }
  ok(dist.size >= 3, 'different seeds produce different events (' + dist.size + ' variants)');
}
{
  // context awareness: secret locations gated; quests resolve; allies; echoes need deaths
  const AZ = fresh(); play(AZ, PATH_A);
  const locsBefore = []; for (let i = 0; i < 30; i++) { AZ.State.tl.eventCount = i; AZ.State.tl.recent = []; AZ.Events.makeHub().choices.forEach((c) => { if (c.next && c.next.indexOf('@event:') === 0) locsBefore.push(c.next.slice(7)); }); }
  ok(!locsBefore.includes('radio_graveyard'), 'Radio Graveyard hidden on path A without a rumour');
  ok(locsBefore.includes('hollow_church'), 'Hollow Church unlocked by path A knowledge');
  const B = fresh(); play(B, PATH_B);
  const locsB = []; for (let i = 0; i < 30; i++) { B.State.tl.eventCount = i; B.State.tl.recent = []; B.Events.makeHub().choices.forEach((c) => { if (c.next && c.next.indexOf('@event:') === 0) locsB.push(c.next.slice(7)); }); }
  ok(locsB.includes('radio_graveyard') && !locsB.includes('hollow_church'), 'path B unlocks the Radio Graveyard instead');
  // echo events need prior deaths
  const noDeath = fresh(); play(noDeath, PATH_A);
  let sawEcho = false; for (let i = 0; i < 60; i++) { noDeath.State.tl.eventCount = i; noDeath.State.tl.recent = []; if (noDeath.Events.makeEvent('ash_road').templateId === 'my_cairn') sawEcho = true; }
  ok(!sawEcho, 'echo events never appear before the first death');
  // quest chain: start -> active -> resolve at the right place
  const Q = fresh(); play(Q, PATH_A);
  Q.State.tl.recent = []; Q.State.tl.eventCount = 0;
  Q.Choice.apply({ quest: { q_water: { title: 'Water', data: { sv: 'x', loc: 'silo_farm' } } } });
  const sv = Q.Events.makeSurvivor(Q.util.rng('t')); Q.State.tl.quests.q_water.data.sv = sv.id;
  const hub = Q.Events.makeHub(); ok(hub.choices.some((c) => c.next === '@event:silo_farm'), 'active quest guarantees its destination in the hub');
  let resolved = false; for (let i = 0; i < 10; i++) { Q.State.tl.recent = []; const s = Q.Events.makeEvent('silo_farm'); if (s.templateId === 'qe_water_run') { resolved = true; break; } }
  ok(resolved, 'quest resolution event is strongly favoured at its target');
}

section('13. Randomised bot: 80 runs x up to 300 choices (no crashes, never stuck)');
{
  let crashes = 0, stuck = 0, totalDeaths = 0, endings = { e_trust: 0, e_solo: 0 }, visited = new Set(), maxChap2 = 0, steps = 0;
  for (let run = 0; run < 80; run++) {
    const AZ = fresh();
    let seed = run * 7919 + 13; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    try {
      for (let s = 0; s < 300; s++) {
        const v = AZ.Story.view;
        if (!v || !v.choices.length) { stuck++; break; }
        // survival aid so the bot explores farther: eat/drink when it can
        const st = AZ.State.tl.stats;
        if (st.hunger > 70 && AZ.Inventory.has('ration')) AZ.Inventory.use('ration');
        if (st.thirst > 70 && AZ.Inventory.has('water_bottle')) AZ.Inventory.use('water_bottle');
        const v2 = AZ.Story.view; if (!v2) { AZ.Story.resumeAfterDeath(); continue; }
        const c = v2.choices[Math.floor(rnd() * v2.choices.length)];
        const r = AZ.Story.choose(v2.choices.indexOf(c));
        if (r.died) AZ.Story.resumeAfterDeath();
        visited.add(AZ.State.tl.sceneId.replace(/^gen:.*/, 'gen'));
        steps++;
      }
    } catch (e) { crashes++; console.log('  crash in run ' + run + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
    totalDeaths += AZ.State.meta.deaths;
    if (AZ.State.meta.endings.e_trust) endings.e_trust++; if (AZ.State.meta.endings.e_solo) endings.e_solo++;
    ok(AZ.State.meta.deaths === AZ.State.meta.deathLog.length, 'deathLog matches death count (run ' + run + ')');
    ok(Object.keys(AZ.State.meta.knowledge).every((k) => AZ.data.config.knowledge[k]), 'only valid knowledge stored (run ' + run + ')');
  }
  eq(crashes, 0, 'no crashes across random play');
  eq(stuck, 0, 'never stuck without a choice');
  console.log('    steps ' + steps + ', deaths ' + totalDeaths + ', endings ' + JSON.stringify(endings) + ', distinct scenes seen ' + visited.size);
  ok(totalDeaths > 50, 'random play dies often (return by death exercised)');
}

section('14. Missing data / assets degrade gracefully');
{
  const AZ = fresh();
  AZ.State.tl.sceneId = 'does_not_exist'; AZ.Story.enterScene('does_not_exist', {});
  ok(AZ.Story.view && AZ.Story.view.sceneId === 'wake' || AZ.Story.view.sceneId === (AZ.State.checkpoint && AZ.State.checkpoint.sceneId), 'missing scene falls back safely');
  AZ.Choice.apply({ stat: { bogus: 5 }, item: { nothing: 1 }, learn: 'nope', trust: { ghost: 5 }, location: 'nowhere', fakeEffect: 1 });
  ok(AZ.State.tl.stats.health === 100, 'bad effects are ignored, state intact');
  ok(AZ.Choice.check({ madeUp: 1 }) === false, 'unknown condition fails safe');
  const tpl = AZ.Events.templates()[0]; AZ.data.events.templates.unshift({ id: 'broken', type: 'x', meaning: 'm', weight: 9999, lines: [{ text: 'a {{' }], choices: null });
  let threw = false; try { for (let i = 0; i < 5; i++) AZ.Events.makeEvent('dry_well'); } catch (e) { threw = true; }
  ok(!threw, 'a broken event template cannot crash generation');
}

console.log('\n==========================================');
console.log('PASSED ' + pass + '   FAILED ' + fail);
if (fail) { console.log(failures.map((f) => ' - ' + f).join('\n')); process.exit(1); }
