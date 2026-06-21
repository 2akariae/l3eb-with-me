// ── HauntedHouseBg — fully reactive, immersive scene background ───────────────
import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useSpringMouse } from '../../hooks/useMouseTracker.js';
import { BatSystem } from './BatSystem.jsx';
import { IS_MOBILE } from '../../utils/device.js';

// ── Star twinkle layer (parallax via spring values) ───────────────────────────
function StarLayer({ count, px, py, speed, topMax = 55 }) {
  // Mobile: render a single SVG background — zero motion.div elements
  if (IS_MOBILE) {
    const svgStars = useMemo(() => {
      const dots = Array.from({ length: count }, () => {
        const x = (Math.random() * 100).toFixed(1);
        const y = (Math.random() * topMax).toFixed(1);
        const r = Math.random() < 0.06 ? 1.5 : Math.random() < 0.22 ? 1 : 0.5;
        const o = (0.15 + Math.random() * 0.55).toFixed(2);
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${o}"/>`;
      });
      return `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 ${topMax}'>${dots.join('')}</svg>`
      )}")`;
    }, [count, topMax]);
    return (
      <div className="absolute inset-0" style={{
        backgroundImage: svgStars,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }} />
    );
  }

  // Desktop: original motion.div stars
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id:    i,
      left:  Math.random() * 100,
      top:   Math.random() * topMax,
      size:  Math.random() < 0.06 ? 3 : Math.random() < 0.22 ? 2 : 1,
      dur:   1.6 + Math.random() * 3.5,
      delay: Math.random() * 5,
    })),
  [count]);
  const x = useTransform(px, [-1, 1], [speed * 22, -speed * 22]);
  const y = useTransform(py, [-1, 1], [speed * 14, -speed * 14]);
  return (
    <motion.div className="absolute inset-0" style={{ x, y }}>
      {stars.map((s) => (
        <motion.div key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.1, s.size > 1 ? 1 : 0.55, 0.1] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </motion.div>
  );
}

// ── Moonlight beam that radiates from the moon ─────────────────────────────────
function MoonlightBeam() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top:   '0%',
        right: '8%',
        width:  160,
        height: '70%',
        background: 'linear-gradient(180deg, rgba(245,220,120,0.07) 0%, transparent 100%)',
        transformOrigin: 'top center',
        transform: 'rotate(8deg)',
      }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Animated clouds (day only) ─────────────────────────────────────────────────
function DayClouds({ px, py }) {
  const x = useTransform(px, [-1, 1], [8, -8]);
  const y = useTransform(py, [-1, 1], [4, -4]);
  return (
    <motion.div className="absolute inset-0 opacity-40" style={{ x, y }}>
      {[
        { top: '8%',  left: '8%',  w: 150, h: 42, spd: 22 },
        { top: '13%', left: '52%', w: 95,  h: 30, spd: 28 },
        { top: '5%',  left: '72%', w: 120, h: 36, spd: 18 },
      ].map((c, i) => (
        <motion.div key={i}
          className="absolute rounded-full bg-white blur-2xl"
          style={{ top: c.top, left: c.left, width: c.w, height: c.h }}
          animate={{ x: [0, 14, 0] }}
          transition={{ duration: c.spd, repeat: Infinity, ease: 'easeInOut', delay: i * 4 }}
        />
      ))}
    </motion.div>
  );
}

// ── House SVG scene ────────────────────────────────────────────────────────────
function HouseScene({ isNight }) {
  const winFill = isNight ? '#d08820' : '#4878b4';

  return (
    <svg viewBox="0 0 390 320" preserveAspectRatio="xMidYMax meet" className="w-full h-full">
      {/* Left fence */}
      <g fill="#110720">
        <rect x="0" y="222" width="78" height="5" />
        {[8,18,28,38,48,58,68].map((x) => (
          <g key={x}>
            <rect x={x} y="202" width="4" height="25" />
            <polygon points={`${x+2},198 ${x},202 ${x+4},202`} />
          </g>
        ))}
        {/* Skull */}
        <ellipse cx="16" cy="214" rx="7" ry="6.5" fill="#1c0c28" />
        <rect x="12" y="219" width="3" height="4" />
        <rect x="17" y="219" width="3" height="4" />
        <circle cx="14" cy="212" r="1.4" fill="#0b0418" />
        <circle cx="18" cy="212" r="1.4" fill="#0b0418" />
        {/* Tombstone */}
        <rect x="32" y="206" width="18" height="20" rx="9" fill="#180a26" />
        <text x="41" y="220" textAnchor="middle" fontSize="6" fill="#2c1844" fontFamily="serif">RIP</text>
      </g>

      {/* Right fence */}
      <g fill="#110720">
        <rect x="312" y="222" width="78" height="5" />
        {[315,325,335,345,355,365,375].map((x) => (
          <g key={x}>
            <rect x={x} y="202" width="4" height="25" />
            <polygon points={`${x+2},198 ${x},202 ${x+4},202`} />
          </g>
        ))}
        {/* Pumpkin */}
        <ellipse cx="368" cy="219" rx="10" ry="9" fill="#aa4200" />
        <rect x="367" y="211" width="3" height="3" fill="#1e3a16" />
        <polygon points="362,216 364,219 362,222" fill="#0b0418" />
        <polygon points="372,216 374,219 372,222" fill="#0b0418" />
        <path d="M364 221 Q368 225 374 221" stroke="#0b0418" strokeWidth="1.5" fill="none" />
        {isNight && (
          <motion.ellipse cx="368" cy="219" rx="10" ry="9" fill="none"
            stroke="rgba(200,80,0,0.5)" strokeWidth="1"
            animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        )}
      </g>

      {/* Power poles & wires */}
      <g fill="#110720" stroke="#110720">
        <rect x="58" y="138" width="5" height="104" />
        <rect x="48" y="154" width="25" height="4" />
        <circle cx="48" cy="156" r="2" fill="#1c1228" />
        <circle cx="73" cy="156" r="2" fill="#1c1228" />
        <path d="M48 156 Q120 174 194 164" strokeWidth="1.4" fill="none" />
        <path d="M73 156 Q138 177 208 167" strokeWidth="1.4" fill="none" />
      </g>

      {/* Left small house */}
      <g fill="#0e0618">
        <rect x="18" y="200" width="60" height="57" />
        <polygon points="18,200 48,168 78,200" />
        <rect x="33" y="215" width="18" height="24" rx="9" fill={winFill} opacity="0.85" />
        <line x1="42" y1="215" x2="42" y2="239" stroke="#180928" strokeWidth="1.2" />
        <line x1="33" y1="227" x2="51" y2="227" stroke="#180928" strokeWidth="1.2" />
        {isNight && (
          <motion.rect x="33" y="215" width="18" height="24" rx="9" fill="#ffcc44"
            animate={{ opacity: [0, 0.2, 0, 0.15, 0] }}
            transition={{ duration: 6, repeat: Infinity, times: [0,0.12,0.55,0.75,1] }} />
        )}
      </g>

      {/* Main tower */}
      <g fill="#0a0514">
        <rect x="128" y="178" width="134" height="165" />
        {/* Witch-hat */}
        <polygon points="195,50 128,178 262,178" />
        <polygon points="195,40 191,56 199,56" fill="#120720" />
        <polygon points="195,30 188,47 202,47" fill="#120720" />
        {/* Roof peaks */}
        <polygon points="128,178 154,158 180,178" fill="#130820" />
        <polygon points="210,178 236,158 262,178" fill="#130820" />
        {/* Top arch window */}
        <rect x="178" y="128" width="34" height="44" rx="17" fill={winFill} opacity="0.88" />
        <line x1="195" y1="128" x2="195" y2="172" stroke="#16082a" strokeWidth="1.5" />
        <line x1="178" y1="150" x2="212" y2="150" stroke="#16082a" strokeWidth="1.5" />
        {isNight && (
          <motion.rect x="178" y="128" width="34" height="44" rx="17" fill="#ffcc44"
            animate={{ opacity: [0, 0.22, 0, 0.16, 0] }}
            transition={{ duration: 5, repeat: Infinity, times: [0,0.1,0.5,0.7,1] }} />
        )}
        {/* Side windows */}
        {[{ x: 138, y: 218 }, { x: 224, y: 218 }].map((w, i) => (
          <g key={i}>
            <rect x={w.x} y={w.y} width="28" height="32" rx="4" fill={winFill} opacity="0.8" />
            <line x1={w.x+14} y1={w.y} x2={w.x+14} y2={w.y+32} stroke="#16082a" strokeWidth="1.2" />
            <line x1={w.x}    y1={w.y+16} x2={w.x+28} y2={w.y+16} stroke="#16082a" strokeWidth="1.2" />
          </g>
        ))}
        {/* Door window */}
        <rect x="162" y="248" width="66" height="95" rx="33" fill={isNight ? '#e09030' : '#3d6898'} opacity="0.9" />
        {isNight && (
          <motion.rect x="162" y="248" width="66" height="95" rx="33" fill="#ffaa20"
            animate={{ opacity: [0.32, 0.6, 0.32] }}
            transition={{ duration: 3.5, repeat: Infinity }} />
        )}
        <line x1="195" y1="248" x2="195" y2="343" stroke="#16082a" strokeWidth="1.5" />
      </g>

      {/* Night fog */}
      {isNight && (
        <motion.rect x="-40" y="290" width="480" height="30" rx="15"
          fill="rgba(70,15,130,0.15)"
          animate={{ x: [0, 18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      )}

      {/* Ground */}
      <rect x="0" y="302" width="390" height="20" fill="#0a0514" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function HauntedHouseBg({ isNight = false }) {
  const { x: px, y: py } = useSpringMouse();

  // Sky gradients
  const skyNight = 'linear-gradient(180deg,#09031c 0%,#1c0740 30%,#2b1052 70%,#381860 100%)';
  const skyDay   = 'linear-gradient(180deg,#2860a8 0%,#4a94de 28%,#80baf8 58%,#c4def8 100%)';

  // Parallax transforms for house layer
  const houseX = useTransform(px, [-1, 1], [10, -10]);
  const houseY = useTransform(py, [-1, 1], [5,  -5]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

      {/* ── 1. Sky ───────────────────────────────────────────────────── */}
      <motion.div className="absolute inset-0"
        animate={{ background: isNight ? skyNight : skyDay }}
        transition={{ duration: 2.2, ease: 'easeInOut' }}
      />

      {/* ── 2. Day clouds ────────────────────────────────────────────── */}
      {!isNight && <DayClouds px={px} py={py} />}

      {/* ── 3. Stars (3 parallax layers, night only) ──────────────────── */}
      {isNight && (
        <>
          <StarLayer count={65} px={px} py={py} speed={0.22} />
          <StarLayer count={32} px={px} py={py} speed={0.58} />
          <StarLayer count={14} px={px} py={py} speed={1.10} />
        </>
      )}

      {/* ── 4. Moon ──────────────────────────────────────────────────── */}
      {isNight && (
        <>
          <motion.div className="absolute rounded-full"
            style={{
              width: 78, height: 78, top: '9%', right: '10%',
              background: 'radial-gradient(circle at 38% 35%, #fffcee 0%, #f5d878 55%, #c89010 100%)',
              boxShadow: '0 0 32px 14px rgba(245,216,118,0.28), 0 0 80px 36px rgba(245,216,118,0.1)',
            }}
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.3, ease: [0.22,1,0.36,1] }}
          />
          <MoonlightBeam />
        </>
      )}

      {/* ── 5. Night atmosphere ──────────────────────────────────────── */}
      {isNight && (
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0.18, 0.32, 0.18] }}
          transition={{ duration: 7, repeat: Infinity }}
          style={{ background: 'radial-gradient(ellipse at 72% 18%, rgba(140,35,225,0.38) 0%, transparent 62%)' }}
        />
      )}

      {/* ── 6. Bats ──────────────────────────────────────────────────── */}
      <BatSystem isNight={isNight} maxBats={isNight ? 4 : 1} nightOnly={false} />

      {/* ── 7. House (mid parallax) ───────────────────────────────────── */}
      <motion.div className="absolute bottom-0 left-0 right-0" style={{ height: '62%', x: houseX, y: houseY }}>
        <HouseScene isNight={isNight} />
      </motion.div>

      {/* ── 8. Night vignette ────────────────────────────────────────── */}
      {isNight && (
        <motion.div className="absolute inset-0"
          animate={{ opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(6,1,18,0.65) 100%)' }}
        />
      )}

      {/* ── 9. Day sunlight glow ─────────────────────────────────────── */}
      {!isNight && (
        <motion.div className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,240,180,0.3) 0%, transparent 55%)' }}
        />
      )}
    </div>
  );
}

export default React.memo(HauntedHouseBg, (prev, next) => prev.isNight === next.isNight);
