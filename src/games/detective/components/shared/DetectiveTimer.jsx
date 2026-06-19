// src/games/detective/components/shared/DetectiveTimer.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useDetectiveTimer } from '../../hooks/useDetectiveTimer.js';

export function DetectiveTimer({ deadline, totalDuration, size=60, strokeWidth=3 }) {
  const remaining = useDetectiveTimer(deadline);
  const r = Math.max(0, remaining);
  const t = totalDuration > 0 ? totalDuration : 1;
  
  const radius = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, r / t)));
  
  const isUrgent = r <= 10000;
  const stroke = isUrgent ? '#DC2626' : '#3B9EFF';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle 
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={stroke}
          strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 0.1, ease: 'linear' }}
          className={isUrgent ? 'animate-pulse' : ''}
        />
      </svg>
      <span className="absolute font-mono font-black" style={{ fontSize: size * 0.25, color: stroke }}>
        {Math.ceil(r / 1000)}
      </span>
    </div>
  );
}
