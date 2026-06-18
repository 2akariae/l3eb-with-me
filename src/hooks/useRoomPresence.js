// ─── L3EBWITHME PLATFORM — hooks/useRoomPresence.js ───────────────────────────
// Two responsibilities extracted from App.jsx, kept together because both
// are about "is this client still legitimately in this room":
//   1. Watch rooms/{roomId}/meta and rooms/{roomId}/players/{me} — detect
//      host-closed rooms and kicks, and clear local room state accordingly.
//   2. Maintain the Firebase Realtime Database presence pattern
//      (.info/connected + onDisconnect) so other players see accurate
//      online/offline status for this player.

import { useEffect } from 'react';
import { onValue, ref, onDisconnect, set as dbSet } from 'firebase/database';
import { db } from '../services/firebaseConfig.js';
import { useGameStore } from '../store/gameStore.js';
import { vibrate, HAPTICS } from '../utils/haptics.js';
import { toast } from '../components/ui/index.jsx';
import { useTranslation } from '../constants/translations.js';

/**
 * @param {string} appMode - 'online' | 'offline' | null
 * @param {string} tabPlayerId - stable per-tab id from utils/session.js
 */
export function useRoomPresence(appMode, tabPlayerId) {
  const { roomId, isHost, user, playerId, language, clearRoom } = useGameStore();
  const t = useTranslation(language);

  // ── Meta + kick watcher ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !user || appMode !== 'online') return;
    const pid = playerId || tabPlayerId;

    const unsubMeta = onValue(ref(db, `rooms/${roomId}/meta`), (snap) => {
      if (isHost) return;
      if (!snap.exists()) { toast(t('hostEndedGame'), 'info'); clearRoom(); return; }
      if (snap.val()?.status === 'closed') { toast(t('hostLeftGame'), 'info'); clearRoom(); }
    });

    const unsubPlayer = onValue(ref(db, `rooms/${roomId}/players/${pid}`), (snap) => {
      if (!snap.exists() && roomId) {
        toast(t('kickedMessage'), 'error');
        vibrate(HAPTICS.ERROR);
        clearRoom();
      }
    });

    return () => { unsubMeta(); unsubPlayer(); };
  }, [roomId, isHost, user?.uid, playerId, language, appMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online presence (.info/connected + onDisconnect) ──────────────────
  useEffect(() => {
    if (!roomId || !playerId) return;
    const connPath = ref(db, '.info/connected');
    const presPath = ref(db, `rooms/${roomId}/players/${playerId}/connected`);

    const unsub = onValue(connPath, (snap) => {
      if (snap.val() !== true) return;
      onDisconnect(presPath).set(false);
      dbSet(presPath, true).catch(() => {});
    });

    return () => {
      unsub();
      dbSet(presPath, false).catch(() => {});
    };
  }, [roomId, playerId]); // eslint-disable-line react-hooks/exhaustive-deps
}
