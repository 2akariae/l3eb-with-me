// src/components/game/ParallaxStars.jsx — v3 MOBILE OPTIMIZED
// Mobile: single <canvas> RAF loop — zero Framer Motion, zero compositor layers
// Desktop: original 3-layer SVG background-image approach (not individual divs)
import React, { useRef, useEffect, useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useSpringMouse } from '../../hooks/useMouseTracker.js';
import { IS_MOBILE } from '../../utils/device.js';

// ── Mobile canvas renderer ────────────────────────────────────────────────────
function CanvasStars({ count = 100 }) {
  const canvasRef = useRef(null);
  const starsRef  = useRef([]);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    starsRef.current = Array.from({ length: count }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() < 0.05 ? 1.5 : Math.random() < 0.2 ? 1 : 0.5,
      speed: 0.02 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      freq:  0.3 + Math.random() * 0.7,
    }));

    let t = 0;
    function draw() {
      t += 0.016;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of starsRef.current) {
        const opacity = 0.15 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.freq + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(2)})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'auto' }}
    />
  );
}

// ── Desktop SVG-bg layer (no individual divs) ─────────────────────────────────
function makeSVGStars(n) {
  const W = 400, H = 400;
  const dots = Array.from({ length: n }, () => {
    const x = (Math.random() * W).toFixed(1);
    const y = (Math.random() * H).toFixed(1);
    const r = Math.random() < 0.05 ? 1.5 : Math.random() < 0.2 ? 1 : 0.5;
    const o = (0.2 + Math.random() * 0.6).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${o}"/>`;
  });
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>${dots.join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function DesktopLayer({ bgImage, size, duration, px, py, speedX, speedY }) {
  const x = useTransform(px, [-1, 1], [speedX, -speedX]);
  const y = useTransform(py, [-1, 1], [speedY, -speedY]);
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x, y,
        backgroundImage: bgImage,
        backgroundSize: size,
        backgroundRepeat: 'repeat',
        willChange: 'transform',
        animation: `matrix-float ${duration}s linear infinite`,
      }}
    />
  );
}

export function ParallaxStars({ count = 100, paused = false }) {
  const { x: px, y: py } = useSpringMouse();

  const [far, mid, near] = useMemo(() => [
    makeSVGStars(Math.floor(count * 0.55)),
    makeSVGStars(Math.floor(count * 0.30)),
    makeSVGStars(Math.floor(count * 0.15)),
  ], [count]);

  if (IS_MOBILE) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <CanvasStars count={Math.min(count, 60)} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes matrix-float {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(0,-50%,0); }
        }
      `}</style>
      <DesktopLayer bgImage={far}  size="300px 300px" duration={120} px={px} py={py} speedX={paused?0:8}  speedY={paused?0:5}  />
      <DesktopLayer bgImage={mid}  size="400px 400px" duration={80}  px={px} py={py} speedX={paused?0:18} speedY={paused?0:11} />
      <DesktopLayer bgImage={near} size="500px 500px" duration={50}  px={px} py={py} speedX={paused?0:30} speedY={paused?0:18} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: paused ? 'transparent' : 'radial-gradient(ellipse, rgba(88,22,195,0.14) 0%, transparent 70%)' }} />
    </div>
  );
}
