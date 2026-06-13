// ─── THE MAFIA — CinematicOverlay.jsx ────────────────────────────────────────
// Provides a global cinematic texture (grain + vignette) to the application.
import React from 'react';
import { motion } from 'framer-motion';

export function CinematicOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {/* 1. Film Grain Layer */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.65" 
              numOctaves="3" 
              stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* 2. Dynamic Vignette */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.5, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* 3. Scanline Effect (Very subtle) */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 2px, 3px 100%'
        }} />
      </div>
    </div>
  );
}
