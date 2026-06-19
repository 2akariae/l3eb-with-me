// src/games/detective/store/detectiveStore.js
// Isolated Zustand store for "The Detective".
// Uses `immer` for immutable state updates and `subscribeWithSelector` for fine-grained reactivity.

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

const initialState = {
  // Room metadata
  roomId: null,
  hostId: null,
  players: [],           // Array<{ uid, displayName, avatarSeed, isOnline, isReady }>

  // Role assignment (stored locally for security, synced server-side)
  myRole: null,          // 'detective' | 'killer' | 'witness' | 'citizen'
  myUid: null,

  // Game phase management
  currentPhase: 'lobby', // 'lobby' | 'setup' | 'witness' | 'discussion' | 'accusation' | 'killerGuess' | 'resolution'
  phaseDeadline: null,   // Unix timestamp ms — drives all timers

  // Game content
  weaponsList: [],       // Array<{ id, name, svgKey }>
  cluesList: [],         // Array<{ id, name, svgKey }>

  // Killer's secret selections
  selectedWeaponId: null,
  selectedClueId: null,

  // Detective's accusation
  accusedPlayerId: null,
  accusedWeaponId: null,
  accusedClueId: null,

  // Killer's counter-guess
  killerWitnessGuessId: null,

  // Resolution
  resolution: null,      // { winner: 'detective'|'killer', reason: string }

  // Chat
  chatMessages: [],      // Array<{ id, uid, displayName, type: 'text'|'voice', content, timestamp, isDetective }>

  // UI state
  isLoading: false,
  error: null,
};

export const useDetectiveStore = create(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      initRoom: (roomId, myUid) => set((state) => {
        state.roomId = roomId;
        state.myUid = myUid;
      }),
      setPlayers: (players) => set((state) => {
        state.players = players;
      }),
      setMyRole: (role) => set((state) => {
        state.myRole = role;
      }),
      advancePhase: (phase, deadline) => set((state) => {
        state.currentPhase = phase;
        state.phaseDeadline = deadline;
      }),
      setWeaponsAndClues: (weapons, clues) => set((state) => {
        state.weaponsList = weapons;
        state.cluesList = clues;
      }),
      killerSelectWeapon: (weaponId) => set((state) => {
        state.selectedWeaponId = weaponId;
      }),
      killerSelectClue: (clueId) => set((state) => {
        state.selectedClueId = clueId;
      }),
      detectiveAccuse: (playerId, weaponId, clueId) => set((state) => {
        state.accusedPlayerId = playerId;
        state.accusedWeaponId = weaponId;
        state.accusedClueId = clueId;
      }),
      killerGuessWitness: (playerId) => set((state) => {
        state.killerWitnessGuessId = playerId;
      }),
      setResolution: (resolution) => set((state) => {
        state.resolution = resolution;
      }),
      addChatMessage: (message) => set((state) => {
        state.chatMessages.push(message);
      }),
      setError: (error) => set((state) => {
        state.error = error;
      }),
      resetGame: () => set((state) => {
        const { myUid, roomId } = state;
        Object.assign(state, { ...initialState, myUid, roomId });
      }),
    }))
  )
);
