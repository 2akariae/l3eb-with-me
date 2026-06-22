// ─── L3EBWITHME PLATFORM — registry/gameRegistry.js ───────────────────────────
// Single source of truth for every game on the platform.
//
// WHY THIS EXISTS:
//   Before this module, GameSelector.jsx hardcoded a `games` array with two
//   entries (mafia, spy). Adding a third game meant touching GameSelector.jsx
//   directly and hoping nothing else assumed exactly two games existed.
//
//   With this registry, GameSelector.jsx (or any future component) reads
//   from getAllGames() — a single call site. Adding game #3 means:
//     1. registerGame({ id: 'werewolf', ... }) below (or in the new game's
//        own module, imported once from here)
//     2. Create src/games/werewolf/ following the same folder shape as
//        src/games/mafia/ or src/games/spy/
//     3. Add an icon + accent style mapping where the UI needs one
//   Nothing else in the codebase changes. No routing files, no App.jsx edits.
//
// This module holds NO game logic, NO Firebase calls, NO React. It is pure
// metadata — keeping it dependency-free means it can be imported from
// anywhere (UI screens, server-side validation, future admin tooling)
// without dragging in React or Firebase.

const registry = new Map();

/**
 * @typedef {Object} GameDefinition
 * @property {string} id            - Unique game identifier (e.g. 'mafia', 'spy'). Used as the Firebase path segment.
 * @property {string} label         - Display name (English)
 * @property {string} labelAr       - Display name (Arabic)
 * @property {string} description   - Short description (English)
 * @property {string} descriptionAr - Short description (Arabic)
 * @property {number} minPlayers    - Minimum players required to start
 */

/**
 * Register a new game with the platform. Call once per game, typically at
 * module load time. Re-registering the same id is a no-op (logs a warning)
 * rather than throwing, so hot-reload in dev doesn't crash the app.
 * @param {GameDefinition} definition
 */
export function registerGame(definition) {
  if (!definition?.id) {
    console.error('[GameRegistry] registerGame() called without an id — ignored.');
    return;
  }
  if (registry.has(definition.id)) {
    return; // already registered — safe no-op for HMR / duplicate imports
  }
  registry.set(definition.id, definition);
}

/**
 * @param {string} id
 * @returns {GameDefinition|null}
 */
export function getGame(id) {
  return registry.get(id) ?? null;
}

/**
 * @returns {GameDefinition[]} all registered games, in registration order
 */
export function getAllGames() {
  return Array.from(registry.values());
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isValidGameId(id) {
  return registry.has(id);
}

// ── Built-in game registrations ────────────────────────────────────────────
// These two calls replace what used to be a hardcoded array inside
// GameSelector.jsx. Adding game #3 means adding one more registerGame() call
// — either here, or (preferred for true plug-and-play scaling) inside the
// new game's own entry file, imported once below.

registerGame({
  id:            'mafia',
  label:         'The Mafia',
  labelAr:       'المافيا',
  description:   'A game of deception and mystery',
  descriptionAr: 'لعبة الخداع والغموض',
  minPlayers:    4,
});

registerGame({
  id:            'spy',
  label:         'The Spy',
  labelAr:       'الجاسوس',
  description:   'Find the imposter among you',
  descriptionAr: 'ابحث عن الجاسوس بينكم',
  minPlayers:    3,
});
