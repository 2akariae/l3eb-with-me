// src/components/game/SpyBackground.jsx — v2 MOBILE OPTIMIZED
// Replaces 20 individual motion.div stars with a single canvas RAF loop
import React, { useRef, useEffect } from 'react';
import { IS_MOBILE } from '../../utils/device.js';

function CanvasSpyStars() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const stars = Array.from({ length: 20 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1 + 0.5,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
    let t = 0, raf;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of stars) {
        const o = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.5 + s.phase));
        s.y -= s.speed;
        if (s.y < -5) { s.y = window.innerHeight + 5; s.x = Math.random() * window.innerWidth; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${o.toFixed(2)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />;
}

export function SpyBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020c08]">
      <CanvasSpyStars />
    </div>
  );
}
