// ─── THE MAFIA — hooks/useTimer.js ────────────────────────────────────────────
// SERVER-SYNCED timer. All players see identical countdown regardless of when
// they received the Firebase update or if they came back from WhatsApp.
//
// How it works:
//   1. Firebase stores timerStartedAt (server timestamp) + timer (duration sec)
//   2. Firebase .info/serverTimeOffset gives local←→server clock difference
//   3. remaining = duration - (serverNow - timerStartedAt) / 1000
//   4. All clients calculate the same remaining time simultaneously
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebaseConfig.js';

// Cache the server offset so we only subscribe once across all hooks
let cachedOffset = 0;
let offsetSubscribed = false;
function ensureOffsetSubscribed() {
  if (offsetSubscribed) return;
  offsetSubscribed = true;
  onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
    cachedOffset = snap.val() ?? 0;
  });
}

export function useTimer(gameState, onExpire) {
  ensureOffsetSubscribed();

  const duration  = gameState?.timerDuration  ?? 0;   // FIX: field is timerDuration, not timer
  const startedAt = gameState?.timerStartedAt ?? null;
  const phase     = gameState?.phase;

  const [remaining, setRemaining] = useState(duration);
  const expiredRef  = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset guard whenever phase changes
  useEffect(() => {
    expiredRef.current = false;
  }, [phase]);

  useEffect(() => {
    if (!startedAt || !duration) {
      setRemaining(duration);
      return;
    }

    const tick = () => {
      const serverNow = Date.now() + cachedOffset;
      const elapsed   = (serverNow - startedAt) / 1000;
      const rem       = Math.max(0, Math.ceil(duration - elapsed));
      setRemaining(rem);

      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick(); // fire immediately so UI doesn't wait 500ms
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startedAt, duration]);

  const isUrgent = remaining <= 10 && duration > 0;
  const pct      = duration > 0 ? (remaining / duration) * 100 : 0;

  return { remaining, pct, isUrgent };
}
