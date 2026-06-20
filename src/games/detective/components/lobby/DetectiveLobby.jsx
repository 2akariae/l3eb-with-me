// src/games/detective/components/lobby/DetectiveLobby.jsx
// FIX SESSION 3: Added Room Code display + Share/Copy button.
//   Host was unable to invite other players because DetectiveLobby had no
//   room code UI — unlike LobbyScreen (Mafia/Spy) which shows the code in
//   the header. Fixed by reading roomId from the platform gameStore (one
//   allowed cross-import since roomId is platform identity, not game logic)
//   and rendering the code + share button in the lobby header.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../../store/gameStore.js';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { useDetectiveRoom } from '../../hooks/useDetectiveRoom.js';
import { PlayerSlot } from './PlayerSlot.jsx';
import { advanceGamePhase } from '../../utils/detectiveFirebase.js';
import { PHASES, PHASE_DURATIONS_MS } from '../../constants/detectiveConstants.js';

const MIN_PLAYERS = 4;

// ── Share / Copy Room Code ────────────────────────────────────────────────────
function ShareButton({ roomId }) {
  function handleShare() {
    const base = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
    const url  = `${base}?room=${roomId}`;
    if (navigator.share) {
      navigator.share({ title: 'Detective — Game Invite', text: `Room: ${roomId}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        // brief visual flash — no external toast dependency needed here
      }).catch(() => {
        navigator.clipboard.writeText(roomId).catch(() => {});
      });
    }
  }

  return (
    <motion.button
      onClick={handleShare}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-3 group"
      title="Share room invite link"
    >
      {/* Room code */}
      <span
        className="font-black tracking-[0.25em]"
        style={{
          fontSize: 28,
          color: '#fff',
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: '0.3em',
        }}
      >
        {roomId}
      </span>

      {/* Share icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        className="group-hover:bg-white/10"
      >
        {/* Share SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.5)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="group-hover:stroke-white transition-all"
        >
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </div>
    </motion.button>
  );
}

/**
 * @param {Object}  props
 * @param {Object}  props.user     - Firebase auth user
 * @param {string}  props.roomId   - Room ID from platform store
 * @param {string}  props.playerId - Stable tab player ID
 * @param {boolean} props.isHost   - Whether this client hosts the room
 */
export function DetectiveLobby({ user, roomId, playerId, isHost }) {
  const myUid = user?.uid ?? playerId ?? null;

  // Bootstrap Firebase listeners
  useDetectiveRoom(roomId, myUid);

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
      className="flex flex-col min-h-[100dvh] overflow-hidden"
      style={{ background: '#080B12' }}
    >
      {/* ── Header: Room Code + Share ──────────────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Left: back placeholder (same width as right) */}
        <div style={{ width: 40 }} />

        {/* Center: room code + share */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="uppercase font-black"
            style={{
              fontSize: 9,
              letterSpacing: '0.4em',
              color: '#3B9EFF',
              opacity: 0.7,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Waiting Room
          </span>
          {roomId && <ShareButton roomId={roomId} />}
        </div>

        {/* Right: player count badge */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: count >= MIN_PLAYERS ? '#3B9EFF' : 'rgba(255,255,255,0.3)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {count}/{MIN_PLAYERS}
          </span>
        </div>
      </div>

      {/* ── Body: title + table ───────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center flex-1 p-6">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <h1
            className="text-5xl font-black uppercase tracking-[0.2em] text-white"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            The Detective
          </h1>
          <p
            className="mt-2 text-xs uppercase tracking-[0.5em] font-bold"
            style={{ color: '#3B9EFF', opacity: 0.6 }}
          >
            {count} / {MIN_PLAYERS}+ Players
          </p>
        </motion.div>

        {/* Circular Table — Desktop */}
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

        {/* Mobile Grid */}
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

        {/* Empty state */}
        {count === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-white text-sm uppercase tracking-widest font-bold mb-10"
          >
            Waiting for players to join…
          </motion.p>
        )}

        {/* Start Button — host only */}
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
              minWidth: 240,
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
    </div>
  );
}
