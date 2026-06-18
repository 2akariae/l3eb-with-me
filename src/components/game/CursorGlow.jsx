// ── CursorGlow — zero-lag cursor-following radial glow ──────────────────────
// Uses direct DOM style mutations (no React state) for 60fps smoothness.
import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const elRef = useRef(null);
  const coreRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    const core = coreRef.current;
    if (!el || !core) return;

    // Start offscreen
    el.style.left = '-600px';
    el.style.top  = '-600px';
    core.style.left = '-600px';
    core.style.top  = '-600px';

    let rafId = null;
    let targetX = -600, targetY = -600;
    let curX = -600, curY = -600;
    let coreX = -600, coreY = -600;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animate() {
      // Large glow has more lag (0.06)
      curX = lerp(curX, targetX, 0.06);
      curY = lerp(curY, targetY, 0.06);
      
      // Core has less lag (0.15)
      coreX = lerp(coreX, targetX, 0.15);
      coreY = lerp(coreY, targetY, 0.15);

      el.style.left = `${curX}px`;
      el.style.top  = `${curY}px`;
      
      core.style.left = `${coreX}px`;
      core.style.top  = `${coreY}px`;

      rafId = requestAnimationFrame(animate);
    }

    function onMouse(e) { targetX = e.clientX; targetY = e.clientY; }
    function onTouch(e) {
      if (e.touches[0]) { targetX = e.touches[0].clientX; targetY = e.touches[0].clientY; }
    }

    rafId = requestAnimationFrame(animate);
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  return (
    <>
      {/* Outer Atmosphere */}
      <div
        ref={elRef}
        aria-hidden="true"
        style={{
          position:      'fixed',
          width:          600,
          height:         600,
          borderRadius:  '50%',
          pointerEvents: 'none',
          zIndex:         9990,
          transform:     'translate(-50%, -50%)',
          background:    'radial-gradient(circle, rgba(110,28,215,0.08) 0%, rgba(80,10,170,0.04) 40%, transparent 70%)',
          mixBlendMode:  'screen',
          willChange:    'left, top',
          filter:        'blur(40px)',
        }}
      />
      {/* Dynamic Core */}
      <div
        ref={coreRef}
        aria-hidden="true"
        style={{
          position:      'fixed',
          width:          120,
          height:         120,
          borderRadius:  '50%',
          pointerEvents: 'none',
          zIndex:         9991,
          transform:     'translate(-50%, -50%)',
          background:    'radial-gradient(circle, rgba(201,148,58,0.12) 0%, rgba(224,32,32,0.06) 50%, transparent 100%)',
          mixBlendMode:  'plus-lighter',
          willChange:    'left, top',
          filter:        'blur(10px)',
        }}
      />
    </>
  );
}

