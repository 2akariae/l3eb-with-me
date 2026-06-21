// ─── THE MAFIA PLATFORM — LobbyScreen.jsx (v12 — cinematic motion) ──────────
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useTransform } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import {
  startGame, startSpyGame, leaveRoom, kickPlayer,
  subscribeJoinRequests, resolveJoinRequest,
} from '../../games/mafia/hooks/useMafiaEngine.js';
import { Avatar, toast, Spinner } from '../ui/index.jsx';
import { getMafiaCount } from '../../constants/game.js';
import { useTranslation } from '../../constants/translations.js';
import BackButton from '../ui/BackButton.jsx';
import { Share2, Crown, UserX, Users, Zap, ShieldCheck } from 'lucide-react';
import { GameBackground } from '../game/GameBackground.jsx';
import { useSpringMouse } from '../../hooks/useMouseTracker.js';

// ── Kick Confirm Modal ────────────────────────────────────────────────────────
function KickConfirmModal({ player, onConfirm, onCancel, t }) {
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xs rounded-[3rem] p-10 text-center bg-zinc-900/40 backdrop-blur-xl border border-red-500/20 shadow-2xl">
        <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <UserX size={48} className="text-red-500" />
        </div>
        <h3 className="text-white font-black text-2xl mb-2 tracking-tight">{t('kickPlayer')}</h3>
        <p className="text-white/40 text-sm mb-8 font-bold">{player?.name}</p>
        <div className="flex flex-col gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} className="h-14 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/40">
            {t('kick')}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onCancel} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-xs font-black uppercase tracking-widest">
            {t('abort')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Circular Player Table (Cinematic Performance Overhaul) ─────────────────────
function RoundTable({ players, myPlayerId, isHost, onKick, t, accentColor }) {
  const { x, y } = useSpringMouse();
  
  // High-performance transforms bound to MotionValues (No Re-renders)
  const rotateX = useTransform(y, [-1, 1], [15, -15]);
  const rotateY = useTransform(x, [-1, 1], [-15, 15]);
  const translateX = useTransform(x, [-1, 1], [-20, 20]);
  const translateY = useTransform(y, [-1, 1], [-20, 20]);

  const count = players.length;
  if (count === 0) return null;

  const tableR = Math.min(130, 70 + count * 5); 

  return (
    <motion.div 
      style={{ rotateX, rotateY, x: translateX, y: translateY, perspective: 1200, transformStyle: 'preserve-3d' }}
      className="relative flex-shrink-0 flex items-center justify-center select-none touch-none" 
      style={{ width: tableR * 2 + 150, height: tableR * 2 + 150 }}
    >
      {/* ── Interactive Neon Rings (CSS Accelerated) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[90%] h-[90%] rounded-full border border-white/5 animate-[spin_40s_linear_infinite]" />
        <div className="absolute w-[100%] h-[100%] rounded-full border border-dashed border-white/10 animate-[spin_60s_linear_infinite_reverse]" />
        <div 
          className="absolute w-[80%] h-[80%] rounded-full opacity-20 blur-2xl"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
        
        {/* Dynamic Scanning Ring */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full border-2"
          style={{ width: tableR * 2.2, height: tableR * 2.2, borderColor: accentColor }}
        />
      </div>

      {/* Player nodes */}
      <AnimatePresence>
        {players.map((p, i) => {
          const angle  = (i / count) * 2 * Math.PI - Math.PI / 2;
          const cx     = Math.cos(angle) * tableR;
          const cy     = Math.sin(angle) * tableR;
          const isMe   = p.uid === myPlayerId;
          const isConnected = p.connected !== false;

          return (
            <div
              key={p.uid}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`,
                zIndex: 1,
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, translateZ: 50 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {p.isHost && (
                      <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-[-4px] rounded-2xl border border-white/20 blur-sm"
                        style={{ backgroundColor: `${accentColor}20` }}
                      />
                    )}
                    
                    <div className="relative z-10 bg-zinc-900/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 shadow-2xl">
                      <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="sm" className="rounded-xl" />
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#03020a] ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>

                    {isHost && !p.isHost && (
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onKick(p)}
                        className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center shadow-lg"
                      >
                        <UserX size={12} className="text-white" />
                      </motion.button>
                    )}
                  </div>

                  <div className="text-center px-2 py-1 rounded-lg bg-black/20 backdrop-blur-sm border border-white/5" style={{ maxWidth: 80 }}>
                    <p className="text-[9px] font-black text-white/80 truncate uppercase tracking-widest">
                      {isMe ? t('youParen') : p.name}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LobbyScreen({ user, playerId }) {
  const { roomId, isHost, players, clearRoom, language, joinRequests, setJoinRequests, gameType } = useGameStore();
  const [starting, setStarting] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const t = useTranslation(language);

  useEffect(() => {
    if (!roomId || !isHost) return;
    return subscribeJoinRequests(roomId, setJoinRequests);
  }, [roomId, isHost, setJoinRequests]);

  const playerList = Object.entries(players).map(([uid, p]) => ({ uid, ...p }));
  const count = playerList.length;
  const mafiaCount = getMafiaCount(count);
  const minPlayers = gameType === 'spy' ? 3 : 4;
  const canStart = count >= minPlayers;

  async function handleStart() {
    if (!canStart) { toast(t('needMorePlayers', { n: minPlayers - count }), 'error'); return; }
    setStarting(true);
    try {
      await (gameType === 'spy' ? startSpyGame(roomId) : startGame(roomId));
    } catch (e) { toast(e.message, 'error'); setStarting(false); }
  }

  function handleShare() {
    const base = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
    const url = `${base}?room=${roomId}`;
    if (navigator.share) {
      navigator.share({ title: 'Game Invite', text: `Room: ${roomId}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast(t('inviteCopied'), 'success'));
    }
  }

  const isSpy = gameType === 'spy';
  const accentColor = isSpy ? '#10b981' : '#c9943a';
  const requests = Object.entries(joinRequests);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#03020a] select-none touch-none">
      <GameBackground />

      {/* Header */}
      <div className="z-20 px-8 pt-safe pt-6 pb-6 flex items-center justify-between border-b border-white/5 backdrop-blur-xl">
        <BackButton onClick={async () => { await leaveRoom(playerId, user.uid, roomId); clearRoom(); }} />
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-40" style={{ color: accentColor }}>
            {t('waitingRoom')}
          </span>
          <button onClick={handleShare} className="flex items-center gap-3">
            <span className="text-white font-black text-2xl tracking-[0.2em]">{roomId}</span>
            <Share2 size={16} className="text-white/30" />
          </button>
        </div>

        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40">
          <Users size={18} />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        <RoundTable
          players={playerList} myPlayerId={playerId}
          isHost={isHost} onKick={setKickTarget} t={t} accentColor={accentColor}
        />

        {/* Status Pill */}
        <AnimatePresence>
          {count >= minPlayers && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="mt-12 px-6 py-2.5 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/5 flex items-center gap-3 shadow-2xl"
            >
              <ShieldCheck size={14} style={{ color: accentColor }} />
              <div className="text-[10px] font-black uppercase tracking-widest text-white/60">
                {isSpy ? `1 ${t('theSpy')} · ${count - 1} ${t('citizens')}` : `${mafiaCount} ${t('mafia')} · 1 ${t('doctor')} · 1 ${t('sheikh')}`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="z-20 px-8 pb-safe pb-8 pt-6 border-t border-white/5 backdrop-blur-2xl bg-[#03020a]/40">
        {isHost ? (
          <motion.button 
            whileHover={canStart ? { scale: 1.02, y: -2 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
            onClick={handleStart}
            disabled={!canStart || starting}
            className={`h-16 w-full rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all ${
              canStart 
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                : 'bg-white/5 text-white/20 border border-white/5'
            }`}
          >
            {starting ? <Spinner size={20} color="black" /> : (canStart ? t('startGame') : t('needMorePlayers', { n: minPlayers - count }))}
          </motion.button>
        ) : (
          <div className="h-16 flex items-center justify-center gap-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{t('waitingForHost')}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {kickTarget && <KickConfirmModal player={kickTarget} t={t} onConfirm={() => { kickPlayer(roomId, kickTarget.uid, kickTarget.authUid); setKickTarget(null); }} onCancel={() => setKickTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}

