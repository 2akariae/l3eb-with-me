// ─── THE MAFIA — DawnScrollScreen.jsx (PREMIUM REFACTOR) ──────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Search, Sun, Swords, Circle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { advanceToDiscussion } from '../../games/mafia/hooks/useMafiaEngine.js';
import { Avatar, toast } from '../ui/index.jsx';
import { useTimer } from '../../hooks/useTimer.js';
import { useTranslation } from '../../constants/translations.js';
import HauntedHouseBg from '../game/HauntedHouseBg.jsx';

function CinematicTypewriter({ text, speed = 28, delay = 0, onDone, className = '' }) {
  const [displayed, setDisplayed] = useState('');
  const [done,      setDone]      = useState(false);
  const [started,   setStarted]   = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
      idx.current = 0;
      setDisplayed('');
      setDone(false);
      const id = setInterval(() => {
        idx.current += 1;
        setDisplayed(text.slice(0, idx.current));
        if (idx.current >= text.length) {
          clearInterval(id);
          setDone(true);
          onDone?.();
        }
      }, speed);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [text, delay]); // eslint-disable-line

  if (!started) return <span className={className}>&nbsp;</span>;

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-gold-400">|</motion.span>
      )}
    </span>
  );
}

function SunriseBurst() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top:    '-10%',
        left:   '50%',
        width:  340,
        height: 340,
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,180,40,0.18) 0%, rgba(255,100,20,0.08) 45%, transparent 70%)',
      }}
      initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1.4, opacity: 1 }}
      transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

export default function DawnScrollScreen({ user, playerId }) {
  const { roomId, isHost, gameState, players, myRole, language } = useGameStore();
  const [lineIdx,   setLineIdx]   = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const t = useTranslation(language);

  const lines         = gameState?.scrollLines   ?? [language === 'en' ? 'The city stirs as dawn breaks.' : 'تتحرك المدينة مع بزوغ الفجر.'];
  const killed        = gameState?.lastKilled;
  const victim        = killed ? players[killed] : null;
  const privateResult = gameState?.privateResult;

  const sheikResult = myRole === 'sheikh' && privateResult?.sheikUid === playerId ? privateResult : null;

  function onLineDone() {
    if (lineIdx < lines.length - 1) {
      setTimeout(() => setLineIdx((i) => i + 1), 700);
    }
  }

  async function handleExpire() {
    if (!isHost || advancing) return;
    setAdvancing(true);
    try { await advanceToDiscussion(roomId); }
    catch (e) { toast(e.message, 'error'); setAdvancing(false); }
  }

  useTimer(gameState, handleExpire);

  const allLinesDone = lineIdx >= lines.length - 1;

  return (
    <div className="screen noise overflow-hidden">
      <HauntedHouseBg isNight={false} />
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      <SunriseBurst />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,160,40,0.22) 0%, transparent 55%)' }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-10 gap-7 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="text-amber-400/70 text-xs uppercase tracking-[0.4em] font-mono">{t('dawnReport')}</p>
          <h1 className="display text-3xl font-bold text-amber-200 mt-1">
            <CinematicTypewriter text={t('morningAfter')} speed={60} delay={300} />
          </h1>
        </motion.div>

        <motion.div
          initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="w-full max-w-sm flex flex-col gap-4 rounded-2xl px-5 py-5"
          style={{
            transformOrigin: 'top',
            background:      'rgba(201,148,58,0.08)',
            border:          '1px solid rgba(201,148,58,0.22)',
            backdropFilter:  'blur(12px)',
            boxShadow:       '0 0 40px rgba(201,148,58,0.1)',
          }}
        >
          {lines.slice(0, lineIdx + 1).map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              {i === lineIdx ? (
                <p className="display text-lg font-semibold text-white leading-relaxed">
                  <CinematicTypewriter text={line} speed={30} onDone={onLineDone} />
                </p>
              ) : (
                <p className="display text-lg font-semibold text-white/80 leading-relaxed">{line}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {victim && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 16 }} animate={{ scale: 1,   opacity: 1, y: 0  }}
            transition={{ type: 'spring', damping: 14, delay: 0.6 }}
            className="flex flex-col items-center gap-3 rounded-[2rem] px-8 py-5"
            style={{
              background:    'rgba(224,32,32,0.1)',
              border:        '1px solid rgba(224,32,32,0.3)',
              boxShadow:     '0 0 36px rgba(224,32,32,0.15)',
              backdropFilter:'blur(12px)',
            }}
          >
            <p className="text-crimson-400/70 text-[10px] font-black uppercase tracking-[0.3em]">{t('foundDead')}</p>
            <div className="opacity-60 grayscale">
              <Avatar uid={killed} name={victim.name} avatar={victim.avatar} size="lg" dead />
            </div>
            <p className="display text-xl font-bold text-white">{victim.name}</p>
            <p className="text-crimson-300/60 text-xs">{t('wasEliminatedOvernight')}</p>
          </motion.div>
        )}

        {!victim && allLinesDone && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-3 rounded-2xl px-8 py-5"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <ShieldCheck size={36} strokeWidth={1.75} className="text-emerald-400" />
            <p className="text-emerald-300 font-black text-sm">{t('everyoneSurvived')}</p>
          </motion.div>
        )}

        {sheikResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
            className="rounded-2xl px-6 py-4 text-center"
            style={{
              background: sheikResult.isMafia ? 'rgba(224,32,32,0.15)' : 'rgba(16,185,129,0.15)',
              border:     `1px solid ${sheikResult.isMafia ? 'rgba(224,32,32,0.4)' : 'rgba(16,185,129,0.4)'}`,
            }}
          >
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-black text-smoke-400 uppercase tracking-widest mb-1">
              <Search size={11} strokeWidth={2} /> {t('yourInvestigation')}
            </p>
            <p className="text-white font-black">
              {sheikResult.checkedName} is{' '}
              <span className="inline-flex items-center gap-1" style={{ color: sheikResult.isMafia ? '#f87171' : '#34d399' }}>
                {sheikResult.isMafia
                  ? <><Swords size={13} strokeWidth={2} /> {t('mafia').toUpperCase()}</>
                  : <><Circle size={11} strokeWidth={2} /> {t('isInnocent')}</>
                }
              </span>
            </p>
          </motion.div>
        )}

        {isHost && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              if (advancing) return;
              setAdvancing(true);
              try { await advanceToDiscussion(roomId); }
              catch (e) { toast(e.message, 'error'); setAdvancing(false); }
            }}
            disabled={advancing}
            className="w-full max-w-sm h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] text-white disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(201,148,58,0.9), rgba(201,148,58,0.7))',
              boxShadow:  '0 0 28px rgba(201,148,58,0.3)',
            }}
          >
            {advancing
              ? t('advancing')
              : <span className="inline-flex items-center gap-2"><Sun size={15} strokeWidth={2} /> {t('beginDiscussion')}</span>
            }
          </motion.button>
        )}
      </div>
    </div>
  );
}
