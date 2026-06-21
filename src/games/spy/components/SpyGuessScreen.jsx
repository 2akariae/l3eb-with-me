import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import {
  submitSpyGuess,
  expireSpyGuess,
} from '../../../services/gameEngine.js';
import { TimerRing, toast } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Ghost, ShieldAlert, Terminal } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import { SpyBackground } from '../../../components/game/SpyBackground.jsx';
import { WORD_PACKS } from '../../../constants/wordPack.js';

function ScanLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
      }}
    />
  );
}

export default function SpyGuessScreen({ user, playerId }) {
  const { roomId, isHost, myRole, gameState, language, players } = useGameStore();
  const t    = useTranslation(language);
  const isAr = language === 'ar';
  const isSpy = myRole === 'spy';

  const { remaining } = useTimer(gameState, async () => {
    if (isHost) await expireSpyGuess(roomId);
  });

  const votedOutId = gameState?.votedOutId;
  const votedName  = votedOutId ? (players[votedOutId]?.name ?? '???') : '???';

  const activeWord = gameState?.word;
  const categoryWords = activeWord ? WORD_PACKS.find(p => p.words.some(w => w.word.en === activeWord.en))?.words ?? [] : [];

  if (!isSpy) {
    return (
      <div className="screen bg-noir-950 flex flex-col items-center justify-center p-8 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <SpyBackground />
        <ScanLines />
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-8 mx-auto"
        >
          <ShieldAlert size={48} className="text-emerald-500" />
        </motion.div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">
          {isAr ? 'الجاسوس يخمّن...' : 'The Spy Is Guessing...'}
        </h1>
        <p className="text-smoke-500 text-sm mb-6">
          {isAr ? `${votedName} لديه فرصة أخيرة لتخمين الكلمة السرية` : `${votedName} has one last chance to guess the secret word`}
        </p>
        <div className="mt-4">
          <TimerRing remaining={remaining} total={30} size={80} color="#10b981" strokeWidth={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="screen flex flex-col overflow-hidden" dir={isAr ? 'rtl' : 'ltr'} style={{ background: 'linear-gradient(170deg, #020c08 0%, #000 100%)' }}>
      <SpyBackground />
      <ScanLines />
      <div className="relative z-10 px-6 pt-safe pt-8 pb-6 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] font-mono">
              {isAr ? 'المحطة الأخيرة' : 'FINAL TRANSMISSION'}
            </span>
          </div>
          <TimerRing remaining={remaining} total={30} size={50} color="#10b981" strokeWidth={3} />
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center"
        >
          <Ghost size={40} className="text-emerald-400" />
        </motion.div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 gap-6 overflow-y-auto">
        <h1 className="text-2xl font-black text-white uppercase text-center">{isAr ? 'اختر الكلمة السرية' : 'SELECT THE SECRET WORD'}</h1>
        <div className="grid grid-cols-2 gap-3">
          {categoryWords.map((item, i) => (
            <button
              key={i}
              onClick={() => submitSpyGuess(roomId, item.word.en)}
              className="px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm hover:bg-emerald-500/20 transition-all text-center"
            >
              {isAr ? item.word.ar : item.word.en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
