// ─── THE PLATFORM — GameSelector.jsx (v10-fixed) ──────────────────────────────
// BUG FIXED (P2): BackButton previously called window.location.reload() to
//   return to language selection. This was a lossy hard reload that flushed all
//   Zustand state, aborted any pending Firebase listener cleanup, and caused a
//   visible full-page flash. Fixed by accepting an `onLangReset` callback prop
//   from App.jsx which performs a clean in-memory state transition instead.

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import { Swords, Ghost } from 'lucide-react';
import { useTranslation } from '../../constants/translations.js';
import BackButton from '../ui/BackButton.jsx';

export default function GameSelector({ onLangReset }) {
  const { setGameType, resetSession, language } = useGameStore();
  const t     = useTranslation(language);
  const isRTL = language === 'ar';

  function handleSelectGame(gameId) {
    resetSession();
    setGameType(gameId);
  }

  // FIX (P2): use the prop callback for clean state-based navigation.
  // Falls back to a best-effort reload only if the prop is somehow absent
  // (e.g. during testing or if the component is rendered outside App.jsx).
  function handleBack() {
    if (typeof onLangReset === 'function') {
      onLangReset();
    } else {
      try { localStorage.removeItem('mafia_lang'); } catch {}
      window.location.reload();
    }
  }

  const games = [
    {
      id: 'mafia',
      title: t('mafiaTitle'),
      desc:  t('mafiaDesc'),
      icon:  <Swords size={32} className="text-crimson-400" />,
      gradient: 'from-crimson-900/40 to-noir-950',
      border:   'border-crimson-600/30',
    },
    {
      id: 'spy',
      title: t('spyTitle'),
      desc:  t('spyDesc'),
      icon:  <Ghost size={32} className="text-emerald-400" />,
      gradient: 'from-emerald-900/40 to-noir-950',
      border:   'border-emerald-600/30',
    },
  ];

  return (
    <div
      className="screen bg-noir-950 flex flex-col items-center justify-center p-6 gap-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <BackButton onClick={handleBack} />

      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="display text-4xl font-black tracking-[0.2em] text-white uppercase">
          {t('gameHub')}
        </h1>
        <p className="text-gold-500/50 text-[10px] uppercase tracking-[0.5em] mt-3 font-black">
          {t('selectExperience')}
        </p>
      </motion.div>

      <div className="w-full max-w-sm flex flex-col gap-6">
        {games.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectGame(game.id)}
            className={`relative w-full h-40 rounded-[2.5rem] overflow-hidden border ${game.border} group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`} />

            <motion.div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{ background: 'linear-gradient(135deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%)' }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 p-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                {game.icon}
              </div>
              <div className="text-center">
                <h3 className="display text-2xl font-black text-white tracking-tight uppercase">
                  {game.title}
                </h3>
                <p className="text-smoke-400 text-xs font-medium opacity-60">{game.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-8 text-smoke-600 text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
        <span>{t('chooseGame')}</span>
      </div>
    </div>
  );
}
