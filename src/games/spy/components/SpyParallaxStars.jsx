import React from 'react';

/**
 * High-Performance Hardware-Accelerated Parallax Stars
 * Uses 2 layers of seamless star patterns with pure CSS animations.
 */
export function SpyParallaxStars() {
  const starPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle cx='20' cy='30' r='1' fill='white' opacity='0.4'/%3E%3Ccircle cx='150' cy='70' r='1.2' fill='white' opacity='0.7'/%3E%3Ccircle cx='80' cy='160' r='1' fill='white' opacity='0.3'/%3E%3Ccircle cx='190' cy='120' r='1.5' fill='white' opacity='0.6'/%3E%3Ccircle cx='40' cy='190' r='0.8' fill='white' opacity='0.5'/%3E%3C/svg%3E")`;
  
  const starPatternNear = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Ccircle cx='50' cy='50' r='1.8' fill='white' opacity='0.6'/%3E%3Ccircle cx='250' cy='150' r='2' fill='white' opacity='0.8'/%3E%3Ccircle cx='100' cy='280' r='1.5' fill='white' opacity='0.5'/%3E%3C/svg%3E")`;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020c08] pointer-events-none contain-strict">
      <style>
        {`
          @keyframes parallaxVertical {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
          }
          .star-layer {
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
      
      {/* Slow Layer (Far) */}
      <div 
        className="star-layer opacity-40"
        style={{
          backgroundImage: starPattern,
          backgroundSize: '200px 200px',
          animation: 'parallaxVertical 60s linear infinite',
        }}
      />
      
      {/* Fast Layer (Near) */}
      <div 
        className="star-layer opacity-60"
        style={{
          backgroundImage: starPatternNear,
          backgroundSize: '300px 300px',
          animation: 'parallaxVertical 30s linear infinite',
        }}
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020c08] opacity-80" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
}
