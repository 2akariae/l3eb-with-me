// ── useMouseTracker ─────────────────────────────────────────────────────────
// Single global tracker: sets CSS vars on <html> for CSS-driven parallax
// AND provides spring-animated MotionValues for JS-driven effects.
// Import once at App root level; call anywhere via useMousePosition().
import { useEffect, useRef } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';

// Shared singleton values — created once, reused everywhere
let _mx = null;
let _my = null;
let _springX = null;
let _springY = null;
let _initialized = false;

const SPRING = { stiffness: 38, damping: 22, mass: 0.9 };

export function useMouseTracker() {
  // Initialise singleton MotionValues once
  if (!_mx) _mx = { set: () => {}, get: () => 0, onChange: () => () => {} };

  useEffect(() => {
    if (_initialized) return;
    _initialized = true;

    const root = document.documentElement;

    function update(cx, cy) {
      const nx = ((cx / window.innerWidth)  - 0.5) * 2;   // –1 … 1
      const ny = ((cy / window.innerHeight) - 0.5) * 2;

      // CSS variables — read by pure-CSS parallax helpers
      root.style.setProperty('--mx', nx.toFixed(4));
      root.style.setProperty('--my', ny.toFixed(4));
      root.style.setProperty('--cx', `${cx}px`);
      root.style.setProperty('--cy', `${cy}px`);
    }

    function onMouse(e) { update(e.clientX, e.clientY); }
    function onTouch(e) {
      if (e.touches[0]) update(e.touches[0].clientX, e.touches[0].clientY);
    }
    function onLeave() {
      root.style.setProperty('--mx', '0');
      root.style.setProperty('--my', '0');
    }

    window.addEventListener('mousemove',  onMouse,  { passive: true });
    window.addEventListener('touchmove',  onTouch,  { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove',  onMouse);
      window.removeEventListener('touchmove',  onTouch);
      window.removeEventListener('mouseleave', onLeave);
      _initialized = false;
    };
  }, []);
}

// ── Framer Motion spring values for JS-driven components ────────────────────
export function useSpringMouse() {
  const springX = useSpring(0, SPRING);
  const springY = useSpring(0, SPRING);
  const raf     = useRef(null);

  useEffect(() => {
    function update(nx, ny) {
      springX.set(nx);
      springY.set(ny);
    }
    function onMouse(e) {
      update(
        ((e.clientX / window.innerWidth)  - 0.5) * 2,
        ((e.clientY / window.innerHeight) - 0.5) * 2,
      );
    }
    function onTouch(e) {
      if (e.touches[0]) onMouse({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
    function onLeave() { update(0, 0); }

    window.addEventListener('mousemove',  onMouse,  { passive: true });
    window.addEventListener('touchmove',  onTouch,  { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove',  onMouse);
      window.removeEventListener('touchmove',  onTouch);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return { x: springX, y: springY };
}
