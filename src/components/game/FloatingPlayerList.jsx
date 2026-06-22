// ─── THE MAFIA — FloatingPlayerList.jsx ──────────────────────────────────────
// Draggable floating button visible during game. Tap to see all players.
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import { Avatar } from '../ui/index.jsx';
import { containerVariants, itemVariants, modalVariants } from '../../constants/motion.js';

/* ── SVG Players Icon ── */
function PlayersIcon({ size = 20, color = '#c9943a' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

export function FloatingPlayerList({ myPlayerId }) {
  const { players } = useGameStore();
  const [open, setOpen] = useState(false);
  const constraintsRef = useRef(null);

  const playerList = Object.entries(players).map(([uid, p]) => ({ uid, ...p }));
  const alive = playerList.filter((p) => p.isAlive);
  const dead  = playerList.filter((p) => !p.isAlive);

  return (
    <>
      {/* Full-screen drag constraint */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      {/* Draggable floating button */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="fixed bottom-24 right-4 z-50 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        whileDrag={{ scale: 1.1 }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-2xl overflow-hidden"
          style={{ 
            background: 'rgba(201,148,58,0.12)', 
            border: '1.5px solid rgba(201,148,58,0.3)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <PlayersIcon size={24} />
          {/* Count badge */}
          <span className="absolute top-2 right-2 w-5 h-5 rounded-lg bg-gold-500 text-noir-950 text-[10px] font-black flex items-center justify-center shadow-lg">
            {alive.length}
          </span>
        </motion.button>
      </motion.div>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed bottom-44 right-4 z-50 w-64 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
            style={{ background: 'rgba(5,2,2,0.96)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(255,255,255,0.1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <span className="text-gold-400 text-[10px] font-black uppercase tracking-[0.2em]">Game Roster</span>
              <button onClick={() => setOpen(false)} className="text-smoke-500 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* List */}
            <motion.div 
              variants={containerVariants}
              initial="hidden" animate="visible"
              className="max-h-80 overflow-y-auto px-3 py-3 flex flex-col gap-1 scrollbar-hide">
              {alive.map((p) => (
                <motion.div variants={itemVariants} key={p.uid} className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/5 transition-all">
                  <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate tracking-tight">{p.name}</p>
                    {p.uid === myPlayerId && <p className="text-gold-500/60 text-[9px] font-black uppercase tracking-widest mt-0.5">You</p>}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                </motion.div>
              ))}

              {dead.length > 0 && (
                <>
                  <motion.div variants={itemVariants} className="text-smoke-600 text-[9px] font-black uppercase tracking-[0.2em] px-3 mt-4 mb-1">Eliminated</motion.div>
                  {dead.map((p) => (
                    <motion.div variants={itemVariants} key={p.uid} className="flex items-center gap-3 px-3 py-2 rounded-2xl opacity-40 grayscale">
                      <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="xs" dead />
                      <p className="text-smoke-400 text-xs font-medium truncate">{p.name}</p>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
