// src/games/detective/components/shared/WeaponCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { DetectiveIcon } from './DetectiveSVGRegistry.jsx';

export function WeaponCard({ weapon, isSelected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative w-24 h-32 rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-colors ${
        isSelected ? 'border-[#3B9EFF] bg-[#161D2C]' : 'border-[rgba(255,255,255,0.06)] bg-[#111827]'
      }`}
    >
      <DetectiveIcon name={weapon.svgKey} size={40} color={isSelected ? '#3B9EFF' : '#94A3B8'} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-center text-white/80">
        {weapon.name}
      </span>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-[#3B9EFF] rounded-full p-1">
          <DetectiveIcon name="icon_check" size={12} color="white" />
        </motion.div>
      )}
    </motion.button>
  );
}
