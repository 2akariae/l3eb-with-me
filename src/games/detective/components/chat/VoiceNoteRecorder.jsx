// src/games/detective/components/chat/VoiceNoteRecorder.jsx
import React from 'react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder.js';
import { DetectiveIcon } from '../shared/DetectiveSVGRegistry.jsx';

export function VoiceNoteRecorder() {
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();

  return (
    <button 
      onPointerDown={startRecording}
      onPointerUp={stopRecording}
      className={`p-2 rounded-full ${isRecording ? 'bg-[#DC2626]' : 'bg-[#161D2C]'}`}
    >
      <DetectiveIcon name={isRecording ? 'icon_mic_active' : 'icon_mic'} color="white" />
    </button>
  );
}
