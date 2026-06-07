// ─── THE PLATFORM — BackButton.jsx (v10) ─────────────────────────────────────
// Universal back button. Inject this at the top of EVERY screen.
// Accepts `onClick` (required), `label` (optional), and `style` override.
// Renders at absolute top-left (or top-right in RTL) using fixed positioning.
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';

export default function BackButton({ onClick, label, style = {}, className = '' }) {
  const language = useGameStore((s) => s.language);
  const isRTL    = language === 'ar';

  const defaultLabel = isRTL ? 'رجوع' : 'Back';
  const Icon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <motion.button
      initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`absolute top-5 ${isRTL ? 'right-5' : 'left-5'} z-30 flex items-center gap-2 h-10 px-4 rounded-2xl border border-white/10 text-smoke-400 hover:text-white hover:border-white/20 transition-all ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', ...style }}
    >
      <Icon size={14} />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label ?? defaultLabel}
      </span>
    </motion.button>
  );
}
