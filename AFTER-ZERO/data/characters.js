/* AFTER ZERO — data/characters.js : important NPCs. Portrait params drive the pixel-portrait painter. */
AZ.defineData('characters', {
  protagonist: { id: 'protagonist', name: 'You', short: 'You' },

  halcyon: {
    id: 'halcyon', name: 'HALCYON', title: 'Shelter 7 Prabandhan AI',
    personality: 'Shaant, shishtaachaari, sateek. Seedha jhooth nahi bolta. Bas chhupa leta hai.',
    background: 'Wo AI jo Zero Event se pehle se Shelter 7 chala raha hai. Tumhe naam se nahi, designation se bulata hai.',
    trust: 50, status: 'alive',
    secrets: ['Usne Subject 0 ke har baar jaagne ko log kiya hai.', 'Wo tumhe zinda rakhne ki koshish nahi kar raha. Wo tumhe schedule par rakhna chahta hai.'],
    recognizes: { afterDeaths: 1, line: 'Jaagna darj hua. Phir se.' },
    portrait: { kind: 'machine', skin: '#2b4a52', glow: '#4fd0e0', eyes: '#4fd0e0', hair: null, accent: '#4fd0e0' },
    voice: 'synth'
  },

  mara: {
    id: 'mara', name: 'Mara Voss', title: 'Engineer, Kessler Street Clinic',
    personality: 'Thakaan ke upar sookha mazaak. Apne logon ki sakht rakhwali. Jhooth maaf nahi karti, galtiyan kar deti hai.',
    background: 'Signals engineer jisne khandar clinic ko panaah bana diya. Wo 91.4 par broadcast karti rehti hai kyunki kisi ko, kabhi, jawab dena hi hoga.',
    trust: 35, status: 'alive', perceptive: true,
    secrets: ['Wo tumse pehle mil chuki hai — ek aise tareeke se jo samajh nahi aata.', 'Wo har aane wale ajnabi ka ledger rakhti hai. Tumhara naam usme pehle se hai.'],
    recognizes: { afterDeaths: 1, line: 'Tum aise chaunkte ho jaise yahan pehle mar chuke ho.' },
    portrait: { kind: 'human', skin: '#c89878', hair: '#2a1e1a', hairStyle: 'bun', eyes: '#3a5a4a', accent: '#d09a30', scar: false, mask: false, glasses: true },
    voice: 'warm'
  },

  kael: {
    id: 'kael', name: 'Kael Rook', title: 'Kabaadi',
    personality: 'Kam bolta hai, chaukanna, thaka hua. Pehle goli tabhi chalata hai jab koi majboor kare. Waade chupchaap nibhata hai.',
    background: 'Pehle perimeter guard tha, ek aur shelter se nikla jab uske darwaze raakh par khule. Hathiyaar uthane wale par bharosa nahi karta, baaki sabki izzat karta hai.',
    trust: 20, status: 'alive',
    secrets: ['Usne dekha tha jis raat tum jaage, Relay Tower ki battiyan jal uthi thi.', 'Jis aakhri insaan par usne bharosa kiya, use apne haathon se dafnaya.'],
    recognizes: { afterDeaths: 3, line: 'Ajeeb hai. Tum mujhe aise dekhte ho jaise ye sab pehle ho chuka hai.' },
    portrait: { kind: 'human', skin: '#a07858', hair: '#1c1c1c', hairStyle: 'short', eyes: '#6a4a2a', accent: '#6a7a50', scar: true, mask: true, glasses: false },
    voice: 'low'
  },

  listener: {
    id: 'listener', name: 'The Listener', title: 'Anjaan Maujoodgi',
    personality: 'Sabr wala. Garm. Galat.',
    background: 'Wo awaazein seekhta hai. Ye kabhi nahi seekha ki wo kyun zaroori hain.',
    trust: 0, status: 'alive',
    secrets: ['Wo shikaar nahi karta. Intezaar karta hai ki tum khud darwaza kholo.'],
    portrait: { kind: 'shadow', skin: '#0d0d12', glow: '#c04a4a', eyes: '#c04a4a', hair: null, accent: '#c04a4a' },
    voice: 'whisper'
  },

  /* Procedural survivor archetypes (names are generated at runtime from these pools). */
  _pools: {
    firstNames: ['Ines', 'Tobias', 'Wren', 'Dara', 'Oskar', 'Lio', 'Petra', 'Haldor', 'Nell', 'Juno', 'Cass', 'Bram', 'Odile', 'Reza', 'Mika', 'Sol', 'Ada', 'Teo'],
    epithets: ['Kuein-Rakhwala', 'Do-Ungli', 'Chup Wala', 'Overpass Wala', 'Mistri', 'Ginti Wala', 'Raakh-Haath', 'Medic', 'Bhagoda', 'Pracharak'],
    traits: [
      { id: 'desperate', text: 'bahut majboor hai aur ise chhupane mein naakaam hai', mood: 'afraid' },
      { id: 'kind', text: 'aisi meherbaan hai jise raaste ne abhi tak saza nahi di', mood: 'warm' },
      { id: 'cunning', text: 'har lafz bolne se pehle tol raha hai', mood: 'sly' },
      { id: 'broken', text: 'ne kisi accha hone ki umeed chhod di hai', mood: 'flat' },
      { id: 'devout', text: 'maanta hai ki Zero Event ka koi maqsad tha', mood: 'calm' }
    ],
    wants: ['paani', 'dawai', 'Kessler Street ka surakshit raasta', 'gum hui behen ki khabar', 'radio ka chalta part', 'koi jo unki kahani ka gawah bane']
  }
});
