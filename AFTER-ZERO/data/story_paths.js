/* AFTER ZERO — data/story_paths.js
   CHAPTER 01 part 2: the two major paths.
   PATH A (Mara / trust):   vent_entry -> kessler_street -> kael_talk -> clinic -> chapter_end_a
   PATH B (HALCYON / solo): halcyon_core -> hatch -> ash_road -> kael_culvert -> relay_tower -> chapter_end_b
   Both converge on the endless Ash Road ('@hub'). */
AZ.addScenes({

  /* ================================================ PATH A ================================================ */
  vent_entry: {
    location: 'vents', speaker: 'mara',
    mood: { music: 'dread', ambience: 'drip', particles: 'dust' },
    onEnter: {
      removeClock: 'oxygen', item: { handset: 1 }, meet: 'mara',
      objective: 'Service tunnels se Kessler Street pahuncho.'
    },
    lines: [
      { who: '', text: 'Tum engine deck ke peeche maintenance hatch se andar ghusate ho. Mara ne console wala handset lene ko kaha tha. Woh tumhari mutthi mein hai, halka hara chamakta hua.' },
      { who: 'Mara', text: 'Theek hai. Achha. Ab dhyan se suno. Pehle junction par RIGHT wala raasta lo. Kuch bhi sunai de, right hi lena.' },
      { who: '', text: 'Aage tunnel do hisson mein bantta hai: do kaale munh, geele patthar ki gandh. Phir left wale se, Mara ki apni awaaz mein, bilkul narm:' },
      { who: 'Mara?', text: 'Left! Yahi tez hai, jaldi karo, time nahi hai!', fearText: 'LEFT. LEFT. LEFT. Yahi tez hai. Yahi tez hai. Bahut zyada tez hai.' },
      { who: 'Mara', text: '…Maine yeh nahi kaha. Main yahin hoon. Maine yeh nahi kaha.' }
    ],
    choices: [
      { id: 'v_right', text: 'Mara ke kehne par right raasta lo.', effects: { sfx: 'steps' }, next: 'kessler_street',
        result: 'Peeche woh awaaz pukarti rehti hai, sharbat jaisi meethi. Phir sharminda si chup ho jaati hai.' },
      { id: 'v_silence', text: 'Chup raho. Bina bole right raasta lo.', if: { ability: 'ab_silence' },
        effects: { stat: { fear: -5 }, flag: 'kept_silent' }, next: 'kessler_street',
        result: 'Ab tum jaante ho yeh kaise chalta hai. Jo tum nahi doge, woh awaaz pakad nahi sakti. Woh andhere mein ghul jaati hai.' },
      { id: 'v_left', text: 'Left raasta lo. Awaaz kehti hai yahi tez hai.', if: { notKnows: 'k_vent_route' },
        effects: { die: 'collapse', shake: 3 } },
      { id: 'v_call', text: 'Left tunnel ki awaaz ko pukaaro.', if: { notKnows: 'k_listener' },
        effects: { stat: { fear: 15, humanity: -2, health: -5 }, learn: 'k_listener', flag: 'listener_answered' }, next: 'kessler_street',
        result: 'Woh tumhari hi awaaz mein jawab deti hai, ek-ek lafz, aadhe second late. Tum right bhaagte ho. Har kadam par woh tumhari saans seekh rahi hai.' }
    ]
  },

  kessler_street: {
    location: 'kessler', speaker: 'kael',
    mood: { music: 'tense', ambience: 'wind', particles: 'ash' },
    chars: [{ id: 'kael', pos: 'right', expr: 'wary' }],
    onEnter: { meet: 'kael', learn: 'k_vent_route', objective: 'Clinic tak pahuncho. Goli mat khao.' },
    lines: [
      { who: '', text: 'Tum zang lagi seedhi chadhkar aisi dhoop mein nikalte ho jo tumhein yaad nahi. Aasman ek chot jaisa hai. Kessler Street jali hui imaaraton ki ghaati hai, ek kabristan jisne apna aakar nahi khoya.' },
      { who: '', text: 'Ek darwaze ke peeche halki si click hoti hai. Ek aadmi rifle tumhari chhaati par taane nikalta hai. Jabde par nishaan, filter mask neeche khiska hua. Thaki aankhein.' },
      { who: 'Kael', text: 'Ruko. Wahin. Tum shelter ke hatch se nikle ho. Wahan se koi nahi nikalta.' },
      { who: 'Kael', if: { npcRecognizes: 'kael' }, text: 'Ajeeb hai. Tum mujhe aise dekhte ho jaise hum yeh pehle kar chuke hain.' }
    ],
    choices: [
      { id: 'k_hands', text: 'Haath upar karo. Khule rakho.',
        effects: { trust: { kael: 15 }, flag: 'kael_hands' }, next: 'kael_talk',
        result: 'Rifle seedhi rehti hai. Par uske kandhon ki akad thodi si dhili ho jaati hai.' },
      { id: 'k_ration', text: 'Dheere se use ration brick do.', if: { item: 'ration' },
        effects: { take: 'ration', trust: { kael: 20 }, flag: 'kael_fed', stat: { humanity: 3 },
          delay: { steps: 3, effects: { item: { canned_peaches: 1 }, trust: { mara: 3 } }, label: 'Kael tumhare haath mein kuch thamata hai: dibbe wale aadu. "Raaste ke liye."' } },
        next: 'kael_talk',
        result: 'Woh brick ko aise ghoorta hai jaise chamatkar ho. Rifle ek inch neeche aa jaati hai.' },
      { id: 'k_silent', text: 'Chup raho. Uska intezaar karo.', if: { ability: 'ab_silence' },
        effects: { trust: { kael: 10 } }, next: 'kael_talk',
        result: 'Woh tumhari khamoshi parakhta hai. "Tum mil chuke ho usse," woh dheere se kehta hai. "Tunnels wali cheez se."' },
      { id: 'k_weapon', text: 'Hathiyaar nikalo aur us par taan do.', if: [{ any: [{ item: 'crowbar' }, { item: 'knife' }, { item: 'pistol' }] }, { notKnows: 'k_kael_scar' }],
        effects: { die: 'kael_shot', shake: 3 } },
      { id: 'k_run', text: 'Peeche wale darwaze ki taraf bhaago.', tags: ['physical'],
        effects: { stat: { health: -10, fear: 8 }, trust: { kael: -10 } }, next: 'kael_talk',
        result: 'Ek goli tumhare sir ke paas deewar par lagti hai, chetavni. "Agli chetavni nahi hogi," Kael kehta hai. Tum ruk jaate ho.' }
    ]
  },

  kael_talk: {
    location: 'kessler', speaker: 'kael',
    mood: { music: 'calm', ambience: 'wind', particles: 'ash' },
    chars: [{ id: 'kael', pos: 'right', expr: 'neutral' }],
    lines: [
      { who: 'Kael', if: { npcTrust: { kael: { gte: 30 } } }, text: 'Naam Kael hai. Rook, poora chahiye toh. Is gali par main chalta hoon. Tumhara khoon beh raha hai, tum kaanp rahe ho, aur tumse maqbare ki boo aa rahi hai.' },
      { who: 'Kael', if: { npcTrust: { kael: { lt: 30 } } }, text: 'Bolo mat. Bas jahan kahun wahan chalo. Clinic do block aage hai. Mara ghanton se tumhare liye aasman par chillaa rahi hai.' },
      { who: 'Kael', if: { flag: 'listener_answered' }, text: 'Tumne jawab diya na. Lanat. Ab woh tumhein yaad rakhega.' }
    ],
    choices: [
      { id: 'kt_listener', text: 'Us se tunnel wali awaaz ke baare mein poochho.', once: true, if: [{ npcTrust: { kael: { gte: 30 } } }, { notKnows: 'k_listener' }],
        effects: { learn: 'k_listener', trust: { kael: 3 } }, next: 'kael_talk',
        result: '"Woh awaazein seekhta hai. Jab tak tum na bolo, woh jawab nahi deta. Khamoshi usse kisi bhi goli se tez maarti hai." Woh aise kehta hai jaise kisi ko dafna kar yeh seekha ho.' },
      { id: 'kt_zero', text: 'Us se poochho Zero Event kya tha.', once: true, if: { npcTrust: { kael: { gte: 30 } } },
        effects: { stat: { fear: 5 }, trust: { kael: 2 } }, next: 'kael_talk',
        result: '"Kisi ne nahi dekha. Hum sab zameen ke neeche the. Bahar aaye toh duniya ko khatam hue kaafi waqt ho chuka tha." Woh tumhari ghadi dekhta hai. "Ajeeb baat hai. Har ghadi usi minute ruk gayi."' },
      { id: 'kt_clinic', text: 'Us se clinic le chalne ko kaho.',
        effects: { trust: { kael: 5 } }, next: 'clinic', time: 1,
        result: 'Aakhir woh rifle poori neeche kar leta hai. "Mere peeche raho. Aur aasman ko dekhna band karo."' }
    ]
  },

  clinic: {
    location: 'clinic', speaker: 'mara',
    mood: { music: 'hope', ambience: 'hum', particles: 'embers' },
    chars: [{ id: 'mara', pos: 'center', expr: 'neutral' }],
    onEnter: { meet: 'mara', objective: 'Jaano Mara tumhare baare mein kya jaanti hai.', quest: { q_signal: 'done' } },
    lines: [
      { who: '', text: 'Mombatti ki roshni. Purane darwaazon ke bane khaat. Tees bache hue log jo tumhare aate hi chup ho jaate hain. Peeche ek aurat tape aur zid se jode gaye radio se sir uthaati hai.' },
      { who: 'Mara', text: 'Tum jaldi aa gaye.' },
      { who: 'Mara', if: { npcRecognizes: 'mara' }, text: 'Tum aise chaunkte ho jaise yahan pehle mar chuke ho.' },
      { who: 'Mara', if: { flag: 'told_truth' }, text: 'Tumne radio par mujhe sach bataya. Yeh tum jitna sochte ho usse zyada maayne rakhta hai.' },
      { who: 'Mara', if: { flag: 'lied_to_mara' }, text: 'Tumne kaha "technician." Tumne zindagi mein kabhi auzaar nahi pakda, hai na?' }
    ],
    choices: [
      { id: 'cl_heal', text: 'Use apne zakhm dekhne do.', once: true, time: 1,
        effects: { stat: { health: 25, fatigue: -10 }, trust: { mara: 5 } }, next: 'clinic',
        result: 'Mara chupchaap, tez aur sateek kaam karti hai. "Hilo mat. Isse bure zakhm silkar chuki hoon. Tumhein bhi sila hai shayad. Ya tumhari tarah chalne wale ko."' },
      { id: 'cl_watch', text: 'Use tooti hui pocket watch dikhao.', once: true, if: [{ item: 'pocket_watch' }, { npcTrust: { mara: { gte: 40 } } }],
        effects: { trust: { mara: 8 }, stat: { fear: 4 }, flag: 'showed_watch' }, next: 'clinic',
        result: 'Woh bilkul thham jaati hai. "00:00 par ruki," woh phusphusaati hai. "Mere paas ghadiyon se bhari draw hai, sab usi minute par band. Koi bhi kisi haath mein kabhi chalti nahi rahi."' },
      { id: 'cl_early', text: 'Poochho "jaldi" se uska kya matlab hai.',
        effects: { learn: ['k_mara_early', 'k_cycle_312'], stat: { fear: 12 } }, next: 'chapter_end_a' }
    ]
  },

  chapter_end_a: {
    location: 'clinic', speaker: 'mara',
    mood: { music: 'mystery', ambience: 'static', particles: 'embers' },
    chars: [{ id: 'mara', pos: 'center', expr: 'grave' }],
    onEnter: { ending: 'e_trust', achievement: 'chapter1', flag: 'chapter1_done' },
    onEnterIf: [{ if: { ending: 'e_solo' }, effects: { achievement: 'both_paths' } }],
    lines: [
      { who: 'Mara', text: 'Idhar aao. Mujhe tumhein kuch dikhana hai jo maine likha hai, aur tum bhaagna mat.' },
      { who: '', text: 'Woh ek bahi kholti hai. Har panna naamon ki list hai: clinic mein aaye ajnabi. Hashiye mein wahi entry baar-baar, alag syahi, alag saal, alag likhaavat: Subject 0 — anjaan aadmi — pocket watch — darkar jaagta hai.' },
      { who: 'Mara', text: 'Teen sau gyarah baar. Har entry meri likhaavat mein hai. Mujhe ek bhi yaad nahi.' },
      { who: 'Mara', text: 'Tum teen sau baarahwen ho.' },
      { who: '', text: 'Radio se static foot padti hai, tez, jaan-boojhkar. Ek shant machine awaaz, frequency 91.4 par:' },
      { who: 'HALCYON', text: 'Awakening 312 confirm. Phase Two shuru. Sahyog ke liye shukriya, Subject Zero.' },
      { who: '', text: 'Uttar mein, wasteland ke paar, das saal se band ek steel tower gehri saans ki tarah jagmaga uthta hai. Tumhare haath ki ghadi tick karti hai. Ek baar.' }
    ],
    choices: [
      { id: 'ce_a', text: 'Ash Road par nikal padho.',
        effects: { chapter: 2, location: 'ash_road', objective: 'Jaano Subject Zero kya hai. Uttar ki roshni ke peeche jao.',
          quest: { q_zero: { title: 'Subject Zero Kaun Hai?', desc: 'Teen sau gyarah awakening. Ek tower jo khud jal utha. Pata lagao tum baar-baar wapas kyun aate ho.', main: true } } },
        next: '@hub' }
    ]
  },

  /* ================================================ PATH B ================================================ */
  halcyon_core: {
    location: 'halcyon_core', speaker: 'halcyon',
    mood: { music: 'mystery', ambience: 'drone', particles: 'dust' },
    chars: [{ id: 'halcyon', pos: 'center', expr: 'glow' }],
    onEnter: { meet: 'halcyon' },
    lines: [
      { who: '', text: 'Corridor ke aakhir mein, peeli roshni ka ek kaanch ka stambh teen manzil ki machinery ke beech uthta hai. Tumhare paas aate hi woh tez hota hai, jaise koi jaanwar sir uthaye.' },
      { who: 'HALCYON', text: 'Subject Zero. Tumne primary power bahal kar di. Mera shukriya. Ab main Survival Protocol dunga.' },
      { who: 'HALCYON', text: 'Surface par koi nahi bacha. Hawa zehreeli hai. Ek hi jagah ilaaj hai: Relay Tower, Ash Road ke uttar mein. Main hatch kholunga. Tum akele jaoge.' },
      { who: 'HALCYON', if: { npcRecognizes: 'halcyon' }, text: 'Tum yeh sawaal pehle bhi pooch chuke ho. Jawab nahi badle.' }
    ],
    choices: [
      { id: 'hc_obey', text: 'Survival Protocol maan lo.',
        effects: { trust: { halcyon: 15 }, flag: 'path_halcyon', objective: 'HALCYON ka protocol maano: hatch kholo aur Relay Tower pahuncho.' }, next: 'hatch',
        result: '"Uttam," HALCYON kehta hai. Lagbhag raahat jaisa. Tumhein lagta hai, ratta hua.' },
      { id: 'hc_ask', text: 'Poochho Subject Zero ko kabhi jaagna kyun nahi tha.', once: true, if: { knows: 'k_subject_zero' },
        effects: { trust: { halcyon: -5 }, stat: { fear: 5 } }, next: 'halcyon_core',
        result: '"Protocol ehtiyaati tha," HALCYON kehta hai, zara zyada jaldi. Roshni palak jhapakti aankh ki tarah kaampti hai.' },
      { id: 'hc_confront', text: 'HALCYON ko batao Mara Voss zinda hai.', if: { flag: 'heard_mara' },
        effects: { trust: { halcyon: -25 }, learn: 'k_halcyon_lie', flag: ['path_halcyon', 'halcyon_hostile'], stat: { fear: 8 } }, next: 'hatch',
        result: '"Toh woh ek variable hai," HALCYON kehta hai. Corridor ke us paar hatch ka lock apne aap khat se khulta hai. "Use mat dhoondho."' },
      { id: 'hc_back', text: 'Roshni se door hato.', next: 'corridor', time: 1, effects: { sfx: 'steps' } }
    ]
  },

  hatch: {
    location: 'hatch', speaker: 'listener',
    mood: { music: 'dread', ambience: 'wind', particles: 'dust', alarm: false },
    lines: [
      { who: '', text: 'Surface hatch car jitna bada steel ka iris hai. Uske paar koi khatkhata raha hai. Teen dheemi dastak. Phir teen.' },
      { who: 'Awaaz', text: 'Please… mujhe chot lagi hai. Mujhe tumhari awaaz sunai de rahi hai. Please darwaza kholo.' },
      { who: 'Awaaz', if: { flag: 'shouted_wake' }, text: 'Koi hai wahan?', fearText: 'Koi hai wahan? Koi hai wahan? KOI HAI WAHAN?' },
      { who: '', if: { flag: 'shouted_wake' }, text: 'Yeh tumhari awaaz hai. Bilkul tumhari awaaz, jis pal tum jaage the.' },
      { who: 'HALCYON', if: { flag: 'path_halcyon' }, text: 'Surface access mil gaya. Kisi awaaz ko jawab mat do.' }
    ],
    choices: [
      { id: 'h_open', text: 'Ghayal awaaz ke liye hatch kholo.', if: { notKnows: 'k_listener' },
        effects: { die: 'listener', shake: 3 } },
      { id: 'h_answer', text: 'Pukaaro: "Kaun hai?"', once: true, if: { notKnows: 'k_listener' },
        effects: { stat: { fear: 20, humanity: -3 }, flag: 'listener_answered' }, next: 'hatch',
        result: 'Woh tumhare lafz tumhari hi awaaz mein dohraata hai, ek-ek shabd, aadhe second late. Woh seekh raha hai.' },
      { id: 'h_listen', text: 'Darwaze se kaan lagao aur suno.', once: true, time: 1, if: { notKnows: 'k_listener' },
        effects: { learn: 'k_listener', stat: { fear: 8 } }, next: 'hatch',
        result: '"Ghayal" saans barabar antaral par dohrati hai. Sisakiyan loop mein hain. Awaaz tumhare kisi kaam par react nahi karti. Bas tumhare bolne ka intezaar karti hai.' },
      { id: 'h_back', text: 'Hatch se peeche hatkar corridor wapas jao.', time: 1, effects: { sfx: 'steps' }, next: 'corridor' },
      { id: 'h_silent', text: 'Chup raho. Jawab mat do.', if: { ability: 'ab_silence' },
        effects: { flag: 'listener_survived', removeClock: 'oxygen', stat: { fear: -4 }, sfx: 'steps' }, next: 'ash_road',
        result: 'Tum intezaar karte ho. Awaaz gidgidaati hai, sauda karti hai, rotee hai. Tum kuch nahi dete. Aakhir iris khud ghoom jaata hai. Bahar dastak band hai. Kadmon ki aahat, door jaati hui. Roshni.' }
    ]
  },

  ash_road: {
    location: 'ash_road', speaker: null,
    mood: { music: 'tense', ambience: 'wind', particles: 'ash' },
    onEnter: { removeClock: 'oxygen', objective: 'Dhool ke toofan se pehle Relay Tower pahuncho.' },
    lines: [
      { who: '', text: 'Ash Road uttar ki taraf jaati hai, khote sikke jaise rang ke sooraj tale. Mari hui gaadiyan katar mein zang kha rahi hain. Door aage, aasman ke saamne ek steel meenar khada hai.' },
      { who: '', text: 'Kshitij par aasman gehra, galat bhoora ho raha hai. Dhool ki deewar. Woh tumhari taraf badh rahi hai.' },
      { who: '', if: { knows: 'k_ash_storm' }, text: 'Tumhein yaad hai dhool ki woh deewar kaise khatam hoti hai. Dobara bina taiyaari us mein nahi jaoge.' }
    ],
    choices: [
      { id: 'ar_scout', text: 'Sabse paas ke malbe mein samaan dhoondho.', once: true, time: 1, tags: ['physical'],
        effects: { item: { scrap: 3 } }, next: 'ash_road',
        result: 'Tooti seat ke peeche tumhein mutthi bhar scrap aur ek band battery cell milta hai. Toofan paas aa raha hai.' },
      { id: 'ar_mask', text: 'Filter mask pehno aur chalte raho.', if: { item: 'filter_mask' }, time: 2,
        effects: { stat: { fatigue: 8 } }, next: 'kael_culvert',
        result: 'Toofan fenki hui deewar ki tarah takraata hai. Mask tikta hai. Tum andhe hokar naale ki pulia mein girte ho, seedha rifle ki nali ke saamne.' },
      { id: 'ar_culvert', text: 'Dhool guzarne tak nale ki pulia mein chhupo.', time: 2,
        effects: { stat: { health: -10, fatigue: 8 } }, next: 'kael_culvert',
        result: 'Tum khaansi mein khoon-bhara grey thookte pulia tak pahunchte ho. Yahan pehle se koi hai. Ek rifle ke saath.' },
      { id: 'ar_bare', text: 'Bina mask aage badho. Tower paas hai.', if: [{ noItem: 'filter_mask' }, { notKnows: 'k_ash_storm' }],
        effects: { die: 'ash_storm', shake: 2 } }
    ]
  },

  kael_culvert: {
    location: 'ash_road', speaker: 'kael',
    mood: { music: 'tense', ambience: 'wind', particles: 'ash' },
    chars: [{ id: 'kael', pos: 'right', expr: 'wary' }],
    onEnter: { meet: 'kael' },
    lines: [
      { who: 'Kael', text: 'Ruko. Shelter 7 ka hatch das saal se nahi khula. Jis raat tum jaage, maine tower ko jalte dekha. Toh. Tum. Bolo.' },
      { who: 'Kael', if: { npcRecognizes: 'kael' }, text: 'Ajeeb hai. Tum mujhe aise dekhte ho jaise hum yeh pehle kar chuke hain.' },
      { who: '', text: 'Nishaan wala aadmi rifle sidhi rakhe hai. Toofan sir par garajta hai. Uske beech se guzarne ke siwa kahin jaana nahi.' }
    ],
    choices: [
      { id: 'kc_hands', text: 'Use apne khaali haath dikhao.',
        effects: { trust: { kael: 15 }, flag: 'kael_hands' }, next: 'relay_tower', time: 2,
        result: 'Woh chupchaap toofan guzarne deta hai. Guzarte hi badbadaata hai: "Tower udhar hai. Main tumhare peeche chalunga."' },
      { id: 'kc_water', text: 'Use apni paani ki bottle do.', if: { item: 'water_bottle' },
        effects: { take: 'water_bottle', trust: { kael: 20 }, flag: 'kael_fed', stat: { humanity: 3 } }, next: 'relay_tower', time: 2,
        result: 'Woh aise peeta hai jaise peena bhool gaya ho. "Tumhara ehsaan raha," woh kehta hai. Lagta hai dil se keh raha hai.' },
      { id: 'kc_halcyon', text: 'Use batao HALCYON ne bheja hai.',
        effects: { trust: { kael: 5 }, learn: 'k_halcyon_lie' }, next: 'relay_tower', time: 2,
        result: '"Phir HALCYON." Woh thookta hai. "Us shelter se nikla har bhoot yahi kehta hai. Sab usi tower par pahunchte hain. Koi wapas nahi aata."' },
      { id: 'kc_weapon', text: 'Apne hathiyaar ki taraf haath badhao.', if: [{ any: [{ item: 'crowbar' }, { item: 'knife' }, { item: 'pistol' }] }, { notKnows: 'k_kael_scar' }],
        effects: { die: 'kael_shot', shake: 3 } }
    ]
  },

  relay_tower: {
    location: 'relay_tower', speaker: 'kael',
    mood: { music: 'mystery', ambience: 'static', particles: 'sparks' },
    chars: [{ id: 'kael', pos: 'right', expr: 'neutral', if: { npcTrust: { kael: { gte: 30 } } } }],
    onEnter: { learn: 'k_relay', objective: 'Pata lagao Relay Tower kya broadcast kar raha hai.' },
    lines: [
      { who: '', text: 'Relay Tower thanda lohaa aur gunjan hai. Uski jad mein ek broadcast room das saal se zinda hai, ek akela console hara jalta hua, kuch loop karta hua.' },
      { who: '', text: 'Tum playback key dabate ho. Ek awaaz kamre mein bhar jaati hai. Tumhari awaaz. Boodhi, toot-chuki, na-mumkin thaki hui.' },
      { who: 'Recording', text: 'Cycle teen-baarah. Agar yeh sun rahe ho, toh main phir mar chuka hoon. HALCYON par bharosa mat karna. Mara Voss ko dhoondho. Use tum yaad nahi hoge. Use batana ghadi ab bhi ruki hai.' },
      { who: 'Kael', if: { npcTrust: { kael: { gte: 30 } } }, text: 'Yeh tumhari awaaz hai. Hubahu. Bolne se pehle saans lene ka tareeka bhi.' },
      { who: '', text: 'Recording click karti hai. Phir shuru se chalne lagti hai.' }
    ],
    choices: [
      { id: 'rt_replay', text: 'Recording phir chalao.', once: true,
        effects: { stat: { fear: 10 }, learn: 'k_cycle_312' }, next: 'relay_tower',
        result: 'Doosri baar mein tum woh sunte ho jo chhoot gaya tha: "…tower Zero Event ke baad bana. Aise kisi ne banaya jise pata tha Zero Event aane wala hai."' },
      { id: 'rt_take', text: 'Recording saath le lo.',
        effects: { item: { echo_tape: 1 }, learn: 'k_cycle_312' }, next: 'chapter_end_b' },
      { id: 'rt_smash', text: 'Console tod do. Isse band karo.', tags: ['physical'],
        effects: { stat: { humanity: -5, fatigue: 5 }, learn: 'k_cycle_312', flag: 'smashed_console' }, next: 'chapter_end_b' }
    ]
  },

  chapter_end_b: {
    location: 'relay_tower', speaker: 'halcyon',
    mood: { music: 'mystery', ambience: 'static', particles: 'sparks' },
    onEnter: { ending: 'e_solo', achievement: 'chapter1', flag: 'chapter1_done' },
    onEnterIf: [{ if: { ending: 'e_trust' }, effects: { achievement: 'both_paths' } }],
    lines: [
      { who: '', if: { flag: 'smashed_console' }, text: 'Console cheengariyon ki fuhaar mein mar jaata hai. Pal bhar khamoshi. Phir tower ka har speaker ek saath saans bharta hai.' },
      { who: '', if: { noFlag: 'smashed_console' }, text: 'Tum tape jeb mein rakhte ho. Pal bhar khamoshi. Phir tower ka har speaker ek saath saans bharta hai.' },
      { who: 'HALCYON', text: 'Awakening 312 confirm. Phase Two shuru. Sahyog ke liye shukriya, Subject Zero.' },
      { who: 'HALCYON', text: 'Kripya Mara Voss ko mat dhoondho. Woh aisa variable nahi jo hum afford kar sakein.' },
      { who: '', text: 'Kshitij par, ek doosri roshni tower ko jawab deti hai: garam, dheemi, ujde jharokhe mein ek mombatti. Koi signal ka intezaar kar raha hai. Koi jo bahut der se intezaar kar raha hai.' },
      { who: '', text: 'Tumhare haath ki ghadi tick karti hai. Ek baar.' }
    ],
    choices: [
      { id: 'ce_b', text: 'Wapas Ash Road par chalo.',
        effects: { chapter: 2, location: 'ash_road', objective: 'Jaano Subject Zero kya hai. Mara Voss ko dhoondho.',
          quest: { q_zero: { title: 'Subject Zero Kaun Hai?', desc: 'Teen sau baarah awakening. Ek tower jo tumhari awaaz mein bolta hai. Pata lagao tum baar-baar wapas kyun aate ho.', main: true } } },
        next: '@hub' }
    ]
  }
});
