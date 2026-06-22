import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import {
  submitSpyGuess,
  expireSpyGuess,
} from '../../../services/gameEngine.js';
import { TimerRing, toast } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Ghost, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import { SpyParallaxBackground } from './SpyParallaxBackground.jsx';
import { WORD_PACKS } from '../../../constants/wordPack.js';

export default function SpyGuessScreen({ user, playerId }) {
  const { roomId, isHost, myRole, gameState, language, players } = useGameStore();
  const t    = useTranslation(language);
  const isAr = language === 'ar';
  const isSpy = myRole === 'spy';
  const [selectedWord, setSelectedWord] = useState(null);
  const [choices, setChoices] = useState([]);

  const { remaining } = useTimer(gameState, async () => {
    if (isHost) await expireSpyGuess(roomId);
  });

  const votedOutId = gameState?.votedOutId;
  const votedName  = votedOutId ? (players[votedOutId]?.name ?? '???') : '???';

  const activeWord = gameState?.word;
  
  useEffect(() => {
    if (!activeWord) return;

    // Flatten all words from all packs into one searchable pool
    const allWords = WORD_PACKS.flatMap(p => p.words);

    // Find the correct answer entry
    const correct = allWords.find(w => w.word.en === activeWord.en);
    if (!correct) return;

    const correctHintEn = (correct.hint?.en ?? '').toLowerCase().trim();

    // Candidates = everything that is NOT the secret word
    const candidates = allWords.filter(w => w.word.en !== activeWord.en);

    // Tier 1: exact same hint
    const tier1 = candidates.filter(
      w => (w.hint?.en ?? '').toLowerCase().trim() === correctHintEn
    );

    // Tier 2: words whose hint partially overlaps
    const hintTokens = correctHintEn.split(/\s+/).filter(Boolean);
    const tier2 = candidates.filter(w => {
      const wHint = (w.hint?.en ?? '').toLowerCase();
      return !tier1.includes(w) && hintTokens.some(tok => wHint.includes(tok));
    });

    // Tier 3: same category/pack as the secret word
    const correctPack = WORD_PACKS.find(p => p.words.some(w => w.word.en === activeWord.en));
    const tier3 = correctPack
      ? correctPack.words.filter(
          w => w.word.en !== activeWord.en && !tier1.includes(w) && !tier2.includes(w)
        )
      : [];

    // Tier 4: remaining words
    const tier4 = candidates.filter(
      w => !tier1.includes(w) && !tier2.includes(w) && !tier3.includes(w)
    );

    // Build distractor pool: prefer tier1, then tier2, then tier3, then tier4
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

    const pool = [
      ...shuffle(tier1),
      ...shuffle(tier2),
      ...shuffle(tier3),
      ...shuffle(tier4),
    ];

    const distractors = pool.slice(0, 5);

    // Return 1 correct + 5 distractors, shuffled
    setChoices(shuffle([correct, ...distractors]));
  }, [activeWord]);

  // Container variants for staggered reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'tween', duration: 0.1, ease: 'linear' } }
  };

  if (!isSpy) {
    return (
      <div className="screen flex flex-col items-center justify-center p-8 text-center" dir={isAr ? 'rtl' : 'ltr'}>
        <SpyParallaxBackground />
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center mb-8 mx-auto"
        >
          <ShieldAlert size={48} className="text-emerald-500" />
        </motion.div>
        <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-3">
          {isAr ? 'الجاسوس يخمّن...' : 'THE SPY IS GUESSING...'}
        </h1>
        <p className="text-smoke-400 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
          {isAr ? `${votedName} لديه فرصة أخيرة لتخمين الكلمة السرية` : `${votedName} has one last chance to guess the secret word`}
        </p>
        <div className="mt-4 relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          <TimerRing remaining={remaining} total={30} size={100} color="#10b981" strokeWidth={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="screen flex flex-col overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <SpyParallaxBackground />
      
      <div className="relative z-10 px-6 pt-safe pt-8 pb-6 flex flex-col items-center gap-6">
        <div className="flex items-center justify-between w-full glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.4em] font-mono">
              {isAr ? 'المحطة الأخيرة' : 'FINAL TRANSMISSION'}
            </span>
          </div>
          <div className="relative">
             <TimerRing remaining={remaining} total={30} size={44} color="#10b981" strokeWidth={3} />
          </div>
        </div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center"
        >
          <Ghost size={48} className="text-emerald-400" />
        </motion.div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 gap-8 overflow-y-auto scrollbar-hide">
        <h1 className="text-2xl font-black text-white uppercase text-center tracking-[0.15em]">
          {isAr ? 'اختر الكلمة السرية' : 'SELECT THE SECRET WORD'}
        </h1>
        
        <motion.div 
          className="grid grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {choices.map((item, i) => (
            <motion.button
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedWord(item.word.en)}
              className={`px-4 py-6 rounded-2xl border transition-all duration-300 text-sm font-bold tracking-wider ${
                selectedWord === item.word.en 
                ? 'bg-emerald-500/30 border-emerald-500 text-white'
                : 'glass-panel text-smoke-300 hover:border-emerald-500/50'
              }`}
            >
              {isAr ? item.word.ar : item.word.en}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {selectedWord && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "tween", duration: 0.1, ease: "linear" }}
          className="relative z-10 p-8 pt-0"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => submitSpyGuess(roomId, selectedWord)}
            className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-emerald-400/30"
          >
            <Check size={24} strokeWidth={3} />
            {isAr ? 'تأكيد' : 'CONFIRM'}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
