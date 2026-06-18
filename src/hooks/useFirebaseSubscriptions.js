// ─── L3EBWITHME PLATFORM — hooks/useFirebaseSubscriptions.js ─────────────────
// Consolidates the room-state subscription set that used to live as a single
// useEffect inside App.jsx (gameState, players, myRole, roles, history).
//
// Kept separate from useRoomPresence.js (connection/meta/kick watchers) and
// useGamePhaseEffects.js (audio + transition-overlay orchestration) because
// those three concerns have different dependency arrays and different
// failure modes — merging them produced exactly the kind of multi-purpose
// god-effect this refactor is trying to eliminate.

import { useEffect } from 'react';
import {
  subscribeGameState, subscribePlayers, subscribeMyRole,
  subscribeRoles, subscribeHistory,
} from '../games/mafia/hooks/useMafiaEngine.js';
import { useGameStore } from '../store/gameStore.js';

/**
 * Subscribes to all live Firebase game-state listeners for the current room.
 * No-ops (and unsubscribes) when roomId, user, gameType, or appMode aren't
 * all simultaneously satisfied — e.g. while in offline mode, or before a
 * room has been joined.
 *
 * @param {string} appMode - 'online' | 'offline' | null
 * @param {string} tabPlayerId - stable per-tab id from utils/session.js
 */
export function useFirebaseSubscriptions(appMode, tabPlayerId) {
  const {
    roomId, user, playerId, gameType,
    setGameState, setPlayers, setMyRole, setRoles, setHistory,
  } = useGameStore();

  useEffect(() => {
    if (!roomId || !user || appMode !== 'online' || !gameType) return;

    const pid  = playerId || tabPlayerId;
    const subs = [
      subscribeGameState(roomId, setGameState, gameType),
      subscribePlayers(roomId, setPlayers),
      subscribeMyRole(roomId, pid, setMyRole, gameType),
      subscribeRoles(roomId, setRoles, gameType),
      subscribeHistory(roomId, setHistory, gameType),
    ];

    return () => subs.forEach((unsub) => unsub?.());
    // playerId/tabPlayerId intentionally excluded: pid is read once per
    // subscription cycle, and re-subscribing on every playerId tick (which
    // can fire mid-render before Firebase has echoed it back) would cause
    // listener churn. roomId+gameType changes already force a fresh cycle.
  }, [roomId, user?.uid, gameType, appMode]); // eslint-disable-line react-hooks/exhaustive-deps
}
