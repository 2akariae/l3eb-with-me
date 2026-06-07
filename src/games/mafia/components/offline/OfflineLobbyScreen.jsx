// ── OfflineLobbyScreen — add players, configure, start offline game ────────────
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { startOfflineGame, genPlayerId } from '../../../../services/offlineEngine.js';
import { getMafiaCount } from '../../../../constants/game.js';
import { ParallaxStars } from '../../../../components/game/ParallaxStars.jsx';

export default function OfflineLobbyScreen({ onBackToMode }) {
  const { players, setPlayers, reset, language, gameType } = useOfflineStore();
  const t = useOfflineLang(language);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const count      = players.length;
  const isSpy      = gameType === 'spy';
  const minPlayers = isSpy ? 3 : 4;
  const canStart   = count >= minPlayers;
  const mafiaCount = count >= 4 ? getMafiaCount(count) : 1;

  function addPlayer() {
    const name = input.trim();
    if (!name) return;
    if (name.length < 2) { setError('Min 2 characters'); return; }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) { setError('Name already taken'); return; }
    if (players.length >= 15) { setError('Max 15 players'); return; }
    setPlayers([...players, { id: genPlayerId(), name }]);
    setInput(''); setError('');
  }

  function handleStart() {
    if (!canStart) { setError(`Need at least ${4 - count} more player(s)`); return; }
    try { startOfflineGame(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="screen bg-noir-950 overflow-hidden">
      <ParallaxStars count={90} />

      {/* Back */}
      <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        onClick={() => { reset(); onBackToMode(); }}
        className="absolute top-4 left-4 z-20 px-4 py-2 rounded-xl border border-white/10 text-smoke-400 text-xs font-black uppercase tracking-widest"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        {t('back')}
      </motion.button>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-6 pt-20 pb-8 gap-5 h-full overflow-y-auto">

        {/* Title */}
        <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
          <h1 className="text-4xl font-black tracking-widest text-white uppercase"
            style={{ fontFamily: 'Playfair Display, serif', color: isSpy ? '#10b981' : '#e8c060' }}>
            {isSpy ? t('spyTitle') : t('mafiaTitle')}
          </h1>
          <p className="text-smoke-500 text-xs tracking-[0.4em] uppercase mt-1 font-mono">{t('offlineMode')}</p>
        </motion.div>

        {/* Role breakdown badge */}
        {count >= minPlayers && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4 px-5 py-2.5 rounded-2xl border border-white/8 text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {isSpy ? (
              <>
                <span className="text-emerald-400">1 {t('theSpy')}</span>
                <span className="text-white/20">|</span>
                <span className="text-gold-400">{count - 1} {t('citizens')}</span>
              </>
            ) : (
              <>
                <span className="text-crimson-400">✕ {mafiaCount} {t('mafia')}</span>
                <span className="text-white/20">|</span>
                <span className="text-emerald-400">+ 1 {t('doctor')}</span>
                <span className="text-white/20">|</span>
                <span className="text-blue-400">○ 1 {t('sheikh')}</span>
              </>
            )}
          </motion.div>
        )}

        {/* Input */}
        <div className="w-full flex gap-2">
          <input
            className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-white font-bold placeholder-smoke-600 focus:outline-none focus:border-purple-500/50 transition-all"
            placeholder={t('addPlayer')} value={input} maxLength={20}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={addPlayer}
            className="w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center font-black"
            style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.35)' }}>+</motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-crimson-400 text-xs font-bold">{error}</motion.p>
          )}
        </AnimatePresence>

        {/* Player list */}
        <div className="w-full flex flex-col gap-2">
          <AnimatePresence>
            {players.map((p, i) => (
              <motion.div key={p.id} layout
                initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                exit={{ x: 16, opacity: 0, height: 0 }}
                className="flex items-center gap-3 h-14 px-5 rounded-2xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-xs font-black text-smoke-400">{i + 1}</span>
                <span className="flex-1 font-bold text-white">{p.name}</span>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setPlayers(players.filter((x) => x.id !== p.id))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-crimson-400 hover:bg-crimson-500/15 text-xl">×</motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-h-4" />

        {/* Begin */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart} disabled={!canStart}
          className="w-full h-16 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white relative overflow-hidden"
          style={canStart ? {
            background: isSpy ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#7c3aed,#c026d3)',
            boxShadow: isSpy ? '0 0 40px rgba(16,185,129,0.4)' : '0 0 40px rgba(124,58,237,0.4)',
          } : {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)',
          }}>
          {canStart
            ? `${t('beginGame')} (${count})`
            : t('needMore').replace('{n}', minPlayers - count)}
        </motion.button>
      </div>
    </div>
  );
}
