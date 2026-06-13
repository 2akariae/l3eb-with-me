// ─── THE MAFIA — PhaseTransitionOverlay.jsx (PREMIUM REFACTOR) ────────────────
// Full-screen cinematic overlay between phase changes.
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES } from '../../constants/game.js';
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

export function PhaseTransitionOverlay({ phase, onDone }) {
  const { language, gameType } = useGameStore();
  const t = useTranslation(language);
  const [visible, setVisible] = useState(true);

  const configs = useMemo(() => ({
    mafia: {
      [PHASES.NIGHT]: {
        icon:    '🌕',
        label:   t('night'),
        sub:     t('nightSub'),
        bg:      'radial-gradient(ellipse at center, rgba(43,20,80,0.97) 0%, rgba(3,2,10,0.99) 100%)',
        accent:  '#a855f7',
      },
      [PHASES.DAWN_SCROLL]: {
        icon:    '🌅',
        label:   t('dawnBreak'),
        sub:     t('dawnSub'),
        bg:      'radial-gradient(ellipse at 50% 0%, rgba(200,100,10,0.96) 0%, rgba(3,2,10,0.99) 100%)',
        accent:  '#f59e0b',
      },
      [PHASES.DISCUSSION]: {
        icon:    '☀️',
        label:   t('discussion'),
        sub:     t('discussionSub'),
        bg:      'radial-gradient(ellipse at center, rgba(40,30,10,0.97) 0%, rgba(3,2,10,0.99) 100%)',
        accent:  '#c9943a',
      },
      [PHASES.VOTING]: {
        icon:    '⚖',
        label:   t('voting'),
        sub:     t('votingSub'),
        bg:      'radial-gradient(ellipse at center, rgba(100,10,10,0.97) 0%, rgba(3,2,10,0.99) 100%)',
        accent:  '#e02020',
      },
      [PHASES.EXECUTION]: {
        icon:    '🔫',
        label:   t('execution'),
        sub:     t('executionSub'),
        bg:      'radial-gradient(ellipse at center, rgba(120,0,0,0.97) 0%, rgba(3,2,10,0.99) 100%)',
        accent:  '#f87171',
      },
      [PHASES.GAME_OVER]: {
        icon:    '♣',
        label:   t('gameOver'),
        sub:     t('gameOverSub'),
        bg:      'radial-gradient(ellipse at center, rgba(30,20,60,0.97) 0%, rgba(3,2,10,0.99) 100%)',
        accent:  '#c9943a',
      },
    },
    spy: {
      [PHASES.DISCUSSION]: {
        icon:    '📡',
        label:   t('operationalDebrief'),
        sub:     t('spyDiscussionSub'),
        bg:      'radial-gradient(ellipse at center, rgba(10,40,30,0.98) 0%, rgba(2,5,3,1) 100%)',
        accent:  '#10b981',
      },
      [PHASES.VOTING]: {
        icon:    '🎯',
        label:   t('terminationVote'),
        sub:     t('spyVotingSub'),
        bg:      'radial-gradient(ellipse at center, rgba(10,20,50,0.98) 0%, rgba(2,3,8,1) 100%)',
        accent:  '#3b82f6',
      },
      [PHASES.GAME_OVER]: {
        icon:    '💾',
        label:   t('gameOver'),
        sub:     t('spyGameOverSub'),
        bg:      'radial-gradient(ellipse at center, rgba(20,20,20,0.98) 0%, rgba(0,0,0,1) 100%)',
        accent:  '#ffffff',
      }
    }
  }), [t]);

  const config = configs[gameType]?.[phase];

  useEffect(() => {
    if (!config) { onDone?.(); return; }
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 500);
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, config, onDone]);

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
          {/* Scanlines / Overlay bars */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 3px, transparent 4px)',
              backgroundSize: '100% 4px'
            }} />
          </div>

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

              <p className="text-white/50 text-sm mt-2 font-mono tracking-widest uppercase min-h-[1.5em]">
                <TransitionTypewriter text={config.sub} speed={38} />
              </p>
            </motion.div>

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
