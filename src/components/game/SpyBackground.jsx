import React from 'react';
import { motion } from 'framer-motion';

export function SpyBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020c08]">
      {/* Moving stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          initial={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            y: [0, -1000],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
}
