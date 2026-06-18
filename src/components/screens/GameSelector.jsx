// ─── THE PLATFORM — GameSelector.jsx (v11 — cinematic refresh) ──────────────
import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import { Swords, Ghost, Globe, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../constants/translations.js';
import { getAllGames } from '../../registry/gameRegistry.js';
import BackButton from '../ui/BackButton.jsx';
import { ParallaxStars } from '../game/ParallaxStars.jsx';

const GAME_PRESENTATION = {
  mafia: { 
    icon: <Swords size={36} className="text-white" />, 
    accent: '#e02020',
    gradient: 'from-crimson-900/40 to-noir-950', 
    border: 'border-crimson-600/30' 
  },
  spy: { 
    icon: <Ghost size={36} className="text-white" />, 
    accent: '#10b981',
    gradient: 'from-emerald-900/40 to-noir-950', 
    border: 'border-emerald-600/30' 
  },
};
const DEFAULT_PRESENTATION = { 
  icon: <ShieldAlert size={36} className="text-white" />, 
  accent: '#c9943a',
  gradient: 'from-noir-900 to-noir-950', 
  border: 'border-white/10' 
};

export default function GameSelector({ onLangReset }) {
  const { setGameType, resetSession, language } = useGameStore();
  const t     = useTranslation(language);
  const isRTL = language === 'ar';

  function handleSelectGame(gameId) {
    resetSession();
    setGameType(gameId);
  }

  function handleBack() {
    if (typeof onLangReset === 'function') {
      onLangReset();
    } else {
      try { localStorage.removeItem('mafia_lang'); } catch {}
      window.location.reload();
    }
  }

  const games = getAllGames().map((g) => {
    const presentation = GAME_PRESENTATION[g.id] ?? DEFAULT_PRESENTATION;
    return {
      id:       g.id,
      title:    language === 'ar' ? g.labelAr : g.label,
      desc:     language === 'ar' ? g.descriptionAr : g.description,
      icon:     presentation.icon,
      accent:   presentation.accent,
      gradient: presentation.gradient,
      border:   presentation.border,
    };
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } }
  };

  return (
    <div className="screen bg-noir-950 flex flex-col items-center justify-center p-6 gap-12 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <ParallaxStars count={100} />
      
      <BackButton onClick={handleBack} />

      <motion.div
        initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        className="text-center relative z-10"
      >
        <h1 className="display text-5xl font-black tracking-[0.25em] text-white uppercase aberration">
          {t('gameHub')}
        </h1>
        <p className="text-gold-500/60 text-[10px] uppercase tracking-[0.8em] mt-5 font-black bloom">
          {t('selectExperience')}
        </p>
      </motion.div>

      <motion.div 
        variants={container} initial="hidden" animate="show"
        className="w-full max-w-sm flex flex-col gap-6 relative z-10"
      >
        {games.map((game) => (
          <motion.button
            key={game.id}
            variants={item}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelectGame(game.id)}
            className={`relative w-full h-44 rounded-[3rem] overflow-hidden border ${game.border} group shadow-2xl bg-noir-900/40 backdrop-blur-xl`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-40 group-hover:opacity-60 transition-opacity`} />
            
            {/* dynamic background glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
              style={{ background: `radial-gradient(circle at center, ${game.accent}, transparent 70%)` }} />

            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-5 p-8">
              <motion.div 
                className="p-5 rounded-3xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors shadow-inner"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {game.icon}
              </motion.div>
              <div className="text-center">
                <h3 className="display text-3xl font-black text-white tracking-tight uppercase aberration">
                  {game.title}
                </h3>
                <p className="text-smoke-400 text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">{game.desc}</p>
              </div>
            </div>
            
            {/* shimmer effect */}
            <div className="absolute inset-0 pointer-events-none shimmer opacity-[0.03]" />
          </motion.button>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1.5 }}
        className="flex gap-10 text-smoke-600 text-[10px] font-black uppercase tracking-[0.4em] bloom"
      >
        <span>{t('chooseGame')}</span>
      </motion.div>
    </div>
  );
}

