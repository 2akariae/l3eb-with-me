// ─── THE MAFIA — DiscussionScreen.jsx ────────────────────────────────────────
// Mobile-first architecture:
//  • HauntedHouseBg (day mode) as atmospheric base
//  • Unified PlayerCard (luxury offline-parity)
//  • Floating PopupChat (never breaks layout)
//  • Mic + Deafen controls in header (Lucide, no emojis)
//  • Skip-discussion shared progress button (bottom sheet style)
//  • Phase timer in pill
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, SkipForward, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import {
  subscribeSkipVotes,
  submitSkipVote,
  advanceToVoting,
} from '../../games/mafia/hooks/useMafiaEngine.js';
import { useAgora } from '../../hooks/useAgora.js';
import { toast } from '../ui/index.jsx';
import { PHASES, SKIP_THRESHOLD } from '../../constants/game.js';
import { useTimer } from '../../hooks/useTimer.js';
import { useTranslation } from '../../constants/translations.js';
import HauntedHouseBg from '../game/HauntedHouseBg.jsx';
import { PopupChat } from '../game/PopupChat.jsx';
import { PlayerCard } from '../../games/mafia/components/PlayerCard.jsx';

export default function DiscussionScreen({ user, playerId }) {
  const {
    roomId, isHost, players, gameState, language,
    skipVotes, setSkipVotes, speakingUids, gameType,
  } = useGameStore();

  const t        = useTranslation(language);
  const [skipped,   setSkipped]   = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const me      = players?.[playerId];
  const isAlive = me?.isAlive ?? true;

  // Agora voice
  const { micEnabled, speakerEnabled, setMicEnabled, setSpeakerEnabled } =
    useAgora(roomId, user?.uid, isAlive, PHASES.DISCUSSION);

  // Skip votes subscription
  useEffect(() => {
    if (!roomId || !gameType) return;
    return subscribeSkipVotes(roomId, setSkipVotes, gameType);
  }, [roomId, gameType]); // eslint-disable-line

  const alivePlayers = Object.entries(players || {})
    .filter(([, p]) => p.isAlive)
    .map(([uid, p]) => ({ uid, ...p, isMe: uid === playerId }));

  const aliveCount  = alivePlayers.length;
  const skipCount   = Object.keys(skipVotes || {}).length;
  const skipReached = aliveCount > 0 && skipCount / aliveCount >= SKIP_THRESHOLD;
  const skipBarPct  = Math.min(skipCount / Math.max(1, aliveCount * SKIP_THRESHOLD), 1);

  const handleExpire = useCallback(async () => {
    if (!isHost || advancing || !gameType) return;
    setAdvancing(true);
    try { await advanceToVoting(roomId, gameType); }
    catch (e) { toast(e.message, 'error'); setAdvancing(false); }
  }, [isHost, advancing, roomId, gameType]);

  const { remaining } = useTimer(gameState, handleExpire);

  // Auto-advance when skip threshold reached
  useEffect(() => {
    if (skipReached && isHost && !advancing && gameType) {
      setAdvancing(true);
      setTimeout(() => advanceToVoting(roomId, gameType).catch(() => setAdvancing(false)), 900);
    }
  }, [skipReached, isHost, gameType]); // eslint-disable-line

  const handleSkip = useCallback(async () => {
    if (skipped || !isAlive || !gameType) return;
    setSkipped(true);
    await submitSkipVote(roomId, playerId, gameType);
  }, [skipped, isAlive, roomId, playerId, gameType]);

  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, '0');

  return (
    <div className="screen bg-noir-950 overflow-hidden flex flex-col">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <HauntedHouseBg isNight={false} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(3,2,10,0.45) 0%, rgba(3,2,10,0.1) 40%, rgba(3,2,10,0.7) 100%)' }} />
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe pt-3 pb-3 flex-shrink-0">

        {/* Left: phase label */}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-gold-400"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-400">
              {t('discussion')}
            </span>
          </div>
          <p className="text-[9px] text-smoke-500 font-mono uppercase tracking-widest">
            {t('round')} {gameState?.round ?? 1}
          </p>
        </div>

        {/* Center: timer pill */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 h-9 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div className="w-1.5 h-1.5 rounded-full bg-gold-500"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <span className="font-black text-gold-400 text-sm font-mono">{mins}:{secs}</span>
        </div>

        {/* Right: audio controls */}
        <div className="flex items-center gap-2">
          {/* Mic toggle */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setMicEnabled?.(!micEnabled)}
            disabled={!isAlive}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              background: !micEnabled ? 'rgba(224,32,32,0.2)' : 'rgba(16,185,129,0.15)',
              border:     `1px solid ${!micEnabled ? 'rgba(224,32,32,0.5)' : 'rgba(16,185,129,0.35)'}`,
              color:      !micEnabled ? '#e02020' : '#10b981',
              opacity:    isAlive ? 1 : 0.35,
            }}>
            {!micEnabled
              ? <MicOff   size={15} strokeWidth={2.5} />
              : <Mic      size={15} strokeWidth={2.5} />
            }
          </motion.button>

          {/* Deafen toggle */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setSpeakerEnabled?.(!speakerEnabled)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              background: !speakerEnabled ? 'rgba(224,32,32,0.2)' : 'rgba(255,255,255,0.07)',
              border:     `1px solid ${!speakerEnabled ? 'rgba(224,32,32,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color:      !speakerEnabled ? '#e02020' : 'rgba(255,255,255,0.5)',
            }}>
            {!speakerEnabled
              ? <VolumeX  size={15} strokeWidth={2.5} />
              : <Volume2  size={15} strokeWidth={2.5} />
            }
          </motion.button>
        </div>
      </div>

      {/* ── Player Grid ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {alivePlayers.map((p) => (
            <PlayerCard
              key={p.uid}
              uid={p.uid}
              name={p.name}
              isAlive={true}
              isHost={p.isHost}
              isMe={p.isMe}
              speaking={!!speakingUids[p.uid]}
            />
          ))}
        </div>

        {/* Dead players row */}
        {Object.entries(players).some(([, p]) => !p.isAlive) && (
          <div className="mt-6">
            <p className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.3em] text-center mb-3">
              Eliminated
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(players)
                .filter(([, p]) => !p.isAlive)
                .map(([uid, p]) => (
                  <PlayerCard
                    key={uid}
                    uid={uid}
                    name={p.name}
                    isAlive={false}
                    className="w-[90px] h-[90px]"
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Skip Discussion Bottom Sheet ──────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-4 pb-safe pb-5 pt-2"
        style={{ background: 'linear-gradient(to top, rgba(3,2,10,0.95) 0%, transparent 100%)' }}>
        <AnimatePresence mode="wait">
          {!skipped && isAlive ? (
            <motion.button key="skip-btn"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              className="relative w-full h-16 rounded-2xl overflow-hidden flex items-center justify-between px-5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {/* Progress fill */}
              <motion.div className="absolute inset-0 origin-left rounded-2xl pointer-events-none"
                style={{ background: 'linear-gradient(90deg,rgba(201,148,58,0.28) 0%,rgba(201,148,58,0.08) 100%)' }}
                animate={{ scaleX: skipBarPct }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
              {/* Flash when reached */}
              <AnimatePresence>
                {skipReached && (
                  <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl pointer-events-none bg-gold-400" />
                )}
              </AnimatePresence>
              <div className="relative flex items-center gap-2 text-white">
                <SkipForward size={15} strokeWidth={2.5} />
                <span className="font-black text-sm">{t('skip')} Discussion</span>
              </div>
              <span className="relative text-[11px] font-black text-smoke-400">
                {skipCount} / {Math.ceil(aliveCount * SKIP_THRESHOLD)}
                {skipReached && (
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                    className="ml-2 text-gold-400">●</motion.span>
                )}
              </span>
            </motion.button>
          ) : (
            <motion.div key="voted"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="h-16 flex items-center justify-center gap-2 opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem' }}>
              <CheckCircle2 size={14} strokeWidth={2.5} color="#10b981" />
              <span className="text-white text-xs font-black uppercase tracking-widest">{t('voted')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Floating popup chat ───────────────────────────────────────────── */}
      <PopupChat playerId={playerId} label="Chat" accentColor="#c9943a" />
    </div>
  );
}
