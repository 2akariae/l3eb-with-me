// ─── SettingsButton — global floating trigger ─────────────────────────────────
// Small gear icon rendered at top-right of every screen.
// Calls toggleSettings() from gameStore to open SettingsPanel.
import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';

export default function SettingsButton({ style = {} }) {
  const toggleSettings = useGameStore((s) => s.toggleSettings);
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={toggleSettings}
      className="fixed top-5 right-5 z-[60] w-11 h-11 rounded-2xl flex items-center justify-center border border-white/8 backdrop-blur-xl hover:bg-white/8 transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', ...style }}
    >
      <Settings size={20} className="text-smoke-400" />
    </motion.button>
  );
}
