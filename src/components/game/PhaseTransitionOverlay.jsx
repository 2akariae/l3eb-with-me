// ─── THE MAFIA — PhaseTransitionOverlay.jsx (CINEMATIC V2) ────────────────
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sunrise, Sun, Scale, Crosshair, Spade, Radio, Target, Database } from 'lucide-react';
import { PHASES } from '../../constants/game.js';
import { useGameStore } from '../../store/gameStore.js';
import { useTranslation } from '../../constants/translations.js';

function TransitionTypewriter({ text, speed = 40 }) {
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
  }, [text, speed]);

  return (
    <span className="typewriter">
      {displayed}
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
        Icon: Moon, label: t('night'), sub: t('nightSub'),
        bg: 'radial-gradient(circle at center, rgba(30,15,60,0.98) 0%, rgba(3,2,10,1) 100%)',
        accent: '#a855f7',
      },
      [PHASES.DAWN_SCROLL]: {
        Icon: Sunrise, label: t('dawnBreak'), sub: t('dawnSub'),
        bg: 'radial-gradient(circle at 50% 0%, rgba(180,80,10,0.98) 0%, rgba(3,2,10,1) 100%)',
        accent: '#f5d878',
      },
      [PHASES.DISCUSSION]: {
        Icon: Sun, label: t('discussion'), sub: t('discussionSub'),
        bg: 'radial-gradient(circle at center, rgba(60,40,15,0.98) 0%, rgba(3,2,10,1) 100%)',
        accent: '#c9943a',
      },
      [PHASES.VOTING]: {
        Icon: Scale, label: t('voting'), sub: t('votingSub'),
        bg: 'radial-gradient(circle at center, rgba(120,20,20,0.98) 0%, rgba(3,2,10,1) 100%)',
        accent: '#e02020',
      },
      [PHASES.EXECUTION]: {
        Icon: Crosshair, label: t('execution'), sub: t('executionSub'),
        bg: 'radial-gradient(circle at center, rgba(160,10,10,0.98) 0%, rgba(3,2,10,1) 100%)',
        accent: '#f87171',
      },
      [PHASES.GAME_OVER]: {
        Icon: Spade, label: t('gameOver'), sub: t('gameOverSub'),
        bg: 'radial-gradient(circle at center, rgba(20,15,40,0.98) 0%, rgba(3,2,10,1) 100%)',
        accent: '#c9943a',
      },
    },
    spy: {
      [PHASES.DISCUSSION]: {
        Icon: Radio, label: t('operationalDebrief'), sub: t('spyDiscussionSub'),
        bg: 'radial-gradient(circle at center, rgba(10,50,40,0.98) 0%, rgba(2,5,3,1) 100%)',
        accent: '#10b981',
      },
      [PHASES.VOTING]: {
        Icon: Target, label: t('terminationVote'), sub: t('spyVotingSub'),
        bg: 'radial-gradient(circle at center, rgba(10,30,80,0.98) 0%, rgba(2,3,8,1) 100%)',
        accent: '#3b82f6',
      },
      [PHASES.GAME_OVER]: {
        Icon: Database, label: t('gameOver'), sub: t('spyGameOverSub'),
        bg: 'radial-gradient(circle at center, rgba(30,30,30,0.98) 0%, rgba(0,0,0,1) 100%)',
        accent: '#ffffff',
      }
    }
  }), [t]);

  const config = configs[gameType]?.[phase];

  useEffect(() => {
    if (!config) { onDone?.(); return; }
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 600);
    }, 2400);
    return () => clearTimeout(timer);
  }, [phase, config, onDone]);

  if (!config) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: config.bg }}
        >
          {/* Film Grain & Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay">
            <div className="w-full h-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 3px, transparent 4px)',
              backgroundSize: '100% 4px'
            }} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 text-center px-10">
            <motion.div
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.1 }}
              className="flex items-center justify-center"
              style={{ filter: `drop-shadow(0 0 40px ${config.accent}60)` }}
            >
              <config.Icon size={100} strokeWidth={1.2} color={config.accent} />
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
              <h2
                className="display text-6xl font-black uppercase tracking-tighter aberration"
                style={{ color: config.accent, textShadow: `0 0 30px ${config.accent}40` }}
              >
                {config.label}
              </h2>

              <p className="text-white/40 text-[11px] mt-4 font-black tracking-[0.4em] uppercase min-h-[1.5em] bloom">
                <TransitionTypewriter text={config.sub} />
              </p>
            </motion.div>

            {/* Cinematic bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 120, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1, ease: [0.19, 1, 0.22, 1] }}
              className="h-px opacity-30"
              style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }}
            />
          </div>
          
          {/* Depth vignette */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

