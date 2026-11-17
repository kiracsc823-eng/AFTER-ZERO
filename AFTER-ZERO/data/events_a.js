/* AFTER ZERO — data/events_a.js : procedural templates, part A (survivors, resources, quests).
   Template fields:
     id, type, meaning (WHY this exists — required), weight, locations[] / tags[], if, boost:[{if,mul}],
     unique (once per timeline), slot:'survivor'|'ally', bindQuest, loot:[items], mood,
     lines:[{who,text,if}], onEnter, choices:[{id,text,if,tags,effects,result,next}]
   Text syntax:  [a|b|c] = seeded random pick   {{sv.first}} {{sv.name}} {{sv.want}} {{sv.trait}} {{loc}} {{itemname}}
   Effect tokens: @sv @svname @item @itemname @ally @allyname @loc  (substituted when the event is built)
   Every choice ends with next:'@hub' (back to the Ash Road). */
AZ.addEvents([

  /* ---------------------------------------------------- SURVIVORS */
  { id: 'sv_thirsty', type: 'survivor', weight: 3, slot: 'survivor', locations: ['dry_well', 'rust_market', 'silo_farm', 'ash_road'],
    meaning: 'Establishes water scarcity and tests basic humanity. Trust earned here recurs later.',
    boost: [{ if: { stat: { humanity: { gte: 60 } } }, mul: 1.2 }],
    mood: { music: 'tense', ambience: 'wind', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '[Ek phati hui awaaz|Ek fusfusahat|Garmi ki dhundh mein ek parchhai] tumhe road par rok leti hai. {{sv.name}}, {{sv.title}}. {{sv.name}} {{sv.trait}}. Hont phate hue, canteen khali.' },
      { who: '{{sv.first}}', text: 'Please. Kuch bhi geela chalega. Main yahan {{sv.want}} ke liye aaya tha, aur road ne baaki sab chheen liya.' }
    ],
    choices: [
      { id: 'give', text: 'Apni water bottle de do.', if: { item: 'water_bottle' }, effects: { take: 'water_bottle', trust: { '@sv': 20 }, stat: { humanity: 3, trust: 3 } }, next: '@hub',
        result: 'Woh ise dua ki tarah peete hain. "Mera naam yaad rakhna," {{sv.first}} kehta hai. "Yahi ek currency hai jisme zang nahi lagta."' },
      { id: 'sell', text: 'Scrap ke badle kuch ghoont bech do.', if: { item: 'water_bottle' }, effects: { take: 'water_bottle', item: { scrap: 3 }, trust: { '@sv': -8 }, stat: { humanity: -3 } }, next: '@hub',
        result: 'Scrap jaldi se haath badalta hai. Dono chup hain. Yeh jurm nahi hai; bas duniya ab aisi ho gayi hai.' },
      { id: 'refuse', text: 'Sir hilao aur chalte raho.', effects: { trust: { '@sv': -10 }, stat: { humanity: -2, fear: 2 } }, next: '@hub',
        result: 'Tum peechhe nahi dekhte. Road yaad rakhti hai kaun ruka aur kaun nahi.' },
      { id: 'rob', text: 'Jo thoda bacha hai, chheen lo.', tags: ['physical', 'risky'], effects: { item: { scrap: 2 }, trust: { '@sv': -30 }, stat: { humanity: -8, fear: 5 } }, next: '@hub',
        result: 'Isme jitni mehnat honi chahiye, utni lagti hi nahi. Yahi baat tumhare saath reh jati hai.' }
    ] },

  { id: 'sv_medic', type: 'survivor', weight: 2, slot: 'survivor', locations: ['rust_market', 'dry_well', 'silo_farm'],
    meaning: 'A trade hub for medical supplies; introduces the scrap economy and a lore thread about earlier Subject Zeros.',
    boost: [{ if: { stat: { health: { lte: 60 } } }, mul: 2.5 }],
    mood: { music: 'calm', ambience: 'crowd', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: 'Do zang lage lamp-posts ke beech bandhi tarp ke neeche, {{sv.name}} bottles, saaf kapda aur ek bahut purana stethoscope saja raha hai. Haath se likha board: PATCHES, NOT PROMISES.' },
      { who: '{{sv.first}}', text: 'Scrap chalega. Imaandaari usse bhi behtar. Tum kya laaye ho?' }
    ],
    choices: [
      { id: 'patch', text: '2 scrap do, ilaaj karwao.', if: [{ itemQty: { scrap: { gte: 2 } } }, { stat: { health: { lte: 85 } } }], effects: { take: { scrap: 2 }, stat: { health: 25, fatigue: -5 }, trust: { '@sv': 5 } }, next: '@hub', time: 1,
        result: '{{sv.first}} chupchap kaam karta hai, tez aur sahi. "Zinda wapas aana. Paperwork bach jayega."' },
      { id: 'kit', text: '3 scrap mein field medkit kharido.', if: { itemQty: { scrap: { gte: 3 } } }, effects: { take: { scrap: 3 }, item: { medkit: 1 }, trust: { '@sv': 5 } }, next: '@hub',
        result: 'Ek sealed kit haath badalta hai. Aisi kangaal duniya mein yeh ghar ki registry jaisa hai.' },
      { id: 'ask', text: 'Ruki ghadi wale aadmi ke baare mein poochho.', once: true, effects: { trust: { '@sv': 3 }, memory: 'Ek road medic ko ek mareez yaad hai jisne kal ka mausam bilkul sahi bataya, phir ek aise zakhm se mara jo abhi hua hi nahi tha.' }, next: '@hub',
        result: '"Saalon pehle," {{sv.first}} dheere se kehta hai. "Ek aadmi, jiski ghadi tik nahi karti thi. Usne bataya kal baarish kaise giregi. Phir ek aise zakhm se khoon beh gaya jo use abhi laga hi nahi tha. Aaj bhi sapne mein dikhta hai."' },
      { id: 'leave', text: 'Sir hilao aur aage badho.', effects: { trust: { '@sv': 1 } }, next: '@hub' }
    ] },

  { id: 'sv_rumor', type: 'survivor', weight: 2, slot: 'survivor', locations: ['rust_market', 'dry_well', 'silo_farm', 'ash_road'],
    meaning: 'Unlocks secret locations through conversation, so exploration is driven by relationships rather than luck.',
    mood: { music: 'mystery', ambience: 'wind', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '{{sv.name}} chori-chhupe haath hilakar tumhe bulata hai, jaise kab se kisi ko kuch batane ka intezaar kar raha ho.' },
      { who: '{{sv.first}}', text: 'Do baatein kasam khake bolunga. Ek: poorab mein antennas ka ek maidan hai, aur uski har dish aasman ke usi murda hisse ki taraf hai. Do: ek church hai jiski ghanti ab bhi bajti hai, jabki bajane wala koi nahi.' }
    ],
    choices: [
      { id: 'graveyard', text: 'Antennas ka maidan kaise milega, poochho.', effects: { flag: 'rumor_graveyard', trust: { '@sv': 4 }, stat: { fear: 3 } }, next: '@hub',
        result: '"Purani cable line ke saath poorab jao." {{sv.first}} kaanp jata hai. "Kaanon par kuch baandh lena. Wahan ka static baatein karta sunai deta hai."' },
      { id: 'church', text: 'Church kaise milega, poochho.', effects: { flag: 'rumor_church', trust: { '@sv': 4 } }, next: '@hub',
        result: '"Market ke uttar mein. Jahan road murda ped ke paas mudti hai. Ghanti sunai de, toh samajh lo paas ho."' },
      { id: 'pay', text: 'Thoda scrap do aur dono raaste poochho.', if: { itemQty: { scrap: { gte: 2 } } }, effects: { take: { scrap: 2 }, flags: { rumor_graveyard: true, rumor_church: true }, trust: { '@sv': 10 } }, next: '@hub',
        result: '{{sv.first}} scrap jeb mein rakhta hai, dhool mein ek dande se dono raaste kheenchta hai, phir joote se mita deta hai.' }
    ] },

  { id: 'sv_recruit', type: 'survivor', weight: 1.5, slot: 'survivor', locations: ['rust_market', 'dry_well', 'silo_farm', 'ash_road'],
    meaning: 'Companions make dangerous events survivable — and make losing them hurt. Allies can die.', if: { noFlag: 'has_ally' },
    mood: { music: 'hope', ambience: 'wind', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '{{sv.name}} bina poochhe tumhare saath chalne lagta hai. {{sv.name}} {{sv.trait}}.' },
      { who: '{{sv.first}}', text: 'Tum aise chalte ho jaise kahin pahunchna ho. Mere paas koi jagah nahi. Saath chalun?' }
    ],
    choices: [
      { id: 'accept', text: 'Saath chalne do.', effects: { flags: { has_ally: true, ally_id: '@sv' }, trust: { '@sv': 15 }, stat: { fear: -6 } }, next: '@hub',
        result: 'Do jodi kadmon ki aahat. Tumhe pata hi nahi tha ek akele kadam kitne sunsaan the.' },
      { id: 'decline', text: 'Bolo tum akele chalte ho.', effects: { trust: { '@sv': -5 } }, next: '@hub',
        result: '"Theek hai," {{sv.first}} kehta hai, aur dheere hote hote tum phir akele reh jaate ho.' }
    ] },

  /* ---------------------------------------------------- RESOURCES */
  { id: 'res_cache', type: 'resource', weight: 3, locations: ['dead_mall', 'rust_market', 'ash_road', 'sunken_subway', 'kessler'], tags: ['loot'],
    loot: ['ration', 'water_bottle', 'bandage', 'canned_peaches', 'battery', 'stim'],
    meaning: 'Resource discovery rewarding preparation: the crowbar turns a gamble into a certainty.',
    mood: { music: 'tense', ambience: 'wind', particles: 'dust' },
    lines: [
      { who: '', text: '[Chhat ki tile|Gire hue awning|Zang lage shutter] ke neeche aadha dabaa, ek steel supply crate. Kisi ne ise dhyaan se seal kiya aur kabhi lauta nahi.' },
      { who: '', text: 'Dhakkan par ghisa hua stencil: {{itemname}}.' }
    ],
    choices: [
      { id: 'pry', text: 'Crowbar se dhakkan khol do.', if: { item: 'crowbar' }, time: 1, effects: { item: { '@item': 1, scrap: 1 }, stat: { fatigue: 3 } }, next: '@hub',
        result: 'Dhakkan kadak awaaz ke saath khulta hai. {{itemname}}, aur saath mein thoda scrap.' },
      { id: 'smash', text: 'Concrete ke tukde se tod do.', tags: ['physical'], time: 1, effects: { item: { '@item': 1 }, stat: { health: -4, fatigue: 6 } }, next: '@hub',
        result: 'Zor se kaam ban gaya. {{itemname}} bach gaya, aur tum lagbhag nahi bache.' },
      { id: 'leave', text: 'Chhod do. Shayad trap ho.', effects: { stat: { fear: -2 } }, next: '@hub',
        result: 'Tum peechhe hat jaate ho. Shayad samajhdari. Shayad darpokpana. Road koi rasid nahi deti.' }
    ] },

  { id: 'res_garden', type: 'resource', weight: 2, locations: ['silo_farm'], tags: ['food'],
    meaning: 'A glimmer of the world rebuilding: the only place where food is grown, not found.',
    boost: [{ if: { stat: { hunger: { gte: 50 } } }, mul: 3 }],
    mood: { music: 'hope', ambience: 'wind', particles: 'embers' },
    lines: [
      { who: '', text: 'Silos ke peechhe, naamumkin sa, bachaye hue sheeshe ke neeche beans aur patta gobhi ki hari patti. Gate par ghanti ki dori latakti hai: RING FOR GARDENER.' },
      { who: '', text: 'Koi jawab nahi deta. Par mitti geeli hai, patte taaze hain, aur haath se likha board kehta hai: TAKE ONE. LEAVE SOMETHING.' }
    ],
    choices: [
      { id: 'eat', text: 'Taaza gobhi khao, 1 scrap chhod do.', if: { item: 'scrap' }, effects: { take: 'scrap', stat: { hunger: -30, thirst: -8, humanity: 4 } }, next: '@hub', time: 1,
        result: 'Swaad zinda hone jaisa hai. Tum scrap dibbe mein chhod dete ho. Kahin na kahin, umeed hai, iska matlab hoga.' },
      { id: 'steal', text: 'Paudhe nochkar bhaag jao.', tags: ['physical'], effects: { stat: { hunger: -45, humanity: -6 }, item: { ration: 1 } }, next: '@hub',
        result: 'Tum khade khade, jaldi, sharminda hokar khate ho aur baaki baandh lete ho. Khali kyariyan tumhe maaf karne mein ek mausam lengi.' },
      { id: 'water', text: 'Drum se paudhon ke liye paani bharo.', effects: { stat: { humanity: 4, fatigue: 5, trust: 3 } }, next: '@hub', time: 1,
        result: 'Chhoti si neki, kuch baalti paani ki. Tum unhe badhte dekhne ke liye yahan nahi rahoge. Phir bhi poore hafte ka sabse accha kaam yahi hai.' }
    ] },

  { id: 'res_pump', type: 'resource', weight: 2, locations: ['dry_well', 'ash_road'], tags: ['water'],
    meaning: 'Teaches that tools convert danger into safety (the toolkit purifies; bare hands cost health).',
    boost: [{ if: { stat: { thirst: { gte: 50 } } }, mul: 3 }],
    mood: { music: 'calm', ambience: 'wind', particles: 'dust' },
    lines: [
      { who: '', text: 'Ek sunsaan chauraahe par akela hand pump, handle zang khakar salute mein jam gaya. Neeche, halki chai ke rang ka bhoomigat paani.' }
    ],
    choices: [
      { id: 'filter', text: 'Toolkit se filter jugaad karo.', if: { item: 'toolkit' }, time: 1, effects: { item: { water_bottle: 1 }, stat: { thirst: -20 } }, next: '@hub',
        result: 'Kankar, kapda, bujhi aag ka koyla. Paani saaf nikalta hai, aur tum baad ke liye ek bottle bhar lete ho.' },
      { id: 'drink', text: 'Seedha pump se piyo.', effects: { stat: { thirst: -35, health: -8 } }, next: '@hub',
        result: 'Zang ka swaad hai. Pet shikayat darj karta hai, par pyaas bujh jati hai.' },
      { id: 'bottle', text: 'Khali bottle bharo, baad mein ubaalna.', time: 1, effects: { item: { dirty_water: 1 } }, next: '@hub',
        result: 'Peene layak nahi. Zinda rehne layak hai, agar sawaal na karo.' }
    ] },

  { id: 'rg_scrap', type: 'resource', weight: 2.5, locations: ['radio_graveyard'], tags: ['loot', 'machine'],
    meaning: 'Gives the secret location a reason to exist beyond lore: salvage with a creepy edge.',
    mood: { music: 'mystery', ambience: 'static', particles: 'sparks' },
    lines: [
      { who: '', text: 'Saikdon antennas aasman ko cheerte hain. Unke beech se guzarti hawa gaati hai, ek gehri dhun jisme koi awaaz chhupi hai.' },
      { who: '', text: 'Gire hue dish ke neeche ek toolbox, jo kisi ne isi wajah se chhoda: salvage. Static dhaatu mein fusfusata hai. Tum lagbhag ek lafz pakad lete ho.' }
    ],
    choices: [
      { id: 'take', text: 'Jitna utha sako, salvage karo.', time: 1, effects: { item: { scrap: 4, battery: 1 }, stat: { fatigue: 5, fear: 4 } }, next: '@hub',
        result: 'Taar, coils aur aadhi charge battery. Static kuch der tumhare peechhe aata hai, phir dilchaspi kho deta hai.' },
      { id: 'listen', text: 'Chupchap khade hokar static suno.', once: true, effects: { stat: { fear: 10 }, learn: 'k_echoes' }, next: '@hub', time: 1,
        result: 'Shor ke neeche, darjan awaazon mein dohrata sandesh, sab tumhari: "DO NOT TRUST THE TOWER. DO NOT STOP WALKING. IT IS NOT YOUR FAULT." Dish ke neeche kharonch bhi yahi kehte hain.' }
    ] },

  /* ---------------------------------------------------- QUESTS (start -> resolve) */
  { id: 'qs_water_run', type: 'quest', weight: 3, slot: 'survivor', locations: ['dry_well', 'rust_market'], if: { quest: { q_water: 'none' } },
    meaning: 'Side quest: a promise with a deadline in terms of events. Keeping it builds trust; breaking it costs humanity.',
    mood: { music: 'tense', ambience: 'wind', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '{{sv.name}} dhahe hue godown ke bahar chakkar kaat raha hai, har parchhai ko shikaar hue jaanwar ki tarah dekhta hua.' },
      { who: '{{sv.first}}', text: 'Mere log Silo Farm par hain. Chaar log. Wahan ka kuan kharab ho gaya. Main paani bhi uthaun aur ladun bhi, mumkin nahi. Unhe saaf paani pahuncha do, kasam se tumhe iska fayda dilaunga.' }
    ],
    choices: [
      { id: 'accept', text: 'Silo Farm paani pahunchane ka wada karo.',
        effects: { quest: { q_water: { title: 'Silo Farm ke liye paani', desc: 'Silo Farm par {{sv.name}} ke logon tak ek saaf water bottle pahunchao.', data: { sv: '@sv', loc: 'silo_farm' } } }, trust: { '@sv': 8 } }, next: '@hub',
        result: '"Silo Farm," {{sv.first}} dohrata hai. "Purani road ke poorab mein. Gardener andar jaane de, toh bolna Wren ne bheja." Ek chhoti si umeed, ek ajnabi se doosre ko.' },
      { id: 'decline', text: 'Bolo tumhare paas time nahi hai.', effects: { trust: { '@sv': -5 } }, next: '@hub',
        result: '"Samajh gaya," woh kehte hain, us awaaz mein jisne kuch nahi samjha.' }
    ] },

  { id: 'qe_water_run', type: 'quest', weight: 1, bindQuest: 'q_water', locations: ['silo_farm'], if: { quest: { q_water: 'active' } }, boost: [{ if: { quest: { q_water: 'active' } }, mul: 12 }],
    meaning: 'Pays off the water quest with a real choice: deliver, or betray the promise.',
    mood: { music: 'hope', ambience: 'wind', particles: 'embers' }, chars: [{ slot: 'survivor', pos: 'center' }],
    lines: [
      { who: '', text: 'Silo Farm par chaar thake chehre tumhe road par aate dekhte hain. Kisi ne kharab kuan se baalti bhar ke gate par rakh di hai, chhuyi bhi nahi.' },
      { who: '{{sv.first}} ke log', text: '{{sv.first}} ne tumhe bheja? Please. Bolo ki tum le aaye ho.' }
    ],
    choices: [
      { id: 'deliver', text: 'Saaf water bottle de do.', if: { item: 'water_bottle' }, effects: { take: 'water_bottle', quest: { q_water: 'done' }, trust: { '@sv': 25 }, stat: { humanity: 5, trust: 6 }, item: { scrap: 4, ration: 1 } }, next: '@hub',
        result: 'Woh ise prasaad ki tarah baantte hain. Anaaj aur scrap ki thaili dete hain, tum mana karte ho. Woh zid karte hain. "Karz hi ek cheez hai jis par hum ab bhi yakeen karte hain."' },
      { id: 'betray', text: 'Paani rakh lo. Bolo ki hai hi nahi.', if: { item: 'water_bottle' }, effects: { quest: { q_water: 'failed' }, trust: { '@sv': -40 }, stat: { humanity: -8, trust: -8 } }, next: '@hub',
        result: 'Unke chehre chupchap murjha jaate hain. Koi behas nahi karta. Yeh aur bura hai.' },
      { id: 'later', text: 'Bolo ki paani lekar lautoge.', effects: { stat: { fear: 2 } }, next: '@hub',
        result: '"Hum yahin honge," woh kehte hain. Kitni der tak, yeh nahi kehte.' }
    ] },

  { id: 'qs_radio_part', type: 'quest', weight: 2, slot: 'survivor', locations: ['rust_market'], if: { quest: { q_part: 'none' } },
    meaning: 'Side quest linking the market to the secret Radio Graveyard; the quest itself reveals the secret location.',
    mood: { music: 'mystery', ambience: 'crowd', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }], onEnter: { meet: '@sv' },
    lines: [
      { who: '', text: '{{sv.name}} ek band radio ko ghayal chidiya ki tarah thame hai. Isme se ek capacitor gayab hai.' },
      { who: '{{sv.first}}', text: 'Yahi ek hai jo ab bhi uttar se signal pakadta hai. Mujhe ek capacitor chahiye. Yahan se poorab mein antennas ka maidan hai. Jo bhi gaya, jaldi mein gaya. Parts ab bhi wahin hain.' }
    ],
    choices: [
      { id: 'accept', text: 'Radio capacitor dhoondhne ke liye haan bolo.',
        effects: { flag: 'rumor_graveyard', quest: { q_part: { title: 'Market ke liye capacitor', desc: 'Radio Graveyard se radio capacitor dhoondho aur Rust Market par {{sv.name}} ko do.', data: { sv: '@sv', loc: 'radio_graveyard' } } }, trust: { '@sv': 6 } }, next: '@hub',
        result: '"Dhyaan rakhna," {{sv.first}} kehta hai. "Antennas ka maidan gaata hai. Tum mat gaana."' },
      { id: 'decline', text: 'Bolo tum salvager nahi ho.', effects: { trust: { '@sv': -3 } }, next: '@hub' }
    ] },

  { id: 'rg_part', type: 'quest', weight: 1, locations: ['radio_graveyard'], if: { quest: { q_part: 'active' } }, boost: [{ if: { quest: { q_part: 'active' } }, mul: 12 }],
    meaning: 'The quest item is hidden in a place that rewards the player for having unlocked the secret location.',
    mood: { music: 'mystery', ambience: 'static', particles: 'sparks' },
    lines: [
      { who: '', text: 'Antenna maidan ke beechon-beech, dhahi hui control hut. Andar capacitors ki shelf, ek jaani-pehchani likhawat mein label ki hui.' },
      { who: '', text: 'Tumhari apni likhawat. Phiki padi. Saalon purani.' }
    ],
    choices: [
      { id: 'take', text: 'Capacitor utha lo.', effects: { item: { radio_part: 1 }, stat: { fear: 6 }, memory: 'Radio Graveyard mein salvage ki ek shelf tumhari apni likhawat mein label thi, tumhare jaagne se saalon pehle.' }, next: '@hub', time: 1,
        result: 'Label par likha hai: FOR WHOEVER COMES NEXT. Aur neeche, chhote akshar mein: SORRY ABOUT THE ROADS.' },
      { id: 'leave', text: 'Shelf jaisi thi waisi hi chhod do.', effects: { stat: { fear: -3 } }, next: '@hub',
        result: 'Kuch virasatein karz hoti hain. Tum jaanna nahi chahte ki kiske karzdar ho.' }
    ] },

  { id: 'qe_radio_part', type: 'quest', weight: 1, bindQuest: 'q_part', locations: ['rust_market'], if: [{ quest: { q_part: 'active' } }, { item: 'radio_part' }], boost: [{ if: { item: 'radio_part' }, mul: 12 }],
    meaning: 'Closes the capacitor quest with a reward and a small piece of world news from the north.',
    mood: { music: 'hope', ambience: 'crowd', particles: 'dust' }, chars: [{ slot: 'survivor', pos: 'center' }],
    lines: [
      { who: '', text: '{{sv.name}} capacitor jhapat leta hai aur kaampte haathon se solder kar deta hai. Radio hiss karta hai, khaansta hai, aur bol padta hai.' },
      { who: 'Radio', text: '…dohra raha hoon: sabhi stations, sabhi survivors. Phase Two shuru ho chuka hai. Tower ke paas mat jao. Mat—' }
    ],
    choices: [
      { id: 'reward', text: 'Unka shukriya aur payment le lo.', effects: { take: 'radio_part', quest: { q_part: 'done' }, item: { stim: 1, scrap: 3 }, trust: { '@sv': 20 }, stat: { trust: 5, humanity: 3 } }, next: '@hub',
        result: '"Phase Two," {{sv.first}} fusfusata hai. "Jo bhi hai, us raat shuru hua jab tum jaage. Mera khayal hai bas ittefaq hai."' },
      { id: 'free', text: 'Payment mat lo. Bas unhe sunne do.', effects: { take: 'radio_part', quest: { q_part: 'done' }, trust: { '@sv': 30 }, stat: { humanity: 5, trust: 8 } }, next: '@hub',
        result: '{{sv.first}} der tak tumhe ghoorta hai, phir dono haathon se tumhara haath thaam leta hai. Kuch kaha nahi jata. Is duniya mein yeh scrap se zyada keemti hai.' }
    ] }
]);
