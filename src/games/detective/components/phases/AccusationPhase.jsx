// src/games/detective/components/phases/AccusationPhase.jsx
import React from 'react';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { WEAPONS, CLUES } from '../../constants/detectiveConstants.js';
import { WeaponCard } from '../shared/WeaponCard.jsx';
import { ClueCard } from '../shared/ClueCard.jsx';
import { writeAccusation } from '../../utils/detectiveFirebase.js';

export function AccusationPhase() {
  const { myRole, players, roomId, accusedPlayerId, accusedWeaponId, accusedClueId, detectiveAccuse } = useDetectiveStore();

  if (myRole !== 'detective') {
    return <div className="text-white text-center">The Detective is deliberating...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h2 className="text-2xl text-white">Make Your Accusation</h2>
      
      {/* Player selection */}
      <div className="flex gap-4">
        {players.map(p => (
          <button key={p.uid} onClick={() => detectiveAccuse(p.uid, accusedWeaponId, accusedClueId)} className={`p-4 rounded-xl ${accusedPlayerId === p.uid ? 'bg-[#3B9EFF]' : 'bg-[#111827]'}`}>
            {p.displayName}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {WEAPONS.map(w => (
          <WeaponCard key={w.id} weapon={w} isSelected={accusedWeaponId === w.id} 
            onClick={() => detectiveAccuse(accusedPlayerId, w.id, accusedClueId)} />
        ))}
      </div>
      <div className="flex gap-4">
        {CLUES.map(c => (
          <ClueCard key={c.id} clue={c} isSelected={accusedClueId === c.id} 
            onClick={() => detectiveAccuse(accusedPlayerId, accusedWeaponId, c.id)} />
        ))}
      </div>
      
      <button 
        onClick={() => writeAccusation(roomId, accusedPlayerId, accusedWeaponId, accusedClueId)}
        className="mt-6 px-8 py-4 bg-[#3B9EFF] text-white font-black rounded-xl uppercase"
      >
        Submit Accusation
      </button>
    </div>
  );
}
