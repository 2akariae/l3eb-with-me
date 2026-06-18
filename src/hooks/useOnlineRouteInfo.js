// ─── L3EBWITHME PLATFORM — hooks/useOnlineRouteInfo.js ────────────────────────
// Small selector hook exposing the resolved phase + myPlayerId, so App.jsx's
// shared chrome (GameHUD, FloatingPlayerList, MafiaChat, PhaseTransitionOverlay)
// can read them without duplicating `gameState?.phase ?? PHASES.LOBBY` logic
// inline. Kept in its own file (rather than alongside OnlineRouter.jsx) so
// that file can export a single component for React Fast Refresh.

import { useGameStore } from '../store/gameStore.js';
import { PHASES } from '../constants/game.js';

/**
 * @param {string} tabPlayerId - stable per-tab id from utils/session.js, used
 *   as a fallback before the store's playerId has been set.
 */
export function useOnlineRouteInfo(tabPlayerId) {
  const { roomId, gameState, playerId } = useGameStore();
  return {
    phase:      gameState?.phase ?? PHASES.LOBBY,
    round:      gameState?.round,
    myPlayerId: playerId || tabPlayerId,
    roomId,
  };
}
