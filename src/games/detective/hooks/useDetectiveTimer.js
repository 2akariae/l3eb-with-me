// src/games/detective/hooks/useDetectiveTimer.js
// Countdown timer hook for "The Detective".

import { useState, useEffect } from 'react';

export function useDetectiveTimer(deadlineMs) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!deadlineMs) {
      setRemainingMs(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, deadlineMs - now);
      setRemainingMs(timeLeft);
      
      if (timeLeft === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deadlineMs]);

  return remainingMs;
}
