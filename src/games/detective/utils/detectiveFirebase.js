// src/games/detective/utils/detectiveFirebase.js
// Firebase Realtime Database and Storage helper functions for "The Detective".
// This file handles all data interactions with the Firebase backend.

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
 * FIREBASE SECURITY RULES DEFINITION
 * ============================================================================
 * Copy these rules into your database.rules.json under "games" -> "detective":
 *
 * "detective": {
 *   "$roomId": {
 *     ".read": "auth != null && data.child('players').hasChild(auth.uid)",
 *     ".write": "auth != null",
 *     
 *     "roles": {
 *       "$uid": {
 *         ".read": "auth != null && auth.uid == $uid",
 *         ".write": "!data.exists() || data.parent().parent().child('meta/hostId').val() == auth.uid"
 *       }
 *     },
 *     
 *     "killerSecret": {
 *       ".read": "auth != null && (root.child('games/detective/' + $roomId + '/roles/' + auth.uid).val() == 'witness' || root.child('games/detective/' + $roomId + '/roles/' + auth.uid).val() == 'killer' || root.child('games/detective/' + $roomId + '/meta/hostId').val() == auth.uid)",
 *       ".write": "auth != null && root.child('games/detective/' + $roomId + '/roles/' + auth.uid).val() == 'killer'"
 *     },
 *     
 *     "witnessAck": {
 *       ".read": "auth != null && root.child('games/detective/' + $roomId + '/meta/hostId').val() == auth.uid",
 *       "acknowledged": {
 *         ".write": "auth != null && auth.uid == root.child('games/detective/' + $roomId + '/roles/' + auth.uid).val() == 'witness'"
 *       }
 *     },
 *     
 *     "accusation": {
 *       ".read": "auth != null",
 *       ".write": "auth != null && root.child('games/detective/' + $roomId + '/roles/' + auth.uid).val() == 'detective'"
 *     },
 *     
 *     "killerGuess": {
 *       ".read": "auth != null",
 *       ".write": "auth != null && root.child('games/detective/' + $roomId + '/roles/' + auth.uid).val() == 'killer'"
 *     },
 *     
 *     "chat": {
 *       ".read": "auth != null && root.child('games/detective/' + $roomId + '/players/' + auth.uid).exists()",
 *       ".write": "auth != null && root.child('games/detective/' + $roomId + '/players/' + auth.uid).exists()"
 *     }
 *   }
 * }
 * 
 * FIREBASE STORAGE SECURITY RULES:
 *
 * match /detective-voice/{roomId}/{filename} {
 *   allow read: if request.auth != null;
 *   allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('audio/.*');
 * }
 * ============================================================================
 */

/**
 * Sanitizes keys to prevent Firebase path issues (removes . # $ [ ])
 * @param {string} key 
 * @returns {string}
 */
export function sanitizeKey(key) {
  if (typeof key !== 'string') return key;
  return key.replace(/[\.\#\$\[\]]/g, '_');
}

/**
 * Attaches a listener to the room players node.
 * @param {string} roomId 
 * @param {Function} callback 
 * @returns {Function} unsubscribe function
 */
export function syncRoomPlayers(roomId, callback) {
  const playersRef = ref(db, `games/detective/${roomId}/players`);
  const unsubscribe = onValue(playersRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const playersArray = Object.entries(val).map(([uid, data]) => ({
          uid,
          ...data
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
 * Attaches a listener to the phase and meta nodes to sync local store.
 * @param {string} roomId 
 * @param {Function} callback 
 * @returns {Function} unsubscribe function
 */
export function syncPhase(roomId, callback) {
  const roomRef = ref(db, `games/detective/${roomId}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    } catch (error) {
      console.error('[detectiveFirebase] syncPhase error:', error);
    }
  });
  return () => off(roomRef, 'value', unsubscribe);
}

/**
 * Sync real-time chat messages
 * @param {string} roomId 
 * @param {Function} callback 
 * @returns {Function} unsubscribe function
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

/**
 * Write Killer's secret choice
 */
export async function writeKillerSecret(roomId, weaponId, clueId) {
  try {
    const secretRef = ref(db, `games/detective/${roomId}/killerSecret`);
    await set(secretRef, {
      selectedWeaponId: weaponId,
      selectedClueId: clueId
    });
  } catch (error) {
    console.error('[detectiveFirebase] writeKillerSecret failed:', error);
    throw new Error('Failed to submit secret choices.');
  }
}

/**
 * Write Witness acknowledgment
 */
export async function writeWitnessAck(roomId, acknowledged = true) {
  try {
    const ackRef = ref(db, `games/detective/${roomId}/witnessAck`);
    await set(ackRef, { acknowledged });
  } catch (error) {
    console.error('[detectiveFirebase] writeWitnessAck failed:', error);
    throw new Error('Failed to acknowledge witness briefing.');
  }
}

/**
 * Write Detective's accusation
 */
export async function writeAccusation(roomId, playerId, weaponId, clueId) {
  try {
    const accusationRef = ref(db, `games/detective/${roomId}/accusation`);
    await set(accusationRef, {
      accusedPlayerId: playerId,
      accusedWeaponId: weaponId,
      accusedClueId: clueId
    });
  } catch (error) {
    console.error('[detectiveFirebase] writeAccusation failed:', error);
    throw new Error('Failed to submit detective accusation.');
  }
}

/**
 * Write Killer's guess about witness identity
 */
export async function writeKillerGuess(roomId, witnessGuessId) {
  try {
    const guessRef = ref(db, `games/detective/${roomId}/killerGuess`);
    await set(guessRef, {
      witnessGuessId
    });
  } catch (error) {
    console.error('[detectiveFirebase] writeKillerGuess failed:', error);
    throw new Error('Failed to submit killer counter-guess.');
  }
}

/**
 * Write game resolution
 */
export async function writeResolution(roomId, winner, reason) {
  try {
    const resRef = ref(db, `games/detective/${roomId}/resolution`);
    await set(resRef, { winner, reason });
    
    // Also update meta status
    const metaRef = ref(db, `games/detective/${roomId}/meta/status`);
    await set(metaRef, 'finished');
  } catch (error) {
    console.error('[detectiveFirebase] writeResolution failed:', error);
    throw new Error('Failed to write game resolution.');
  }
}

/**
 * Advance game phase with new duration
 */
export async function advanceGamePhase(roomId, phase, durationMs) {
  try {
    const deadline = Date.now() + durationMs;
    const updates = {
      [`games/detective/${roomId}/phase/current`]: phase,
      [`games/detective/${roomId}/phase/deadline`]: deadline,
      [`games/detective/${roomId}/meta/currentPhase`]: phase
    };
    await update(ref(db), updates);
  } catch (error) {
    console.error('[detectiveFirebase] advanceGamePhase failed:', error);
    throw new Error(`Failed to advance game phase to ${phase}.`);
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(roomId, messagePayload) {
  try {
    const chatRef = ref(db, `games/detective/${roomId}/chat`);
    const newMsgRef = push(chatRef);
    await set(newMsgRef, {
      ...messagePayload,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[detectiveFirebase] sendChatMessage failed:', error);
    throw new Error('Failed to send message.');
  }
}

/**
 * Upload voice note to Firebase Storage
 */
export async function uploadVoiceNote(roomId, audioBlob) {
  try {
    const storage = getStorage();
    const timestamp = Date.now();
    const path = `detective-voice/${roomId}/${timestamp}.webm`;
    const storageRefInstance = sRef(storage, path);
    
    await uploadBytes(storageRefInstance, audioBlob);
    const url = await getDownloadURL(storageRefInstance);
    return url;
  } catch (error) {
    console.error('[detectiveFirebase] uploadVoiceNote failed:', error);
    throw new Error('Voice note upload failed. Please try again.');
  }
}

/**
 * Clean up database listeners
 */
export function detachRoomListeners(unsubscribeFns) {
  if (Array.isArray(unsubscribeFns)) {
    unsubscribeFns.forEach((unsub) => {
      if (typeof unsub === 'function') {
        unsub();
      }
    });
  }
}
