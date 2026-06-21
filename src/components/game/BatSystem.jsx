// ── BatSystem — realistic flying bats with sinusoidal paths + wing-flap ──────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// ── SVG Bat with animated wing-flap ──────────────────────────────────────────
const WING_UP_L   = 'M 22 15 C 16 8, 6 5, 0 9 C 6 14, 15 17, 22 16';
const WING_UP_R   = 'M 34 15 C 40 8, 50 5, 56 9 C 50 14, 41 17, 34 16';

function BatSVG({ size, flapDuration }) {
  const flapStyle = {
    transformOrigin: 'center',
    animation: `bat-flap ${flapDuration}s ease-in-out infinite alternate`,
  };
  return (
    <>
      <style>{`@keyframes bat-flap { from { transform: scaleY(1); } to { transform: scaleY(-0.5); } }`}</style>
      <svg width={size} height={size * 0.6} viewBox="0 0 56 34" fill="none">
        {/* Static wings — CSS animation instead of JS path morphing */}
        <g style={flapStyle}>
          <path d={WING_UP_L} fill="#26103e" stroke="#1a0830" strokeWidth="0.5" />
          <path d={WING_UP_R} fill="#26103e" stroke="#1a0830" strokeWidth="0.5" />
        </g>
        <ellipse cx="28" cy="18" rx="5.5" ry="4.5" fill="#1a0830" />
        <ellipse cx="28" cy="13" rx="4"   ry="3.5" fill="#1a0830" />
        <polygon points="24,11 21.5,7 26,10"  fill="#1a0830" />
        <polygon points="32,11 34.5,7 30,10"  fill="#1a0830" />
        <circle cx="26.5" cy="13" r="1" fill="#e02020" opacity="0.85" />
        <circle cx="29.5" cy="13" r="1" fill="#e02020" opacity="0.85" />
      </svg>
    </>
  );
}

// ── Sinusoidal keyframe generator ─────────────────────────────────────────────
function sineKeyframes(startYvh, amplitudeVh, frequency, fromRight, numPoints = 28) {
  const xs = [];
  const ys = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const xPct = fromRight ? 115 - t * 125 : -10 + t * 125;
    const y    = startYvh + amplitudeVh * Math.sin(t * frequency * Math.PI * 2);
    xs.push(`${xPct}vw`);
    ys.push(`${y}vh`);
  }
  return { xs, ys };
}

// ── Individual bat ────────────────────────────────────────────────────────────
let _batId = 0;
function makeBat() {
  const fromRight = Math.random() < 0.25;
  return {
    id:           ++_batId,
    startYVh:     5 + Math.random() * 42,
    amplitudeVh:  3 + Math.random() * 6,
    frequency:    1.2 + Math.random() * 1.8,
    duration:     7 + Math.random() * 7,     // seconds
    size:         18 + Math.random() * 22,
    flapDuration: 0.09 + Math.random() * 0.06,
    fromRight,
    opacity:      0.65 + Math.random() * 0.35,
  };
}

function Bat({ bat, onDone }) {
  const { xs, ys } = sineKeyframes(bat.startYVh, bat.amplitudeVh, bat.frequency, bat.fromRight);

  return (
    <motion.div
      key={bat.id}
      style={{
        position:      'absolute',
        top:            0,
        left:           0,
        opacity:        bat.opacity,
        pointerEvents: 'none',
        scaleX:         bat.fromRight ? -1 : 1,
      }}
      animate={{ x: xs, y: ys }}
      transition={{
        duration: bat.duration,
        ease:     'linear',
        times:    xs.map((_, i) => i / (xs.length - 1)),
      }}
      onAnimationComplete={onDone}
    >
      <BatSVG size={bat.size} flapDuration={bat.flapDuration} />
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function BatSystem({ maxBats = 4, nightOnly = true, isNight = true }) {
  const [bats, setBats] = useState([]);
  const timerRef = useRef(null);

  const removeBat = useCallback((id) => {
    setBats((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const spawnBat = useCallback(() => {
    if (!isNight && nightOnly) return;
    setBats((prev) => {
      if (prev.length >= maxBats) return prev;
      return [...prev, makeBat()];
    });
    // Schedule next spawn
    timerRef.current = setTimeout(spawnBat, 3500 + Math.random() * 7000);
  }, [isNight, nightOnly, maxBats]);

  useEffect(() => {
    if (!isNight && nightOnly) {
      setBats([]);
      return;
    }
    // Initial spawn — stagger them
    const delays = Array.from({ length: Math.min(2, maxBats) }, (_, i) => i * 1800 + Math.random() * 1000);
    const initTimers = delays.map((d) => setTimeout(spawnBat, d));
    return () => {
      initTimers.forEach(clearTimeout);
      clearTimeout(timerRef.current);
    };
  }, [isNight]);  // eslint-disable-line

  if (!bats.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
      {bats.map((bat) => (
        <Bat key={bat.id} bat={bat} onDone={() => removeBat(bat.id)} />
      ))}
    </div>
  );
}
