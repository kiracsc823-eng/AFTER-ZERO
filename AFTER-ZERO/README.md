# AFTER ZERO — An Infinite Post-Apocalyptic Survival Adventure

Die. Remember. Return. A pixel-art, choice-driven survival story where death is part of progression.

## Run it
Double-click **`index.html`** (any modern desktop browser: Chrome, Edge, Firefox, Safari).
No server, no install, no internet. Everything (art, music, sound) is generated in code.
Add `?debug` to the URL to log data warnings to the browser console.

**Controls:** click / Space / Enter = continue text · **1–9** = pick a choice · **I J M P S H** = Inventory, Journal, Memories, People, Save/Load, History · **Esc** = menu.

## How the game works (plain language)
* **Three layers of state** keep memories safe:
  * `meta` – PERMANENT: knowledge, memories, abilities, achievements, death log, NPC recognition. Dying never touches it.
  * `tl` (timeline) – temporary: stats, inventory, flags, NPC trust/status, quests, location.
  * `checkpoint` – a frozen copy of `tl`. On death the game saves the death into `meta`, then replaces `tl` with the checkpoint copy and adds 1 to the timeline counter.
* **Checkpoints:** `cp_wake` (automatic start anchor) and `cp_power` (major, after you restore power).
* **Choices** only appear when their conditions pass (items, knowledge, trust, flags, stats, deaths…). Hidden consequences stay hidden.
* **Echo Sense** (unlocked after 3 deaths, toggle in Settings): choices that already killed you flicker red. This is an earned ability, not a default hint.
* **Procedural Ash Road:** after Chapter 01 the game generates events from 27 templates, steered by location, stats, trust, flags, quests and previous deaths. Seeded (same save → same events) with anti-repetition (a template can't repeat within 4 events, is penalised for 8, and the same event *type* is damped).

## Files
```
index.html            page shell (scripts load in this order)
css/style.css         layout, HUD, panels        css/animations.css  keyframes, death/rewind effects
assets/manifest.js    OPTIONAL custom art/audio slots (empty by default)
data/                 ALL content, as plain data
  config.js           stats, items, knowledge, abilities, achievements, death scenarios
  characters.js       Halcyon, Mara Voss, Kael Rook, The Listener + survivor name pools
  locations.js        authored + procedural places (with unlock requirements)
  story_shelter.js    Chapter 01, part 1: the shelter (9 scenes)
  story_paths.js      Chapter 01, part 2: Path A (Mara/trust) and Path B (HALCYON/tower)
  events_a.js         procedural templates: survivors, resources, quests
  events_b.js         procedural templates: dangers, dilemmas, combat, mysteries, secrets
  narration.js        Devanagari reading text for every displayed Hinglish line (voice only; screen text never changes)
js/
  util.js             seeded RNG, helpers, event bus
  gameState.js        meta / timeline structures
  choiceEngine.js     CONDITIONS and EFFECTS mini-languages (add a key = add a feature)
  storyEngine.js      runs scenes, choices, delayed consequences, death hand-off
  timelineManager.js  die() + rewind() (Return by Death)
  checkpointManager.js · memoryManager.js · npcManager.js · inventoryManager.js
  saveManager.js      localStorage, 4 slots, checksums, backups, corruption recovery
  eventGenerator.js   procedural hub/events, anti-repetition, quests, survivors
  validator.js        checks every scene/event/item reference at boot
  art.js · portraits.js · sceneRenderer.js   procedural pixel art + animated canvas
  audioManager.js     WebAudio music / ambience / SFX (with optional file slots)
  voiceManager.js     VOICE NARRATION (speechSynthesis): lines, choices, death/reset lines, controls dock
  uiManager.js · panels.js · main.js
tests/                run-tests.js (node tests/run-tests.js), voice-test.js (node tests/voice-test.js), loader.js
```
Content is stored as `.js` files that call `AZ.defineData(...)` instead of `.json`, because browsers block `fetch()` of local `.json` files when you open a page by double-clicking. The shapes are plain JSON-compatible objects and can be moved to `.json` once you serve the game over HTTP.

## Chapter 01: The Last Shelter
19 authored scenes, 4 characters (HALCYON, Mara Voss, Kael Rook, the Listener), 6+ locations, ~60 choices, **6 death scenarios** (suffocation, red breaker, the voice at the hatch, left-tunnel collapse, threatening Kael, ash storm), 2 major paths that end differently and unlock different secret locations, and a closing mystery (Cycle 312) that flows into the endless Ash Road.

## Adding content
* **New scene:** add to `AZ.addScenes({...})` in a `data/story_*.js` file. Schema: see header of `js/storyEngine.js`.
* **New event:** push a template in `events_*.js` (needs `id, type, meaning, lines, choices`; every choice returns `next:'@hub'`).
* **New effect/condition:** add one function to `EFFECT` / `COND` in `choiceEngine.js`.
* **Own art/sound:** list the file in `assets/manifest.js`. Unlisted or failing files silently fall back to the built-in version.
* Run `node tests/run-tests.js` after changes: it validates all data and plays the game.

## Known limitations
* Art is procedural (chunky 2× busts, 11 background families). It is a solid base but hand-drawn PNGs via `assets/manifest.js` will look better.
* Procedural events are text-and-choice templates; no free-roaming map.
* Audio is synthesised and intentionally simple (generative pads, noise ambience).
* Saves live in browser `localStorage` (per browser/profile, ~5 MB). No cloud saves or export yet.
* Not tuned for phones (desktop 16:9 first; it letterboxes on other sizes).
* Allies exist but have no authored arcs yet; Chapter 02 is procedural only.


## Voice narration (new)
Every scene is read aloud with the phone's / browser's own text-to-speech. No internet, no paid API.
* Order: each dialogue line (narrator, HALCYON, Mara, Kael, strangers all get different pitch/speed/voice) -> **"अब तुम क्या करोगे?"** -> **Option A / B / C** (only choices that are actually available) -> **"Choose your action."** Nothing is ever auto-selected.
* Lines move on by themselves when the voice finishes; tap / Space / Enter skips ahead. Tapping a choice silences the voice at once.
* Death says *"Timeline terminated. Returning to the last known checkpoint."*; the next timeline begins with *"Another chance. Another timeline. But the memories remain."*
* Dock (right edge of the game): VOICE ON/OFF, replay, pause/resume, gear (volume, speed, language Auto / Hindi / English), MUTE. Settings are saved and restored; voice is ON by default. The Settings panel has the same options. The speaker name glows with a note while a voice talks.
* Hindi is read from the Devanagari text in `data/narration.js` (keys = the exact on-screen Hinglish line). Missing keys fall back to the on-screen text read by an Indian-English voice. To add a line: add `"<displayed text>": "<देवनागरी>"`.
* Only one voice at a time; speech stops on every scene change, panel-less death, timeline reset, app minimise / tab hide, and resumes when the app returns.
* If the device has no speech engine the dock shows **VOICE N/A** and the game plays silently with text. It never crashes.
* Optional native bridge: if your APK wrapper injects `window.AZ_NativeTTS = { speak(text, lang, rate, pitch, volume, doneCallback), stop() }`, the game uses it automatically.
* Test without a speaker: `node tests/voice-test.js` (mock speech engine; checks order, replay, pause, persistence, death/reset, no overlap, no-TTS fallback).

## Rebuilding the Android APK
1. Unzip the project; keep the folder structure (index.html at the top, with css/ data/ js/ assets/).
2. In HTML to APK Builder choose the folder / zip with `index.html` as the start page, rebuild, install.
3. On the phone make sure a TTS engine with Hindi is installed: Settings > System > Languages & input > Text-to-speech > Google Speech Services > install **Hindi (India)** voice data (and English India). Without it the voice falls back to English-India reading Roman text or shows VOICE N/A.
4. Open the game and tap once (Android allows speech only after a touch). Use the gear on the dock to adjust volume / speed / language.

## If the APK shows "VOICE N/A" (no sound)
Some APK wrappers use an Android WebView that has **no text-to-speech**. The game then plays silently (by design). Chrome on Android does have it, so run the game in Chrome instead:
1. **Quick test:** copy the unzipped folder to the phone (e.g. Downloads) and open `file:///sdcard/Download/AFTER-ZERO/index.html` in **Chrome**. Tap once, voice starts.
2. **Install like an app (recommended):** upload the folder to any free static host (GitHub Pages, Netlify Drop, Cloudflare Pages). Open the https link in Chrome > menu > **Add to Home screen / Install app**. It then opens fullscreen, landscape, with its own icon, and works **offline** after the first visit (`manifest.webmanifest` + `sw.js`).
3. **No hosting:** install Termux, run `python -m http.server 8080` inside the game folder, open `http://localhost:8080` in Chrome and install from there.
Make sure Hindi (India) voice data is installed (Settings > Languages & input > Text-to-speech > Google Speech Services). Tapping "VOICE N/A" in the game explains the problem on screen.

### Voice backends and the diagnostics screen
The game picks the first speech engine it finds: `window.AZ_NativeTTS` -> a speak/TTS method on a builder bridge (`window.AndroidAPI`, `window.Android`, ...) -> `speechSynthesis` (Chrome, desktop browsers) -> Cordova `window.TTS`. If none exists the indicator reads **VOICE NA** and the game stays text-only. **VOICE ON / OFF / NA** always tells the truth.
Tap **VOICE NA** (or the gear > **DIAG**) to open *Voice Diagnostics*: it lists `speechSynthesis`, voices, WebView version and every method the APK bridge offers. **TEST AWAAZ** plays a test sentence, **COPY** copies the report.
