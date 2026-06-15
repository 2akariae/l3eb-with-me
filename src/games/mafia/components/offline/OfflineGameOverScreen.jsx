// ── OfflineGameOverScreen — winner announcement + full role reveal ─────────────
import React from 'react';
import { motion } from 'framer-motion';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { getRoleLabel } from '../../../../constants/game.js';
import { restartOfflineGame } from '../../../../services/offlineEngine.js';
import HauntedHouseBg from '../../../../components/game/HauntedHouseBg.jsx';

const BADGES = {
  mafia:   { label: { en: 'Mafia',    ar: 'مافيا'    }, color: '#e02020', bg: 'rgba(224,32,32,0.15)' },
  doctor:  { label: { en: 'Doctor',   ar: 'طبيب'     }, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  sheikh:  { label: { en: 'Detective',ar: 'شيخ'      }, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  citizen: { label: { en: 'Citizen',  ar: 'مواطن'    }, color: '#c9943a', bg: 'rgba(201,148,58,0.15)' },
};

// Safe label resolver — always returns a string
function badgeLabel(badge, lang = 'en') {
  if (!badge) return '';
  if (typeof badge.label === 'string') return badge.label;
  return badge.label?.[lang] ?? badge.label?.en ?? '';
}

// Clean SVG role icon
function RoleIcon({ role, size = 16, color }) {
  const s = size;
  switch (role) {
    case 'mafia':   return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z"/></svg>;
    case 'doctor':  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'sheikh':  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    default:        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  }
}

export default function OfflineGameOverScreen({ onPlayAgain }) {
  const { winner, players, roles, alivePlayers, language } = useOfflineStore();
  const t = useOfflineLang(language);

  const isMafiaWin = winner === 'mafia';

  const sorted = [...players].sort((a, b) => {
    const ra = roles[a.id] ?? 'citizen', rb = roles[b.id] ?? 'citizen';
    if (ra === 'mafia' && rb !== 'mafia') return -1;
    if (rb === 'mafia' && ra !== 'mafia') return 1;
    return (alivePlayers.includes(b.id) ? 1 : 0) - (alivePlayers.includes(a.id) ? 1 : 0);
  });

  return (
    <div className="screen overflow-hidden relative">
      <HauntedHouseBg isNight={isMafiaWin} />

      {/* Winner color overlay */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="absolute inset-0 z-0"
        style={{ background: `radial-gradient(ellipse at top, ${isMafiaWin ? '#e02020' : '#10b981'} 0%, transparent 65%)` }} />

      <div className="relative z-10 flex flex-col h-full overflow-y-auto px-6 pb-8">

        {/* Result */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.15 }}
          className="text-center pt-14 pb-8">

          {/* Animated icon */}
          <motion.div
            animate={{ y: [0, -12, 0], rotate: isMafiaWin ? [0, -5, 5, 0] : [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4 select-none"
          >
            {isMafiaWin ? (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z"/>
              </svg>
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 19l3-10 4 6 3-8 3 8 4-6 3 10H2z"/><line x1="12" y1="2" x2="12" y2="4"/>
              </svg>
            )}
          </motion.div>

          <h1 className={`text-4xl font-black tracking-[0.08em] ${isMafiaWin ? 'text-crimson-400' : 'text-emerald-400'}`}
            style={{ fontFamily: 'Playfair Display, serif', textShadow: `0 0 40px ${isMafiaWin ? '#e02020' : '#10b981'}55` }}>
            {isMafiaWin ? t('mafiaWins') : t('civiliansWin')}
          </h1>
          <p className="text-smoke-400 text-xs tracking-[0.28em] uppercase mt-3 font-mono">
            {isMafiaWin ? t('mafiaControl') : t('townEliminated')}
          </p>
        </motion.div>

        {/* Standings */}
        <p className="text-center text-smoke-500 text-xs font-black uppercase tracking-[0.3em] mb-4">{t('finalStandings')}</p>
        <div className="flex flex-col gap-2">
          {sorted.map((p, i) => {
            const role   = roles[p.id] ?? 'citizen';
            const badge  = BADGES[role];
            const alive  = alivePlayers.includes(p.id);
            return (
              <motion.div key={p.id}
                initial={{ x: -18, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex items-center gap-4 h-14 px-5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', opacity: alive ? 1 : 0.48 }}>
                <span className="text-smoke-500 text-xs font-bold w-5">{i + 1}.</span>
                <span className={`flex-1 font-black text-white text-sm ${!alive ? 'line-through opacity-50' : ''}`}>{p.name}</span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: badge.bg, color: badge.color }}>
                  <RoleIcon role={role} size={11} color={badge.color} />
                  {getRoleLabel(role, language, badge)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Play Again (New) */}
        <div className="flex flex-col gap-3 mt-8">
          <motion.button
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
            whileTap={{ scale: 0.97 }} onClick={restartOfflineGame}
            className="w-full h-16 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#c026d3)', boxShadow: '0 0 30px rgba(124,58,237,0.35)' }}>
            {t('playAgain')}
          </motion.button>

          <motion.button
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.97 }} onClick={onPlayAgain}
            className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] text-smoke-400 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            {t('backToHub')}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
