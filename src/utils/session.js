// ─── THE MAFIA PLATFORM — utils/session.js (v10-fixed) ───────────────────────
// BUG FIXED (P3): getPlayerId() called localStorage directly without a
//   try-catch. In Safari Private Browsing and some enterprise-managed browsers
//   any access to localStorage throws a SecurityError, crashing the entire
//   application at boot. Fixed with a try-catch that falls back to a
//   session-scoped random ID (not persisted) so the app always boots cleanly.

function makeId() {
  return Math.random().toString(36).substring(2, 9);
}

// Fallback ID for browsers that block localStorage (private browsing, etc.)
let _sessionFallbackId = null;

export function getPlayerId() {
  try {
    let pid = localStorage.getItem('mafia_pid');
    if (!pid) {
      pid = makeId();
      localStorage.setItem('mafia_pid', pid);
    }
    return pid;
  } catch {
    // localStorage is unavailable (private browsing, security policy).
    // Use a session-scoped ID that lives for the duration of this tab only.
    if (!_sessionFallbackId) _sessionFallbackId = makeId();
    return _sessionFallbackId;
  }
}
