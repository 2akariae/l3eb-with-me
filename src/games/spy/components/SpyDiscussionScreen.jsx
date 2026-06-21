// ─── THE SPY — SpyDiscussionScreen.jsx (v8) ──────────────────────────────────
// FIX: word/category bilingual resolution (objects { en, ar }).
// FIX: import advanceToVoting from services/gameEngine (not useMafiaEngine).
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { advanceToVoting, sendChatMessage, subscribeChat } from '../../../services/gameEngine.js';
import { TimerRing, Avatar, toast } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { MessageSquare, Users, Info, Send, Terminal, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import { SpyBackground } from '../../../components/game/SpyBackground.jsx';

export default function SpyDiscussionScreen({ user, playerId }) {
  const { roomId, isHost, players, myRole, gameState, language } = useGameStore();
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [activeTab, setTab]     = useState('chat');
  const t    = useTranslation(language);
  const isAr = language === 'ar';
  const isSpy = myRole === 'spy';

  const { remaining } = useTimer(gameState, async () => {
    if (isHost) await advanceToVoting(roomId, 'spy');
  });

  useEffect(() => {
    if (!roomId) return;
    return subscribeChat(roomId, setMessages, 'spy');
  }, [roomId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      const me = players[playerId];
      await sendChatMessage(roomId, playerId, me?.name || 'Player', me?.avatar, text, 'spy');
    } catch (e) { toast(e.message, 'error'); }
  };

  // Resolve bilingual game data
  const displayWord = typeof gameState?.word === 'object' ? (gameState?.word?.[language] ?? gameState?.word?.en ?? '') : (gameState?.word ?? '');
  const displayHint = typeof gameState?.hint === 'object' ? (gameState?.hint?.[language] ?? gameState?.hint?.en ?? '') : (gameState?.hint ?? '');

  const alivePlayers = Object.entries(players).filter(([, p]) => p.isAlive);

  return (
    <div className="screen bg-noir-950 flex flex-col overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <SpyBackground />
      {/* Header */}
      <div className="px-6 pt-safe pt-16 pb-4 border-b border-white/5 bg-black/20 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSpy ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <h1 className="display text-lg font-black text-white uppercase tracking-tight">
              {t('operationalDebrief')}
            </h1>
          </div>
          <TimerRing remaining={remaining} total={180} size={44} color={isSpy ? '#10b981' : '#3b82f6'} strokeWidth={3} />
        </div>

        <motion.div
          initial={{ y: 10, opacity: 0 }} animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-2xl border flex items-center justify-between ${
            isSpy ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-black/40 ${isSpy ? 'text-emerald-500' : 'text-blue-500'}`}>
              <Info size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">
                {isSpy ? t('wordHint').toUpperCase() : t('secretWordIs').toUpperCase()}
              </p>
              <p className="text-white font-black text-sm tracking-wide">
                {isSpy ? displayHint : displayWord}
              </p>
            </div>
          </div>
          {!isSpy && displayHint && (
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{t('wordHint').toUpperCase()}</p>
              <p className="text-blue-400 font-bold text-[10px]">{displayHint}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 py-2 gap-2 bg-black/10 border-b border-white/5">
        {[
          { id: 'chat',    label: t('comms'),  Icon: MessageSquare },
          { id: 'players', label: t('roster'), Icon: Users },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === id ? 'bg-white/10 text-white border border-white/10' : 'text-smoke-600'
            }`}>
            <Icon size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div key="chat" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center gap-4">
                    <Terminal size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                      {isAr ? 'القناة مشفرة. ابدأ الإرسال...' : 'Channel Encrypted. Start transmitting...'}
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.uid === playerId;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar uid={msg.uid} name={msg.name} avatar={msg.avatar} size="xs" />
                      <div className={`flex flex-col ${isMe ? 'items-end' : ''} max-w-[75%]`}>
                        <span className="text-smoke-600 text-[9px] font-black mb-1 px-1">{msg.name}</span>
                        <div className={`px-4 py-2.5 rounded-[1.25rem] text-xs text-white/90 leading-relaxed shadow-sm ${
                          isMe ? 'bg-white/10 border border-white/10 rounded-tr-none' : 'bg-white/5 border border-white/5 rounded-tl-none'
                        }`}>{msg.text}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md flex gap-2">
                <input
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white placeholder-smoke-700 outline-none focus:border-white/20 transition-all"
                  placeholder={isAr ? 'اكتب رسالة...' : 'Type transmission...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend} disabled={!input.trim()}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    input.trim() ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-smoke-800'
                  }`}>
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="players" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="absolute inset-0 p-6 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 gap-3">
                {alivePlayers.map(([uid, p]) => (
                  <div key={uid} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-4">
                      <Avatar uid={uid} name={p.name} avatar={p.avatar} size="sm" />
                      <div>
                        <p className="text-white font-black text-sm">{p.name}</p>
                        <p className="text-smoke-600 text-[9px] font-black uppercase tracking-widest">
                          {uid === playerId ? (isAr ? 'أنت' : 'YOU') : (isAr ? 'عميل' : 'OPERATIVE')}
                        </p>
                      </div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-4 bg-black/40 border-t border-white/5 text-center flex items-center justify-center gap-3">
        <HelpCircle size={14} className="text-smoke-600" />
        <p className="text-smoke-600 text-[9px] font-black uppercase tracking-[0.2em]">
          {t('doNotTransmit').toUpperCase()}
        </p>
      </div>
    </div>
  );
}
