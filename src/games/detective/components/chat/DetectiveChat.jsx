// src/games/detective/components/chat/DetectiveChat.jsx
import React, { useRef, useEffect } from 'react';
import { useDetectiveStore } from '../../store/detectiveStore.js';
import { sendChatMessage } from '../../utils/detectiveFirebase.js';
import { ChatMessage } from './ChatMessage.jsx';
import { VoiceNoteRecorder } from './VoiceNoteRecorder.jsx';
import { DetectiveIcon } from '../shared/DetectiveSVGRegistry.jsx';

export function DetectiveChat() {
  const { chatMessages, roomId, myUid } = useDetectiveStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    const content = e.target.elements.message.value.trim();
    if (!content) return;
    sendChatMessage(roomId, { uid: myUid, type: 'text', content });
    e.target.reset();
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {chatMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-[rgba(255,255,255,0.06)] flex gap-2">
        <input name="message" className="flex-1 bg-[#161D2C] text-white p-2 rounded" placeholder="Type..." />
        <button type="submit"><DetectiveIcon name="icon_send" /></button>
        <VoiceNoteRecorder />
      </form>
    </div>
  );
}
