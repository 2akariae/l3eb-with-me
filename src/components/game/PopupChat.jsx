// ─── THE MAFIA — PopupChat.jsx ────────────────────────────────────────────────
// Battle-tested floating chat modal.
// - Fixed portal: never touches page layout
// - iOS keyboard: visualViewport listener shifts panel above KB
// - Unread badge: counts msgs received while closed
// - Rapid updates: uses useRef for stable prev-length tracking
// - Draggable toggle button (thumb-reachable)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronDown } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { subscribeChat, sendChatMessage } from '../../services/gameEngine.js';

// ── Initials avatar (no external dep) ────────────────────────────────────────
const COLORS = ['#7c3aed','#dc2626','#059669','#d97706','#2563eb','#db2777'];
function getColor(uid = '') {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function MiniAvatar({ uid, name }) {
  return (
    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white"
      style={{ background: getColor(uid) }}>
      {(name ?? '?').slice(0,1).toUpperCase()}
    </div>
  );
}

export function PopupChat({ playerId, label = 'Chat', accentColor = '#c9943a', gameTypeOverride }) {
  const { roomId, players, gameType: storeGameType } = useGameStore();
  const gameType = gameTypeOverride || storeGameType;

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [unread,   setUnread]   = useState(0);
  const [kbOffset, setKbOffset] = useState(0);
  const [sending,  setSending]  = useState(false);

  const endRef      = useRef(null);
  const inputRef    = useRef(null);
  const prevLenRef  = useRef(0);
  const openRef     = useRef(false);  // stable ref to avoid stale closure in subscription

  // keep openRef in sync
  useEffect(() => { openRef.current = open; }, [open]);

  // ── Firebase subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !gameType) return;
    const unsub = subscribeChat(roomId, (msgs) => {
      setMessages(msgs);

      // Unread counter — only count if panel is closed
      if (!openRef.current) {
        const newCount = msgs.length - prevLenRef.current;
        if (newCount > 0) setUnread((u) => u + newCount);
      }
      prevLenRef.current = msgs.length;
    }, gameType);
    return unsub;
  }, [roomId, gameType]);

  // ── Scroll to bottom when panel opens or new message arrives ─────────────
  useEffect(() => {
    if (!open) return;
    // Small delay so the animation has started before we scroll
    const t = setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(t);
  }, [messages, open]);

  // ── Clear unread + focus input when opened ────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      prevLenRef.current = messages.length;
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]); // eslint-disable-line

  // ── iOS keyboard: visualViewport ──────────────────────────────────────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function onVPChange() {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset);
    }
    vv.addEventListener('resize', onVPChange);
    vv.addEventListener('scroll', onVPChange);
    return () => {
      vv.removeEventListener('resize', onVPChange);
      vv.removeEventListener('scroll', onVPChange);
    };
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !gameType) return;
    const me = players[playerId];
    setSending(true);
    setInput('');
    try {
      await sendChatMessage(roomId, playerId, me?.name ?? 'Player', me?.avatar ?? '', text, gameType);
    } catch (e) {
      console.error('[PopupChat] send failed:', e);
      setInput(text); // restore on failure
    } finally {
      setSending(false);
    }
  }, [input, sending, roomId, playerId, players, gameType]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  return (
    <>
      {/* ── Draggable toggle FAB ─────────────────────────────────────────── */}
      <motion.button
        drag
        dragConstraints={{ top: -500, bottom: 0, left: -260, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        whileTap={{ scale: 0.88 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-28 right-4 z-[60] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl select-none"
        style={{
          background:     `${accentColor}20`,
          border:         `1px solid ${accentColor}60`,
          backdropFilter: 'blur(12px)',
          color:          accentColor,
          touchAction:    'none',
        }}
      >
        {open
          ? <ChevronDown size={19} strokeWidth={2.5} />
          : <MessageSquare size={19} strokeWidth={2} />
        }

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-black"
              style={{ background: accentColor }}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup-chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed z-[59] flex flex-col"
            style={{
              bottom:         `calc(5.5rem + ${kbOffset}px)`,
              right:          '1rem',
              left:           '1rem',
              maxWidth:       '340px',
              marginLeft:     'auto',
              height:         'min(58vh, 420px)',
              background:     'rgba(6,3,18,0.97)',
              border:         `1px solid ${accentColor}30`,
              borderRadius:   '1.5rem',
              backdropFilter: 'blur(28px)',
              boxShadow:      `0 16px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px ${accentColor}0d`,
              overflow:       'hidden',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <motion.div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: accentColor }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }} />
                <span className="text-xs font-black uppercase tracking-widest"
                  style={{ color: accentColor }}>
                  {label}
                </span>
                {messages.length > 0 && (
                  <span className="text-[9px] font-bold text-smoke-600">
                    {messages.length}
                  </span>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-smoke-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <X size={13} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0"
              style={{ overscrollBehavior: 'contain' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                  <MessageSquare size={28} strokeWidth={1.5} color="white" />
                  <p className="text-white text-xs font-bold">No messages yet</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.uid === playerId;
                  return (
                    <motion.div key={msg.id ?? i}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      {!isMe && <MiniAvatar uid={msg.uid} name={msg.name} />}
                      <div className={`flex flex-col gap-0.5 max-w-[76%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[9px] font-black text-smoke-600 uppercase tracking-wider pl-1">
                            {msg.name}
                          </span>
                        )}
                        <div className="px-3 py-2 text-xs font-bold leading-snug"
                          style={{
                            background: isMe ? accentColor : 'rgba(255,255,255,0.08)',
                            color:      isMe ? '#0a0514'   : 'white',
                            borderRadius: isMe ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
                            border:     isMe ? 'none' : '1px solid rgba(255,255,255,0.07)',
                          }}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-2.5 flex gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <input
                ref={inputRef}
                className="flex-1 h-10 rounded-2xl px-4 text-white text-sm font-bold outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                maxLength={200}
                autoComplete="off"
              />
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center disabled:opacity-30 transition-opacity"
                style={{ background: accentColor }}>
                <Send size={14} strokeWidth={2.5} color="#0a0514" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PopupChat;
