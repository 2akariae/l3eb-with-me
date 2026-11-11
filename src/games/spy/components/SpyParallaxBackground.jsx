import React from 'react';

/**
 * Next-Gen High-Performance Background
 * Static version to minimize CPU/GPU load.
 */
export function SpyParallaxBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#07050d] bg-gradient-to-tr from-[#0a0616] via-[#07050d] to-[#120a24] pointer-events-none contain-strict overflow-hidden" />
  );
}
