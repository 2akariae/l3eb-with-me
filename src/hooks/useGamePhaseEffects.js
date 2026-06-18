// ─── L3EBWITHME PLATFORM — hooks/useGamePhaseEffects.js ───────────────────────
// Watches the current game phase and drives two side effects that only make
// sense bundled together (both fire on the exact same phase transitions):
//   1. Ambient audio (mafia night drone, spy tension loop, stop on discussion/
//      voting/game-over/lobby).
//   2. The cinematic full-screen PhaseTransitionOverlay trigger for Mafia.
//
// Returns { showTransition, setShowTransition } so the calling component can
// render <PhaseTransitionOverlay /> conditionally without owning the timing
// logic itself.

import { useEffect, useRef, useState } from 'react';
import { PHASES } from '../constants/game.js';
import { vibrate, HAPTICS } from '../utils/haptics.js';
import { startMafiaAmbient, startSpyAmbient, stopAmbient, resumeCtx } from '../utils/sound.js';

const MAFIA_TRANSITION_PHASES = new Set([
  PHASES.NIGHT, PHASES.DISCUSSION, PHASES.VOTING, PHASES.EXECUTION, PHASES.GAME_OVER,
]);

/**
 * @param {string} phase - current game phase from gameState.phase
 * @param {string} gameType - 'mafia' | 'spy' | null
 */
export function useGamePhaseEffects(phase, gameType) {
  const [showTransition, setShowTransition] = useState(false);
  const prevPhaseRef = useRef(null);

  useEffect(() => {
    resumeCtx();
    if (
      gameType === 'mafia' &&
      prevPhaseRef.current &&
      prevPhaseRef.current !== phase &&
      MAFIA_TRANSITION_PHASES.has(phase)
    ) {
      setShowTransition(true);
      vibrate(HAPTICS.NOTIFICATION);
      if (phase === PHASES.NIGHT) startMafiaAmbient();
      else if (phase === PHASES.DISCUSSION || phase === PHASES.VOTING) stopAmbient();
    }
    if (gameType === 'spy' && phase === PHASES.DISCUSSION) startSpyAmbient();
    if (phase === PHASES.GAME_OVER || phase === PHASES.LOBBY) stopAmbient();
    prevPhaseRef.current = phase;
  }, [phase, gameType]);

  return { showTransition, setShowTransition };
}
