// src/games/detective/components/phases/WitnessPhase.jsx
import React from 'react';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { writeWitnessAck } from '../../utils/detectiveFirebase.js';

export function WitnessPhase() {
  const { myRole, roomId } = useDetectiveStore();

  if (myRole !== 'witness') {
    return <div className="text-white">The witness is reviewing the evidence...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 bg-[#111827] rounded-3xl border-2 border-[#F59E0B]">
      <h2 className="text-3xl font-black text-[#F59E0B] mb-6">Secret Briefing</h2>
      <p className="text-white mb-8 text-center max-w-sm">You have seen the killer's secret! The killer chose weapon ID: [hidden] and clue ID: [hidden].</p>
      <button 
        onClick={() => writeWitnessAck(roomId)}
        className="px-8 py-4 bg-[#F59E0B] text-black font-black rounded-xl uppercase tracking-widest"
      >
        Acknowledge
      </button>
    </div>
  );
}
