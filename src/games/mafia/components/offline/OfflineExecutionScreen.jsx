import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { executionToNextRound } from '../../../../services/offlineEngine.js';
import { ROLE_META, getRoleLabel } from '../../../../constants/game.js';
import HauntedHouseBg from '../../../../components/game/HauntedHouseBg.jsx';

export default function OfflineExecutionScreen() {
  const { players, lastExecuted, lastExecutedRole, language } = useOfflineStore();
  const t      = useOfflineLang(language);
  const [phase, setPhase] = useState('name');

  const victim  = lastExecuted ? players.find((p) => p.id === lastExecuted) : null;
  const meta    = lastExecutedRole ? ROLE_META[lastExecutedRole] : null;
  const isMafia = lastExecutedRole === 'mafia';

  useEffect(() => {
    if (!victim) {
      // No exile — show briefly then advance
      const t1 = setTimeout(executionToNextRound, 2200);
      return () => clearTimeout(t1);
    }
    const t1 = setTimeout(() => setPhase('role'),     1800);
    const t2 = setTimeout(() => setPhase('continue'), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const roleEmoji = {
    mafia: '⚔️', doctor: '✚', sheikh: '🔍', citizen: '👤',
  }[lastExecutedRole] ?? '👤';

  return (
    <div className="screen overflow-hidden relative">
      <HauntedHouseBg isNight={false} />
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="absolute inset-0 z-1"
        style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />

      <div className="relative z-10 flex flex-col h-full items-center justify-center px-8 gap-6">
        {victim ? (
          <>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-smoke-400 tracking-[0.4em] uppercase font-mono font-black">
              {t('townExiled')}
            </motion.p>

            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.2 }}
              className="text-6xl font-black text-white text-center"
              style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 0 40px rgba(255,255,255,0.3)' }}>
              {victim.name.toUpperCase()}
            </motion.h1>

            {(phase === 'role' || phase === 'continue') && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="flex flex-col items-center gap-3 px-8 py-5 rounded-3xl border"
                style={{
                  background: `${meta?.glowColor ?? 'rgba(100,60,200,0.2)'}33`,
                  borderColor: meta?.glowColor ?? 'rgba(255,255,255,0.2)',
                  boxShadow:  `0 0 40px ${meta?.glowColor ?? 'rgba(100,60,200,0.2)'}`,
                }}>
                <p className="text-3xl">{roleEmoji}</p>
                <p className={`text-2xl font-black tracking-[0.2em] ${meta?.textClass ?? 'text-white'}`}>
                  {getRoleLabel(lastExecutedRole, language).toUpperCase()}
                </p>
                <p className={`text-sm font-bold ${isMafia ? 'text-crimson-400' : 'text-emerald-400'}`}>
                  {isMafia ? '😈 The Mafia loses one.' : '✓ The Town got it right!'}
                </p>
              </motion.div>
            )}

            {phase === 'continue' && (
              <motion.button
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.97 }} onClick={executionToNextRound}
                className="w-full h-16 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {t('continueBtn')}
              </motion.button>
            )}
          </>
        ) : (
          /* No exile — show message with auto-advance */
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="text-center">
            <p className="text-5xl mb-5">🤝</p>
            <h1 className="text-4xl font-black text-white">{t('noExile')}</h1>
            <p className="text-smoke-400 text-sm mt-3">{t('noExileDesc')}</p>
            <motion.div className="flex gap-2 justify-center mt-8"
              animate={{}} transition={{}}>
              {[0,1,2].map((i) => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-white/40"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
