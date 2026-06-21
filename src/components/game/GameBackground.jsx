import React from 'react';

/**
 * GameBackground - High-performance hardware-accelerated parallax background.
 * Uses GPU-accelerated CSS animations (`translateY`, `will-change: transform`, `contain: strict`).
 */
export function GameBackground({ count = 100, paused = false }) {
  // Generate random star data based on count
  const starsFar = React.useMemo(() => generateStars(Math.floor(count * 0.6)), [count]);
  const starsNear = React.useMemo(() => generateStars(Math.floor(count * 0.4)), [count]);

  const starPatternFar = generateStarPattern(starsFar, 200);
  const starPatternNear = generateStarPattern(starsNear, 300);

  return (
    <div className={`absolute inset-0 z-[-1] overflow-hidden bg-[#020c08] pointer-events-none contain-strict ${paused ? 'paused' : ''}`}>
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
          .paused .star-layer {
            animation-play-state: paused;
          }
        `}
      </style>
      
      {/* Far layer */}
      <div 
        className="star-layer opacity-40"
        style={{
          backgroundImage: starPatternFar,
          backgroundSize: '200px 200px',
          animation: 'parallaxVertical 60s linear infinite',
        }}
      />
      
      {/* Near layer */}
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

function generateStars(n) {
  return Array.from({ length: n }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 1.5 + 0.5,
    o: Math.random() * 0.5 + 0.2
  }));
}

function generateStarPattern(stars, size) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${stars.map(s => `<circle cx='${s.x / 100 * size}' cy='${s.y / 100 * size}' r='${s.r}' fill='white' opacity='${s.o}'/>`).join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
