// ── ParallaxStars — three-layer parallax star field for dark screens ──────────
import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useSpringMouse } from '../../hooks/useMouseTracker.js';

function Star({ left, top, size, dur, delay }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
      animate={{ opacity: [0.08, size > 1 ? 0.95 : 0.5, 0.08], scale: [1, size > 2 ? 2.2 : 1.4, 1] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function StarLayer({ stars, px, py, speedX, speedY }) {
  const x = useTransform(px, [-1, 1], [speedX, -speedX]);
  const y = useTransform(py, [-1, 1], [speedY, -speedY]);
  return (
    <motion.div className="absolute inset-0 will-change-transform" style={{ x, y }}>
      {stars.map((s) => <Star key={s.id} {...s} />)}
    </motion.div>
  );
}

function makeStars(n) {
  return Array.from({ length: n }, (_, i) => ({
    id:    i,
    left:  Math.random() * 100,
    top:   Math.random() * 100,
    size:  Math.random() < 0.05 ? 3 : Math.random() < 0.2 ? 2 : 1,
    dur:   1.8 + Math.random() * 3.8,
    delay: Math.random() * 5.5,
  }));
}

export function ParallaxStars({ count = 100, paused = false }) {
  const { x: px, y: py } = useSpringMouse();

  const [far, mid, near] = useMemo(() => [
    makeStars(Math.floor(count * 0.55)),
    makeStars(Math.floor(count * 0.30)),
    makeStars(Math.floor(count * 0.15)),
  ], [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${paused ? 'paused' : ''}`}>
      {/* Far layer — barely moves (deepest) */}
      <StarLayer stars={far}  px={px} py={py} speedX={paused ? 0 : 8}  speedY={paused ? 0 : 5} />
      {/* Mid layer */}
      <StarLayer stars={mid}  px={px} py={py} speedX={paused ? 0 : 18} speedY={paused ? 0 : 11} />
      {/* Near layer — moves most (closest to camera) */}
      <StarLayer stars={near} px={px} py={py} speedX={paused ? 0 : 30} speedY={paused ? 0 : 18} />
      {/* Nebula */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: paused ? 'transparent' : 'radial-gradient(ellipse, rgba(88,22,195,0.14) 0%, transparent 70%)' }} />
    </div>
  );
}
