// ─── THE MAFIA — PhaseTransitionOverlay.jsx (PREMIUM REFACTOR) ────────────────
// Full-screen cinematic overlay between phase changes.
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES, getRoleLabel } from '../../constants/game.js';
import { useGameStore } from '../../store/gameStore.js';
import { useTranslation } from '../../constants/translations.js';

// Typewriter for the sub-label during transitions
function TransitionTypewriter({ text, speed = 42 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = React.useRef(0);

  useEffect(() => {
    ref.current = 0;
    setDisplayed('');
    setDone(false);
    const id = setInterval(() => {
      ref.current += 1;
      setDisplayed(text.slice(0, ref.current));
      if (ref.current >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text]); // eslint-disable-line

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse opacity-70">|</span>}
    </span>
  );
}

const MAFIA_PHASE_CONFIGS = {
  [PHASES.NIGHT]: {
    icon:    '🌕',
    label:   'Night Falls',
    sub:     'The city sleeps. Secrets stir.',
    bg:      'radial-gradient(ellipse at center, rgba(43,20,80,0.97) 0%, rgba(3,2,10,0.99) 100%)',
    accent:  '#a855f7',
    glowBg:  'rgba(124,38,220,0.5)',
    bars:    'rgba(168,85,247,0.5)',
  },
  [PHASES.DAWN_SCROLL]: {
    icon:    '🌅',
    label:   'Dawn Breaks',
    sub:     'The morning reveals all secrets.',
    bg:      'radial-gradient(ellipse at 50% 0%, rgba(200,100,10,0.96) 0%, rgba(3,2,10,0.99) 100%)',
    accent:  '#f59e0b',
    glowBg:  'rgba(251,146,60,0.5)',
    bars:    'rgba(251,191,36,0.5)',
  },
  [PHASES.DISCUSSION]: {
    icon:    '☀️',
    label:   'Open Discussion',
    sub:     'Accuse. Defend. Survive.',
    bg:      'radial-gradient(ellipse at center, rgba(40,30,10,0.97) 0%, rgba(3,2,10,0.99) 100%)',
    accent:  '#c9943a',
    glowBg:  'rgba(201,148,58,0.4)',
    bars:    'rgba(201,148,58,0.5)',
  },
  [PHASES.VOTING]: {
    icon:    '⚖',
    label:   'Voting Begins',
    sub:     'Choose wisely. One will fall.',
    bg:      'radial-gradient(ellipse at center, rgba(100,10,10,0.97) 0%, rgba(3,2,10,0.99) 100%)',
    accent:  '#e02020',
    glowBg:  'rgba(224,32,32,0.5)',
    bars:    'rgba(239,68,68,0.5)',
  },
  [PHASES.EXECUTION]: {
    icon:    '🔫',
    label:   'Execution',
    sub:     'The city has spoken.',
    bg:      'radial-gradient(ellipse at center, rgba(120,0,0,0.97) 0%, rgba(3,2,10,0.99) 100%)',
    accent:  '#f87171',
    glowBg:  'rgba(224,32,32,0.6)',
    bars:    'rgba(248,113,113,0.5)',
  },
  [PHASES.GAME_OVER]: {
    icon:    '♣',
    label:   'Game Over',
    sub:     'The truth is revealed.',
    bg:      'radial-gradient(ellipse at center, rgba(30,20,60,0.97) 0%, rgba(3,2,10,0.99) 100%)',
    accent:  '#c9943a',
    glowBg:  'rgba(124,38,220,0.4)',
    bars:    'rgba(201,148,58,0.5)',
  },
};

const SPY_PHASE_CONFIGS = {
  [PHASES.DISCUSSION]: {
    icon:    '📡',
    label:   'Intel Debrief',
    sub:     'Listen closely. Identify the anomaly.',
    bg:      'radial-gradient(ellipse at center, rgba(10,40,30,0.98) 0%, rgba(2,5,3,1) 100%)',
    accent:  '#10b981',
    glowBg:  'rgba(16,185,129,0.4)',
    bars:    'rgba(16,185,129,0.3)',
  },
  [PHASES.VOTING]: {
    icon:    '🎯',
    label:   'Termination Vote',
    sub:     'Target confirmed. Initiate protocol.',
    bg:      'radial-gradient(ellipse at center, rgba(10,20,50,0.98) 0%, rgba(2,3,8,1) 100%)',
    accent:  '#3b82f6',
    glowBg:  'rgba(59,130,246,0.4)',
    bars:    'rgba(59,130,246,0.3)',
  },
  [PHASES.GAME_OVER]: {
    icon:    '💾',
    label:   'Mission Complete',
    sub:     'Operation outcome finalized.',
    bg:      'radial-gradient(ellipse at center, rgba(20,20,20,0.98) 0%, rgba(0,0,0,1) 100%)',
    accent:  '#ffffff',
    glowBg:  'rgba(255,255,255,0.2)',
    bars:    'rgba(255,255,255,0.1)',
  }
};

// ... (TransitionTypewriter stays same)

export function PhaseTransitionOverlay({ phase, onDone }) {
  const { language, gameType } = useGameStore();
  const t = useTranslation(language);
  const [visible, setVisible] = useState(true);

  const MAFIA_PHASE_CONFIGS = {
    [PHASES.NIGHT]: {
      icon:    '🌕',
      label:   t('night'),
      sub:     language === 'en' ? 'The city sleeps. Secrets stir.' : 'المدينة نائمة. الأسرار تتحرك.',
      bg:      'radial-gradient(ellipse at center, rgba(43,20,80,0.97) 0%, rgba(3,2,10,0.99) 100%)',
      accent:  '#a855f7',
      glowBg:  'rgba(124,38,220,0.5)',
      bars:    'rgba(168,85,247,0.5)',
    },
    [PHASES.DAWN_SCROLL]: {
      icon:    '🌅',
      label:   t('dawnBreak'),
      sub:     language === 'en' ? 'The morning reveals all secrets.' : 'الصباح يكشف كل الأسرار.',
      bg:      'radial-gradient(ellipse at 50% 0%, rgba(200,100,10,0.96) 0%, rgba(3,2,10,0.99) 100%)',
      accent:  '#f59e0b',
      glowBg:  'rgba(251,146,60,0.5)',
      bars:    'rgba(251,191,36,0.5)',
    },
    [PHASES.DISCUSSION]: {
      icon:    '☀️',
      label:   t('discussion'),
      sub:     language === 'en' ? 'Accuse. Defend. Survive.' : 'اتهم. دافع. ابقَ حياً.',
      bg:      'radial-gradient(ellipse at center, rgba(40,30,10,0.97) 0%, rgba(3,2,10,0.99) 100%)',
      accent:  '#c9943a',
      glowBg:  'rgba(201,148,58,0.4)',
      bars:    'rgba(201,148,58,0.5)',
    },
    [PHASES.VOTING]: {
      icon:    '⚖',
      label:   t('voting'),
      sub:     language === 'en' ? 'Choose wisely. One will fall.' : 'اختر بحكمة. واحد سيسقط.',
      bg:      'radial-gradient(ellipse at center, rgba(100,10,10,0.97) 0%, rgba(3,2,10,0.99) 100%)',
      accent:  '#e02020',
      glowBg:  'rgba(224,32,32,0.5)',
      bars:    'rgba(239,68,68,0.5)',
    },
    [PHASES.EXECUTION]: {
      icon:    '🔫',
      label:   t('execution'),
      sub:     language === 'en' ? 'The city has spoken.' : 'لقد قالت المدينة كلمتها.',
      bg:      'radial-gradient(ellipse at center, rgba(120,0,0,0.97) 0%, rgba(3,2,10,0.99) 100%)',
      accent:  '#f87171',
      glowBg:  'rgba(224,32,32,0.6)',
      bars:    'rgba(248,113,113,0.5)',
    },
    [PHASES.GAME_OVER]: {
      icon:    '♣',
      label:   t('gameOver'),
      sub:     language === 'en' ? 'The truth is revealed.' : 'الحقيقة تم كشفها.',
      bg:      'radial-gradient(ellipse at center, rgba(30,20,60,0.97) 0%, rgba(3,2,10,0.99) 100%)',
      accent:  '#c9943a',
      glowBg:  'rgba(124,38,220,0.4)',
      bars:    'rgba(201,148,58,0.5)',
    },
  };

  const SPY_PHASE_CONFIGS = {
    [PHASES.DISCUSSION]: {
      icon:    '📡',
      label:   t('operationalDebrief'),
      sub:     language === 'en' ? 'Listen closely. Identify the anomaly.' : 'استمع جيداً. حدد الخلل.',
      bg:      'radial-gradient(ellipse at center, rgba(10,40,30,0.98) 0%, rgba(2,5,3,1) 100%)',
      accent:  '#10b981',
      glowBg:  'rgba(16,185,129,0.4)',
      bars:    'rgba(16,185,129,0.3)',
    },
    [PHASES.VOTING]: {
      icon:    '🎯',
      label:   t('terminationVote'),
      sub:     language === 'en' ? 'Target confirmed. Initiate protocol.' : 'تم تحديد الهدف. ابدأ البروتوكول.',
      bg:      'radial-gradient(ellipse at center, rgba(10,20,50,0.98) 0%, rgba(2,3,8,1) 100%)',
      accent:  '#3b82f6',
      glowBg:  'rgba(59,130,246,0.4)',
      bars:    'rgba(59,130,246,0.3)',
    },
    [PHASES.GAME_OVER]: {
      icon:    '💾',
      label:   t('gameOver'),
      sub:     language === 'en' ? 'Operation outcome finalized.' : 'تم حسم نتيجة العملية.',
      bg:      'radial-gradient(ellipse at center, rgba(20,20,20,0.98) 0%, rgba(0,0,0,1) 100%)',
      accent:  '#ffffff',
      glowBg:  'rgba(255,255,255,0.2)',
      bars:    'rgba(255,255,255,0.1)',
    }
  };

  const configs = gameType === 'spy' ? SPY_PHASE_CONFIGS : MAFIA_PHASE_CONFIGS;
  const config  = configs[phase];

  useEffect(() => {
    if (!config) { onDone?.(); return; }
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 500);
    }, 2200);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line

  if (!config) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: config.bg }}
        >
          {/* ... (rest of the component stays same) */}
          <div className="relative z-10 flex flex-col items-center gap-5 text-center px-8">
            <motion.div
              initial={{ scale: 0.2, rotate: -30, opacity: 0 }}
              animate={{ scale: 1,   rotate: 0,   opacity: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              className="text-7xl filter drop-shadow-lg"
            >
              {config.icon}
            </motion.div>

            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2
                className="display text-4xl font-bold uppercase tracking-tighter"
                style={{ color: config.accent, textShadow: `0 0 24px ${config.accent}80` }}
              >
                {config.label}
              </h2>

              <p className="text-white/50 text-sm mt-2 font-mono tracking-widest uppercase">
                <TransitionTypewriter text={config.sub} speed={38} />
              </p>
            </motion.div>
            {/* ... (dots stay same) */}

            {/* Progress dots */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-1.5 mt-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-0.5 rounded-full"
                  style={{ background: config.accent }}
                  initial={{ width: 4, opacity: 0.3 }}
                  animate={{ width: i === 1 ? 24 : 4, opacity: i === 1 ? 1 : 0.3 }}
                  transition={{ delay: 0.55 + i * 0.06 }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
