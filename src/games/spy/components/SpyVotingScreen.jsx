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
import { TimerRing, Avatar, toast } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Gavel } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import { GameBackground } from "@/components/game/GameBackground.jsx";

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
    <div className="screen bg-noir-950 glass-panel flex flex-col overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <GameBackground />

      {/* Header */}
      <div className="px-6 pt-safe pt-16 pb-6 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
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
      <div className="px-6 py-4 bg-black/20">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-smoke-500 mb-2">
          <span>{totalVotes} / {alivePlayers.length} {t('voted')}</span>
          <span className="text-emerald-500">
            {Math.round((totalVotes / (alivePlayers.length || 1)) * 100)}%
          </span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(totalVotes / (alivePlayers.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Voting list */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-1 gap-3">
          {alivePlayers.map(([uid, p]) => {
            const voteCount = Object.values(votes ?? {}).filter((v) => v === uid).length;
            return (
              <motion.button
                key={uid}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVote(uid)}
                disabled={!!myVote || uid === playerId}
                className={`relative h-20 rounded-[2rem] flex items-center px-6 border-2 transition-all ${
                  myVote === uid
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : uid === playerId
                    ? 'bg-white/5 border-white/5 opacity-50 grayscale'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <Avatar uid={uid} name={p.name} avatar={p.avatar} size="sm" />
                <div className="flex-1 ml-4 text-left">
                  <p className="text-white font-black text-sm">{p.name}</p>
                  <p className="text-smoke-600 text-[9px] font-black uppercase tracking-widest">
                    {uid === playerId
                      ? (isAr ? 'أنت' : 'YOU')
                      : (isAr ? 'مشتبه به' : 'SUSPECT')}
                  </p>
                </div>
                {voteCount > 0 && (
                  <div className="flex gap-1">
                    {Array.from({ length: voteCount }).map((_, vi) => (
                      <div key={vi} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Host resolve footer */}
      {isHost && (
        <div className="px-6 pb-safe pb-6 pt-4 border-t border-white/5 bg-black/40 backdrop-blur-xl">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
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

