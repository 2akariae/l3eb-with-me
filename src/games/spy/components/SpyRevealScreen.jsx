// ─── THE SPY — SpyRevealScreen.jsx (v8) ──────────────────────────────────────
// FIX: category/word are bilingual objects { en, ar } — resolved with language key.
// FIX: no hardcoded inline strings; all text via useTranslation.
import React, { useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { TimerRing } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Ghost, Shield, HelpCircle, Terminal } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import BackButton from '../../../components/ui/BackButton.jsx';

function GlitchText({ text, className }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <motion.span className="absolute inset-0 text-emerald-500 z-0 opacity-50"
        animate={{ x: [-2, 2, -2], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}>{text}</motion.span>
      <motion.span className="absolute inset-0 text-blue-500 z-0 opacity-50"
        animate={{ x: [2, -2, 2], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 0.1, repeat: Infinity, delay: 0.05, ease: "linear" }}>{text}</motion.span>
    </div>
  );
}

export default function SpyRevealScreen({ user, onExpire }) {
  const { myRole, gameState, language } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const t    = useTranslation(language);
  const isAr = language === 'ar';
  const { remaining } = useTimer(gameState, onExpire);

  const isSpy = myRole === 'spy';

  // Resolve bilingual game data
  const displayWord = typeof gameState?.word === 'object' ? (gameState?.word?.[language] ?? gameState?.word?.en ?? '') : (gameState?.word ?? '');
  const displayHint = typeof gameState?.hint === 'object' ? (gameState?.hint?.[language] ?? gameState?.hint?.en ?? '') : (gameState?.hint ?? '');

  const SPY_CONFIG = {
    spy:     { glow: '#10b981', bg: 'bg-zinc-900', border: 'border-emerald-500/40' },
    citizen: { glow: '#3b82f6', bg: 'bg-zinc-900', border: 'border-blue-500/40' },
  };
  const cfg = SPY_CONFIG[isSpy ? 'spy' : 'citizen'];

  const { clearRoom } = useGameStore();
  return (
    <div className="screen bg-zinc-950 overflow-hidden flex flex-col items-center justify-center p-6 gap-10">
      <BackButton onClick={clearRoom} />
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="absolute top-8 right-8 z-20">
        <TimerRing remaining={remaining} total={10} size={60} color={isSpy ? '#10b981' : '#3b82f6'} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Terminal size={14} className="text-emerald-500" />
          <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.3em] font-mono">{t('decryptionInit')}</p>
        </div>
        <h2 className="display text-3xl font-black text-white uppercase tracking-tight">
          {revealed ? t('identityRevealed') : t('decryptingRole')}
        </h2>
      </motion.div>

      <motion.div
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        onClick={() => setRevealed(true)}
        className="relative w-64 h-96 cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div key="hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "tween", duration: 0.1, ease: "linear" }}
              className="w-full h-full rounded-[2.5rem] bg-zinc-900 border border-white/10 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <HelpCircle size={40} className="text-smoke-500" />
              </div>
              <p className="text-smoke-500 text-[11px] font-black tracking-[0.3em] font-mono">{t('tapToDecrypt')}</p>
            </motion.div>
          ) : (
            <motion.div key="revealed"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ type: "tween", duration: 0.1, ease: "linear" }}
              className={`w-full h-full rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center gap-6 border-2 ${cfg.bg} ${cfg.border}`}>
              <motion.div
                className="p-6 rounded-3xl bg-black/40 border border-white/10"
                style={{ color: cfg.glow }}>
                {isSpy ? <Ghost size={50} /> : <Shield size={50} />}
              </motion.div>

              <div>
                <GlitchText
                  text={isSpy ? t('theSpy').toUpperCase() : t('citizen').toUpperCase()}
                  className="text-2xl font-black tracking-tight"
                />
                <div className="h-px w-12 bg-white/20 mx-auto mt-4 mb-4" />

                {isSpy ? (
                  <div className="space-y-4">
                    <p className="text-emerald-400/80 text-xs font-medium leading-relaxed">
                      {t('spyRoleDesc')}
                    </p>
                    {displayHint && (
                      <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30">
                        <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1">{t('wordHint')}</p>
                        <p className="text-white font-bold text-sm">{displayHint}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-blue-400/80 text-xs font-medium leading-relaxed">{t('secretWordIs').toUpperCase()}:</p>
                    <p className="text-white text-3xl font-black tracking-wider uppercase">{displayWord}</p>
                    {displayHint && (
                      <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest">
                        {t('wordHint').toUpperCase()}: {displayHint}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.2em] font-mono text-center">
        {revealed ? t('maintainSilence') : t('tapToDecrypt')}
      </motion.p>
    </div>
  );
}
