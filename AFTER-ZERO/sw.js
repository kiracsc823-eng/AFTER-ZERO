/* AFTER ZERO service worker: caches the whole game so it runs offline after the first visit. */
const CACHE = 'afterzero-v4';
const FILES = [
 "./",
 "assets/manifest.js",
 "css/animations.css",
 "css/style.css",
 "data/characters.js",
 "data/config.js",
 "data/events_a.js",
 "data/events_b.js",
 "data/locations.js",
 "data/narration.js",
 "data/story_paths.js",
 "data/story_shelter.js",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "index.html",
 "js/art.js",
 "js/audioManager.js",
 "js/checkpointManager.js",
 "js/choiceEngine.js",
 "js/eventGenerator.js",
 "js/gameState.js",
 "js/inventoryManager.js",
 "js/main.js",
 "js/memoryManager.js",
 "js/npcManager.js",
 "js/panels.js",
 "js/portraits.js",
 "js/saveManager.js",
 "js/sceneRenderer.js",
 "js/storyEngine.js",
 "js/timelineManager.js",
 "js/uiManager.js",
 "js/util.js",
 "js/validator.js",
 "js/voiceManager.js",
 "manifest.webmanifest"
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET') return; e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });
