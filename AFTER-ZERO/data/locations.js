/* AFTER ZERO — data/locations.js
   scene: which background painter family to use. tags drive procedural events.
   procedural: true => eligible as an Ash Road destination. */
AZ.defineData('locations', {
  /* ---- Authored: Shelter 7 ---- */
  cryo_ward:   { id: 'cryo_ward',   name: 'Shelter 7 — Cryo Ward',      scene: 'cryo',     ambience: 'hum',   danger: 1, tags: ['shelter', 'interior'], desc: 'Murda pods ki qataarein. Ek khula hua.' },
  corridor:    { id: 'corridor',    name: 'Shelter 7 — Main Corridor',  scene: 'corridor', ambience: 'hum',   danger: 1, tags: ['shelter', 'interior'], desc: 'Lambi steel ki naali mein emergency lights kaanp rahi hain.' },
  engine_deck: { id: 'engine_deck', name: 'Shelter 7 — Engine Deck',    scene: 'engine',   ambience: 'drone', danger: 3, tags: ['shelter', 'machine'],  desc: 'Reactor kaanch ke peeche so raha hai. Pipes pasine se tar.' },
  comm_room:   { id: 'comm_room',   name: 'Shelter 7 — Comm Room',      scene: 'comm',     ambience: 'static', danger: 1, tags: ['shelter', 'interior'], desc: 'Murda switchboard. Bas ek zinda speaker.' },
  hatch:       { id: 'hatch',       name: 'Shelter 7 — Surface Hatch',  scene: 'hatch',    ambience: 'wind',  danger: 4, tags: ['shelter', 'threshold'], desc: 'Saalon se na khulne wala darwaza. Koi khatkhata raha hai.' },
  halcyon_core:{ id: 'halcyon_core',name: 'Shelter 7 — HALCYON Core',   scene: 'core',     ambience: 'drone', danger: 2, tags: ['shelter', 'machine'],  desc: 'Roshni ka ek kaanch ka sutoon. Wo dekh raha hai.' },

  /* ---- Authored: Surface & chapter locations ---- */
  vents:       { id: 'vents',       name: 'Service Tunnel',            scene: 'tunnel',   ambience: 'drip',  danger: 3, tags: ['underground'],        desc: 'Pipes, andhera aur geele concrete ki boo.' },
  kessler:     { id: 'kessler',     name: 'Kessler Street',             scene: 'ruins',    ambience: 'wind',  danger: 3, tags: ['city', 'ruins'],      desc: 'Khokhli imaaraton ki ghati, zakhmi aasman ke neeche.' },
  clinic:      { id: 'clinic',      name: 'Kessler Street Clinic',      scene: 'clinic',   ambience: 'hum',   danger: 1, tags: ['refuge', 'interior'], desc: 'Mombatti. Khatiyaan. Ek radio jo koshish karna nahi chhodta.' },
  ash_road:    { id: 'ash_road',    name: 'The Ash Road',               scene: 'wasteland',ambience: 'wind',  danger: 3, tags: ['wasteland', 'open'],  desc: 'Kahin na jaane wali sadak, khote sikke jaise suraj ke neeche.' },
  relay_tower: { id: 'relay_tower', name: 'The Relay Tower',            scene: 'tower',    ambience: 'static', danger: 3, tags: ['secret', 'machine'], desc: 'Steel ki meenar jo ab bhi khaali aasman mein broadcast kar rahi hai.' },

  /* ---- Procedural destinations ---- */
  dry_well:    { id: 'dry_well',    name: 'Sukha Kuan',               scene: 'wasteland',ambience: 'wind',  danger: 2, tags: ['wasteland', 'water', 'settlement'], procedural: true, desc: 'Haath se khoda kuan aur haath se likha board: WATER, NOT FREE.' },
  rust_market: { id: 'rust_market', name: 'Zang Bazaar',                scene: 'ruins',    ambience: 'crowd', danger: 2, tags: ['city', 'trade', 'settlement'],     procedural: true, desc: 'Tarpaulin, laalten aur sau chupchaap sauday.' },
  sunken_subway:{id:'sunken_subway',name: 'Doobi Subway',          scene: 'tunnel',   ambience: 'drip',  danger: 4, tags: ['underground', 'dark'],             procedural: true, desc: 'Seedhiyaan kaale paani aur purani khamoshiyon mein utarti hain.' },
  silo_farm:   { id: 'silo_farm',   name: 'Silo Farm',                  scene: 'wasteland',ambience: 'wind',  danger: 2, tags: ['wasteland', 'food', 'settlement'], procedural: true, desc: 'Anaaj ke silo. Koi ab bhi kuch ugaa raha hai.' },
  dead_mall:   { id: 'dead_mall',   name: 'Murda Mall',              scene: 'clinic',   ambience: 'hum',   danger: 3, tags: ['ruins', 'interior', 'loot'],       procedural: true, desc: 'Skylights, putle, aur kahin na jaati escalator.' },
  hollow_church:{id:'hollow_church',name: 'Khokhli Girja',          scene: 'ruins',    ambience: 'wind',  danger: 2, tags: ['ruins', 'sacred', 'secret'],       procedural: true, requires: { any: [{ knows: 'k_mara_early' }, { flag: 'rumor_church' }] }, desc: 'Chhat nahi rahi. Ghanta ab bhi hawa se bajta hai.' },
  overpass:    { id: 'overpass',    name: 'Overpass',               scene: 'ruins',    ambience: 'wind',  danger: 3, tags: ['open', 'ruins'],                   procedural: true, desc: 'Toota highway, murda gaadiyon ki nadi ke upar.' },
  radio_graveyard:{id:'radio_graveyard',name:'Radio Kabristan',         scene: 'tower',    ambience: 'static', danger: 3, tags: ['machine', 'secret', 'loot'],      procedural: true, requires: { any: [{ knows: 'k_relay' }, { flag: 'rumor_graveyard' }] }, desc: 'Antennas ka maidaan, sab usi khaali aasman ki taraf.' }
});
