// ── OfflineDawnScreen — typewriter narrative of night events ──────────────────
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { dawnToDiscussion } from '../../../../services/offlineEngine.js';
import { useTypewriter } from '../../../../hooks/useTypewriter.js';
import HauntedHouseBg from '../../../../components/game/HauntedHouseBg.jsx';

function TypeLine({ text, onDone }) {
  const { displayed, done } = useTypewriter(text, 32, onDone);
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="text-xl font-semibold text-white leading-relaxed"
      style={{ fontFamily: 'Playfair Display, serif' }}>
      {displayed}
      {!done && <span className="text-gold-400 animate-pulse ml-0.5">|</span>}
    </motion.p>
  );
}

export default function OfflineDawnScreen() {
  const { scrollLines, lastKilled, players, language } = useOfflineStore();
  const t = useOfflineLang(language);
  const [lineIdx, setLineIdx] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const victim = lastKilled ? players.find((p) => p.id === lastKilled) : null;

  function onLineDone() {
    if (lineIdx < scrollLines.length - 1) {
      setTimeout(() => setLineIdx((i) => i + 1), 700);
    } else {
      setTimeout(() => setAllDone(true), 900);
    }
  }

  return (
    <div className="screen overflow-hidden relative">
      <HauntedHouseBg isNight={false} />
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 flex flex-col h-full px-8 py-14">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-xs font-black uppercase tracking-[0.4em] font-mono"
            style={{ color: '#c9943a' }}>{t('dawnBreaksTitle')}</p>
        </motion.div>

        {/* Victim callout */}
        {victim && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', damping: 14 }}
            className="flex items-center gap-4 p-4 rounded-2xl mb-6"
            style={{ background: 'rgba(224,32,32,0.12)', border: '1px solid rgba(224,32,32,0.28)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(224,32,32,0.2)', border: '1px solid rgba(224,32,32,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="17" y1="11" x2="23" y2="11"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-crimson-400 font-black uppercase tracking-widest">{t('eliminated')}</p>
              <p className="text-white font-black text-xl">{victim.name}</p>
            </div>
          </motion.div>
        )}

        {/* Narrative lines */}
        <div className="flex-1 flex flex-col justify-center gap-5">
          {scrollLines.slice(0, lineIdx + 1).map((line, i) => (
            <TypeLine key={i} text={line} onDone={i === lineIdx ? onLineDone : undefined} />
          ))}
        </div>

        {/* Continue */}
        <AnimatePresence>
          {allDone && (
            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              whileTap={{ scale: 0.97 }} onClick={dawnToDiscussion}
              className="w-full h-16 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white"
              style={{ background: 'linear-gradient(135deg,#4a7fd4,#7c3aed)', boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}>
              {t('startDiscussion')}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
