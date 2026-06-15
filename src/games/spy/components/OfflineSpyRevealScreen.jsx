// ── OfflineSpyRevealScreen (v8) — tap-and-hold reveal · Cyber Espionage ───────
// FIX: reads language from offlineStore, passes it into SpyCard correctly.
// FIX: category and word are bilingual objects { en, ar } — resolved with lang key.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useOfflineStore } from '../../../store/offlineStore.js';
import { useTranslation } from '../../../constants/translations.js';
import { ParallaxStars } from '../../../components/game/ParallaxStars.jsx';
import { Ghost, Shield, Terminal } from 'lucide-react';

const SPY_CFG = {
  spy:     { glow: '#10b981', bg: 'linear-gradient(155deg,rgba(16,185,129,0.2) 0%,rgba(2,12,8,0.98) 100%)', border: 'rgba(16,185,129,0.5)' },
  citizen: { glow: '#3b82f6', bg: 'linear-gradient(155deg,rgba(59,130,246,0.2) 0%,rgba(2,4,16,0.98) 100%)', border: 'rgba(59,130,246,0.5)' },
};

function SpyCard({ role, pressing, tiltX, tiltY, language, word, hint }) {
  const cfg   = SPY_CFG[role];
  const isSpy = role === 'spy';
  const isAr  = language === 'ar';

  // Resolve bilingual objects
  const displayWord = typeof word === 'object' ? (word?.[language] ?? word?.en ?? '') : (word ?? '');
  const displayHint = typeof hint === 'object' ? (hint?.[language] ?? hint?.en ?? '') : (hint ?? '');

  return (
    <div style={{ perspective: 1000, width: 220, height: 310 }}>
      <motion.div
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', rotateX: tiltX, rotateY: tiltY }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
          animate={{ rotateY: pressing ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* FRONT */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            background: 'linear-gradient(155deg,rgba(20,40,30,0.4) 0%,rgba(2,5,3,0.97) 100%)',
            border: '1px solid rgba(16,185,129,0.35)', borderRadius: 28,
          }} className="flex flex-col items-center justify-center gap-5 overflow-hidden select-none">
            <Terminal size={40} className="text-emerald-500 opacity-60" />
            <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-smoke-500">
              {isAr ? 'اضغط للكشف' : 'HOLD TO REVEAL'}
            </p>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
            boxShadow: `0 0 55px ${cfg.glow}55, inset 0 0 28px ${cfg.glow}14`,
            borderRadius: 28,
          }} className="flex flex-col items-center justify-center gap-5 relative overflow-hidden select-none p-6 text-center">
            <div style={{ color: cfg.glow }}>
              {isSpy ? <Ghost size={50} /> : <Shield size={50} />}
            </div>
            <p className="text-xl font-black tracking-[0.1em] text-white uppercase">
              {isSpy
                ? (isAr ? 'أنت الجاسوس' : 'YOU ARE THE SPY')
                : (isAr ? 'أنت مواطن'   : 'YOU ARE A CITIZEN')}
            </p>
            <div className="w-14 h-px rounded-full" style={{ background: cfg.glow, opacity: 0.4 }} />
            {isSpy ? (
              <div className="text-emerald-400/80 text-xs font-bold leading-relaxed">
                {isAr ? 'أنت لا تعرف الكلمة السرية.' : 'You do not know the secret word.'}
                {displayHint && (
                  <p className="text-white mt-2 font-bold">
                    {isAr ? 'تلميح الكلمة:' : 'Hint:'} {displayHint}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-blue-400 font-bold text-lg">
                {displayWord}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function OfflineSpyRevealScreen() {
  const { players, envelopeIndex, nextEnvelope, language, roles, word, hint, spyId } = useOfflineStore();
  const t      = useTranslation(language);
  const isAr   = language === 'ar';

  const [pressing,  setPressing]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const rawTiltX = useSpring(0, { stiffness: 90, damping: 18 });
  const rawTiltY = useSpring(0, { stiffness: 90, damping: 18 });
  const containerRef = useRef(null);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    rawTiltX.set(((e.clientY - r.top)  / r.height - 0.5) * 2 * -16);
    rawTiltY.set(((e.clientX - r.left) / r.width  - 0.5) * 2 *  16);
  }, []); // eslint-disable-line

  const onPointerLeave = useCallback(() => { rawTiltX.set(0); rawTiltY.set(0); }, []); // eslint-disable-line

  useEffect(() => { setPressing(false); setConfirmed(false); }, [envelopeIndex]);

  function handleNext() {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => { setConfirmed(false); nextEnvelope(); }, 320);
  }

  const player = players[envelopeIndex];
  const role   = player && player.id === spyId ? 'spy' : 'citizen';
  const isLast = envelopeIndex >= players.length - 1;

  return (
    <motion.div
      key={envelopeIndex}
      ref={containerRef}
      className="screen bg-noir-950 overflow-hidden items-center justify-center flex flex-col"
      style={{ userSelect: 'none' }}
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35 }}
      onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
    >
      <ParallaxStars count={80} />

      <motion.div initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-center mb-7">
        <p className="text-smoke-500 text-[11px] tracking-[0.38em] uppercase font-mono">{t('passPhoneTo')}</p>
        <h1 className="text-4xl font-black text-white tracking-wider mt-1.5"
          style={{ fontFamily: 'Playfair Display, serif' }}>
          {player?.name?.toUpperCase()}
        </h1>
      </motion.div>

      <div className="relative z-10 touch-none"
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerCancel={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
      >
        <SpyCard
          role={role} pressing={pressing}
          tiltX={rawTiltX} tiltY={rawTiltY}
          language={language} word={word} hint={hint}
        />
      </div>

      <motion.p key={pressing ? 'rel' : 'tap'}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mt-6 text-smoke-500 text-xs tracking-[0.28em] font-mono">
        {pressing ? t('releaseToHide') : t('tapHoldReveal')}
      </motion.p>

      <motion.button initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.96 }} onClick={handleNext}
        className="relative z-10 mt-7 h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-[0.18em] text-white overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}>
        <span className="relative z-10">
          {isLast
            ? (isAr ? 'ابدأ اللعبة' : 'START GAME')
            : `${t('nextPlayer')} → ${players[envelopeIndex + 1]?.name}`}
        </span>
      </motion.button>
    </motion.div>
  );
}
