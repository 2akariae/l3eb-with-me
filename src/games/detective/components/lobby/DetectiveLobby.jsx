import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../../store/gameStore.js';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { useDetectiveRoom } from '../../hooks/useDetectiveRoom.js';
import { PlayerSlot } from './PlayerSlot.jsx';
import { advanceGamePhase } from '../../utils/detectiveFirebase.js';
import { PHASES, PHASE_DURATIONS_MS } from '../../constants/detectiveConstants.js';
import { GameBackground } from '../../../../components/game/GameBackground.jsx';

const MIN_PLAYERS = 4;

// ── Next-Gen Radar Animation ──────────────────────────────────────────────────
function RadarPulse() {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center mb-8">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.66, ease: 'easeOut' }}
          className="absolute border border-blue-500/30 rounded-full w-full h-full"
        />
      ))}
      <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse" />
    </div>
  );
}

// ── Share / Copy Room Code ────────────────────────────────────────────────────
function ShareButton({ roomId }) {
  function handleShare() {
    const base = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
    const url  = `${base}?room=${roomId}`;
    if (navigator.share) {
      navigator.share({ title: 'Detective — Game Invite', text: `Room: ${roomId}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <motion.button
      onClick={handleShare}
      whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-3 group px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl transition-all"
    >
      <span className="font-black tracking-[0.25em] text-white font-mono text-xl">{roomId}</span>
      <div className="w-px h-6 bg-white/10" />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400 group-hover:text-white transition-colors">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    </motion.button>
  );
}

export function DetectiveLobby({ user, roomId, playerId, isHost }) {
  const myUid = user?.uid ?? playerId ?? null;
  useDetectiveRoom(roomId, myUid);
  const { players } = useDetectiveStore();
  const count    = players.length;
  const canStart = isHost && count >= MIN_PLAYERS;

  async function handleStartGame() {
    if (!canStart || !roomId) return;
    try {
      await advanceGamePhase(roomId, PHASES.SETUP, PHASE_DURATIONS_MS.SETUP);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] relative text-white select-none touch-none">
      <GameBackground count={120} />

      {/* ── Header ────────────────────────────────────────── */}
      <div className="z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/70">Waiting Room</span>
          {roomId && <ShareButton roomId={roomId} />}
        </div>
        <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl font-mono text-sm font-bold text-blue-400 shadow-lg">
          {count}/{MIN_PLAYERS} Players
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black uppercase tracking-[0.2em] font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-300 drop-shadow-lg"
        >
          The Detective
        </motion.h1>

        {count === 0 ? (
          <RadarPulse />
        ) : (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            initial="hidden" animate="visible"
          >
            {players.map((p) => (
              <motion.div key={p.uid} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                <motion.div 
                  whileHover={{ scale: 1.05, borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(255,255,255,0.06)' }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 transition-all shadow-2xl"
                >
                  <PlayerSlot player={p} isHost={p.uid === players[0]?.uid} isMe={p.uid === myUid} />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Footer / CTA ────────────────────────────────────────── */}
      <div className="z-10 p-8 flex flex-col items-center bg-black/20 backdrop-blur-md">
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartGame}
            disabled={!canStart}
            className={`relative overflow-hidden px-12 py-4 rounded-full font-black text-sm uppercase tracking-[0.3em] transition-all ${
              canStart ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {canStart && <motion.div className="absolute inset-0 bg-white/20 animate-shimmer" />}
            {canStart ? 'Start Investigation' : `Need ${MIN_PLAYERS - count} more`}
          </motion.button>
        ) : (
          <motion.p 
            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-xs uppercase tracking-[0.3em] font-black text-blue-300/50"
          >
            Waiting for host to start…
          </motion.p>
        )}
      </div>
      
      {/* ── Shimmer Animation Utility ─────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }
      `}</style>
    </div>
  );
}
