import React from 'react';

/**
 * Next-Gen High-Performance Background
 * Uses 2 hardware-accelerated layers with CSS parallax.
 */
export function SpyParallaxBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050508] pointer-events-none contain-strict">
      <style>
        {`
          @keyframes parallaxVertical {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
          }
          .parallax-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200%;
            will-change: transform;
            pointer-events: none;
          }
        `}
      </style>
      
      {/* Layer 1: Subtle Far Stars */}
      <div 
        className="parallax-layer opacity-30"
        style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'parallaxVertical 120s linear infinite',
        }}
      />
      
      {/* Layer 2: Deeper Near Stars */}
      <div 
        className="parallax-layer opacity-50"
        style={{
          backgroundImage: 'radial-gradient(white 1.5px, transparent 1.5px)',
          backgroundSize: '150px 150px',
          animation: 'parallaxVertical 60s linear infinite',
        }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050508_100%)]" />
    </div>
  );
}
