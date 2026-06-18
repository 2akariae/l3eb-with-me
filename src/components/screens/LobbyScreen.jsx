// ─── THE MAFIA PLATFORM — LobbyScreen.jsx (v12 — cinematic motion) ──────────
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// ── Kick Confirm Modal ────────────────────────────────────────────────────────
function KickConfirmModal({ player, onConfirm, onCancel, t }) {
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xs rounded-[3rem] p-10 text-center glass-crimson border-crimson-500/30">
        <div className="w-20 h-20 rounded-[2rem] bg-crimson-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <UserX size={48} className="text-crimson-500" />
        </div>
        <h3 className="text-white font-black text-2xl mb-2 aberration">{t('kickPlayer')}</h3>
        <p className="text-smoke-400 text-sm mb-8 font-bold">{player?.name}</p>
        <div className="flex flex-col gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} className="h-14 rounded-2xl bg-crimson-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-crimson-900/40">
            {t('kick')}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onCancel} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-smoke-400 text-xs font-black uppercase tracking-widest">
            {t('abort')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Circular Player Table (Cinematic) ──────────────────────────────────────────
function RoundTable({ players, myPlayerId, isHost, onKick, t }) {
  const count = players.length;
  if (count === 0) return null;

  const tableR = Math.min(130, 70 + count * 5); 

  return (
    <div className="relative flex-shrink-0" style={{ width: tableR * 2 + 100, height: tableR * 2 + 100 }}>
      {/* Dynamic Center Atmos */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-full"
          style={{ width: tableR * 1.6, height: tableR * 1.6, background: 'radial-gradient(circle, rgba(201,148,58,0.4) 0%, transparent 70%)' }}
        />
        <div className="absolute w-[150%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45" />
        <div className="absolute w-[150%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-45" />
      </div>

      {/* Outer Glow Ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          style={{ width: tableR * 2, height: tableR * 2 }} />
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
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, rotate: 45 }}
                transition={{ 
                  delay: i * 0.08, 
                  type: 'spring', 
                  stiffness: 260, 
                  damping: 20 
                }}
              >
              <div className="flex flex-col items-center gap-3 group">
                <div className="relative">
                  {p.isHost && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-[-4px] rounded-[40%] border-2 border-gold-500/60 shadow-[0_0_15px_rgba(201,148,58,0.4)]"
                    />
                  )}
                  <div className="relative z-10">
                    <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="sm" 
                      className="shadow-2xl border border-white/10 group-hover:border-white/30 transition-colors" />
                    
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-noir-950 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ boxShadow: isConnected ? '0 0 10px rgba(16,185,129,0.5)' : '0 0 10px rgba(245,158,11,0.5)' }} />
                  </div>

                  {p.isHost && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <Crown size={16} className="text-gold-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bloom" />
                    </div>
                  )}

                  {isHost && !p.isHost && (
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onKick(p)}
                      className="absolute inset-0 z-20 rounded-[35%] flex items-center justify-center bg-crimson-600/90 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <UserX size={18} className="text-white" />
                    </motion.button>
                  )}
                </div>

                <div className="text-center px-1" style={{ maxWidth: 80 }}>
                  <p className="text-white font-black leading-tight truncate uppercase tracking-tighter"
                    style={{ fontSize: 10 }}>
                    {isMe ? t('youParen') : p.name}
                  </p>
                  {!isConnected && (
                    <p className="text-amber-500 font-black uppercase tracking-widest mt-0.5" style={{ fontSize: 7 }}>
                      {t('away')}
                    </p>
                  )}
                </div>
              </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function LobbyScreen({ user, playerId }) {
  const { roomId, isHost, players, clearRoom, language, joinRequests, setJoinRequests, gameType } = useGameStore();
  const [starting,   setStarting]  = useState(false);
  const [leaving,    setLeaving]   = useState(false);
  const [kickTarget, setKickTarget]= useState(null);
  const t   = useTranslation(language);
  const isAr = language === 'ar';

  useEffect(() => {
    if (!roomId || !isHost) return;
    return subscribeJoinRequests(roomId, setJoinRequests);
  }, [roomId, isHost, setJoinRequests]);

  const playerList = Object.entries(players).map(([uid, p]) => ({ uid, ...p }));
  const count      = playerList.length;
  const mafiaCount = getMafiaCount(count);
  const minPlayers = gameType === 'spy' ? 3 : 4;
  const canStart   = count >= minPlayers;

  async function handleStart() {
    if (!canStart) { toast(t('needMorePlayers', { n: minPlayers - count }), 'error'); return; }
    setStarting(true);
    try {
      await (gameType === 'spy' ? startSpyGame(roomId) : startGame(roomId));
    } catch (e) { toast(e.message, 'error'); setStarting(false); }
  }

  async function handleLeave() {
    setLeaving(true);
    await leaveRoom(playerId, user.uid, roomId);
    clearRoom();
  }

  async function confirmKick() {
    if (!kickTarget) return;
    try {
      await kickPlayer(roomId, kickTarget.uid, kickTarget.authUid);
      toast(`${kickTarget.name} ${t('kick')}ed`, 'info');
    } catch (e) { toast(e.message, 'error'); }
    setKickTarget(null);
  }

  async function handleResolveReq(uid, approved) {
    try { await resolveJoinRequest(roomId, uid, approved); } catch (e) { toast(e.message, 'error'); }
  }

  function handleShare() {
    const base = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
    const url  = `${base}?room=${roomId}`;
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
    <div className="screen overflow-hidden flex flex-col pt-safe bg-noir-950" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
        <div className="absolute inset-0 bg-noir-950 opacity-40 mix-blend-multiply" />
      </div>

      {/* Modern Top Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-safe pt-6 pb-6 border-b border-white/5 backdrop-blur-2xl">
        <BackButton onClick={handleLeave} />

        <div className="flex flex-col items-center">
          <motion.p 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 bloom"
            style={{ color: accentColor }}>{t('waitingRoom')}</motion.p>
          <motion.button 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleShare} className="flex items-center gap-3 group">
            <span className="text-white font-black text-3xl tracking-[0.2em] aberration">{roomId}</span>
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
              <Share2 size={16} className="text-smoke-400 group-hover:text-white" />
            </div>
          </motion.button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Users size={20} className="text-smoke-400" />
        </div>
      </div>

      {/* Join Requests Pill (Floating) */}
      <AnimatePresence>
        {isHost && requests.length > 0 && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="relative z-20 px-6 py-4 bg-noir-900/80 backdrop-blur-3xl border-b border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 bloom">{t('joinRequests')}</p>
            </div>
            <div className="flex flex-col gap-3">
              {requests.map(([uid, req]) => (
                <motion.div key={uid} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-3xl border border-white/8 bg-white/5 backdrop-blur-md">
                  <Avatar uid={uid} name={req.name} avatar={req.avatar} size="xs" />
                  <p className="flex-1 text-white font-black text-sm tracking-tight">{req.name}</p>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleResolveReq(uid, true)}
                      className="h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black"
                      style={{ background: accentColor }}>{t('approve')}</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleResolveReq(uid, false)}
                      className="h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/8 text-smoke-400">{t('deny')}</motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular Table Main Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-10 px-4 overflow-hidden">
        <AnimatePresence>
          {count > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }} 
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            >
              <RoundTable
                players={playerList} myPlayerId={playerId}
                isHost={isHost} onKick={setKickTarget} t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {count >= minPlayers && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-8 py-3 rounded-[2rem] border border-white/8 bg-noir-900/40 backdrop-blur-xl shadow-2xl"
          >
            <ShieldCheck size={16} style={{ color: accentColor }} className="bloom" />
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
              {isSpy ? (
                <>
                  <span style={{ color: accentColor }}>1 {t('theSpy')}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-gold-400">{count - 1} {t('citizens')}</span>
                </>
              ) : (
                <>
                  <span className="text-crimson-400">{mafiaCount} {t('mafia')}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-emerald-400">1 {t('doctor')}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-blue-400">1 {t('sheikh')}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Footer */}
      <div className="relative z-10 px-10 pb-safe pb-10 pt-6 border-t border-white/5 backdrop-blur-3xl">
        {isHost ? (
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }} 
            onClick={handleStart}
            disabled={!canStart || starting}
            className="h-20 w-full rounded-[3rem] font-black text-xl transition-all overflow-hidden relative group"
            style={canStart ? {
              background: isSpy
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : 'linear-gradient(135deg,#c9943a,#b4802c)',
              boxShadow: `0 20px 60px ${accentColor}40`,
              color: '#000',
            } : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.2)',
            }}>
            <div className="absolute inset-0 pointer-events-none shimmer opacity-10 group-hover:opacity-20" />
            <div className="flex items-center justify-center gap-3">
              {starting ? <Spinner size={28} color="black" /> : (
                <>
                  {canStart && <Zap size={20} fill="currentColor" />}
                  <span>{canStart ? t('startGame') : t('needMorePlayers', { n: minPlayers - count })}</span>
                </>
              )}
            </div>
          </motion.button>
        ) : (
          <div className="h-20 flex items-center justify-center gap-4 rounded-[3rem] border border-white/5 bg-white/[0.03] backdrop-blur-md">
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3] 
              }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" 
              style={{ color: accentColor, backgroundColor: 'currentColor' }} 
            />
            <span className="text-smoke-400 text-xs font-black uppercase tracking-[0.3em] bloom">{t('waitingForHost')}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {kickTarget && (
          <KickConfirmModal
            player={kickTarget} t={t}
            onConfirm={confirmKick} onCancel={() => setKickTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

