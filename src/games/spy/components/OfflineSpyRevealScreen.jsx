// ── OfflineSpyRevealScreen (v8) — tap-and-hold reveal · Cyber Espionage ───────
// FIX: reads language from offlineStore, passes it into SpyCard correctly.
// FIX: category and word are bilingual objects { en, ar } — resolved with lang key.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useOfflineStore } from '../../../store/offlineStore.js';
import { useTranslation } from '../../../constants/translations.js';
import { GameBackground } from "@/components/game/GameBackground.jsx";
import { Ghost, Shield, Terminal } from 'lucide-react';

const SPY_CFG = {
  spy:     { glow: '#10b981', bg: 'bg-zinc-900', border: 'border-emerald-500/40' },
  citizen: { glow: '#3b82f6', bg: 'bg-zinc-900', border: 'border-blue-500/40' },
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
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
      >
        <motion.div
          style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
          animate={{ rotateY: pressing ? 180 : 0 }}
          transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        >
        {/* FRONT */}
        <motion.div 
          className="flex flex-col items-center justify-center gap-5 overflow-hidden select-none"
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)', borderRadius: 28,
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Terminal size={40} className="text-emerald-500" />
          </div>
          <p className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-500/60">
            {isAr ? 'اضغط للكشف' : 'HOLD TO REVEAL'}
          </p>
        </motion.div>

        {/* BACK */}
        <motion.div 
          className="flex flex-col items-center justify-center gap-6 relative overflow-hidden select-none p-8 text-center"
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
            border: `2px solid ${cfg.glow}`,
            borderRadius: 28,
            boxShadow: `0 0 50px ${cfg.glow}40, inset 0 0 20px ${cfg.glow}20`
          }}
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1], filter: [`drop-shadow(0 0 10px ${cfg.glow})`, `drop-shadow(0 0 20px ${cfg.glow})`, `drop-shadow(0 0 10px ${cfg.glow})`] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: cfg.glow }}>
            {isSpy ? <Ghost size={60} /> : <Shield size={60} />}
          </motion.div>
          <p className="text-2xl font-black tracking-[0.1em] text-white uppercase">
            {isSpy
              ? (isAr ? 'أنت الجاسوس' : 'YOU ARE THE SPY')
              : (isAr ? 'أنت مواطن' : 'YOU ARE A CITIZEN')}
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
      className="screen bg-zinc-950 overflow-hidden items-center justify-center flex flex-col"
      style={{ userSelect: 'none' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ type: "tween", duration: 0.1, ease: "linear" }}
      onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
    >
      <GameBackground />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
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
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="relative z-10 mt-6 text-smoke-500 text-xs tracking-[0.28em] font-mono">
        {pressing ? t('releaseToHide') : t('tapHoldReveal')}
      </motion.p>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        onClick={handleNext}
        className="relative z-10 mt-7 h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-[0.18em] text-white"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="relative z-10">
          {isLast
            ? (isAr ? 'ابدأ اللعبة' : 'START GAME')
            : `${t('nextPlayer')} → ${players[envelopeIndex + 1]?.name}`}
        </span>
      </motion.button>
    </motion.div>
  );
}

