// src/games/detective/components/lobby/DetectiveLobby.jsx
// BUG FIX (Root Cause #1):
//   useDetectiveRoom was NEVER called anywhere in the app. The hook exists
//   and is correct, but nothing invoked it. This meant:
//     - detectiveStore.players was always []  → "LOBBY (0)"
//     - detectiveStore.roomId was always null → Firebase listeners never attached
//     - detectiveStore.myUid was always null  → isMe checks always false
//
//   FIX: Call useDetectiveRoom(roomId, myUid) here, at the lobby mount point.
//   Props come from DetectiveRoutes → OnlineRouter (platform's source of truth).
//   We do NOT import from gameStore inside this file — identity comes via props.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { useDetectiveRoom } from '../../hooks/useDetectiveRoom.js';
import { PlayerSlot } from './PlayerSlot.jsx';
import { advanceGamePhase } from '../../utils/detectiveFirebase.js';
import { PHASES, PHASE_DURATIONS_MS } from '../../constants/detectiveConstants.js';

const MIN_PLAYERS = 4;

/**
 * @param {Object}  props
 * @param {Object}  props.user     - Firebase auth user
 * @param {string}  props.roomId   - Room ID from platform store
 * @param {string}  props.playerId - Stable tab player ID
 * @param {boolean} props.isHost   - Whether this client hosts the room
 */
export function DetectiveLobby({ user, roomId, playerId, isHost }) {
  const myUid = user?.uid ?? playerId ?? null;

  // ── THE FIX: Bootstrap Firebase listeners for this room.
  //   Without this call, no onValue listener was ever attached,
  //   so players/phase/chat never updated from Firebase.
  useDetectiveRoom(roomId, myUid);

  // ── Read the now-populated detective store ──────────────────────────────────
  const { players } = useDetectiveStore();

  const count    = players.length;
  const radius   = 130;
  const canStart = isHost && count >= MIN_PLAYERS;

  async function handleStartGame() {
    if (!canStart || !roomId) return;
    try {
      await advanceGamePhase(roomId, PHASES.SETUP, PHASE_DURATIONS_MS.SETUP);
    } catch (err) {
      console.error('[DetectiveLobby] advanceGamePhase failed:', err);
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] p-6 overflow-hidden"
      style={{ background: '#080B12' }}
    >
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10 z-10"
      >
        <h1
          className="text-5xl font-black uppercase tracking-[0.2em] text-white"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          The Detective
        </h1>
        <p
          className="mt-2 text-xs uppercase tracking-[0.5em] font-bold"
          style={{ color: '#3B9EFF', opacity: 0.7 }}
        >
          Waiting Room — {count} / {MIN_PLAYERS}+ Players
        </p>
      </motion.div>

      {/* ── Circular Table — Desktop ──────────────────────────────────────── */}
      {count > 0 && (
        <div
          className="relative hidden md:flex items-center justify-center flex-shrink-0 mb-10"
          style={{ width: radius * 2 + 120, height: radius * 2 + 120 }}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute rounded-full"
            style={{
              width: radius * 2,
              height: radius * 2,
              background: 'radial-gradient(circle, rgba(59,158,255,0.35) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: radius * 2,
              height: radius * 2,
              border: '1px solid rgba(59,158,255,0.12)',
              boxShadow: '0 0 60px rgba(59,158,255,0.06)',
            }}
          />
          <AnimatePresence>
            {players.map((p, i) => {
              const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
              const cx    = Math.cos(angle) * radius;
              const cy    = Math.sin(angle) * radius;
              return (
                <motion.div
                  key={p.uid}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`,
                  }}
                >
                  <PlayerSlot
                    player={p}
                    isHost={p.uid === players[0]?.uid}
                    isMe={p.uid === myUid}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Mobile Grid Layout ────────────────────────────────────────────── */}
      {count > 0 && (
        <div className="md:hidden grid grid-cols-2 gap-5 w-full max-w-xs mb-10">
          <AnimatePresence>
            {players.map((p, i) => (
              <motion.div
                key={p.uid}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <PlayerSlot
                  player={p}
                  isHost={p.uid === players[0]?.uid}
                  isMe={p.uid === myUid}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {count === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="text-white text-sm uppercase tracking-widest font-bold mb-10"
        >
          Waiting for players to join…
        </motion.p>
      )}

      {/* ── Start Button (host only, min 4 players) ───────────────────────── */}
      {isHost && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          whileHover={canStart ? { scale: 1.03 } : {}}
          onClick={handleStartGame}
          disabled={!canStart}
          style={{
            minWidth: 220,
            minHeight: 52,
            borderRadius: 99,
            background: canStart
              ? 'linear-gradient(135deg, #1D4ED8 0%, #3B9EFF 100%)'
              : 'rgba(255,255,255,0.05)',
            border: canStart ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: canStart ? '#fff' : 'rgba(255,255,255,0.25)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            cursor: canStart ? 'pointer' : 'not-allowed',
            boxShadow: canStart ? '0 0 32px rgba(59,158,255,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {canStart
            ? 'Start Investigation'
            : `Need ${MIN_PLAYERS - count} more player${MIN_PLAYERS - count !== 1 ? 's' : ''}`}
        </motion.button>
      )}

      {!isHost && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 0.5 }}
          className="text-white text-xs uppercase tracking-[0.3em] font-bold"
        >
          Waiting for host to start…
        </motion.p>
      )}
    </div>
  );
}
