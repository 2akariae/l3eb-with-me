// src/games/detective/components/shared/RoleRevealCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function RoleRevealCard({ role, label, icon }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-flip after 1.5s
  React.useEffect(() => {
    const timer = setTimeout(() => setIsFlipped(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-64 h-96 [perspective:1000px]">
      <motion.div
        className="w-full h-full relative transition-all duration-700 [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 60, damping: 12 }}
      >
        {/* Card Front (Face-down) */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-3xl bg-[#111827] border-2 border-[rgba(255,255,255,0.06)] flex items-center justify-center animate-pulse">
            <span className="text-white/20 font-black tracking-widest uppercase">Secret</span>
        </div>

        {/* Card Back (Role Reveal) */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl bg-[#111827] border-2 border-[#3B9EFF] flex flex-col items-center justify-center gap-6 p-6">
            {icon}
            <h3 className="text-2xl font-black uppercase tracking-widest text-white">{label}</h3>
        </div>
      </motion.div>
    </div>
  );
}
