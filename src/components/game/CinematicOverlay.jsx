// ─── THE MAFIA — CinematicOverlay.jsx ────────────────────────────────────────
// Provides a global cinematic texture (grain + vignette + aberration) to the application.
import React from 'react';
import { motion } from 'framer-motion';

export function CinematicOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {/* 1. Film Grain Layer (High Frequency) */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full scale-[2]">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.85" 
              numOctaves="4" 
              stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* 2. Dust & Scratches (Subtle motion) */}
      <motion.div 
        className="absolute inset-0 opacity-[0.02] mix-blend-screen"
        animate={{ 
          x: [0, -10, 5, -5, 0],
          y: [0, 5, -10, 5, 0]
        }}
        transition={{ duration: 0.2, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-30">
          <filter id="dustFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 100 -20" />
          </filter>
          <rect width="100%" height="100%" filter="url(#dustFilter)" />
        </svg>
      </motion.div>

      {/* 3. Dynamic Vignette & Depth-of-Field Simulation */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.65, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.5) 100%)',
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)'
        }}
      />

      {/* 4. Chromatic Aberration Simulation (Edges only) */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-screen" style={{
        background: 'radial-gradient(circle at center, transparent 60%, rgba(255,0,0,0.2) 85%, rgba(0,0,255,0.2) 100%)'
      }} />

      {/* 5. Scanline Effect (Ultra subtle) */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px'
        }} />
      </div>
    </div>
  );
}

