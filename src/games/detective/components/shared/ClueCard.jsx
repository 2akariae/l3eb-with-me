// src/games/detective/components/shared/ClueCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { DetectiveIcon } from './DetectiveSVGRegistry.jsx';

export function ClueCard({ clue, isSelected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative w-24 h-32 rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-colors ${
        isSelected ? 'border-[#F59E0B] bg-[#161D2C]' : 'border-[rgba(255,255,255,0.06)] bg-[#111827]'
      }`}
    >
      <DetectiveIcon name={clue.svgKey} size={40} color={isSelected ? '#F59E0B' : '#94A3B8'} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-center text-white/80">
        {clue.name}
      </span>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-[#F59E0B] rounded-full p-1">
          <DetectiveIcon name="icon_check" size={12} color="white" />
        </motion.div>
      )}
    </motion.button>
  );
}
