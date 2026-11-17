/* AFTER ZERO — data/events_b.js : procedural templates, part B
   (dangers, dilemmas, combat/escape, mysteries, secrets, exploration, echoes of past deaths).
   See events_a.js for the template format. `roll` outcomes are seeded and never shown beforehand. */
AZ.addEvents([

  /* ---------------------------------------------------- DANGER */
  { id: 'dg_storm', type: 'danger', weight: 2.5, locations: ['ash_road', 'dry_well', 'silo_farm', 'dead_mall'], tags: ['open'],
    meaning: 'Teaches the filter-mask lesson again in a different shape, with survivable failure.',
    mood: { music: 'dread', ambience: 'wind', particles: 'ash' },
    lines: [
      { who: '', text: 'Horizon purane zakhm jaisa rang le leta hai. Raakh ki deewar tumhari taraf badh rahi hai, khandharon se bhi unchi.' },
      { who: '', if: { knows: 'k_ash_storm' }, text: 'Tum jaante ho laparwahi ka anjaam kya hota hai.' }
    ],
    choices: [
      { id: 'mask', text: 'Filter mask pehno aur jhuk jao.', if: { item: 'filter_mask' }, time: 2, effects: { stat: { fatigue: 8, fear: -3 } }, next: '@hub',
        result: 'Toofan train ki tarah guzar jaata hai. Tum filter se saans lete ho, ginti karte hue, jab tak roshni grey aur shaant wapas nahi aati.' },
      { id: 'shelter', text: 'Sabse paas ke malbe mein ghus jao aur cheethdon se seal karo.', tags: ['physical'], time: 2,
        effects: { roll: { key: 'storm', chance: 0.6, mods: [{ if: { item: 'toolkit' }, add: 0.15 }], success: { stat: { health: -4, fatigue: 8 } }, fail: { stat: { health: -22, fatigue: 8, fear: 8 } }, successText: 'Cheethde tik jaate hain. Ghante bhar raakh khaansate ho, par zinda ho.', failText: 'Cheethde phat jaate hain. Seal milne se pehle seene mein raakh bhar jaati hai.' } }, next: '@hub' },
      { id: 'curl', text: 'Jahan ho wahin simat jao, coat se chehra dhak lo.', time: 2,
        effects: { roll: { key: 'storm_curl', chance: 0.45, success: { stat: { health: -6, fatigue: 6 } }, fail: { stat: { health: -30, fatigue: 6, fear: 8 } }, successText: 'Garajna thamne tak tum apni dhadkanein ginte ho.', failText: 'Raakh har darar dhoondh leti hai. Tum utni saans le lete ho jitni sehni mushkil hai.' } }, next: '@hub' },
      { id: 'run', text: 'Khuli sadak pe bhaago, umeed hai patli ho jaye.', tags: ['physical'], time: 1,
        effects: { roll: { key: 'storm_run', chance: 0.3, success: { stat: { fatigue: 12, fear: 6 } }, fail: { stat: { health: -35, fatigue: 14, fear: 10 } }, successText: 'Tum bas dar ke zor pe aage ka kinara peeche chhod dete ho.', failText: 'Toofan tumhe poora nigal leta hai.' } }, next: '@hub' }
    ] },

  { id: 'dg_floor', type: 'danger', weight: 2, locations: ['dead_mall', 'sunken_subway', 'kessler'], tags: ['ruins', 'dark'],
    meaning: 'The flashlight and caution are rewarded. Injuries carry forward and constrain later choices.',
    mood: { music: 'dread', ambience: 'drip', particles: 'dust' },
    lines: [
      { who: '', text: 'Aage ka farsh pakka lagta hai. Hai nahi. Concrete ki daraar par dhool jam gayi hai, aur torch ki roshni (agar hai) dikhati hai woh kitni gehri hai.' }
    ],
    choices: [
      { id: 'light', text: 'Flashlight ghumao aur kinare se nikal jao.', if: { item: 'flashlight' }, effects: { stat: { fear: -2 } }, next: '@hub', time: 1,
        result: 'Roshni bhi ek gyaan hai. Gaddhe se thandi hawa uthti hai, aisi badbu ke saath jiska naam tum lena nahi chahte.' },
      { id: 'probe', text: 'Crowbar se farsh ko tatolo.', if: { item: 'crowbar' }, effects: { stat: { fatigue: 3 } }, next: '@hub', time: 1,
        result: 'Crowbar grip tak andar chala jaata hai. Gaddhe se bachkar nikalte ho to ek seedhi mil jaati hai jo pehle thi hi nahi.' },
      { id: 'back', text: 'Wapas mudo aur doosra raasta dhoondho.', time: 1, effects: { stat: { fatigue: 4, fear: -1 } }, next: '@hub',
        result: 'Aadha ghanta jaata hai, aur ek thandi si surakshit feeling milti hai. Gaddha tumhe jaate dekhta hai.' },
      { id: 'cross', text: 'Jaldi paar karo, isse pehle ki woh soche.', tags: ['physical'], time: 1,
        effects: { roll: { key: 'floor', chance: 0.5, success: { stat: { fatigue: 4 } }, fail: { stat: { health: -25, fatigue: 8, fear: 6 } }, successText: 'Concrete tik jaata hai. Par woh tumhe maaf nahi karta.', failText: 'Farsh tumhare neeche se dhans jaata hai. Andhera. Takkar.' } }, next: '@hub' }
    ] },

  { id: 'dg_raiders', type: 'combat', weight: 2.5, locations: ['ash_road', 'dry_well', 'rust_market', 'overpass'], tags: ['open', 'settlement'],
    meaning: 'Combat-or-escape with several viable approaches tied to inventory, allies and stats; failure can kill allies.',
    boost: [{ if: { stat: { fear: { gte: 50 } } }, mul: 0.6 }],
    mood: { music: 'dread', ambience: 'wind', particles: 'dust' },
    lines: [
      { who: '', text: 'Bajri pe boots ki awaaz. Jali hui bus ke peeche se teen log nikalte hain, chehre pe scarf. Sabse lamba kaantedaar taar lipta pipe uthaye hai.' },
      { who: 'Raider', text: 'Toll do. Scrap ya khoon. Tumhari marzi, ghost.' },
      { who: '', if: { flag: 'has_ally' }, text: '{{ally.first}} tumhare thoda aur paas aa jaata hai. Haath kaanp rahe hain.' }
    ],
    choices: [
      { id: 'pay', text: 'Toll do: 3 scrap.', if: { itemQty: { scrap: { gte: 3 } } }, effects: { take: { scrap: 3 }, stat: { humanity: -1, fear: 3 } }, next: '@hub',
        result: 'Woh nafrat se dheere dheere ginte hain, phir hat jaate hain. "Samajhdar ghost."' },
      { id: 'fight', text: 'Jo hai usi se ladho.', tags: ['physical', 'risky'], if: { any: [{ item: 'crowbar' }, { item: 'knife' }, { item: 'pistol' }] }, time: 1,
        effects: { roll: { key: 'raid', chance: 0.4, mods: [{ if: { item: 'pistol' }, add: 0.2 }, { if: { flag: 'has_ally' }, add: 0.15 }], success: { stat: { health: -12, fatigue: 8, humanity: -4 }, item: { scrap: 4 } }, fail: { stat: { health: -35, fatigue: 8, fear: 10 }, take: { scrap: 2 } }, successText: 'Gandi, chhoti aur shor bhari ladai. Do bhaag jaate hain. Ek nahi.', failText: 'Woh tumse behtar hain. Tumhe naali mein hosh aata hai, jebein khaali.' } }, next: '@hub' },
      { id: 'fight_ally', text: '{{ally.first}} ke saath milkar ladho.', tags: ['physical', 'risky'], if: [{ flag: 'has_ally' }, { any: [{ item: 'crowbar' }, { item: 'knife' }, { item: 'pistol' }] }], time: 1,
        effects: { roll: { key: 'raid_ally', chance: 0.6, success: { stat: { health: -8, fatigue: 8 }, trust: { '@ally': 10 }, item: { scrap: 3 } }, fail: { stat: { health: -25, fatigue: 8 }, npcStatus: { '@ally': 'dead' }, clearFlag: ['has_ally'], flag: 'ally_lost' }, successText: 'Kandhe se kandha milakar tum morcha sambhal lete ho.', failText: '{{ally.first}} tumhare liye uthe pipe ke saamne aa jaata hai. Baad mein sannata hai. Bahut zyada sannata.' } }, next: '@hub' },
      { id: 'surrender', text: 'Apna pack aur sab kuch unhe de do.', effects: { take: { scrap: 99, ration: 1, water_bottle: 1 }, stat: { humanity: -1, fear: 6 } }, next: '@hub',
        result: 'Woh jo chahiye le lete hain, baaki chhod dete hain, tumhe bhi. "Samajhdar ghost," sabse lamba lagbhag pyaar se kehta hai.' },
      { id: 'hide', text: 'Malbe ke peeche chhup jao, unhe guzarne do.', tags: ['physical'], time: 1,
        effects: { roll: { key: 'raid_hide', chance: 0.45, mods: [{ if: { item: 'flashlight' }, add: -0.05 }], success: { stat: { fear: 4, fatigue: 5 } }, fail: { stat: { health: -20, fear: 8 }, take: { scrap: 3 } }, successText: 'Qadmon ki awaaz door hone tak tum saans roke rakhte ho.', failText: 'Pipe ghutne ke peeche lagta hai. Bas rukwane ke liye tum sab de dete ho.' } }, next: '@hub' }
    ] },

  { id: 'dg_listener', type: 'danger', weight: 1.5, locations: ['ash_road', 'sunken_subway', 'dead_mall', 'hollow_church'], tags: ['dark', 'open'],
    meaning: 'Brings back the Listener from the shelter. Payoff for earlier knowledge; punishes impulsive answers.',
    boost: [{ if: { flag: 'listener_answered' }, mul: 3 }, { if: { knows: 'k_listener' }, mul: 1.5 }],
    mood: { music: 'dread', ambience: 'wind', particles: 'ash' },
    lines: [
      { who: '', text: 'Seedhiyon se ek awaaz pukarti hai. Narm, ghayal, jaani-pehchani.' },
      { who: 'Voice', text: '[Please|Meri madad karo|Hello?]… sunai de raha hai? Shayad meri taang toot gayi hai. Mujhe tumhare chalne ki awaaz aa rahi hai.' },
      { who: '', if: { flag: 'listener_answered' }, text: 'Use tumhare qadmon ki chaal pata hai. Jab se tumne jawab diya, woh tumhare peeche hai.' },
      { who: 'Voice', if: { flag: 'has_ally' }, text: '{{ally.first}}, mujhe chhod ke mat jao. {{ally.first}}, please.', fearText: '{{ally.first}}. {{ally.first}}. {{ally.first}}.' }
    ],
    choices: [
      { id: 'silent', text: 'Chupchap aage badho.', if: { ability: 'ab_silence' }, effects: { stat: { fear: -3, humanity: 1 } }, next: '@hub',
        result: 'Tum use kuch nahi dete. Woh gidgidata hai, phusalata hai, phir ruk jaata hai. Peeche kahin koi jo insaan nahi hai, aah bharkar dilchaspi kho deta hai.' },
      { id: 'answer', text: 'Pukar ke poocho woh kaun hai.', if: { notKnows: 'k_listener' }, effects: { stat: { fear: 25, humanity: -4, health: -10 }, flag: 'listener_answered' }, next: '@hub',
        result: 'Woh tumhari hi awaaz mein, shabd dar shabd jawab deta hai. Seedhiyan chup ho jaati hain. Peeche dekhte ho to dhool mein qadmon ke nishaan hain, ek bhi tumhara nahi.' },
      { id: 'back', text: 'Bina kuch bole peeche hato aur jis raste aaye the wahi se lauto.', time: 1, effects: { stat: { fear: 8, fatigue: 6 } }, next: '@hub',
        result: 'Awaaz kuch qadam tumhare peeche aati hai, kisi jaane-pehchane ki tarah gidgidate hue. Tum mudkar nahi dekhte.' },
      { id: 'go', text: 'Neeche jao aur madad karo.', tags: ['risky'], if: { notKnows: 'k_listener' }, effects: { die: 'listener', shake: 3 } },
      { id: 'salt', text: 'Darwaze pe apna namak bikher do.', if: { item: 'salt_pouch' }, effects: { take: 'salt_pouch', stat: { fear: -8 } }, next: '@hub',
        result: 'Purani kahani, purana usool. Awaaz safed lakeer pe ruk jaati hai, jaise sharminda ho. Woh aage nahi aati.' }
    ] },

  /* ---------------------------------------------------- DILEMMAS */
  { id: 'dl_ration', type: 'dilemma', weight: 2, slot: 'survivor', locations: ['ash_road', 'rust_market', 'dry_well', 'silo_farm'],
    meaning: 'A pure moral dilemma with no correct answer. Tests Humanity vs. self-preservation.',
    boost: [{ if: { stat: { hunger: { gte: 40 } } }, mul: 1.5 }],
    mood: { music: 'tense', ambience: 'wind', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '{{sv.name}} gire hue deewar se tika baitha hai, saath mein kareeb aath saal ka ek ladka. Ladka tumhare pack ki ration brick ko aise ghoor raha hai jaise woh suraj ho.' },
      { who: '{{sv.first}}', text: 'Isne teen din se kuch nahi khaya. Main bheekh nahi maangunga. Bas pooch raha hoon.' }
    ],
    choices: [
      { id: 'give', text: 'Ladke ko apni ration brick de do.', if: { item: 'ration' }, effects: { take: 'ration', stat: { humanity: 6, trust: 5, hunger: 4 }, trust: { '@sv': 25 }, memory: 'Ash Road pe tumne ek ladke ko apna aakhri ration de diya. Uska naam kabhi nahi bataya gaya; uska chehra yaad hai.' }, next: '@hub',
        result: 'Ladka muskurata nahi. Bas khaata hai, poora, jaise use khud mein utaar raha ho. {{sv.first}} nazar fer leta hai. Aaj tak ka sabse sachcha shukriya yahi hai.' },
      { id: 'half', text: 'Aadha ration baant do, baaki rakh lo.', if: { item: 'ration' }, effects: { stat: { humanity: 2, hunger: -10 }, trust: { '@sv': 10 } }, next: '@hub', time: 1,
        result: 'Samjhauta, aur swaad bhi waisa hi. Sab thoda khaate hain. Kisi ka pet nahi bharta.' },
      { id: 'refuse', text: 'Bolo ki bachane ko kuch nahi hai.', effects: { stat: { humanity: -6, fear: 3 }, trust: { '@sv': -25 } }, next: '@hub',
        result: 'Ladka tumhare pack ko tab tak dekhta rehta hai jab tak tum door nahi chale jaate. Ghanton tak woh nazar mehsoos hoti hai.' }
    ] },

  { id: 'dl_trap', type: 'dilemma', weight: 1.5, slot: 'survivor', locations: ['dead_mall', 'rust_market', 'sunken_subway', 'kessler'],
    meaning: 'A cunning stranger sets a trap. Players who have died (and carry Echo memories) are better at spotting patterns.',
    boost: [{ if: { deaths: { gte: 2 } }, mul: 1.5 }],
    mood: { music: 'dread', ambience: 'drip', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '{{sv.name}} darwaze pe dikhta hai, kuch zyada hi aasani se muskurata hua. "Building safe hai," {{sv.first}} kehta hai. "Andar bahut kuch hai. Aao dekho."' },
      { who: '', if: { deaths: { gte: 2 } }, text: 'Ajeeb sa ehsaas hota hai ki yeh muskaan pehle dekhi hai. Kahin, jiska naam tum nahi le paoge.' }
    ],
    choices: [
      { id: 'follow', text: 'Unke saath andar jao.', time: 1, effects: { roll: { key: 'trap', chance: 0.35, mods: [{ if: { deaths: { gte: 2 } }, add: 0.2 }], success: { item: { medkit: 1, ration: 1 }, trust: { '@sv': 10 } }, fail: { stat: { health: -28, fear: 8 }, take: { scrap: 3 }, trust: { '@sv': -30 } }, successText: 'Sach mein safe tha. Aisa kam hota hai, aur isliye aur bechain karta hai.', failText: 'Darwaza peeche band ho jaata hai. "Bahut kuch andar" matlab do aadmi aur ek rassi.' } }, next: '@hub' },
      { id: 'refuse', text: 'Mana karo aur doori banaye rakho.', effects: { stat: { fear: 2 }, trust: { '@sv': -4 } }, next: '@hub', result: 'Muskaan ek pal ke liye utar jaati hai. Phir wapas aa jaati hai, jaise mask pehna ho.' },
      { id: 'test', text: 'Unhe pehle andar jaane ko bolo.', if: { stat: { fear: { lte: 60 } } }, effects: { stat: { fear: 4 }, trust: { '@sv': -6 }, memory: 'Chalaak survivors apne hi jaal mein pehle nahi ghuste.' }, next: '@hub',
        result: '"Achha," {{sv.first}} kehta hai aur muskurana band kar deta hai. "Tum utne narm nahi ho jitne dikhte ho." Woh andhere mein gayab ho jaate hain, tum peeche nahi jaate.' }
    ] },

  /* ---------------------------------------------------- COMBAT / ESCAPE */
  { id: 'cb_duel', type: 'combat', weight: 1.5, locations: ['dead_mall', 'overpass', 'ash_road', 'sunken_subway'], tags: ['loot', 'ruins'],
    meaning: 'A contested prize: violence, negotiation or retreat. Kael (if trusted) can show up and change the odds.',
    boost: [{ if: { npcTrust: { kael: { gte: 55 } } }, mul: 2 }],
    mood: { music: 'tense', ambience: 'wind', particles: 'dust' },
    lines: [
      { who: '', text: 'Ek akela scavenger aur tum, ek hi pal mein ek hi band pantry tak pahunchte ho. Dono ruk jaate ho. Dono belt mein hathiyar jaisi cheez ki taraf haath badhate ho.' },
      { who: 'Scavenger', text: 'Aadha-aadha. Baant lete hain. Warna ek yahan se zinda nahi nikalega.' },
      { who: 'Kael', if: { npcTrust: { kael: { gte: 55 } } }, text: 'Neeche rakh, dost. Yeh mere saath hai.' }
    ],
    choices: [
      { id: 'split', text: 'Barabar baantne ko maan jao.', effects: { item: { ration: 1, scrap: 1 }, stat: { trust: 2 } }, next: '@hub', time: 1,
        result: 'Tum dono milkar kholte ho. Ab tak ki sabse ajeeb baatcheet hai. Kaam kar jaati hai.' },
      { id: 'kael', text: 'Behes Kael ko khatam karne do.', if: { npcTrust: { kael: { gte: 55 } } }, effects: { item: { ration: 2, canned_peaches: 1 }, trust: { kael: 5 } }, next: '@hub',
        result: 'Scavenger Kael ki rifle ek baar dekhta hai aur soch leta hai ki use kahin jaana hai. "Kaha tha na," Kael lagbhag muskurakar kehta hai.' },
      { id: 'attack', text: 'Pehle waar karo.', tags: ['physical', 'risky'], if: { any: [{ item: 'crowbar' }, { item: 'knife' }, { item: 'pistol' }] }, time: 1,
        effects: { roll: { key: 'duel', chance: 0.5, mods: [{ if: { item: 'pistol' }, add: 0.2 }], success: { item: { ration: 2, scrap: 2 }, stat: { humanity: -6, health: -8 } }, fail: { stat: { health: -28, humanity: -4 } }, successText: 'Jaldi khatam ho jaata hai. Tum sab le lete ho, laash ki taraf nahi dekhte.', failText: 'Woh tez hai. Tum khoon behate, khaali haath bhaag nikalte ho.' } }, next: '@hub' },
      { id: 'back', text: 'Dheere se peeche hato.', effects: { stat: { fear: 3 } }, next: '@hub', result: 'Tum use le jaane dete ho. Aur bhi pantry hain.' }
    ] },

  /* ---------------------------------------------------- MYSTERY / ECHOES */
  { id: 'my_cairn', type: 'echo', weight: 3, if: { deaths: { gte: 1 } }, locations: ['ash_road', 'dry_well', 'hollow_church', 'dead_mall', 'silo_farm'],
    meaning: 'Makes the Return-by-Death theme tangible: evidence that other Subject Zeros walked here before you. Grants a permanent memory.',
    boost: [{ if: { deaths: { gte: 3 } }, mul: 1.6 }],
    mood: { music: 'mystery', ambience: 'wind', particles: 'embers' },
    lines: [
      { who: '', text: 'Sadak kinare salvage patthron ka dhher. Kisi ne paas ke patthar pe baar baar shabd kuredey hain, aisi likhawat mein jo tumhe lagbhag jaani-pehchani lagti hai:' },
      { who: '', text: '"[BAAYEN TUNNEL|LAAL HANDLE|DARWAZE PAR AWAAZ] KE PAAS MAT JAANA. MAIN GAYA THA. —0"' },
      { who: '', if: { deaths: { gte: 3 } }, text: 'Saari tareekhein ek hi hain. Har cairn ek aise din ko darshata hai jo abhi aaya hi nahi.' }
    ],
    choices: [
      { id: 'read', text: 'Ghutne tek kar har nishaan padho.', once: true, time: 1, effects: { learn: 'k_echoes', stat: { fear: 8, humanity: 1 } }, next: '@hub',
        result: 'Sainkdon hain. Sabse purane ghis kar chikne ho gaye hain. Sabse naye ab bhi tez hain. Tumhe samajh aata hai ki tum ek aise qabristaan mein khade ho jo badhta hi ja raha hai.' },
      { id: 'add', text: 'Apna ek nishaan kured do.', if: { item: 'knife' }, effects: { stat: { humanity: 2, fear: -4 }, memory: 'Ash Road ke ek cairn pe tumne chetawani kuredi: "DARWAZA JHOOTH BOLTA HAI. —0."' }, next: '@hub', time: 1,
        result: 'Tum wahi likhte ho jo chahte the koi tumhare liye likh deta. Patthar thanda hai. Lagta hai waqt mein aage ek khat thama rahe ho.' },
      { id: 'leave', text: 'Nazar fer lo aur chalte raho.', effects: { stat: { fear: 3 } }, next: '@hub' }
    ] },

  { id: 'my_signal', type: 'mystery', weight: 2, locations: ['ash_road', 'radio_graveyard', 'rust_market', 'silo_farm'],
    meaning: 'World-building about HALCYON and the tower; escalates the main mystery without resolving it.',
    mood: { music: 'mystery', ambience: 'static', particles: 'sparks' },
    lines: [
      { who: '', text: 'Tumhara handset khaansta hua chalu hota hai, ya paas ka koi radio. Ek shaant awaaz, aisi jo kabhi kisi cheez se darri nahi:' },
      { who: 'HALCYON', text: 'Phase Two progress: ikatalis pratishat. Subject Zero manya seema ke andar hai. Kripya zinda rehna jaari rakhein.' },
      { who: '', text: 'Woh loop mein dohrata rehta hai, ek thande vaakya mein, har shabd wahi. Awaaz mein garv lagta hai.' }
    ],
    choices: [
      { id: 'trace', text: 'Pata lagao yeh kahan se broadcast ho raha hai.', if: { item: 'toolkit' }, time: 1, effects: { stat: { fatigue: 4 }, memory: 'HALCYON Phase Two naam ki kisi cheez ka progress report broadcast kar raha hai. Signal ki disha seedhi uttar thi.' }, next: '@hub',
        result: 'Disha uttar ki taraf hai. Hamesha uttar. Signal ka source hil nahi raha. Chhup bhi nahi raha.' },
      { id: 'listen', text: 'Poora broadcast suno.', time: 1, effects: { stat: { fear: 6 }, flag: 'heard_phase_two' }, next: '@hub',
        result: 'Aakhir mein awaaz ek vaakya jodti hai jo tum sunna nahi chahte the: "Subject Zero ko yaad dilaya jaata hai ki yeh unki pehli baar nahi hai."' },
      { id: 'smash', text: 'Radio tod do.', tags: ['physical'], effects: { stat: { fear: -4, humanity: -2 } }, next: '@hub', result: 'Khamoshi. Thodi si tasalli. Par woh vaakya ab bhi dimaag mein hai.' }
    ] },

  { id: 'my_watch', type: 'mystery', weight: 1.5, if: { item: 'pocket_watch' }, locations: ['ash_road', 'hollow_church', 'dry_well', 'dead_mall', 'overpass'],
    meaning: 'The pocket watch is the central artifact. This event hints it responds to death and to timelines.',
    boost: [{ if: { deaths: { gte: 2 } }, mul: 1.8 }],
    mood: { music: 'mystery', ambience: 'wind', particles: 'embers' },
    lines: [
      { who: '', text: 'Jeb mein tooti ghadi ek bahut halki tick karti hai. Phir ek aur. Second ki sui kaanpti hai aur ek kadam peeche khisak jaati hai.' },
      { who: '', text: 'Tumhare peeche, bahut dheere se, duniya jaise saans roke hue hai.' }
    ],
    choices: [
      { id: 'hold', text: 'Use kaan se laga lo.', once: true, effects: { stat: { fear: 7 }, learn: 'k_watch', memory: 'Jab kuch jaanleva paas hota hai, pocket watch ulti tick karti hai. Tumne ticks gine: gyarah.' }, next: '@hub',
        result: 'Gyarah ticks. Phir khamoshi. Ek meel door ek murda ped se baaz udta hai, aur aasman ke kinare ek pal ko mudte lagte hain.' },
      { id: 'step', text: 'Peeche hato. Dekho peeche kya hai.', effects: { stat: { fear: 3, fatigue: 2 } }, next: '@hub',
        result: 'Kuch nahi. Bas tumhara apna saaya, aadha second der se pahunchta hua.' }
    ] },

  /* ---------------------------------------------------- SECRETS */
  { id: 'sc_bunker', type: 'secret', weight: 2, locations: ['sunken_subway', 'dead_mall', 'radio_graveyard', 'hollow_church'], tags: ['secret'],
    meaning: 'A hidden-location reward that needs a tool or a clue. Reveals that Shelter 7 was one of several.',
    mood: { music: 'mystery', ambience: 'drip', particles: 'dust' },
    lines: [
      { who: '', text: 'Nakli deewar ke peeche ek steel ka darwaza, sarkari hare rang se pota hua. Safed stencil mein: SHELTER 4 — EMERGENCY ACCESS.' },
      { who: '', text: 'Shelter 4. Tumhe pata hi nahi tha ki Shelter 4 bhi hai. Pata nahi tha aur bhi hain.' }
    ],
    choices: [
      { id: 'pry', text: 'Crowbar se darwaza todo.', if: { item: 'crowbar' }, time: 1, effects: { item: { medkit: 1, battery: 1, scrap: 2 }, stat: { fatigue: 5 }, learn: 'k_diary_zero' }, next: '@hub',
        result: 'Andar: bunk, dhool, aur takiye pe khuli padi ek diary: "Aasman ek second ko safed ho gaya aur sab ek hi sapna yaad karte hue jage." Bed ke neeche medkit ab bhi sealed hai.' },
      { id: 'tools', text: 'Toolkit se taala kholo.', if: { item: 'toolkit' }, time: 1, effects: { item: { medkit: 1, water_bottle: 1 }, learn: 'k_diary_zero' }, next: '@hub',
        result: 'Ek tasalli dene wali click. Saaf, khaali bunker, aur ek diary jo Zero Event ke pehle hafte ke baare mein kuch chupchap aur bhayanak batati hai.' },
      { id: 'leave', text: 'Khol nahi sakte. Dimaag mein note kar lo.', effects: { stat: { fear: 2 } }, next: '@hub', result: 'Kuch darwaze zyada taiyaar mehmaan chahte hain.' }
    ] },

  { id: 'sc_church', type: 'secret', weight: 3, locations: ['hollow_church'], tags: ['sacred', 'secret'],
    meaning: 'A secret location unlocked via Path A knowledge or rumors. Shows the survivors have built communities around the mystery.',
    mood: { music: 'hope', ambience: 'wind', particles: 'embers' },
    lines: [
      { who: '', text: 'Church ki chhat nahi hai, par ghanta poora latka hai. Darjan bhar survivors nave mein gol ghere mein baithe hain, har ek ke haath mein mombatti. Woh ek saath sar uthate hain.' },
      { who: 'Preacher', text: 'Humne tumhare chalne ki awaaz suni. Hum ek aise aadmi ka intezaar kar rahe the jiski ghadi tick nahi karti. Hamare har sapne mein tumhara chehra hai.' }
    ],
    choices: [
      { id: 'join', text: 'Unke saath baitho aur suno.', time: 2, effects: { stat: { fear: -8, humanity: 5, fatigue: -10, trust: 6 }, memory: 'Hollow Church mein survivors ne bataya ki woh sab ek rukki ghadi wale aadmi ka sapna dekhte hain. Das saal se dekh rahe hain.' }, next: '@hub',
        result: '"Hum nahi jaante tumhara sapna kyun aata hai," preacher kehta hai. "Bas itna ki aasman safed hone ke baad tum hi ho jo kabhi hairaan nahi hua."' },
      { id: 'ring', text: 'Ghanta bajao.', effects: { stat: { fear: 4 }, flag: 'bell_rung' }, next: '@hub',
        result: 'Awaaz weerane mein goonj jaati hai. Ek pal ke liye, uttar se, Relay Tower ek gehri dhun mein jawab deta lagta hai.' },
      { id: 'leave', text: 'Chupchap peeche hat jao.', effects: { stat: { fear: 5 } }, next: '@hub', result: 'Tumhare peeche, barah mombattiyan jhilmilati nahi.' }
    ] },

  /* ---------------------------------------------------- EXPLORATION */
  { id: 'exp_overlook', type: 'explore', weight: 2, locations: ['ash_road', 'silo_farm', 'overpass', 'dead_mall', 'kessler'], tags: ['open'],
    meaning: 'Scouting trades fatigue for safety on later trips; physical, so weakness blocks it.',
    mood: { music: 'calm', ambience: 'wind', particles: 'ash' },
    lines: [
      { who: '', text: 'Giri hui gantry crane khandharon ke upar kankaal ke haath ki tarah khadi hai. Upar se meelon tak dikhega.' }
    ],
    choices: [
      { id: 'climb', text: 'Chadho aur raaston ka jaayza lo.', tags: ['physical'], time: 2, effects: { stat: { fatigue: 12, hunger: 2 }, flag: 'scouted', memory: 'Unchi crane se tumne Ash Road ko din ki roshni mein dekha: uttar mein tower, poorab mein dhuan, aur zameen par ek lambi seedhi daraar jo kudrati nahi lagti.' }, next: '@hub',
        result: 'Yahan upar hawa thandi hai. Duniya tumhari soch se badi aur khaali hai, aur zyadatar dhuan ke sthambh dikhte hain. Tum unhe dimaag mein note kar lete ho.' },
      { id: 'binoc', text: 'Zameen se horizon dekho.', time: 1, effects: { stat: { fatigue: 3 } }, next: '@hub',
        result: 'Garmi ki dhundh aur uttar mein tower ki halki si aakriti ke siwa kuch nahi. Jo chahiye tha mil gaya: sannate ka andaza.' }
    ] },

  { id: 'exp_diary', type: 'explore', weight: 2, locations: ['kessler', 'dead_mall', 'hollow_church', 'rust_market'], tags: ['ruins', 'interior'],
    meaning: 'Pure world-building with a small cost: gives lore about the Zero Event and teases HALCYON.',
    mood: { music: 'mystery', ambience: 'drip', particles: 'dust' },
    lines: [
      { who: '', text: 'Teesri manzil ka ek apartment, bilkul saaf-suthra. Do logon ke liye saja hua table. Fridge pe bachche ki drawing: safed aasman aur ghadi thame ek chhota stick figure.' },
      { who: '', text: 'Table pe ek tablet, abhi aadha charged, ek na bheja hua message dikha raha hai jo kisi ke naam nahi.' }
    ],
    choices: [
      { id: 'read', text: 'Na bheja hua message padho.', once: true, effects: { learn: 'k_diary_zero', stat: { fear: 4, humanity: 2 } }, next: '@hub', time: 1,
        result: '"Din 1. Aasman theek ek second ke liye safed hua. Sab ek hi sapna lekar jage aur sabki ghadi ek hi waqt pe ruki thi. Humein lagta hai shelters ko pata tha."' },
      { id: 'pack', text: 'Tablet ki battery aur bachche ki drawing le lo.', effects: { item: { battery: 1 }, stat: { humanity: 1 } }, next: '@hub', result: 'Kisi ko to drawing yaad rakhni chahiye. Tum use mod kar pack mein rakh lete ho.' },
      { id: 'leave', text: 'Jaisa hai waisa chhod do.', effects: { stat: { humanity: 2 } }, next: '@hub', result: 'Kuch kamre mandir hote hain. Tum darwaza dheere se band karte ho.' }
    ] }
]);
