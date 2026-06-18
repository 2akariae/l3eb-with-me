// ─── THE MAFIA — GameHUD.jsx ──────────────────────────────────────────────────
// Minimal top-right pill visible during active game phases (not lobby/auth)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';
import { PHASES, getRoleLabel } from '../../constants/game.js';
import { useGameStore } from '../../store/gameStore.js';

const PHASE_LABELS = {
  [PHASES.NIGHT]:      { label: 'Night',      color: 'text-purple-400', dot: 'bg-purple-400' },
  [PHASES.DAWN_SCROLL]:{ label: 'Dawn',       color: 'text-amber-400',  dot: 'bg-amber-400'  },
  [PHASES.DISCUSSION]: { label: 'Discussion', color: 'text-gold-400',   dot: 'bg-gold-400'   },
  [PHASES.VOTING]:     { label: 'Voting',     color: 'text-crimson-400',dot: 'bg-crimson-400'},
  [PHASES.EXECUTION]:  { label: 'Execution',  color: 'text-crimson-500',dot: 'bg-crimson-500'},
};

const ACTIVE_PHASES = new Set([
  PHASES.NIGHT, PHASES.DAWN_SCROLL,
  PHASES.DISCUSSION, PHASES.VOTING, PHASES.EXECUTION,
]);

export function GameHUD({ phase, round, myRole }) {
  const { toggleHistory, history, language } = useGameStore();

  if (!ACTIVE_PHASES.has(phase)) return null;
  const cfg = PHASE_LABELS[phase];
  if (!cfg) return null;

  return (
    <div className="fixed top-safe top-3 left-4 z-40 flex items-center gap-2 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/8 pointer-events-none"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
        />
        <span className={`text-xs font-mono ${cfg.color}`}>{getRoleLabel(phase, language, cfg)}</span>
        <span className="text-smoke-500 text-xs">·</span>
        <span className="text-smoke-400 text-xs font-mono">R{round ?? 1}</span>
      </motion.div>

      {history.length > 0 && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleHistory}
          className="glass rounded-full px-3 py-1.5 border border-white/8 text-[10px] font-mono uppercase tracking-widest text-smoke-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ScrollText size={11} strokeWidth={2} /> Log
        </motion.button>
      )}
    </div>
  );
}
