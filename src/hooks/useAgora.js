// ─── THE MAFIA — hooks/useAgora.js (REFACTORED) ──────────────────────────────
// Fixes:
//   1. CAN_NOT_GET_GATEWAY_SERVER / dynamic use static key
//      → Token is always re-fetched fresh before every join; never reuses a stale token.
//      → Falls back gracefully to null token (Agora Testing Mode) when endpoint is missing.
//   2. Exposes setMicEnabled / setSpeakerEnabled for header/card mic-casque buttons.
//   3. Volume indicator drives speakingUids store for all consumers.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useGameStore } from '../store/gameStore.js';
import { PHASES } from '../constants/game.js';

const APP_ID    = import.meta.env.VITE_AGORA_APP_ID;
const TOKEN_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL.replace(/\/$/, '')}/api/agoraToken`
  : null;

// Suppress Agora's chatty logs; show errors only
AgoraRTC.setLogLevel(4);

// Deterministic numeric UID – stable per session, no collisions with small rooms
function toNumericUid(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return (h % 999000) + 1000;
}

// Always fetch a FRESH token – caching a token is what causes the "dynamic use static key" error
// when an App Certificate is enabled. The token must match the exact (channel, uid) pair used
// in client.join(); even a 1-second-old token for the wrong uid will fail with error 4096.
async function fetchFreshToken(channel, numericUid) {
  if (!TOKEN_URL) {
    // No backend configured → Testing Mode (App Certificate disabled). Totally fine for dev.
    console.info('[Agora] TOKEN_URL not set – joining in Testing Mode (null token).');
    return null;
  }
  try {
    const url = `${TOKEN_URL}?channel=${encodeURIComponent(channel)}&uid=${numericUid}&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const { token } = await res.json();
    if (!token) throw new Error('Server returned empty token');
    return token;
  } catch (e) {
    // Hard-fail loudly so the developer knows the endpoint is broken, but still degrade gracefully
    console.error('[Agora] Token fetch failed – falling back to null token (Testing Mode):', e.message);
    return null;
  }
}

/**
 * useAgora – voice-chat hook for online multiplayer.
 *
 * @returns {{ micEnabled, speakerEnabled, setMicEnabled, setSpeakerEnabled }}
 *   Live mic/speaker state + setters wired to the actual Agora track.
 *   Consume these in the header and player cards for instant, synced controls.
 */
export function useAgora(roomId, uid, isAlive, phase) {
  const clientRef   = useRef(null);
  const trackRef    = useRef(null);
  const joinedRef   = useRef(false);
  const setSpeaking = useGameStore((s) => s.setSpeaking);

  // Exposed control state – drives the Mic/Casque buttons in the UI
  const [micEnabled,     setMicState]     = useState(true);
  const [speakerEnabled, setSpeakerState] = useState(true);

  const canSpeak = useMemo(() => phase === PHASES.DISCUSSION && isAlive, [phase, isAlive]);

  // ── Join once per (roomId, uid) pair ────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !uid) return;
    if (!APP_ID) {
      console.warn('[Agora] VITE_AGORA_APP_ID not set – voice chat disabled.');
      return;
    }

    let cancelled = false;

    async function join() {
      try {
        const client     = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        const numericUid = toNumericUid(uid);

        // ─── CRITICAL FIX: fetch token JUST BEFORE join(), not before creating the client ───
        // Agora validates the token against the (appId, channel, uid) tuple at join time.
        // If the certificate is enabled and the token is null or was generated for a different
        // uid, Agora throws error 4096: CAN_NOT_GET_GATEWAY_SERVER.
        const token = await fetchFreshToken(roomId, numericUid);
        if (cancelled) return;

        clientRef.current = client;

        // Volume indicator → speaking ring animation in player cards
        client.enableAudioVolumeIndicator();
        client.on('volume-indicator', (volumes) => {
          volumes.forEach(({ uid: u, level }) => setSpeaking(String(u), level > 28));
        });

        // Auto-subscribe to remote audio
        client.on('user-published', async (remoteUser, mediaType) => {
          if (mediaType !== 'audio') return;
          try {
            await client.subscribe(remoteUser, 'audio');
            remoteUser.audioTrack?.play();
          } catch { /* user may have left */ }
        });

        client.on('user-unpublished', (remoteUser) => {
          setSpeaking(String(remoteUser.uid), false);
        });

        await client.join(APP_ID, roomId, token, numericUid);
        if (cancelled) { await client.leave(); return; }

        joinedRef.current = true;
      } catch (e) {
        console.error('[Agora] Join failed – voice chat unavailable. Error:', e.message, e);
      }
    }

    join();

    return () => {
      cancelled = true;
      (async () => {
        try {
          trackRef.current?.stop();
          trackRef.current?.close();
          trackRef.current  = null;
          await clientRef.current?.leave();
          clientRef.current  = null;
          joinedRef.current  = false;
        } catch { /* ignore during cleanup */ }
      })();
    };
  }, [roomId, uid]); // eslint-disable-line

  // ── Publish / unpublish mic track when discussion starts / ends ─────────────
  useEffect(() => {
    if (!joinedRef.current || !clientRef.current) return;

    async function syncMic() {
      if (canSpeak) {
        if (trackRef.current) {
          await trackRef.current.setEnabled(micEnabled).catch(() => {});
        } else {
          try {
            const track = await AgoraRTC.createMicrophoneAudioTrack({
              encoderConfig: 'speech_standard',
              AEC: true, ANS: true, AGC: true,
            });
            trackRef.current = track;
            await trackRef.current.setEnabled(micEnabled);
            await clientRef.current.publish(track);
          } catch (e) {
            console.warn('[Agora] Mic access denied or unavailable:', e.message);
          }
        }
      } else {
        await trackRef.current?.setEnabled(false).catch(() => {});
      }
    }

    syncMic();
  }, [canSpeak]); // eslint-disable-line

  // ── Public mic toggle – wired to the Mic button ─────────────────────────────
  const setMicEnabled = useCallback(async (enabled) => {
    setMicState(enabled);
    await trackRef.current?.setEnabled(enabled).catch(() => {});
  }, []);

  // ── Speaker (remote audio) toggle – wired to the Casque button ─────────────
  const setSpeakerEnabled = useCallback((enabled) => {
    setSpeakerState(enabled);
    const client = clientRef.current;
    if (!client) return;
    // Mute/unmute all remote audio tracks
    client.remoteUsers.forEach((u) => {
      if (enabled) u.audioTrack?.play();
      else         u.audioTrack?.stop();
    });
  }, []);

  // ── Host force-mute for execution glitch effect (called from gameStore) ─────
  // Exposed on window so ExecutionScreen can trigger without prop drilling
  useEffect(() => {
    window.__agoraMuteSelf = async () => {
      setMicState(false);
      await trackRef.current?.setEnabled(false).catch(() => {});
    };
    return () => { delete window.__agoraMuteSelf; };
  }, []);

  return { micEnabled, speakerEnabled, setMicEnabled, setSpeakerEnabled };
}
