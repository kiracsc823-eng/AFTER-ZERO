/* AFTER ZERO — data/story_shelter.js
   CHAPTER 01: THE LAST SHELTER — part 1: inside Shelter 7.
   Scene schema documented in js/storyEngine.js. */
AZ.addScenes({

  /* ---------------------------------------------------------- WAKE */
  wake: {
    location: 'cryo_ward', title: 'CHAPTER 01: AAKHRI SHELTER',
    mood: { music: 'dread', ambience: 'hum', particles: 'dust', alarm: true },
    chars: [],
    onEnter: {
      permItem: 'pocket_watch',
      objective: 'Pata lagao tum kahan ho — aur hawa kitni der chalegi.',
      quest: { q_air: { title: 'Life Support Wapas Chalao', desc: 'Shelter 7 mein hawa khatam ho rahi hai. Oxygen khatam hone se pehle power wapas lao.', main: true } },
      checkpoint: { id: 'cp_wake', kind: 'start' }
    },
    lines: [
      { who: 'HALCYON', text: 'WARNING. LIFE SUPPORT SYSTEM FAIL HO GAYA.', sfx: 'alarm' },
      { who: '', text: 'Ek anjaan chhat par laal roshni dhadak rahi hai. Tumse pehle tumhare phephde jaan jaate hain ki hawa galat hai.' },
      { who: '', text: 'Tum ek tooti hui dhakkan wale pod mein pade ho. Apna naam yaad nahi. Naam se jude kisi bhi cheez ka kuch yaad nahi.' },
      { who: '', if: { deaths: { gte: 1 } }, text: 'Phir bhi tumhara haath pehle se kisi chhoti, thandi cheez par band hai. Ye tum pehle bhi kar chuke ho. Laal roshni jaanti hai. Tumhara jism jaanta hai. Bas tumhara dimaag is raaz se bahar hai.' },
      { who: 'HALCYON', if: { npcRecognizes: 'halcyon' }, text: 'Jaagna darj hua. Phir se.', fearText: 'Jaagna darj hua. Phir se. Phir se. Phir se.' },
      { who: 'HALCYON', text: 'Occupant designation: SUBJECT ZERO. Oxygen reserve: critical. Bacha hua samay: baarah cycles.', fearText: 'Occupant designation: SUBJECT ZERO. Oxygen reserve: critical. Bacha hua samay: baarah cycles. Tum pehle hi late ho.' },
      { who: '', if: { knows: 'k_oxygen' }, text: 'Baarah cycles. Tum pehle se jaante the. Yahan har kaam mein hawa lagti hai, aur tum iska matlab achhe se samajh chuke ho.' }
    ],
    choices: [
      { id: 'w_rip', text: 'Pod ki cables noch kar azaad ho jao.', tags: ['physical'],
        effects: { stat: { health: -6, fatigue: 5 }, flag: 'ripped_free' }, next: 'pod_room',
        result: 'Cables jadon ki tarah tumhari baanh se nikal aati hain. Dard hota hai. Par kaam ban jaata hai.' },
      { id: 'w_wait', text: 'Chupchap pade raho, wake cycle poora hone do.', time: 1,
        effects: { stat: { fear: -5, fatigue: -6 }, flag: 'calm_wake' }, next: 'pod_room',
        result: 'Ek sui bahar nikalti hai. Haath-pair mein garmi daud jaati hai. Dhakkan aah bharke khulti hai, jaise tumhare sabr ka intezaar kar rahi thi.' },
      { id: 'w_shout', text: 'Awaaz do: "Koi hai wahan?"',
        effects: { stat: { fear: 4 }, flag: 'shouted_wake', delay: { steps: 5, effects: { flag: 'heard_knock' }, label: 'Bahut upar, koi dhaatu par khatkhata raha hai. Teen dheemi dastak.' } },
        next: 'pod_room',
        result: 'Murda hawa mein tumhari awaaz ajeeb lagti hai. Koi jawab nahi. Ek pal ko yakeen hota hai ki door kuch sun raha hai.' }
    ]
  },

  /* ---------------------------------------------------------- POD ROOM (hub) */
  pod_room: {
    location: 'cryo_ward',
    mood: { music: 'dread', ambience: 'hum', particles: 'dust', alarm: true },
    lines: [
      { who: '', text: 'Cryo Ward. Qatar mein saath pods. Unanse sab andhere, barf se dhake, murda. Sirf tumhara khula hai.' },
      { who: '', if: { flag: 'locker_open' }, text: 'Supply locker khula latak raha hai, khaali. Flashlight ki roshni tumhara haath thaam leti hai.' },
      { who: '', if: { noFlag: 'locker_open' }, text: 'Deewar ke saath ek steel supply locker khada hai, chaar-ank ke keypad se band.' },
      { who: 'HALCYON', text: 'Oxygen reserve: {{oxygen}} cycles.', fearText: 'Oxygen reserve: {{oxygen}} cycles. Dheere saans lo. Tum barbaad kar rahe ho.' }
    ],
    choices: [
      { id: 'p_tag', text: 'Pod frame ka tag padho.', once: true, if: { notKnows: 'k_subject_zero' },
        effects: { learn: 'k_subject_zero', stat: { fear: 6 } }, next: 'pod_room',
        result: 'SUBJECT 0 — JAGAO MAT. Kisi ne marker se likha, phir ghis kar mitane ki koshish ki.' },
      { id: 'p_under', text: 'Pod frame ke neeche haath phero.', once: true, time: 1, if: { notKnows: 'k_locker_code' },
        effects: { learn: 'k_locker_code' }, next: 'pod_room',
        result: 'Chaar number, nakhun se dhaatu par khurche hue: 0 · 4 · 1 · 7.' },
      { id: 'p_watch', text: 'Mutthi mein pakdi tooti ghadi dekho.', once: true, if: { notKnows: 'k_watch' },
        effects: { learn: 'k_watch', stat: { fear: 3 } }, next: 'pod_room',
        result: 'Ek pocket watch, sheesha makdi ke jaale jaisa tuta, suiyan 00:00 par jami hui. Lagta hai ye bahut der se tumhare haath mein hai.' },
      { id: 'p_code', text: 'Locker keypad par 0417 daalo.', once: true, time: 0, if: [{ knows: 'k_locker_code' }, { noFlag: 'locker_open' }],
        effects: { flag: 'locker_open', item: { flashlight: 1, toolkit: 1, water_bottle: 1, ration: 1, crowbar: 1 } }, next: 'pod_room',
        result: 'Keypad beep karta hai. Locker khulta hai: flashlight, toolkit, paani ki bottle, ration brick aur crowbar. Jisne bhi rakha, usne kisi ajnabi ka intezaar kiya tha.' },
      { id: 'p_pry', text: 'Locker ko nange haathon se kholo.', tags: ['physical', 'risky'], once: true, time: 2, if: [{ notKnows: 'k_locker_code' }, { noFlag: 'locker_open' }],
        effects: { flag: 'locker_open', stat: { health: -8, fatigue: 8 }, item: { flashlight: 1, toolkit: 1, water_bottle: 1, ration: 1, crowbar: 1 } }, next: 'pod_room',
        result: 'Darwaza mud jaata hai. Hatheliyan cheel jaati hain. Andar: flashlight, toolkit, paani, ration brick aur crowbar. Iske liye hawa bhi gayi, khaal bhi.' },
      { id: 'p_leave', text: 'Corridor ke darwaze se ward chhodo.', time: 1,
        effects: { sfx: 'steps' }, next: 'corridor' }
    ]
  },

  /* ---------------------------------------------------------- CORRIDOR (hub) */
  corridor: {
    location: 'corridor',
    mood: { music: 'dread', ambience: 'hum', particles: 'dust', alarm: true },
    lines: [
      { who: '', text: 'Main corridor ek steel ka gala hai, jhilmilati emergency strips se roshan. Dono taraf darwaze. Teen ab bhi zinda hain: Engine Deck, Comm Room, aur ek maintenance closet.' },
      { who: '', if: { noFlag: 'power_on' }, text: 'Hawa mein sikke jaisa swaad hai. Sar ghoomne laga hai.' },
      { who: '', if: { flag: 'power_on' }, text: 'Ab roshni sthir hai. Vents saans lete hain. Corridor lagbhag rehne layak jagah lagti hai.' },
      { who: '', if: { flag: 'heard_knock' }, text: 'Kahin upar, sabr se, taal mein: khat. Khat. Khat.', fearText: 'KHAT. KHAT. KHAT. Ye deewaron ke andar se aa raha hai.' }
    ],
    choices: [
      { id: 'c_closet_dark', text: 'Maintenance closet khangalo (andhere mein).', once: true, time: 1, if: [{ noFlag: 'closet_done' }, { noItem: 'flashlight' }],
        effects: { flag: 'closet_done', item: { bandage: 1 } }, next: 'corridor',
        result: 'Dikhta kuch nahi. Ungliyon ko bas bandage ka roll milta hai, aur kuch nahi.' },
      { id: 'c_closet_lit', text: 'Flashlight se maintenance closet khangalo.', once: true, time: 1, if: [{ noFlag: 'closet_done' }, { item: 'flashlight' }],
        effects: { flag: 'closet_done', item: { bandage: 1, filter_mask: 1, medkit: 1 } }, next: 'corridor',
        result: 'Roshni ek peechli shelf par padti hai jo kisi ne nahi khangali: filter mask, band medkit aur bandage roll. Roshni bhi ek tarah ka gyaan hai.' },
      { id: 'c_engine', text: 'Engine Deck jao.', time: 1, effects: { sfx: 'steps' }, next: 'engine_deck' },
      { id: 'c_comm', text: 'Comm Room jao.', time: 1, effects: { sfx: 'steps' }, next: 'comm_room' },
      { id: 'c_pod', text: 'Cryo Ward wapas jao.', time: 1, effects: { sfx: 'steps' }, next: 'pod_room' },
      { id: 'c_cross', text: 'Ruko. Socho. Tay karo aage kya karna hai.', if: { flag: 'power_on' }, next: 'crossroads' }
    ]
  },

  /* ---------------------------------------------------------- COMM ROOM */
  comm_room: {
    location: 'comm_room',
    mood: { music: 'tense', ambience: 'static', particles: 'dust' },
    lines: [
      { who: '', text: 'Comm Room switchboards ka qabristan hai. Ek speaker ab bhi fuskar raha hai. Static ke neeche, lagbhag kisi awaaz jaisa kuch.' },
      { who: '', if: { flag: 'comm_fixed' }, text: 'Array gunguna raha hai, tumhare haathon mein dobara zinda. Hari batti kehti hai transmit ke liye taiyaar hai.' },
      { who: '', if: [{ noFlag: 'comm_fixed' }, { noItem: 'toolkit' }], text: 'Array band pada hai. Tools ke bina repair ka matlab hai nange taar aur buri ideas.' }
    ],
    choices: [
      { id: 'm_listen', text: 'Static suno.', once: true, time: 1, if: { notKnows: 'k_mara_freq' },
        effects: { learn: 'k_mara_freq', stat: { fear: -3 } }, next: 'comm_room',
        result: 'Fuskar ke neeche, ek aurat ki awaaz, baar-baar: "…Shelter 7 mein agar koi zinda hai, main 91.4 par hoon. Please. Koi bhi." Lagta hai usne ye das hazaar baar kaha hai.' },
      { id: 'm_repair', text: 'Toolkit se comm array repair karo.', once: true, time: 1, if: [{ item: 'toolkit' }, { noFlag: 'comm_fixed' }],
        effects: { flag: 'comm_fixed', stat: { fatigue: 4 } }, next: 'comm_room',
        result: 'Jala capacitor, tuti solder joint, chalis dhyaan bhare minute jo tum afford nahi kar sakte. Array kaanp kar jaag uthta hai.' },
      { id: 'm_hack', text: 'Nange taaron se array ko jagao.', tags: ['physical', 'risky'], once: true, time: 2, if: [{ noItem: 'toolkit' }, { noFlag: 'comm_fixed' }],
        effects: { flag: 'comm_fixed', stat: { health: -12, fatigue: 6 } }, next: 'comm_room',
        result: 'Panel kaat leta hai. Chingariyan. Baanh dard se jhanjhana jaati hai. Phir bhi array jal uthta hai.' },
      { id: 'm_call', text: '91.4 par transmit karo.', if: [{ flag: 'comm_fixed' }, { knows: 'k_mara_freq' }, { noFlag: 'heard_mara' }],
        effects: { sfx: 'radio' }, next: 'comm_contact' },
      { id: 'm_scan', text: 'Signal ke liye frequencies scan karo.', time: 2, if: [{ flag: 'comm_fixed' }, { notKnows: 'k_mara_freq' }, { noFlag: 'heard_mara' }],
        effects: { learn: 'k_mara_freq', sfx: 'radio' }, next: 'comm_contact' },
      { id: 'm_back', text: 'Corridor wapas jao.', time: 1, effects: { sfx: 'steps' }, next: 'corridor' }
    ]
  },

  /* ---------------------------------------------------------- RADIO CONTACT: MARA */
  comm_contact: {
    location: 'comm_room',
    mood: { music: 'hope', ambience: 'static', particles: 'dust' },
    speaker: 'mara',
    chars: [{ id: 'mara', pos: 'center', expr: 'radio' }],
    onEnter: {
      meet: 'mara', flag: 'heard_mara', achievement: 'met_mara', trust: { mara: 5 },
      quest: { q_signal: { title: 'Signal Ka Jawab Do', desc: 'Mara Voss Kessler Street Clinic mein zinda hai. Wo tumhe service tunnels se bahar nikalne mein guide kar sakti hai.' } }
    },
    lines: [
      { who: 'Mara', text: '…Hello? Phir se bolo. Please. Kuch to bolo.' },
      { who: 'You', text: 'Main Shelter 7 mein hoon. Shayad. Hawa khatam ho rahi hai.' },
      { who: 'Mara', text: 'Shelter 7 das saal se band hai. HALCYON ne har survivor channel ko bataya tha ki zameen ke neeche koi zinda nahi bach sakta.' },
      { who: 'Mara', if: { npcRecognizes: 'mara' }, text: 'Tumhari awaaz. Ye ghabrahat wala lehza pehle suna hai. Bas yaad nahi kahan.', fearText: 'Main tumhe jaanti hoon. Jaanti hoon. Jaanti hoon.' },
      { who: 'Mara', text: 'Mera naam Mara Voss hai. Main Kessler Street ka clinic chalati hoon. Agar tum engine deck ke neeche service tunnels tak pahunch sako, to main tumhe bahar nikaal sakti hoon. Tumhara naam kya hai?' }
    ],
    choices: [
      { id: 'mc_truth', text: 'Sach batao: na naam, na yaaddasht.',
        effects: { trust: { mara: 12 }, flag: 'told_truth', stat: { humanity: 2 } }, next: 'vent_entry',
        result: 'Lambi khamoshi. "Saalon mein kisi ne mujhse itna sach nahi bola. Kessler Street aao."' },
      { id: 'mc_vague', text: 'Kaho ki tum technician ho. Baat dhundhli rakho.',
        effects: { trust: { mara: -4 }, flag: 'lied_to_mara', stat: { humanity: -2 } }, next: 'vent_entry',
        result: '"Theek hai," wo kehti hai, aisi awaaz mein jisne ise baad ke liye yaad rakhne ka faisla kar liya hai.' },
      { id: 'mc_halcyon', text: 'Poocho HALCYON ne kyun kaha ki koi zinda nahi.',
        effects: { trust: { mara: 5 }, learn: 'k_halcyon_lie' }, next: 'vent_entry',
        result: '"Main bhi jaanna chahti hoon," Mara dheere se kehti hai. "Machines galti se jhooth nahi bolti."' }
    ]
  },

  /* ---------------------------------------------------------- ENGINE DECK */
  engine_deck: {
    location: 'engine_deck',
    mood: { music: 'tense', ambience: 'drone', particles: 'sparks' },
    lines: [
      { who: '', text: 'Engine Deck. Moti kaanch ke peechhe reactor sota hai, ek thanda suraj. Deewar par breaker panel: teen bade handle, neela, amber, hara, aur plastic cover ke neeche ek bada laal lever.' },
      { who: '', text: 'Laal lever par likha hai: EMERGENCY OVERRIDE.', fearText: 'Laal lever chamak raha hai. Us par likha hai: KHEECHO. KHEECHO. KHEECHO.' },
      { who: 'HALCYON', text: 'Primary power offline. Manual restart zaroori.' },
      { who: '', if: { knows: 'k_breaker_order' }, text: 'Neela. Amber. Hara. Laal kabhi nahi. Tum ye aise jaante ho jaise apni nabz.' }
    ],
    choices: [
      { id: 'e_study', text: 'Kuch chhune se pehle panel ko dekho.', once: true, time: 1, if: { notKnows: 'k_breaker_order' },
        effects: { flag: 'panel_studied', learn: 'k_breaker_order' },
        next: 'engine_deck',
        result: 'Jame hue gande ke neeche likha hai: RED = REACTOR PURGE. COOLANT DUMP. LIVE DECK PAR JAANLEWA. RESTART: BLUE · AMBER · GREEN.' },
      { id: 'e_red', text: 'Laal EMERGENCY OVERRIDE kheencho.', if: { notKnows: 'k_breaker_order' },
        effects: { die: 'electrocution', shake: 3 } },
      { id: 'e_seq', text: 'Breakers girao: neela, amber, hara.', time: 1, if: [{ noFlag: 'power_on' }, { any: [{ knows: 'k_breaker_order' }, { flag: 'panel_studied' }] }],
        effects: { flag: 'power_on', clock: { oxygen: 8 }, achievement: 'power_on', sfx: 'powerup', quest: { q_air: 'done' } }, next: 'power_restored' },
      { id: 'e_back', text: 'Corridor wapas jao.', time: 1, effects: { sfx: 'steps' }, next: 'corridor' }
    ]
  },

  /* ---------------------------------------------------------- POWER RESTORED — MAJOR CHECKPOINT */
  power_restored: {
    location: 'corridor',
    mood: { music: 'tense', ambience: 'hum', particles: 'dust' },
    onEnter: {
      objective: 'Tay karo kiski suno: HALCYON, radio, ya surface ki dastak.',
      checkpoint: { id: 'cp_power', kind: 'major' }
    },
    lines: [
      { who: '', text: 'Ek ek karke batti gadgadate hue jalti hai. Corridor safed roshni se bhar jaata hai. Deewaron ke andar kahin, bade pankhe phephdon ki tarah ghoomte hain.' },
      { who: 'HALCYON', text: 'Primary power wapas. Oxygen reserve badh gaya. Shukriya, Subject Zero.' },
      { who: '', text: 'Usne shukriya aise kaha jaise darwaza kehta hai ki wo khula hai.' },
      { who: '', text: 'Phir upar se, do meter steel ke paar: khat. Khat. Khat.' }
    ],
    choices: [
      { id: 'pr_on', text: 'Saans lo. Tay karne ke liye ek pal lo.', next: 'crossroads' }
    ]
  },

  /* ---------------------------------------------------------- CROSSROADS: THE TWO MAJOR PATHS */
  crossroads: {
    location: 'corridor',
    mood: { music: 'tense', ambience: 'hum', particles: 'dust' },
    lines: [
      { who: '', text: 'Teen cheezein tumhe bula rahi hain. Corridor ke ant mein roshni ka kaanch ka stambh, tumhari designation gungunata hua. Comm Room ka speaker, ek aurat ki umeed fuskarta hua. Surface hatch par sabr bhari dastak.' },
      { who: '', if: { flag: 'heard_mara' }, text: 'Mara ki awaaz ab bhi kaan mein hai: service tunnels, phir Kessler Street.' },
      { who: '', if: { noFlag: 'comm_fixed' }, text: 'Tumne comm array abhi theek nahi kiya. Wo awaaz chahiye to karna padega.' }
    ],
    choices: [
      { id: 'x_radio', text: 'Service tunnels jao. Radio par bharosa karo. Mara par bharosa karo.', if: { flag: 'heard_mara' },
        effects: { flag: 'path_mara', objective: 'Mara ke bataye raaste se Kessler Street pahuncho.' }, next: 'vent_entry' },
      { id: 'x_comm', text: 'Comm Room wapas jao aur signal ka jawab do.', if: { noFlag: 'heard_mara' }, time: 1,
        effects: { sfx: 'steps' }, next: 'comm_room' },
      { id: 'x_core', text: 'HALCYON ke core tak jao aur poocho wo kya chahta hai.', time: 1,
        effects: { sfx: 'steps' }, next: 'halcyon_core' },
      { id: 'x_hatch', text: 'Surface hatch par kaan lagao.', time: 1, if: { noFlag: 'listener_survived' },
        effects: { sfx: 'steps' }, next: 'hatch' }
    ]
  }
});
