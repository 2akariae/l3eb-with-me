import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { advanceToVoting, sendChatMessage, subscribeChat } from '../../../services/gameEngine.js';
import { TimerRing, Avatar, toast } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { MessageSquare, Users, Info, Send, Terminal, HelpCircle } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import { SpyParallaxBackground } from './SpyParallaxBackground.jsx';

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

  const displayWord = typeof gameState?.word === 'object' ? (gameState?.word?.[language] ?? gameState?.word?.en ?? '') : (gameState?.word ?? '');
  const displayHint = typeof gameState?.hint === 'object' ? (gameState?.hint?.[language] ?? gameState?.hint?.en ?? '') : (gameState?.hint ?? '');

  const alivePlayers = Object.entries(players).filter(([, p]) => p.isAlive);

  return (
    <div className="screen flex flex-col overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <SpyParallaxBackground />
      
      {/* Header */}
      <div className="px-6 pt-safe pt-16 pb-6 border-b border-white/10 bg-zinc-950/90 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSpy ? 'bg-emerald-500' : 'bg-purple-500'}`} />
            <h1 className="text-xl font-black text-white uppercase tracking-[0.1em]">
              {t('operationalDebrief')}
            </h1>
          </div>
          <div className="relative">
            <TimerRing remaining={remaining} total={90} size={48} color={isSpy ? '#10b981' : '#a855f7'} strokeWidth={3} />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ type: "tween", duration: 0.1, ease: "linear" }}
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isSpy ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-purple-500/10 border-purple-500/40'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl bg-black/40 ${isSpy ? 'text-emerald-400' : 'text-purple-400'}`}>
              <Info size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">
                {isSpy ? t('wordHint').toUpperCase() : t('secretWordIs').toUpperCase()}
              </p>
              <p className="text-white font-black text-base tracking-widest">
                {isSpy ? displayHint : displayWord}
              </p>
            </div>
          </div>
          {!isSpy && displayHint && (
            <div className="text-right border-l border-white/10 pl-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{t('wordHint').toUpperCase()}</p>
              <p className="text-purple-400 font-bold text-xs tracking-tight">{displayHint}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 py-3 gap-3 bg-zinc-950/90 border-b border-white/10">
        {[
          { id: 'chat',    label: t('comms'),  Icon: MessageSquare },
          { id: 'players', label: t('roster'), Icon: Users },
        ].map(({ id, label, Icon }) => (
          <motion.button 
            key={id} 
            onClick={() => setTab(id)}
            transition={{ type: "tween", duration: 0.1, ease: "linear" }}
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border ${
              activeTab === id 
              ? 'bg-white/15 text-white border-white/20' 
              : 'text-smoke-500 border-transparent hover:text-white hover:bg-white/5'
            }`}>
            <Icon size={18} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "tween", duration: 0.1, ease: "linear" }}
              className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center gap-6">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                      <Terminal size={32} className="text-white/50" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] max-w-[200px] leading-loose">
                      {isAr ? 'القناة مشفرة. ابدأ الإرسال...' : 'Channel Encrypted. Start transmitting...'}
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.uid === playerId;
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ type: "tween", duration: 0.1, ease: "linear" }}
                      className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="mt-1">
                        <Avatar uid={msg.uid} name={msg.name} avatar={msg.avatar} size="xs" />
                      </div>
                      <div className={`flex flex-col ${isMe ? 'items-end' : ''} max-w-[80%]`}>
                        <span className="text-smoke-500 text-[10px] font-black mb-1.5 px-1 uppercase tracking-wider">{msg.name}</span>
                        <div className={`px-5 py-3 rounded-2xl text-[13px] text-white/95 leading-relaxed border ${
                          isMe 
                          ? 'bg-white/15 border-white/20 rounded-tr-none' 
                          : 'bg-zinc-900 border-white/10 text-smoke-300 rounded-tl-none'
                        }`}>{msg.text}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-6 bg-zinc-950/90 border-t border-white/10 flex gap-3">
                <input
                  className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm text-white placeholder-smoke-700 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                  placeholder={isAr ? 'اكتب رسالة...' : 'Type transmission...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <motion.button
                  transition={{ type: "tween", duration: 0.1, ease: "linear" }}
                  onClick={handleSend} disabled={!input.trim()}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    input.trim() 
                    ? 'bg-white text-black' 
                    : 'bg-white/5 text-smoke-800'
                  }`}>
                  <Send size={22} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "tween", duration: 0.1, ease: "linear" }}
              className="absolute inset-0 p-6 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 gap-4">
                {alivePlayers.map(([uid, p]) => (
                  <motion.div 
                    key={uid} 
                    transition={{ type: "tween", duration: 0.1, ease: "linear" }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <Avatar uid={uid} name={p.name} avatar={p.avatar} size="sm" />
                      <div>
                        <p className="text-white font-black text-base tracking-wide">{p.name}</p>
                        <p className="text-smoke-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
                          {uid === playerId ? (isAr ? 'أنت' : 'YOU') : (isAr ? 'عميل' : 'OPERATIVE')}
                        </p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-5 glass-panel border-t border-white/10 text-center flex items-center justify-center gap-4">
        <HelpCircle size={16} className="text-smoke-600" />
        <p className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.3em]">
          {t('doNotTransmit').toUpperCase()}
        </p>
      </div>
    </div>
  );
}
