// ── CursorGlow — zero-lag cursor-following radial glow ──────────────────────
// Uses direct DOM style mutations (no React state) for 60fps smoothness.
import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Start offscreen
    el.style.left = '-400px';
    el.style.top  = '-400px';

    let rafId = null;
    let targetX = -400, targetY = -400;
    let currentX = -400, currentY = -400;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animate() {
      currentX = lerp(currentX, targetX, 0.12);
      currentY = lerp(currentY, targetY, 0.12);
      el.style.left = `${currentX}px`;
      el.style.top  = `${currentY}px`;
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
    <div
      ref={elRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        width:          560,
        height:         560,
        borderRadius:  '50%',
        pointerEvents: 'none',
        zIndex:         9990,
        transform:     'translate(-50%, -50%)',
        background:    'radial-gradient(circle, rgba(110,28,215,0.13) 0%, rgba(80,10,170,0.07) 38%, transparent 72%)',
        mixBlendMode:  'screen',
        willChange:    'left, top',
      }}
    />
  );
}
