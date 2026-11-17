/* AFTER ZERO — assets/manifest.js
   OPTIONAL art/audio slots. Everything in the game is generated in code, so this list is empty by default
   and the game never requests a file that is not listed here (no 404s, no crashes).

   To use your own files, drop them in the matching assets/ folder and list them:

     AZ.assets.backgrounds.cryo      = 'assets/backgrounds/cryo.png';     // 320x180 (or any 16:9) PNG, key = background family
                                                                          //   cryo corridor engine comm hatch core tunnel ruins clinic wasteland tower
     AZ.assets.portraits.mara        = 'assets/portraits/mara.png';       // square PNG, key = character id
     AZ.assets.audio.music_dread     = 'assets/audio/dread.mp3';          // music_<mood>   calm dread tense hope mystery
     AZ.assets.audio.amb_wind        = 'assets/audio/wind.mp3';           // amb_<name>     hum drone wind static drip crowd
     AZ.assets.audio.sfx_click       = 'assets/audio/click.wav';          // sfx_<name>     click hover type steps alarm death rewind powerup radio use rest learn checkpoint

   If a listed file fails to load, the built-in synthesized version is used instead. */
window.AZ = window.AZ || {};
AZ.assets = { backgrounds: {}, portraits: {}, audio: {} };
