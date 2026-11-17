/* ============================================================
   AFTER ZERO — data/config.js
   Static game definitions: stats, items, knowledge, abilities,
   achievements, death scenarios, survival rules.
   (Stored as JS files that call AZ.defineData so the game also
   runs by double-clicking index.html — browsers block fetch() of
   .json files on file://. The shapes are plain JSON.)
   ============================================================ */
AZ.defineData('config', {
  title: 'AFTER ZERO',
  saveVersion: 1,
  startScene: 'wake',
  chapterTitles: { 1: 'CHAPTER 01: AAKHRI SHELTER', 2: 'CHAPTER 02: ASH ROAD (ANANT)' },

  /* Stat meaning: health high = good. hunger/thirst/fatigue/fear high = bad. trust/humanity high = good. */
  stats: {
    health:   { label: 'Sehat',    start: 100, color: '#d6483b', good: 'high', tip: 'Zero hui to timeline khatam.' },
    hunger:   { label: 'Bhookh',    start: 20,  color: '#c98a2b', good: 'low',  tip: '85 se upar, mehnat wale kaam nahi hote.' },
    thirst:   { label: 'Pyaas',    start: 25,  color: '#3f8fc9', good: 'low',  tip: '100 par tum gir jaoge.' },
    fatigue:  { label: 'Thakaan',   start: 20,  color: '#8a6bc4', good: 'low',  tip: '90 se upar, bhaari kaam nahi hote.' },
    trust:    { label: 'Bharosa',     start: 40,  color: '#5cb85c', good: 'high', tip: 'Survivors tum par kitna yakeen karte hain.' },
    fear:     { label: 'Darr',      start: 15,  color: '#c45a9a', good: 'low',  tip: '70 se upar, tumhari nazar tumhe dhokha deti hai.' },
    humanity: { label: 'Insaniyat',  start: 80,  color: '#e8d9a0', good: 'high', tip: 'Sab gaya to tum wo insaan nahi rahoge jo jaaga tha.' }
  },

  /* Passive decay per unit of "time" a choice spends. */
  decay: { hunger: 3, thirst: 4, fatigue: 3 },

  /* Survival thresholds used by the choice engine. */
  rules: {
    weakHunger: 85,        // 'physical' choices vanish above this hunger
    weakFatigue: 90,       // ...or this fatigue
    riskyHealth: 25,       // 'risky' choices vanish below this health
    panicFear: 70          // perception distortion threshold
  },

  /* Clocks that kill when they reach 0 (timeline-scoped). */
  clocks: { oxygen: { label: 'Oxygen', deathId: 'suffocation', warn: 4 } },

  items: {
    ration:        { name: 'Ration Brick', type: 'food', icon: 'brick', color: '#b58a4a', desc: 'Thos, feeka, aur ab tak ka sabse lazeez khaana.', use: { stat: { hunger: -30 }, note: 'Tum ration brick zabardasti nigal lete ho.' } },
    canned_peaches:{ name: 'Dibbe ke Aadu', type: 'food', icon: 'can', color: '#e0a060', desc: 'Duniya khatam hone se pehle ka label. Syrup ab bhi meetha.', use: { stat: { hunger: -20, thirst: -8, humanity: 2 }, note: 'Mithaas. Kuch insaani sa jaag uthta hai.' } },
    water_bottle:  { name: 'Paani ki Bottle', type: 'water', icon: 'bottle', color: '#6fb4e8', desc: 'Kaafi saaf. Ab ye luxury hai.', use: { stat: { thirst: -35 }, note: 'Thanda paani. Tum rone ko ho jaate ho.' } },
    dirty_water:   { name: 'Gandla Paani', type: 'water', icon: 'bottle', color: '#7a8a4a', desc: 'Peene layak, bas sawaal mat poochho.', use: { stat: { thirst: -25, health: -6 }, note: 'Zang aur pachhtave ka swaad.' } },
    bandage:       { name: 'Bandage Roll', type: 'medical', icon: 'cross', color: '#e8e0d0', desc: 'Phata kapda, ek baar ubaala hua.', use: { stat: { health: 15 }, note: 'Tum zakhm par patti baandh lete ho.' } },
    medkit:        { name: 'Field Medkit', type: 'medical', icon: 'cross', color: '#d6483b', desc: 'Seal band. Ab bhi sterile. Anmol.', use: { stat: { health: 40, fear: -5 }, note: 'Medkit apna kaam karti hai.' } },
    stim:          { name: 'Stim Injector', type: 'medical', icon: 'syringe', color: '#6fe0a0', desc: 'Thakaan jad se mitata hai. Utarte waqt rehem nahi karta.', use: { stat: { fatigue: -40, health: -5 }, note: 'Dil hathode sa bajta hai. Dhundh chhat jaati hai.' } },
    flashlight:    { name: 'Torch', type: 'tool', icon: 'light', color: '#f0e08a', desc: 'Ek chalti roshni. Andhere kamre ab band darwaze nahi.' },
    toolkit:       { name: 'Toolkit', type: 'tool', icon: 'wrench', color: '#9aa4ad', desc: 'Screwdriver, soldering pen, aur thoda sabr.' },
    crowbar:       { name: 'Crowbar', type: 'weapon', icon: 'crowbar', color: '#7d868f', desc: 'Darwaze kholta hai. Zaroorat pade to aur cheezein bhi.' },
    knife:         { name: 'Kabaad Chaaku', type: 'weapon', icon: 'knife', color: '#b8c0c8', desc: 'Kaafi tez. Umeed hai kabhi pata na chale kitna.' },
    pistol:        { name: 'Zang Lagi Pistol', type: 'weapon', icon: 'pistol', color: '#6a6e74', desc: 'Teen goli. Shayad.' },
    filter_mask:   { name: 'Filter Mask', type: 'tool', icon: 'mask', color: '#8fa08a', desc: 'Raakh ko phephdon se door rakhta hai.' },
    keycard_b2:    { name: 'Level B2 Keycard', type: 'quest', icon: 'card', color: '#4fc0d0', desc: 'Hatch control cabinet kholta hai.' },
    radio_part:    { name: 'Radio Capacitor', type: 'quest', icon: 'chip', color: '#d0a040', desc: 'Bahar kisi ko bolne ke liye ye chahiye.' },
    scrap:         { name: 'Kabaad', type: 'tool', icon: 'scrap', color: '#a08060', desc: 'Ab bhi kaam ki ek hi currency.', stack: 99 },
    battery:       { name: 'Cell Battery', type: 'tool', icon: 'battery', color: '#c0d060', desc: 'Aadhi charge. Aadhi umeed.' },
    echo_tape:     { name: 'Echo Tape', type: 'artifact', icon: 'tape', color: '#e070a0', desc: 'Tumhari apni awaaz ki recording, ek aise din ki jo abhi aaya nahi.' },
    pocket_watch:  { name: 'Tooti Ghadi', type: 'artifact', icon: 'watch', color: '#d8c070', permanent: true, desc: '00:00 par ruki hui. Jaagte waqt tumhare haath mein thi. Har baar.' },
    handset:       { name: 'Haath ka Radio', type: 'tool', icon: 'radio', color: '#6fe0a0', desc: '91.4 par tune. Isme Mara ki awaaz rehti hai.' },
    salt_pouch:    { name: 'Namak ki Potli', type: 'tool', icon: 'pouch', color: '#e8e8e8', desc: 'Purani kahaniyon ka purana usool. Phir bhi tum rakhte ho.' }
  },

  knowledge: {
    k_oxygen:      { title: 'Hawa Khatam Hoti Hai', cat: 'lore', text: 'Shelter 7 mein lagbhag baarah cycle ki saans layak hawa hai. Andar har action thodi hawa khaata hai.' },
    k_locker_code: { title: 'Locker Code 0417', cat: 'clue', text: 'Supply locker ka code pod frame ke neeche khurcha hua hai: 0-4-1-7.' },
    k_subject_zero:{ title: 'Subject 0', cat: 'clue', text: 'Pod tag par likha hai "SUBJECT 0 — DO NOT WAKE". Tumhe aankhein kholni hi nahi thi.' },
    k_breaker_order:{ title: 'Breaker ka Kram', cat: 'skill', text: 'Pehle BLUE, phir AMBER, phir GREEN. Laal EMERGENCY OVERRIDE KABHI nahi: wo deck mein coolant chhod deta hai.', grants: 'ab_circuit' },
    k_listener:    { title: 'The Listener', cat: 'lore', text: 'Bahar kuch awaazein copy karta hai. Tum jawab doge to wo jawab dega. Chuppi se wo dilchaspi kho deta hai.', grants: 'ab_silence' },
    k_mara_freq:   { title: 'Frequency 91.4', cat: 'clue', text: 'Mara Voss naam ki ek aurat 91.4 MHz par broadcast kar rahi hai. Wo kehti hai aur survivors hain.' },
    k_halcyon_lie: { title: 'HALCYON ne Jhooth Bola', cat: 'clue', text: 'HALCYON ne kaha koi survivor nahi bacha. Survivors hain. Shelter AI ke paas tumhe andar rakhne ki wajah hai — ya kahin khaas bhejne ki.' },
    k_ash_storm:   { title: 'Shaam ki Dhool', cat: 'lore', text: 'Shaam ko Ash Road par raakh ke toofan aate hain. Filter mask ke bina ye dhool jaanleva hai.' },
    k_cycle_312:   { title: 'Cycle 312', cat: 'clue', text: 'Shelter log mein Subject 0 ke 312 baar jaagne ka record hai. Ye pehli baar nahi. Shayad pehli maut bhi nahi.' },
    k_kael_scar:   { title: 'Kael ki Chetawani', cat: 'lore', text: 'Kael Rook hathiyaar uthaye aane wale ko goli maar deta hai. Khule haath ho to wo sunta hai.' },
    k_watch:       { title: 'Ghadi Ginti Karti Hai', cat: 'lore', text: 'Jaagte waqt tooti ghadi hamesha tumhare haath mein hoti hai. Wo 00:00 par ruki hai — Zero Event ke pal par.' },
    k_vent_route:  { title: 'Vent ka Raasta', cat: 'clue', text: 'Shelter 7 ke neeche service tunnels Kessler Street tak jaate hain. Left wala hissa dhah jaata hai. Right lo.' },
    k_relay:       { title: 'Relay Tower', cat: 'clue', text: 'Ash Road ke uttar mein ek tower ab bhi broadcast kar raha hai. Uska signal tumhari awaaz le jaata hai.' },
    k_echoes:      { title: 'Dusron ke Nishaan', cat: 'lore', text: 'Pehle ke Subject Zero Ash Road par khurchi hui chetawaniyan chhod gaye. Wo yahan marne wale pehle nahi the.' },
    k_diary_zero:  { title: 'Wahi Sapna', cat: 'lore', text: 'Zero Event ke pehle hafte ki diary: aasman ek second ke liye safed ho gaya, aur sab wahi sapna yaad karte hue jaage.' },
    k_mara_early:  { title: '"Tum jaldi aa gaye."', cat: 'clue', text: 'Mara Voss ne tumhe aise mila jaise tumhara intezaar tha. Usne nahi bataya kis cheez ke liye jaldi.' }
  },

  abilities: {
    ab_echo:    { name: 'Echo Sense', desc: 'Teen maut ke baad tumhe un choices ka ehsaas hota hai jinse tum pehle mar chuke ho — halki laal jhilmil. (Settings mein on/off.)' },
    ab_silence: { name: 'Chuppi ka Hunar', desc: 'Tumhe jawab na dena aata hai. Chup rehne ke options khulte hain aur himmat nahi ghatti.' },
    ab_circuit: { name: 'Circuit Sense', desc: 'Tum breaker panel ko vaakya ki tarah padhte ho. Sahi kram turant khul jaata hai.' }
  },

  achievements: {
    first_death:   { name: 'Maut se Wapsi', desc: 'Pehli baar mar kar phir jaago.' },
    three_deaths:  { name: 'Riyaaz', desc: 'Teen baar maro.' },
    ten_deaths:    { name: 'Ziddi', desc: 'Das baar maro.' },
    met_mara:      { name: 'Static mein Ek Awaaz', desc: 'Mara Voss se sampark karo.' },
    kael_trusted:  { name: 'Khule Haath', desc: 'Kael Rook ka bharosa jeeto.' },
    power_on:      { name: 'Batti Jali', desc: 'Shelter 7 ki power wapas laao.' },
    chapter1:      { name: 'Aakhri Shelter', desc: 'Chapter 01 poora karo.' },
    both_paths:    { name: 'Do Raaste', desc: 'Chapter 01 dono bade raaston se poora karo.' },
    wanderer:      { name: 'Musafir', desc: 'Ash Road par 10 events nipta do.' },
    knowledge_8:   { name: 'Sachchaiyon ka Sangrah', desc: '8 sthaayi sach jaano.' }
  },

  /* Cinematic death scenarios. lines show during the death sequence; learns are permanent. */
  deaths: {
    suffocation: { title: 'HAWA KHATAM', lines: ['Pehle alarm dheema padta hai. Phir roshni.', 'Phephde khaali hawa kheenchte hain.', 'Kahin upar, hawa us duniya par chalti hai jisne tumhara intezaar nahi kiya.'], summary: 'Shelter 7 ke andar tumhari hawa khatam ho gayi.', learns: ['k_oxygen'], sfx: 'death' },
    electrocution: { title: 'LAAL HANDLE', lines: ['EMERGENCY OVERRIDE, label par likha tha.', 'Handle jhuk jaata hai. Coolant deck ki plating mein cheekhta hai.', 'Current tum tak soch se pehle pahunchta hai.'], summary: 'Tumne laal breaker kheencha. Reactor purge se engine deck bhar gaya.', learns: ['k_breaker_order'], sfx: 'death' },
    listener: { title: 'DARWAZE PAR AWAAZ', lines: ['Wo kisi aise ki awaaz thi jise tumhe bachana tha.', 'Hatch khulta hai. Awaaz ab bhi bol rahi hai, ab tumhare peeche, ab tumhare andar.', 'Wo kabhi meherbaan hona nahi chhodti. Yahi sabse bura hai.'], summary: 'Tumne kisi gair-insaan ko jawab diya. Wo tumhe le gaya.', learns: ['k_listener'], sfx: 'death' },
    ash_storm: { title: 'SHAAM KI DHOOL', lines: ['Kshitij purani chot ke rang ka ho jaata hai.', 'Tum khaansate ho. Chalte rehte ho. Phir khaansate ho.', 'Raakh tumhe dheere, sabr se, poori tarah bhar deti hai.'], summary: 'Raakh ke toofan ne tumhe filter mask ke bina pakad liya.', learns: ['k_ash_storm'], sfx: 'death' },
    collapse: { title: 'LEFT TUNNEL', lines: ['Chhat saalon se bahaane ka intezaar kar rahi thi.', 'Concrete jaldi nahi karta. Bas aa pahunchta hai.'], summary: 'Left service tunnel tum par dhah gaya.', learns: ['k_vent_route'], sfx: 'death' },
    kael_shot: { title: 'HATHIYAAR UTHA', lines: ['Tum awaaz se pehle muzzle flash dekhte ho.', 'Kael Rook ka chehra, jab saaf dikhta hai, gusse mein nahi hai. Bas thaka hua.'], summary: 'Tumne Kael Rook ko dhamkaya. Usne pehle goli chalayi.', learns: ['k_kael_scar'], sfx: 'death' },
    wounds: { title: 'KHOON BAH GAYA', lines: ['Garmahat sabse pehle haathon se jaati hai.', 'Tumhe abhi bahut kuch karna tha.'], summary: 'Tumhara saara khoon bah gaya.', learns: [], sfx: 'death' },
    starved: { title: 'KHOKHLA', lines: ['Bhookh dard karna band kar deti hai. Tab pata chalta hai.'], summary: 'Tum bhookh se mar gaye.', learns: [], sfx: 'death' },
    dehydrated: { title: 'SOOKHA', lines: ['Marichika bahut accha jhoothi hai. Phir bhi tum uske peeche jaate ho.'], summary: 'Tum pyaas se mar gaye.', learns: [], sfx: 'death' },
    hollowed: { title: 'BACHANE KO KUCH NAHI', lines: ['Tum aakhri kaam bina kuch mehsoos kiye karte ho.', 'Jo tumhe insaan banata tha, chupchaap door chala jaata hai.'], summary: 'Tumne apni poori insaniyat kho di.', learns: [], sfx: 'death' },
    raiders: { title: 'GHAT', lines: ['Kankar par boot. Bahut saare. Bahut paas.', 'Aakhri cheez jo tum sunte ho, koi hansta hai ki kitna aasaan tha.'], summary: 'Raaste mein lootero ne tum par ghaat lagakar hamla kiya.', learns: [], sfx: 'death' },
    unknown: { title: 'IS TIMELINE KA ANT', lines: ['Sab kuch ruk jaata hai.'], summary: 'Is timeline mein tumhari kahani khatam hui.', learns: [], sfx: 'death' }
  }
});
