// src/games/detective/components/chat/VoiceNotePlayer.jsx
import React, { useRef, useState } from 'react';
import { DetectiveIcon } from '../shared/DetectiveSVGRegistry.jsx';

export function VoiceNotePlayer({ url }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2 bg-[#161D2C] p-2 rounded">
      <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} />
      <button onClick={togglePlay}>
        <DetectiveIcon name={isPlaying ? 'icon_pause' : 'icon_play'} />
      </button>
      <div className="text-white text-xs">Voice Note</div>
    </div>
  );
}
