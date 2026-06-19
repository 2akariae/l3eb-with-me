// src/games/detective/components/phases/SetupPhase.jsx
import React from 'react';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { WEAPONS, CLUES } from '../../constants/detectiveConstants.js';
import { WeaponCard } from '../shared/WeaponCard.jsx';
import { ClueCard } from '../shared/ClueCard.jsx';
import { writeKillerSecret } from '../../utils/detectiveFirebase.js';

export function SetupPhase() {
  const { myRole, roomId, selectedWeaponId, selectedClueId, killerSelectWeapon, killerSelectClue } = useDetectiveStore();

  if (myRole !== 'killer') {
    return <div className="text-white">Waiting for the Killer...</div>;
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <h2 className="text-2xl text-white">Select Weapon & Clue</h2>
      <div className="flex gap-4">
        {WEAPONS.map(w => (
          <WeaponCard key={w.id} weapon={w} isSelected={selectedWeaponId === w.id} 
            onClick={() => { killerSelectWeapon(w.id); writeKillerSecret(roomId, w.id, selectedClueId); }} />
        ))}
      </div>
      <div className="flex gap-4">
        {CLUES.map(c => (
          <ClueCard key={c.id} clue={c} isSelected={selectedClueId === c.id} 
            onClick={() => { killerSelectClue(c.id); writeKillerSecret(roomId, selectedWeaponId, c.id); }} />
        ))}
      </div>
    </div>
  );
}
