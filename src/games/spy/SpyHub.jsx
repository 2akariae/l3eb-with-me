import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';

export default function SpyHub({ roomId, playerId }) {
  const { setGameType } = useGameStore();

  useEffect(() => {
    setGameType('spy');
    return () => {
      setGameType(null);
    };
  }, [roomId, setGameType]);

  return (
    <div className="spy-system-root w-full h-full bg-slate-900" style={{ height: '100dvh' }}>
      {/* SpyHub — future shell. Routing currently in App.jsx. */}
    </div>
  );
}
