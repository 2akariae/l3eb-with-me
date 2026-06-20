// src/games/detective/utils/detectiveFirebase.js
// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX — PATH MISMATCH (Root Cause of players = 0):
//
//   createRoom() (services/gameEngine.js) writes players to:
//     rooms/{roomId}/players/{playerId}          ← ACTUAL DATA LOCATION
//
//   syncRoomPlayers() was reading from:
//     games/detective/{roomId}/players           ← EMPTY — nothing writes here
//
//   This is why DetectiveLobby always showed 0 players even after the
//   useDetectiveRoom hook was correctly wired in the previous fix.
//
// FIX APPLIED:
//   syncRoomPlayers  → reads from  rooms/{roomId}/players
//   syncPhase        → reads from  rooms/{roomId}/detective/gameState
//                      (mirrors how gameEngine.js builds paths via getGamePath)
//   advanceGamePhase → writes to   rooms/{roomId}/detective/gameState/phase
//                      (same path the platform's subscribeGameState reads from)
//
// All other paths (killerSecret, accusation, roles, chat, etc.) are
// detective-exclusive data with no platform equivalent — they stay under
// games/detective/{roomId}/ and are untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '../../../services/firebaseConfig.js';
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  onChildAdded,
  off,
  serverTimestamp
} from 'firebase/database';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * ============================================================================
 * FIREBASE PATH ARCHITECTURE FOR THE DETECTIVE
 * ============================================================================
 *
 * SHARED WITH PLATFORM (read by useFirebaseSubscriptions.js):
 *   rooms/{roomId}/players/{playerId}              ← written by createRoom()
 *   rooms/{roomId}/detective/gameState/phase       ← written by advanceGamePhase()
 *   rooms/{roomId}/detective/roles/{playerId}      ← detective role assignments
 *   rooms/{roomId}/meta/status                     ← game status
 *
 * DETECTIVE-EXCLUSIVE (not read by platform):
 *   games/detective/{roomId}/killerSecret          ← killer's weapon+clue
 *   games/detective/{roomId}/witnessAck            ← witness acknowledgement
 *   games/detective/{roomId}/accusation            ← detective's final guess
 *   games/detective/{roomId}/killerGuess           ← killer's counter-guess
 *   games/detective/{roomId}/resolution            ← outcome
 *   games/detective/{roomId}/chat                  ← in-game chat
 * ============================================================================
 */

/**
 * Sanitize Firebase path keys — strip . # $ [ ]
 * @param {string} key
 * @returns {string}
 */
export function sanitizeKey(key) {
  if (typeof key !== 'string') return key;
  return key.replace(/[.#$[\]]/g, '_');
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTENERS — reads from platform-compatible paths
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync players from the PLATFORM player registry.
 * PATH FIX: was games/detective/{roomId}/players — now rooms/{roomId}/players
 *
 * @param {string} roomId
 * @param {Function} callback  receives Array<{ uid, name, avatar, isHost, isAlive, connected }>
 * @returns {Function} unsubscribe
 */
export function syncRoomPlayers(roomId, callback) {
  // ✅ FIXED: read from rooms/ — where createRoom() actually writes players
  const playersRef = ref(db, `rooms/${roomId}/players`);

  const unsubscribe = onValue(playersRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const playersArray = Object.entries(val).map(([uid, data]) => ({
          uid,
          ...data,
        }));
        callback(playersArray);
      } else {
        callback([]);
      }
    } catch (error) {
      console.error('[detectiveFirebase] syncRoomPlayers error:', error);
    }
  });

  return () => off(playersRef, 'value', unsubscribe);
}

/**
 * Sync the detective game phase from the platform-compatible game state path.
 * PATH FIX: was games/detective/{roomId} — now rooms/{roomId}/detective/gameState
 *
 * @param {string} roomId
 * @param {Function} callback  receives the gameState object { phase, deadline, ... }
 * @returns {Function} unsubscribe
 */
export function syncPhase(roomId, callback) {
  // ✅ FIXED: read from rooms/{roomId}/detective/gameState
  // This mirrors getGamePath(roomId, 'detective') in gameEngine.js
  const phaseRef = ref(db, `rooms/${roomId}/detective/gameState`);

  const unsubscribe = onValue(phaseRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        const gs = snapshot.val();
        // Wrap in the shape useDetectiveRoom expects: { phase: { current, deadline } }
        callback({
          phase: {
            current:  gs.phase    ?? 'lobby',
            deadline: gs.deadline ?? null,
          },
        });
      }
    } catch (error) {
      console.error('[detectiveFirebase] syncPhase error:', error);
    }
  });

  return () => off(phaseRef, 'value', unsubscribe);
}

/**
 * Sync real-time chat messages (detective-exclusive path — no change needed).
 * @param {string} roomId
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function syncChat(roomId, callback) {
  const chatRef = ref(db, `games/detective/${roomId}/chat`);
  const unsubscribe = onChildAdded(chatRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        callback({ id: snapshot.key, ...snapshot.val() });
      }
    } catch (error) {
      console.error('[detectiveFirebase] syncChat error:', error);
    }
  });
  return () => off(chatRef, 'child_added', unsubscribe);
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITES — detective-exclusive paths (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

/** Killer submits their secret weapon + clue choice */
export async function writeKillerSecret(roomId, weaponId, clueId) {
  try {
    const secretRef = ref(db, `games/detective/${roomId}/killerSecret`);
    await set(secretRef, {
      selectedWeaponId: weaponId,
      selectedClueId:   clueId,
    });
  } catch (error) {
    console.error('[detectiveFirebase] writeKillerSecret failed:', error);
    throw new Error('Failed to submit secret choices.');
  }
}

/** Witness acknowledges their briefing */
export async function writeWitnessAck(roomId, acknowledged = true) {
  try {
    const ackRef = ref(db, `games/detective/${roomId}/witnessAck`);
    await set(ackRef, { acknowledged });
  } catch (error) {
    console.error('[detectiveFirebase] writeWitnessAck failed:', error);
    throw new Error('Failed to acknowledge witness briefing.');
  }
}

/** Detective submits their final accusation */
export async function writeAccusation(roomId, playerId, weaponId, clueId) {
  try {
    const accusationRef = ref(db, `games/detective/${roomId}/accusation`);
    await set(accusationRef, {
      accusedPlayerId: playerId,
      accusedWeaponId: weaponId,
      accusedClueId:   clueId,
    });
  } catch (error) {
    console.error('[detectiveFirebase] writeAccusation failed:', error);
    throw new Error('Failed to submit detective accusation.');
  }
}

/** Killer guesses who the Witness is (counter-guess phase) */
export async function writeKillerGuess(roomId, witnessGuessId) {
  try {
    const guessRef = ref(db, `games/detective/${roomId}/killerGuess`);
    await set(guessRef, { witnessGuessId });
  } catch (error) {
    console.error('[detectiveFirebase] writeKillerGuess failed:', error);
    throw new Error('Failed to submit killer counter-guess.');
  }
}

/** Write final game resolution */
export async function writeResolution(roomId, winner, reason) {
  try {
    const resRef  = ref(db, `games/detective/${roomId}/resolution`);
    await set(resRef, { winner, reason });

    // Also update the shared meta status so the platform knows the game ended
    const metaRef = ref(db, `rooms/${roomId}/meta/status`);
    await set(metaRef, 'finished');
  } catch (error) {
    console.error('[detectiveFirebase] writeResolution failed:', error);
    throw new Error('Failed to write game resolution.');
  }
}

/**
 * Advance the game phase.
 * PATH FIX: now writes to rooms/{roomId}/detective/gameState (platform path)
 * so that the platform's subscribeGameState() in useFirebaseSubscriptions.js
 * picks up the phase change and keeps OnlineRouter in sync.
 *
 * @param {string} roomId
 * @param {string} phase       - new phase string (from PHASES constant)
 * @param {number} durationMs  - how long this phase lasts in ms
 */
export async function advanceGamePhase(roomId, phase, durationMs) {
  try {
    const deadline = Date.now() + durationMs;
    const updates  = {
      // ✅ FIXED: write to platform-compatible path
      [`rooms/${roomId}/detective/gameState/phase`]:    phase,
      [`rooms/${roomId}/detective/gameState/deadline`]: deadline,
      // Keep a copy in the detective-exclusive namespace for detective hooks
      [`games/detective/${roomId}/phase/current`]:      phase,
      [`games/detective/${roomId}/phase/deadline`]:     deadline,
      [`rooms/${roomId}/meta/status`]:                  'playing',
    };
    await update(ref(db), updates);
  } catch (error) {
    console.error('[detectiveFirebase] advanceGamePhase failed:', error);
    throw new Error(`Failed to advance game phase to ${phase}.`);
  }
}

/** Send a text or voice chat message */
export async function sendChatMessage(roomId, messagePayload) {
  try {
    const chatRef   = ref(db, `games/detective/${roomId}/chat`);
    const newMsgRef = push(chatRef);
    await set(newMsgRef, {
      ...messagePayload,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('[detectiveFirebase] sendChatMessage failed:', error);
    throw new Error('Failed to send message.');
  }
}

/** Upload a voice note blob to Firebase Storage */
export async function uploadVoiceNote(roomId, audioBlob) {
  try {
    const storage           = getStorage();
    const timestamp         = Date.now();
    const path              = `detective-voice/${roomId}/${timestamp}.webm`;
    const storageRefInstance = sRef(storage, path);

    await uploadBytes(storageRefInstance, audioBlob);
    const url = await getDownloadURL(storageRefInstance);
    return url;
  } catch (error) {
    console.error('[detectiveFirebase] uploadVoiceNote failed:', error);
    throw new Error('Voice note upload failed. Please try again.');
  }
}

/** Clean up multiple Firebase listeners */
export function detachRoomListeners(unsubscribeFns) {
  if (Array.isArray(unsubscribeFns)) {
    unsubscribeFns.forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
  }
}
