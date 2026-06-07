// ─── THE MAFIA — VotingScreen.jsx (PREMIUM REFACTOR) ─────────────────────────
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import { subscribeVotes, subscribeSkipVotes, submitVote, submitSkipVote, resolveVoting } from '../../games/mafia/hooks/useMafiaEngine.js';
import { Avatar, toast } from '../ui/index.jsx';
import { SKIP_THRESHOLD } from '../../constants/game.js';
import { useTimer } from '../../hooks/useTimer.js';
import { useTranslation } from '../../constants/translations.js';
import HauntedHouseBg from '../game/HauntedHouseBg.jsx';

/* ── SVG Icons ── */
function VoteIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function SkipIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l6 16h4"/><circle cx="9" cy="7" r="1"/><circle cx="15" cy="17" r="1"/>
    </svg>
  );
}

export default function VotingScreen({ user, playerId }) {
  const { roomId, isHost, players, votes, setVotes, skipVotes, setSkipVotes, gameState, language, gameType } = useGameStore();
  const [myVote,    setMyVote]    = useState(null);
  const [skipped,   setSkipped]   = useState(false);
  const [resolving, setResolving] = useState(false);

  const t = useTranslation(language);

  useEffect(() => {
    if (!roomId || !gameType) return;
    const u1 = subscribeVotes(roomId, setVotes, gameType);
    const u2 = subscribeSkipVotes(roomId, setSkipVotes, gameType);
    return () => { u1(); u2(); };
  }, [roomId, gameType]);

  async function handleExpire() {
    if (!isHost || resolving) return;
    setResolving(true);
    try { await resolveVoting(roomId, gameType); }
    catch (e) { toast(e.message, 'error'); setResolving(false); }
  }

  const { remaining } = useTimer(gameState, handleExpire);

  const alivePlayers = Object.entries(players)
    .filter(([, p]) => p.isAlive)
    .map(([uid, p]) => ({ uid, ...p }));

  const aliveCount  = alivePlayers.length;
  const skipCount   = Object.keys(skipVotes).length;
  const skipReached = aliveCount > 0 && (skipCount / aliveCount) >= SKIP_THRESHOLD;

  const me      = players[playerId];
  const canVote = me?.isAlive && !myVote;

  const tally = {};
  Object.values(votes).forEach((target) => {
    tally[target] = (tally[target] || 0) + 1;
  });
  const maxVotes = Math.max(0, ...Object.values(tally));

  useEffect(() => {
    if (skipReached && isHost && !resolving) {
      setResolving(true);
      setTimeout(() => resolveVoting(roomId, gameType).catch(() => setResolving(false)), 800);
    }
  }, [skipReached, isHost, gameType]); // eslint-disable-line

  async function handleVote(targetUid) {
    if (!canVote) return;
    setMyVote(targetUid);
    try { await submitVote(roomId, playerId, targetUid, gameType, user?.uid); }
    catch (e) { toast(e.message, 'error'); setMyVote(null); }
  }

  async function handleSkip() {
    if (skipped || !me?.isAlive) return;
    setSkipped(true);
    await submitSkipVote(roomId, playerId, gameType);
  }

  const votedCount = Object.keys(votes).length;
  const votePct    = aliveCount > 0 ? (votedCount / aliveCount) * 100 : 0;

  return (
    <div className="screen noise overflow-hidden">
      <HauntedHouseBg isNight={false} />

      {/* Crimson tension overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at center top, rgba(224,32,32,0.25) 0%, transparent 65%)' }}
      />
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-safe pt-4 pb-4 border-b border-white/5 bg-black/30 backdrop-blur-2xl flex-shrink-0">
        <div>
          <h1 className="display text-xl font-black text-white tracking-tight">{t('voting')}</h1>
          <p className="text-crimson-500/80 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
            {t('tieNoExecution')}
          </p>
        </div>
        <div
          className="h-10 px-4 rounded-2xl flex items-center gap-2.5 shadow-2xl"
          style={{ background: 'rgba(224,32,32,0.15)', border: '1.5px solid rgba(224,32,32,0.4)' }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-crimson-500 shadow-[0_0_10px_rgba(224,32,32,0.6)]"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="font-black text-crimson-400 text-sm font-mono tabular-nums tracking-wider">{remaining}s</span>
        </div>
      </div>

      {/* Vote Progress */}
      <div className="relative z-10 px-6 py-4 flex-shrink-0 bg-black/10">
        <div className="flex justify-between items-center text-[9px] font-black text-smoke-500 uppercase tracking-[0.3em] mb-3 px-1">
          <span>{votedCount} / {aliveCount} {t('voted')}</span>
          <span className="text-white">{Math.round(votePct)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/5 p-[1px] border border-white/5">
          <motion.div
            className="h-full rounded-full shadow-[0_0_15px_rgba(224,32,32,0.4)]"
            style={{ background: 'linear-gradient(90deg, #b91c1c, #ef4444)' }}
            initial={{ width: 0 }}
            animate={{ width: `${votePct}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 100 }}
          />
        </div>
      </div>

      {/* Candidate List */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 pt-2 min-h-0 scrollbar-hide">
        <div className="flex flex-col gap-3">
          {alivePlayers
            .filter((p) => p.uid !== playerId)
            .map((p) => {
              const voteCount = tally[p.uid] || 0;
              const isLeading = voteCount === maxVotes && maxVotes > 0;
              const isMine    = myVote === p.uid;
              const votePctRow = aliveCount > 0 ? (voteCount / aliveCount) * 100 : 0;

              return (
                <motion.button
                  key={p.uid}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVote(p.uid)}
                  disabled={!canVote}
                  className="relative h-18 rounded-[1.75rem] flex items-center gap-4 px-5 overflow-hidden text-left transition-all"
                  style={{
                    background: isMine
                      ? 'linear-gradient(135deg, rgba(224,32,32,0.25), rgba(224,32,32,0.15))'
                      : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${
                      isMine    ? 'rgba(224,32,32,0.6)'
                    : isLeading ? 'rgba(224,32,32,0.25)'
                    :             'rgba(255,255,255,0.05)'
                    }`,
                    boxShadow: isMine
                      ? '0 10px 25px rgba(224,32,32,0.2)'
                      : 'none',
                    cursor: canVote ? 'pointer' : 'default',
                  }}
                >
                  {/* Tally Fill */}
                  {!isMine && voteCount > 0 && (
                    <motion.div
                      className="absolute inset-y-0 left-0 pointer-events-none opacity-20"
                      style={{ background: 'rgba(224,32,32,0.4)', borderRadius: 'inherit' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${votePctRow}%` }}
                      transition={{ type: 'spring', damping: 25 }}
                    />
                  )}

                  <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="sm" />

                  <div className="flex-1 relative z-10 min-w-0">
                    <p className="font-black text-sm text-white truncate tracking-tight">{p.name}</p>
                    {isMine && (
                      <p className="text-[9px] font-black uppercase text-crimson-400 tracking-widest mt-0.5 animate-pulse">Your Verdict</p>
                    )}
                  </div>

                  {/* Badge */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs flex-shrink-0 relative z-10 shadow-inner"
                    style={{
                      background: isMine ? 'rgba(224,32,32,0.3)' : isLeading ? 'rgba(224,32,32,0.15)' : 'rgba(255,255,255,0.03)',
                      color:      isMine ? 'white' : isLeading ? '#ef4444' : 'rgba(255,255,255,0.2)',
                      border:     isLeading ? '1px solid rgba(224,32,32,0.2)' : '1px solid transparent'
                    }}
                  >
                    {voteCount > 0 ? voteCount : '—'}
                  </div>
                </motion.button>
              );
            })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 pb-safe pb-6 pt-4 border-t border-white/5 bg-black/40 backdrop-blur-2xl flex-shrink-0">
        {me?.isAlive && !skipped ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            className="h-16 w-full rounded-[1.75rem] font-black text-sm flex items-center justify-between px-6 text-white group"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <SkipIcon size={18} color="rgba(255,255,255,0.5)" />
              <span className="tracking-widest uppercase text-xs">{t('skip')}</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl font-mono text-[10px] shadow-inner"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
            >
              {skipCount} / {Math.ceil(aliveCount * SKIP_THRESHOLD)}
            </div>
          </motion.button>
        ) : skipped ? (
          <div
            className="h-16 flex items-center justify-center gap-3 rounded-[1.75rem] border border-white/5 bg-white/[0.02] opacity-40"
          >
            <VoteIcon size={18} color="rgba(255,255,255,0.5)" />
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{t('voted')}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
