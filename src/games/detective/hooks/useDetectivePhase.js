// src/games/detective/hooks/useDetectivePhase.js
// Hook for managing game phase logic and role-based UI gating.

import { useMemo } from 'react';
import { useDetectiveStore } from '../store/detectiveStore.js';
import { PHASES } from '../constants/detectiveConstants.js';

export function useDetectivePhase() {
  const currentPhase = useDetectiveStore((s) => s.currentPhase);
  const myRole = useDetectiveStore((s) => s.myRole);
  const deadline = useDetectiveStore((s) => s.phaseDeadline);

  const phaseState = useMemo(() => {
    const now = Date.now();
    const timeRemaining = Math.max(0, deadline ? deadline - now : 0);

    return {
      currentPhase,
      myRole,
      timeRemaining,
      isMyTurn: false, // This will be expanded based on specific phase logic
    };
  }, [currentPhase, myRole, deadline]);

  return phaseState;
}
