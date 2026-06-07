import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';

export default function MafiaHub({ roomId, playerId }) {
  const { setGameType } = useGameStore();

  useEffect(() => {
    setGameType('mafia');
    return () => {
      setGameType(null);
    };
  }, [roomId, setGameType]);

  return (
    <div className="mafia-system-root w-full h-full" style={{ height: '100dvh' }}>
      {/* MafiaHub — future shell. Routing currently in App.jsx. */}
    </div>
  );
}
