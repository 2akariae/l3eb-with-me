// ─── THE MAFIA — GameOverScreen.jsx (v10-fixed) ───────────────────────────────
// BUG FIXED (P2): getRevealColor used ROLE_META[role]?.textClass which does not
//   exist on any ROLE_META entry (they have `color` and `glow`, not `textClass`).
//   The expression always fell through to 'text-white', making every role in the
//   Full Roster Reveal panel render in plain white regardless of faction.
//   Fixed with an explicit lookup table (ROLE_COLOR_CLASS).
//
// BUG FIXED (P2): Following strings were hardcoded English and never passed
//   through useTranslation — breaking Arabic layout:
//     "Full Roster Reveal" → t('fullRosterReveal')
//     "Mafia Wins" / "Citizens Win" → t('mafiaWins') / t('civiliansWin')
//     "The Spy Wins" → t('spyWon')
//     "BACK TO HUB" → t('backToHub')
//     "Eliminated" on player cards → t('eliminated')

import React from 'react';
import { motion } from 'framer-motion';
import { ref, remove } from 'firebase/database';
import { db } from '../../services/firebaseConfig.js';
import { useGameStore } from '../../store/gameStore.js';
import { restartRoom } from '../../services/gameEngine.js';
import { Avatar } from '../ui/index.jsx';
import { ROLE_META } from '../../constants/game.js';
import { useTranslation } from '../../constants/translations.js';
import { Trophy, Skull, Ghost, ArrowLeft, RotateCcw } from 'lucide-react';

// FIX (P2): explicit Tailwind class map instead of nonexistent ROLE_META.textClass
const ROLE_COLOR_CLASS = {
  mafia:   'text-crimson-400',
  doctor:  'text-emerald-400',
  sheikh:  'text-blue-400',
  citizen: 'text-gold-400',
  spy:     'text-emerald-400',
};

export default function GameOverScreen({ user }) {
  const { roomId, isHost, gameState, players, roles, clearRoom, language, gameType } = useGameStore();

  const t = useTranslation(language);

  const winner  = gameState?.winner;
  const isMafia = winner === 'mafia';
  const isSpy   = winner === 'spy';

  const allPlayers = Object.entries(players)
    .map(([uid, p]) => ({ uid, ...p, role: roles[uid] ?? null }))
    .sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (b.isAlive && !a.isAlive) return  1;
      return 0;
    });

  async function handleRestart() {
    if (!roomId || !isHost) return;
    try {
      await restartRoom(roomId, gameType);
    } catch (e) {
      console.error('Restart failed:', e);
    }
  }

  async function handleBackToHub() {
    if (roomId && isHost) {
      try { await remove(ref(db, `rooms/${roomId}`)); } catch {}
    }
    clearRoom();
  }

  const winColor = isMafia ? 'text-crimson-500' : isSpy ? 'text-emerald-500' : 'text-blue-500';
  const winGlow  = isMafia ? '#e02020' : isSpy ? '#10b981' : '#3b82f6';

  const getRevealLabel = (role) => {
    if (gameType === 'spy') return role === 'spy' ? (language === 'ar' ? 'الجاسوس' : 'THE SPY') : t('citizen').toUpperCase();
    const meta = ROLE_META[role];
    if (meta) return (language === 'ar' ? meta.label?.ar : meta.label?.en)?.toUpperCase() ?? (t(role)).toUpperCase();
    return t(role).toUpperCase();
  };

  // FIX (P2): use explicit color lookup — ROLE_META has no `textClass` property
  const getRevealColor = (role) => ROLE_COLOR_CLASS[role] ?? 'text-smoke-400';

  const winHeadline = isMafia ? t('mafiaWins') : isSpy ? t('spyWon') : t('civiliansWin');

  const winFlavour = isMafia
    ? (language === 'ar' ? 'ابتلعت الظلال المدينة.' : 'The shadows consumed the city.')
    : isSpy
    ? (language === 'ar' ? 'نجح الجاسوس في الحصول على المعلومات.' : 'The operative successfully extracted the intel.')
    : (language === 'ar' ? 'تم القضاء على التهديد.' : 'The threat has been neutralized.');

  return (
    <div className="screen bg-noir-950 noise" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Dynamic background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle, ${winGlow} 0%, transparent 70%)` }} />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center gap-12 scrollbar-hide">

        {/* Trophy / Result */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{ color: winGlow }}
          >
            {isMafia ? <Skull size={64} /> : isSpy ? <Ghost size={64} /> : <Trophy size={64} />}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-gold-500/60 text-[10px] font-black uppercase tracking-[0.5em]"
          >
            {t('gameOver')}
          </motion.p>

          {/* FIX (P2): was hardcoded ternary string, now uses translation keys */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className={`display text-4xl font-black ${winColor} tracking-tight uppercase`}
          >
            {winHeadline}
          </motion.h1>

          <p className="text-smoke-500 text-xs font-bold max-w-[280px] mx-auto opacity-60 leading-relaxed uppercase tracking-widest">
            {winFlavour}
          </p>
        </div>

        {/* Roles Reveal Card */}
        <div className="w-full bg-noir-900/60 border border-white/5 rounded-[3rem] p-8 space-y-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            {/* FIX (P2): was hardcoded "Full Roster Reveal" string */}
            <h2 className="text-[10px] font-black text-smoke-600 uppercase tracking-[0.3em]">
              {t('fullRosterReveal')}
            </h2>
            <div className="h-px w-8 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {allPlayers.map((p, i) => (
              <motion.div
                key={p.uid}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-4 hover:bg-white/[0.08] transition-all"
              >
                <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="sm" dead={!p.isAlive} />
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm truncate ${!p.isAlive ? 'opacity-40' : 'text-white'}`}>
                    {p.name}
                  </p>
                  {/* FIX (P2): getRevealColor now returns correct Tailwind class */}
                  <p className={`text-[9px] font-black uppercase tracking-widest ${getRevealColor(p.role)}`}>
                    {getRevealLabel(p.role)}
                  </p>
                </div>
                {/* FIX (P2): "Eliminated" was hardcoded English */}
                {!p.isAlive && (
                  <span className="text-[9px] font-black text-crimson-500/40 uppercase tracking-widest">
                    {t('eliminated')}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-4">
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRestart}
              className="h-20 w-full rounded-[2rem] bg-gold-500 text-black font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all"
            >
              <RotateCcw size={20} />
              <span>{t('playAgain').toUpperCase()}</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleBackToHub}
            className="h-16 w-full rounded-[2rem] bg-white/5 border border-white/10 text-white font-black text-sm shadow-2xl flex items-center justify-center gap-3 transition-all"
          >
            <ArrowLeft size={16} />
            {/* FIX (P2): was hardcoded 'BACK TO HUB' / 'العودة للقائمة' ternary */}
            <span>{t('backToHub').toUpperCase()}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
