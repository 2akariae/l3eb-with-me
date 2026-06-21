import React from 'react';

/**
 * GameBackground - Ultra-high performance hardware-accelerated starfield.
 * Isolated from layout engine via contain: strict.
 * Animated purely via compositor-thread transforms.
 */
export function GameBackground({ count = 80 }) {
  const starsFar = React.useMemo(() => generateStars(Math.floor(count * 0.6), 2), [count]);
  const starsNear = React.useMemo(() => generateStars(Math.floor(count * 0.4), 3), [count]);

  return (
    <div 
      className="fixed inset-0 z-[-10] overflow-hidden bg-[#03020a] pointer-events-none"
      style={{ contain: 'strict' }}
    >
      <style>
        {`
          @keyframes matrix-float {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(0, -50%, 0); }
          }
          @keyframes star-pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
          .star-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200%;
            will-change: transform;
            background-repeat: repeat;
          }
        `}
      </style>

      {/* Far Matrix */}
      <div 
        className="star-layer"
        style={{
          backgroundImage: starsFar,
          backgroundSize: '300px 300px',
          animation: 'matrix-float 120s linear infinite',
        }}
      />

      {/* Near Matrix */}
      <div 
        className="star-layer"
        style={{
          backgroundImage: starsNear,
          backgroundSize: '450px 450px',
          animation: 'matrix-float 60s linear infinite',
        }}
      />

      {/* Radial Depth Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,2,10,0.8)_80%)]" />
      
      {/* Dynamic Glows */}
      <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-900/10 blur-[120px] animate-pulse" />
      <div className="absolute -bottom-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-purple-900/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

function generateStars(n, maxR) {
  const size = 400;
  const stars = Array.from({ length: n }, () => ({
    x: Math.random() * size,
    y: Math.random() * size,
    r: Math.random() * maxR + 0.5,
    o: Math.random() * 0.6 + 0.2
  }));

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    ${stars.map(s => `<circle cx='${s.x}' cy='${s.y}' r='${s.r}' fill='white' opacity='${s.o}'/>`).join('')}
  </svg>`;
  
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
