// src/games/detective/components/phases/DiscussionPhase.jsx
import React from 'react';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { DetectiveChat } from '../chat/DetectiveChat.jsx';
import { DetectiveTimer } from '../shared/DetectiveTimer.jsx';

export function DiscussionPhase() {
  const { phaseDeadline } = useDetectiveStore();
  
  return (
    <div className="flex h-[100dvh] w-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-4xl font-black text-white mb-6 uppercase">Discussion</h2>
        <DetectiveTimer deadline={phaseDeadline} totalDuration={180000} />
      </div>
      <div className="w-80 border-l border-[rgba(255,255,255,0.06)]">
        <DetectiveChat />
      </div>
    </div>
  );
}
