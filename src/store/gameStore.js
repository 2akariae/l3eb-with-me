// ─── THE MAFIA PLATFORM — store/gameStore.js (v9) ────────────────────────────
// FIX #1 (React #310/#318): All localStorage reads moved OUT of the store
//   initializer body — they are now inside a lazy initializer function so they
//   only run once, safely, after the JS module is loaded.  Direct top-level
//   localStorage access in Zustand create() caused hydration mismatches on
//   hard-refresh in strict-mode React because the store was being read before
//   the DOM was ready.
// FIX #2: resetSession() also purges appMode persistence key so "Play Again"
//   in an Offline Spy session can never bleed gameType into online Mafia flow.
// FIX #3: profile (displayName, avatar, photo) persisted to localStorage at
//   boot so AuthScreen & LandingScreen can pre-fill from a single source.

import { create } from 'zustand';

function safeRead(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function safeWrite(key, val) {
  try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch {}
}

export const useGameStore = create((set, get) => ({
  // ── Auth ───────────────────────────────────────────────────────────────────
  user:    null,
  setUser: (user) => set({ user }),

  // ── Profile (persisted) ────────────────────────────────────────────────────
  // Stored separately from Firebase user so guest-name / avatar survive page reloads
  profile: (() => {
    try {
      const raw = localStorage.getItem('mafia_profile');
      return raw ? JSON.parse(raw) : { name: '', avatar: '', photo: '' };
    } catch { return { name: '', avatar: '', photo: '' }; }
  })(),
  setProfile: (updates) => {
    const next = { ...get().profile, ...updates };
    safeWrite('mafia_profile', JSON.stringify(next));
    set({ profile: next });
  },

  // ── Room ───────────────────────────────────────────────────────────────────
  roomId:   null,
  isHost:   false,
  playerId: null,
  myRole:   null,

  // FIX: lazy read — not evaluated at module parse time
  gameType: safeRead('game_type'),

  setRoom: (roomId, isHost, playerId, gameType = null) => {
    // FIX D: persist immediately — not in a useEffect — so a fast refresh
    // never loses the room between state-write and effect-flush.
    if (gameType) safeWrite('game_type', gameType);
    if (roomId && playerId) {
      safeWrite('mafia_room', JSON.stringify({ roomId, isHost: isHost ?? false, playerId }));
    }
    set({ roomId, isHost, playerId, gameType: gameType || get().gameType });
  },
  setPlayerId: (pid)  => set({ playerId: pid }),
  setMyRole:   (role) => set({ myRole: role }),
  setGameType: (type) => {
    safeWrite('game_type', type);
    set({ gameType: type });
  },

  // ── clearRoom: leave room, keep user session & gameType ───────────────────
  clearRoom: () => {
    safeWrite('mafia_room', null);
    set({
      roomId: null, isHost: false, playerId: null, myRole: null,
      gameState: null, players: {}, roles: {}, votes: {}, skipVotes: {},
      chatOpen: false, speakingUids: {}, historyOpen: false, history: [],
      joinRequests: {},
    });
  },

  // ── resetSession: atomic full wipe — safe to call from any context ────────
  // Clears: gameType, room, all game state, all UI state, appMode persistence.
  // Does NOT clear: user auth, language, profile.
  resetSession: () => {
    safeWrite('mafia_room',   null);
    safeWrite('game_type',    null);
    safeWrite('mafia_appMode', null);   // FIX #2: purge appMode so offline spy can't re-route
    set({
      roomId: null, isHost: false, playerId: null, myRole: null,
      gameState: null, players: {}, roles: {}, votes: {}, skipVotes: {},
      chatOpen: false, speakingUids: {}, historyOpen: false, history: [],
      joinRequests: {}, gameType: null,
    });
  },

  // ── Live game state ────────────────────────────────────────────────────────
  gameState:    null,
  players:      {},
  roles:        {},
  votes:        {},
  skipVotes:    {},
  history:      [],
  joinRequests: {},

  setGameState:    (gs) => set({ gameState: gs }),
  setPlayers:      (p)  => set({ players: p }),
  setRoles:        (r)  => set({ roles: r }),
  setVotes:        (v)  => set({ votes: v }),
  setSkipVotes:    (sv) => set({ skipVotes: sv }),
  setHistory:      (h)  => set({ history: h }),
  setJoinRequests: (jr) => set({ joinRequests: jr }),

  // ── Settings ──────────────────────────────────────────────────────────────
  language: safeRead('mafia_lang', 'en'),
  setLanguage: (lang) => {
    safeWrite('mafia_lang', lang);
    set({ language: lang });
  },

  // ── UI State ──────────────────────────────────────────────────────────────
  chatOpen:      false,
  historyOpen:   false,
  settingsOpen:  false,
  toggleChat:    () => set((s) => ({ chatOpen:    !s.chatOpen })),
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  toggleSettings:() => set((s) => ({ settingsOpen:!s.settingsOpen })),
  closeSettings: () => set({ settingsOpen: false }),

  // ── Speaking Indicator ────────────────────────────────────────────────────
  speakingUids: {},
  setSpeaking: (uid, isSpeaking) => {
    set((s) => {
      if (isSpeaking === !!s.speakingUids[uid]) return s;
      if (isSpeaking) return { speakingUids: { ...s.speakingUids, [uid]: true } };
      const next = { ...s.speakingUids };
      delete next[uid];
      return { speakingUids: next };
    });
  },

  // ── Derived ────────────────────────────────────────────────────────────────
  getAlivePlayers: () => {
    const { players } = get();
    return Object.entries(players)
      .filter(([, p]) => p.isAlive)
      .map(([uid, p]) => ({ uid, ...p }));
  },
}));
