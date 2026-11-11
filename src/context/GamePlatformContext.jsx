// ─── PLATFORM — GamePlatformContext.jsx ──────────────────────────────────────
// Thin bridge to Zustand — single source of truth, zero state drift.
import React, { createContext } from 'react';
import { useGameStore } from '../store/gameStore.js';

const GamePlatformContext = createContext(null);

export function GamePlatformProvider({ children }) {
  return (
    <GamePlatformContext.Provider value={null}>
      {children}
    </GamePlatformContext.Provider>
  );
}

export function useGamePlatform() {
  const gameType    = useGameStore((s) => s.gameType);
  const setGameType = useGameStore((s) => s.setGameType);
  return {
    activeGame:    gameType,
    setActiveGame: setGameType,
    isMafia:       gameType === 'mafia',
    isSpy:         gameType === 'spy',
  };
}

export default GamePlatformContext;
