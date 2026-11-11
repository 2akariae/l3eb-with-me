// ─── THE SPY — SpyVotingScreen.jsx (v10-fixed) ───────────────────────────────
// BUG FIXED (P1): A "Guess Word" button and modal were rendered for the Spy
//   during the VOTING phase. Tapping it called submitSpyGuess(), which
//   unconditionally writes phase → GAME_OVER. This let the Spy:
//     1. Win instantly by guessing correctly BEFORE being voted out, bypassing
//        the entire SPY_GUESS phase designed for that purpose.
//     2. Forfeit the game (incorrect guess) prematurely, ending the round while
//        votes were still in progress.
//
//   The game's own canonical win-condition comment states:
//     "Spy wins ONLY by guessing the secret word correctly in the SPY_GUESS phase."
//
//   The Spy's one guess chance occurs AFTER resolveSpyVoting confirms the Spy
//   was voted out, in the dedicated SpyGuessScreen (phase = SPY_GUESS). That
//   screen is already correctly wired in App.jsx's phase router.
//
//   Fix: the Spy-only footer section and the AnimatePresence guess modal are
//   removed entirely. No state for showGuessModal/guess is needed.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { submitVote, resolveSpyVoting, subscribeVotes } from '../../../services/gameEngine.js';
import { TimerRing, Avatar, toast, PremiumCard } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Gavel } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import { SpyParallaxBackground } from './SpyParallaxBackground.jsx';
import { containerVariants, itemVariants } from '../../../constants/motion.js';

export default function SpyVotingScreen({ user, playerId }) {
  const { roomId, isHost, players, myRole, gameState, language, votes, setVotes } = useGameStore();
  const [myVote, setMyVote] = useState(null);

  const t    = useTranslation(language);
  const isAr = language === 'ar';

  const { remaining } = useTimer(gameState, async () => {
    if (isHost) await resolveSpyVoting(roomId);
  });

  // Subscribe to live votes for the spy game
  useEffect(() => {
    if (!roomId) return;
    return subscribeVotes(roomId, setVotes, 'spy');
  }, [roomId]); // eslint-disable-line

  const handleVote = async (targetId) => {
    if (myVote) return;
    setMyVote(targetId);
    try {
      await submitVote(roomId, playerId, targetId, 'spy', user?.uid);
    } catch (e) {
      toast(e.message, 'error');
      setMyVote(null);
    }
  };

  const alivePlayers = Object.entries(players).filter(([, p]) => p.isAlive);
  const totalVotes   = Object.keys(votes ?? {}).length;

  return (
    <div className="screen flex flex-col overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <SpyParallaxBackground />

      {/* Header */}
      <div className="px-6 pt-safe pt-16 pb-6 border-b border-white/5 bg-zinc-950/90">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gavel size={18} className="text-emerald-500" />
              <h1 className="display text-xl font-black text-white uppercase tracking-tight">
                {t('terminationVote')}
              </h1>
            </div>
            <p className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.2em]">
              {t('identifyAnomalies')}
            </p>
          </div>
          <TimerRing remaining={remaining} total={10} size={54} color="#10b981" />
        </div>
      </div>

      {/* Vote progress bar */}
      <div className="px-6 py-4 bg-zinc-950/90">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-smoke-500 mb-2">
          <span>{totalVotes} / {alivePlayers.length} {t('voted')}</span>
          <span className="text-emerald-500">
            {Math.round((totalVotes / (alivePlayers.length || 1)) * 100)}%
          </span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(totalVotes / (alivePlayers.length || 1)) * 100}%` }}
            transition={{ type: "tween", duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>

      {/* Voting list */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <motion.div 
          variants={containerVariants}
          initial="hidden" animate="visible"
          className="grid grid-cols-1 gap-3">
          {alivePlayers.map(([uid, p]) => {
            const voteCount = Object.values(votes ?? {}).filter((v) => v === uid).length;
            const isSelected = myVote === uid;
            return (
              <PremiumCard
                key={uid}
                padding="p-0"
                onClick={() => handleVote(uid)}
                className={`relative h-20 transition-all ${
                  isSelected
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : uid === playerId
                    ? 'border-white/5 opacity-50 grayscale'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`h-full flex items-center px-6 ${
                  isSelected
                    ? 'bg-emerald-900/40'
                    : uid === playerId
                    ? 'bg-white/5'
                    : 'bg-white/5 hover:bg-white/[0.08]'
                }`}>
                  <div className={`relative p-0.5 rounded-full ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}>
                    <Avatar uid={uid} name={p.name} avatar={p.avatar} size="sm" />
                  </div>
                  <div className="flex-1 ml-4 text-left">
                    <p className="text-white font-black text-sm tracking-tight">{p.name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-500' : 'text-smoke-600'}`}>
                      {uid === playerId
                        ? (isAr ? 'أنت' : 'YOU')
                        : (isAr ? 'مشتبه به' : 'SUSPECT')}
                    </p>
                  </div>
                  {voteCount > 0 && (
                    <div className="flex gap-1.5">
                      {Array.from({ length: voteCount }).map((_, vi) => (
                        <motion.div 
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          key={vi} className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                      ))}
                    </div>
                  )}
                </div>
              </PremiumCard>
            );
          })}
        </motion.div>
      </div>

      {/* Host resolve footer */}
      {isHost && (
        <div className="px-6 pb-safe pb-6 pt-4 border-t border-white/5 bg-zinc-950/90">
          <motion.button
            transition={{ type: "tween", duration: 0.1, ease: "linear" }}
            onClick={async () => { if (isHost) await resolveSpyVoting(roomId); }}
            className="w-full h-14 rounded-[2rem] text-smoke-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {isAr ? 'إنهاء التصويت' : 'CLOSE VOTE'}
          </motion.button>
        </div>
      )}
    </div>
  );
}

