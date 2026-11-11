// ─── THE MAFIA PLATFORM — utils/haptics.js (v10) ─────────────────────────────
// Rich haptic pattern library for AAA mobile feel.
// All calls are fire-and-forget — never throw.
export const HAPTICS = {
  TAP:           [8],
  DOUBLE_TAP:    [8, 40, 8],
  SUCCESS:       [12, 60, 20, 40, 30],
  ERROR:         [60, 30, 60, 30, 60],
  NOTIFICATION:  [20, 50, 20, 50, 20],
  KILL:          [80, 40, 120, 40, 80],
  VOTE:          [15, 30, 15],
  ROLE_REVEAL:   [30, 60, 30, 60, 80],
  NIGHT_START:   [40, 80, 40, 80, 40, 80, 60],
  DAWN:          [20, 100, 20],
  GAME_OVER:     [100, 60, 100, 60, 200],
  TIMER_URGENT:  [30],
  TIMER_END:     [80, 40, 80],
  CHAT:          [6],
};

export function vibrate(pattern = HAPTICS.TAP) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch { /* silently ignore */ }
}

// Convenient single-shot wrappers
export const hapticTap         = () => vibrate(HAPTICS.TAP);
export const hapticSuccess     = () => vibrate(HAPTICS.SUCCESS);
export const hapticError       = () => vibrate(HAPTICS.ERROR);
export const hapticKill        = () => vibrate(HAPTICS.KILL);
export const hapticRoleReveal  = () => vibrate(HAPTICS.ROLE_REVEAL);
export const hapticNightStart  = () => vibrate(HAPTICS.NIGHT_START);
export const hapticGameOver    = () => vibrate(HAPTICS.GAME_OVER);
export const hapticVote        = () => vibrate(HAPTICS.VOTE);
export const hapticTimerEnd    = () => vibrate(HAPTICS.TIMER_END);
