// src/hooks/useMouseTracker.js — v3 MOBILE OPTIMIZED
// Key changes:
//   1. useSpringMouse() is now a TRUE singleton — one shared spring pair for the whole app
//   2. On IS_MOBILE: returns frozen motionValue(0,0) — zero listeners, zero springs
//   3. useMouseTracker() CSS-var tracker also disabled on mobile
import { useEffect } from 'react';
import { useSpring, motionValue } from 'framer-motion';
import { IS_MOBILE } from '../utils/device.js';

// ── CSS var tracker ────────────────────────────────────────────────────────────
let _cssInit = false;
export function useMouseTracker() {
  useEffect(() => {
    if (IS_MOBILE || _cssInit) return;
    _cssInit = true;
    const root = document.documentElement;
    const onMouse = (e) => {
      root.style.setProperty('--mx', (((e.clientX / window.innerWidth) - 0.5) * 2).toFixed(4));
      root.style.setProperty('--my', (((e.clientY / window.innerHeight) - 0.5) * 2).toFixed(4));
      root.style.setProperty('--cx', `${e.clientX}px`);
      root.style.setProperty('--cy', `${e.clientY}px`);
    };
    const onLeave = () => { root.style.setProperty('--mx','0'); root.style.setProperty('--my','0'); };
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mouseleave', onLeave);
      _cssInit = false;
    };
  }, []);
}

// ── Singleton spring pair ──────────────────────────────────────────────────────
// Frozen zeros for mobile — real springs for desktop, shared across all components
let _sx = null;
let _sy = null;
let _bound = false;

export function useSpringMouse() {
  // Mobile: return frozen MotionValues, never update
  if (IS_MOBILE) {
    if (!_sx) { _sx = motionValue(0); _sy = motionValue(0); }
    return { x: _sx, y: _sy };
  }

  // Desktop: create springs (only the first caller creates them)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sx = useSpring(0, { stiffness: 38, damping: 22, mass: 0.9 });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sy = useSpring(0, { stiffness: 38, damping: 22, mass: 0.9 });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (_bound) return;
    _bound = true;
    _sx = sx; _sy = sy;
    const move = (e) => {
      _sx.set(((e.clientX / window.innerWidth)  - 0.5) * 2);
      _sy.set(((e.clientY / window.innerHeight) - 0.5) * 2);
    };
    const leave = () => { _sx.set(0); _sy.set(0); };
    window.addEventListener('mousemove', move,  { passive: true });
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', leave);
      _bound = false; _sx = null; _sy = null;
    };
  }, [sx, sy]);

  return { x: sx, y: sy };
}
