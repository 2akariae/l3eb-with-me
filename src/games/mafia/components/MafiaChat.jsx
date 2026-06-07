// ─── THE MAFIA — MafiaChat.jsx (Cinematic Floating Chat Modal) ────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { sendMafiaChat, subscribeMafiaChat } from '../../../services/gameEngine.js';
import { Avatar } from '../../../components/ui/index.jsx';
import { vibrate, HAPTICS } from '../../../utils/haptics.js';

/* ── SVG Mafia Icon ── */
function MafiaIcon({ size = 20, color = '#e02020' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z"/>
    </svg>
  );
}

export default function MafiaChat({ user, playerId }) {
  const { roomId, players, myRole } = useGameStore();

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [unread,   setUnread]   = useState(0);
  const endRef         = useRef(null);
  const prevLenRef     = useRef(0);

  useEffect(() => {
    if (!roomId || myRole !== 'mafia') return;
    return subscribeMafiaChat(roomId, (msgs) => {
      setMessages(msgs || []);
    });
  }, [roomId, myRole]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      prevLenRef.current = messages?.length || 0;
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const newMsgs = (messages?.length || 0) - prevLenRef.current;
      if (newMsgs > 0) {
        setUnread((n) => n + newMsgs);
        vibrate(HAPTICS.NOTIFICATION);
      }
      prevLenRef.current = messages?.length || 0;
    }
  }, [messages, open]);

  if (myRole !== 'mafia') return null;

  const me = players?.[playerId];

  async function handleSend() {
    if (!input?.trim()) return;
    const text = input.trim();
    setInput('');
    vibrate(HAPTICS.TAP);
    try {
      await sendMafiaChat(roomId, playerId, me?.name ?? 'Mafia', me?.avatar, text);
    } catch { /* ignore */ }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { setOpen((v) => !v); vibrate(HAPTICS.TAP); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl relative select-none overflow-hidden"
        style={{ 
          background: 'rgba(224,32,32,0.15)', 
          border: '1px solid rgba(224,32,32,0.4)', 
          backdropFilter: 'blur(12px)',
          boxShadow: unread > 0 ? '0 0 20px rgba(224,32,32,0.4)' : 'none'
        }}
      >
        <MafiaIcon size={24} />
        {unread > 0 && (
          <span className="absolute top-2 right-2 w-5 h-5 rounded-lg bg-crimson-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg">
            {Math.min(unread, 9)}
          </span>
        )}
      </motion.button>

      {/* Chat Drawer/Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[60vh] rounded-t-[2rem] overflow-hidden flex flex-col"
            style={{ 
              background: 'linear-gradient(180deg, rgba(20,5,5,0.98) 0%, rgba(5,2,2,1) 100%)', 
              backdropFilter: 'blur(24px)', 
              borderTop: '1.5px solid rgba(224,32,32,0.4)', 
              boxShadow: '0 -10px 40px rgba(0,0,0,0.8)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-crimson-900/30">
              <span className="text-crimson-500 text-[10px] font-black uppercase tracking-[0.25em]">Mafia Underground</span>
              <button onClick={() => { setOpen(false); vibrate(HAPTICS.TAP); }} className="p-2 text-smoke-500">Close</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {(messages || []).map((msg, i) => {
                const isMe = msg?.uid === playerId;
                return (
                  <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar uid={msg?.uid} name={msg?.name} avatar={msg?.avatar} size="xs" />
                    <div className={`flex flex-col ${isMe ? 'items-end' : ''} max-w-[70%]`}>
                      <span className="text-smoke-500 text-[9px] font-bold mb-1 px-1">{msg?.name}</span>
                      <div className={`px-3 py-2 rounded-2xl text-[11px] text-white/90 ${isMe ? 'bg-crimson-900/40 rounded-tr-none' : 'bg-white/5 rounded-tl-none'}`}>
                        {msg?.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-crimson-900/20 bg-black/40">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-crimson-600/40"
                  placeholder="Whisper..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="px-4 py-3 bg-crimson-700/40 text-white rounded-xl text-xs">Send</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
