// ── OfflineVotingScreen — moderator selects who to exile ─────────────────────
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { confirmExile } from '../../../../services/offlineEngine.js';
import { GameBackground } from '../../../../components/game/GameBackground.jsx';

export default function OfflineVotingScreen() {
  const { players, alivePlayers, round, language } = useOfflineStore();
  const t = useOfflineLang(language);
  const [selected, setSelected] = useState(null);
  const [locking,  setLocking]  = useState(false);

  const alive = players.filter((p) => alivePlayers.includes(p.id));

  function handleExile(targetId) {
    if (locking) return;
    setLocking(true);
    // Small delay so the button press animation is visible
    setTimeout(() => confirmExile(targetId), 450);
  }

  function handleSkip() {
    if (locking) return;
    setLocking(true);
    setTimeout(() => confirmExile(null), 300);
  }

  return (
    <div className="screen overflow-hidden relative glass-panel">
      <GameBackground />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full px-6 pointer-events-auto">
        {/* Header */}
        <div className="text-center pt-10 pb-6">
          <p className="text-purple-400 text-xs font-black uppercase tracking-[0.3em]">
            {t('votingPhase')} · ROUND {round}
          </p>
          <h1 className="text-white text-3xl font-black mt-2"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('whoExile')}
          </h1>
          <p className="text-smoke-400 text-xs mt-2">{t('votingInstruction')}</p>
        </div>

        {/* Player buttons */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
          {alive.map((p) => {
            const isSel = selected === p.id;
            return (
              <motion.button key={p.id} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !locking && setSelected(isSel ? null : p.id)}
                className="relative w-full h-16 rounded-2xl flex items-center justify-center font-black text-base tracking-widest overflow-hidden"
                style={{
                  background: isSel ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isSel ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isSel ? '0 0 22px rgba(124,58,237,0.4)' : 'none',
                  color: 'white',
                }}>
                {isSel && (
                  <motion.div layoutId="vsel" className="absolute inset-0 bg-purple-600/18" />
                )}
                <span className="relative z-10">{p.name.toUpperCase()}</span>
                {isSel && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="relative z-10 ml-3 text-purple-300">✓</motion.span>
                )}
              </motion.button>
            );
          })}

          {/* Skip */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }} 
            onClick={handleSkip} disabled={locking}
            className="w-full h-14 rounded-2xl font-black text-sm tracking-widest text-smoke-500 mt-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {t('skipNobody')}
          </motion.button>
        </div>

        {/* Exile confirm */}
        <AnimatePresence>
          {selected && !locking && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
              className="py-5">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }} 
                onClick={() => handleExile(selected)}
                className="w-full h-16 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#c026d3)', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
                {t('exileBtn')} {players.find((p) => p.id === selected)?.name?.toUpperCase()}
              </motion.button>
            </motion.div>
          )}
          {(!selected || locking) && <div className="py-5" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

