// src/games/detective/components/resolution/ResolutionScreen.jsx
import React from 'react';
import { useDetectiveStore } from '../../store/detectiveStore.js';

export function ResolutionScreen() {
  const { resolution } = useDetectiveStore();

  if (!resolution) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#080B12] text-white">
      <h1 className="text-6xl font-black uppercase mb-4">{resolution.winner === 'detective' ? 'Detective Wins!' : 'Killer Wins!'}</h1>
      <p className="text-xl">{resolution.reason}</p>
    </div>
  );
}
