// ─── THE MAFIA — GameHUD.jsx (v11 — cinematic refresh) ───────────────────────
import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Activity } from 'lucide-react';
import { PHASES, getRoleLabel } from '../../constants/game.js';
import { useGameStore } from '../../store/gameStore.js';

const PHASE_CONFIG = {
  [PHASES.NIGHT]:       { color: 'text-purple-400', dot: 'bg-purple-500',  glow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]' },
  [PHASES.DAWN_SCROLL]: { color: 'text-amber-400',  dot: 'bg-amber-500',   glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]'  },
  [PHASES.DISCUSSION]:  { color: 'text-gold-400',   dot: 'bg-gold-500',    glow: 'shadow-[0_0_12px_rgba(201,148,58,0.5)]'  },
  [PHASES.VOTING]:      { color: 'text-crimson-400',dot: 'bg-crimson-500', glow: 'shadow-[0_0_12px_rgba(224,32,32,0.5)]' },
  [PHASES.EXECUTION]:   { color: 'text-crimson-500',dot: 'bg-crimson-600', glow: 'shadow-[0_0_12px_rgba(185,28,28,0.5)]' },
};

const ACTIVE_PHASES = new Set([
  PHASES.NIGHT, PHASES.DAWN_SCROLL,
  PHASES.DISCUSSION, PHASES.VOTING, PHASES.EXECUTION,
]);

export function GameHUD({ phase, round, myRole }) {
  const { toggleHistory, history, language } = useGameStore();

  if (!ACTIVE_PHASES.has(phase)) return null;
  const cfg = PHASE_CONFIG[phase];
  if (!cfg) return null;

  return (
    <div className="fixed top-safe top-5 left-6 z-40 flex items-center gap-3 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        className="flex items-center gap-4 glass rounded-3xl px-5 py-2.5 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.glow}`}
          />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] leading-none mb-1">Phase</span>
            <span className={`text-[11px] font-black uppercase tracking-widest leading-none aberration ${cfg.color}`}>
              {getRoleLabel(phase, language, { label: phase })}
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex flex-col">
          <span className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] leading-none mb-1">Round</span>
          <span className="text-white text-[11px] font-black font-mono leading-none tracking-widest">
            #{String(round ?? 1).padStart(2, '0')}
          </span>
        </div>
      </motion.div>

      {history.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleHistory}
          className="glass rounded-[1.25rem] px-4 py-2.5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-smoke-400 hover:text-white transition-all flex items-center gap-2.5 shadow-2xl group"
        >
          <ScrollText size={14} className="group-hover:text-gold-500 transition-colors" />
          <span className="bloom">Log</span>
        </motion.button>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
      >
        <Activity size={10} className="text-emerald-500 animate-pulse" />
        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
      </motion.div>
    </div>
  );
}

