// src/components/game/CursorGlow.jsx — v2 MOBILE DISABLED
// On mobile: renders null immediately — no RAF, no blur layers, no GPU cost
// On desktop: original behavior unchanged
import { useEffect, useRef } from 'react';
import { IS_MOBILE } from '../../utils/device.js';

export function CursorGlow() {
  const outerRef = useRef(null);
  const coreRef  = useRef(null);

  useEffect(() => {
    if (IS_MOBILE) return;
    const outer = outerRef.current;
    const core  = coreRef.current;
    if (!outer || !core) return;

    outer.style.left = '-600px'; outer.style.top = '-600px';
    core.style.left  = '-600px'; core.style.top  = '-600px';

    let rafId, tx = -600, ty = -600, cx = -600, cy = -600, ox = -600, oy = -600;
    const lerp = (a, b, t) => a + (b - a) * t;

    function tick() {
      ox = lerp(ox, tx, 0.06); oy = lerp(oy, ty, 0.06);
      cx = lerp(cx, tx, 0.15); cy = lerp(cy, ty, 0.15);
      outer.style.left = `${ox}px`; outer.style.top = `${oy}px`;
      core.style.left  = `${cx}px`; core.style.top  = `${cy}px`;
      rafId = requestAnimationFrame(tick);
    }
    const onMouse = (e) => { tx = e.clientX; ty = e.clientY; };
    rafId = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMouse, { passive: true });
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('mousemove', onMouse); };
  }, []);

  if (IS_MOBILE) return null;

  return (
    <>
      <div ref={outerRef} aria-hidden="true" style={{
        position:'fixed', width:600, height:600, borderRadius:'50%',
        pointerEvents:'none', zIndex:9990, transform:'translate(-50%,-50%)',
        background:'radial-gradient(circle, rgba(110,28,215,0.08) 0%, rgba(80,10,170,0.04) 40%, transparent 70%)',
        mixBlendMode:'screen', willChange:'left, top', filter:'blur(40px)',
      }} />
      <div ref={coreRef} aria-hidden="true" style={{
        position:'fixed', width:120, height:120, borderRadius:'50%',
        pointerEvents:'none', zIndex:9991, transform:'translate(-50%,-50%)',
        background:'radial-gradient(circle, rgba(201,148,58,0.12) 0%, rgba(224,32,32,0.06) 50%, transparent 100%)',
        mixBlendMode:'plus-lighter', willChange:'left, top', filter:'blur(10px)',
      }} />
    </>
  );
}
