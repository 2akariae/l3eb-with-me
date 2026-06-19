// src/games/detective/components/chat/ChatMessage.jsx
import React from 'react';

export function ChatMessage({ message }) {
  return (
    <div className={`p-2 rounded ${message.isDetective ? 'border-l-4 border-[#3B9EFF]' : ''} bg-[#161D2C]`}>
      <p className="text-xs text-white/50">{message.displayName}</p>
      <p className="text-white">{message.content}</p>
    </div>
  );
}
