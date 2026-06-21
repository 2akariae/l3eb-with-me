// ── OfflineCloseEyesScreen — dramatic night transition ────────────────────────
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { closeEyesToNight } from '../../../../services/offlineEngine.js';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { GameBackground } from '../../../components/game/GameBackground.jsx';

export default function OfflineCloseEyesScreen() {
  const { language } = useOfflineStore();
  const t = useOfflineLang(language);

  useEffect(() => {
    const timer = setTimeout(closeEyesToNight, 3800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="screen overflow-hidden relative">
      <GameBackground />

      {/* Dark vignette */}
      <motion.div className="absolute inset-0 z-1 bg-black"
        initial={{ opacity: 0 }} animate={{ opacity: 0.45 }}
        transition={{ duration: 1.5 }} />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-5xl font-black text-white tracking-[0.1em] leading-tight"
            style={{ textShadow: '0 0 50px rgba(255,255,255,0.25)' }}>
            {t('everyoneCloseEyes').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="text-smoke-400 text-sm mt-6 tracking-[0.3em] font-mono uppercase">
            {t('getReadyNight')}
          </motion.p>
        </motion.div>

        {/* Animated loading dots */}
        <motion.div className="absolute bottom-16 flex gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-white/40"
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.35 }} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
