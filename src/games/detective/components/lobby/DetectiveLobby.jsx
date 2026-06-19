// src/games/detective/components/lobby/DetectiveLobby.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { PlayerSlot } from './PlayerSlot.jsx';
import { DetectiveIcon } from '../shared/DetectiveSVGRegistry.jsx';

export function DetectiveLobby() {
  const { players, roomId, myUid } = useDetectiveStore();

  const count = players.length;
  const radius = 120;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-[#080B12]">
      <h2 className="text-4xl font-black uppercase text-white mb-12">Lobby ({count})</h2>
      
      {/* Circular Table (responsive layout) */}
      <div className="relative w-[300px] h-[300px] hidden md:flex items-center justify-center">
        {players.map((p, i) => {
          const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
          const cx = Math.cos(angle) * radius;
          const cy = Math.sin(angle) * radius;
          return (
            <div key={p.uid} style={{ position: 'absolute', transform: `translate(${cx}px, ${cy}px)` }}>
              <PlayerSlot player={p} isHost={p.uid === players[0]?.uid} isMe={p.uid === myUid} />
            </div>
          );
        })}
      </div>

      {/* Mobile Grid Layout */}
      <div className="md:hidden grid grid-cols-2 gap-6">
        {players.map((p) => (
          <PlayerSlot key={p.uid} player={p} isHost={p.uid === players[0]?.uid} isMe={p.uid === myUid} />
        ))}
      </div>
    </div>
  );
}
