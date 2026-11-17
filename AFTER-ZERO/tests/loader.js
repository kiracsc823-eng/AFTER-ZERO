/* Test helper: loads the game's non-UI scripts into one shared global (like a browser would). */
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function load(opts) {
  opts = opts || {};
  const root = path.join(__dirname, '..');
  const store = {};
  const sandbox = {
    console, Date, Math, JSON, Object, Array, String, Number, Set, Map, Error, parseInt, parseFloat, isNaN,
    localStorage: opts.noStorage ? { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {} }
      : { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    _store: store
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const files = ['js/util.js', 'data/config.js', 'data/characters.js', 'data/locations.js', 'data/story_shelter.js', 'data/story_paths.js', 'data/events_a.js', 'data/events_b.js',
    'js/gameState.js', 'js/choiceEngine.js', 'js/inventoryManager.js', 'js/npcManager.js', 'js/memoryManager.js', 'js/checkpointManager.js', 'js/timelineManager.js', 'js/saveManager.js',
    'js/storyEngine.js', 'js/eventGenerator.js', 'js/validator.js'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
  sandbox.AZ._store = store;
  return sandbox.AZ;
};
