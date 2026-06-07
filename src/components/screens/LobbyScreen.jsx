// ─── THE MAFIA PLATFORM — LobbyScreen.jsx (v10) ─────────────────────────────
// v10: Full cyber/neon redesign. Players arranged in a circular "round table"
//      layout using CSS transform. Real agent SVG avatars. Smooth entry stagger.
//      window.confirm replaced with in-app confirm dialog.
//      BackButton injected. Connected status dots per player.
import React, { useEffect, useState, useRef } from 'react';
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
import { Share2, Users, Crown, UserX } from 'lucide-react';

// ── Kick Confirm Modal ────────────────────────────────────────────────────────
function KickConfirmModal({ player, onConfirm, onCancel, language }) {
  const isAr = language === 'ar';
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xs rounded-[2rem] p-8 text-center"
        style={{ background: '#0e0e14', border: '1px solid rgba(224,32,32,0.3)' }}>
        <UserX size={40} className="text-crimson-500 mx-auto mb-4" />
        <h3 className="text-white font-black text-xl mb-2">{isAr ? 'طرد اللاعب؟' : 'Kick Player?'}</h3>
        <p className="text-smoke-400 text-sm mb-6">{player?.name}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={onConfirm} className="flex-1 h-12 rounded-2xl bg-crimson-500 text-white text-xs font-black uppercase">
            {isAr ? 'طرد' : 'Kick'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Circular Player Table ─────────────────────────────────────────────────────
function RoundTable({ players, myPlayerId, isHost, onKick, language }) {
  const isAr = language === 'ar';
  const count = players.length;
  if (count === 0) return null;

  const tableR = Math.min(110, 60 + count * 6); // radius scales with player count

  return (
    <div className="relative flex-shrink-0" style={{ width: tableR * 2 + 80, height: tableR * 2 + 80 }}>
      {/* Center glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="rounded-full"
          style={{ width: tableR * 1.4, height: tableR * 1.4, background: 'radial-gradient(circle, rgba(201,148,58,0.35) 0%, transparent 70%)' }}
        />
      </div>

      {/* Round table ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-white/5"
          style={{ width: tableR * 2, height: tableR * 2 }} />
      </div>

      {/* Player nodes */}
      {players.map((p, i) => {
        const angle  = (i / count) * 2 * Math.PI - Math.PI / 2;
        const cx     = Math.cos(angle) * tableR;
        const cy     = Math.sin(angle) * tableR;
        const isMe   = p.uid === myPlayerId;
        const isConnected = p.connected !== false; // undefined = connected

        return (
          // FIX A: position in a regular div — Framer Motion owns `transform`
          // and will override any translate set in style when animate.scale is used.
          // Separation: outer div handles position, inner motion.div handles animation.
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
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', damping: 15, stiffness: 200 }}
            >
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                {/* Glow ring for host */}
                {p.isHost && (
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute inset-[-3px] rounded-[35%] border-2 border-gold-500"
                  />
                )}
                <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="sm" />

                {/* Connection indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-noir-950 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ boxShadow: isConnected ? '0 0 6px rgba(16,185,129,0.8)' : '0 0 6px rgba(245,158,11,0.8)' }} />

                {/* Host crown */}
                {p.isHost && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Crown size={12} className="text-gold-500 drop-shadow-md" />
                  </div>
                )}

                {/* Kick button (host only, not self) */}
                {isHost && !p.isHost && (
                  <motion.button initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                    onClick={() => onKick(p)}
                    className="absolute inset-0 rounded-[30%] flex items-center justify-center bg-crimson-600/80 backdrop-blur-sm"
                    style={{ opacity: 0 }}>
                    <UserX size={14} className="text-white" />
                  </motion.button>
                )}
              </div>

              <div className="text-center" style={{ maxWidth: 60 }}>
                <p className="text-white font-black leading-none truncate"
                  style={{ fontSize: 9 }}>
                  {isMe ? (isAr ? '(أنت)' : '(you)') : p.name}
                </p>
                {!isConnected && (
                  <p className="text-amber-500 font-mono" style={{ fontSize: 7 }}>
                    {isAr ? 'غائب' : 'away'}
                  </p>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main LobbyScreen ──────────────────────────────────────────────────────────
export default function LobbyScreen({ user, playerId }) {
  const { roomId, isHost, players, clearRoom, language, joinRequests, setJoinRequests, gameType } = useGameStore();
  const [starting,   setStarting]  = useState(false);
  const [leaving,    setLeaving]   = useState(false);
  const [kickTarget, setKickTarget]= useState(null); // player object to kick
  const t   = useTranslation(language);
  const isAr = language === 'ar';

  useEffect(() => {
    if (!roomId || !isHost) return;
    return subscribeJoinRequests(roomId, setJoinRequests);
  }, [roomId, isHost]); // eslint-disable-line

  const playerList = Object.entries(players).map(([uid, p]) => ({ uid, ...p }));
  const count      = playerList.length;
  const mafiaCount = getMafiaCount(count);
  const minPlayers = gameType === 'spy' ? 3 : 4;
  const canStart   = count >= minPlayers;

  async function handleStart() {
    if (!canStart) { toast(t('needMorePlayers', { n: minPlayers - count }), 'error'); return; }
    setStarting(true);
    try {
      await (gameType === 'spy' ? startSpyGame(roomId) : startGame(roomId, user.uid));
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
    <div className="screen overflow-hidden flex flex-col pt-safe"
      style={{ background: 'linear-gradient(170deg,#080810 0%,#050508 100%)' }}
      dir={isAr ? 'rtl' : 'ltr'}>

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.14, 0.06] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 grid grid-cols-[auto,1fr,auto] items-center px-6 pt-safe pt-5 pb-4 border-b border-white/5 backdrop-blur-xl gap-4">
        <BackButton onClick={handleLeave} />

        <div className="flex flex-col items-center justify-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1"
            style={{ color: accentColor }}>{t('waitingRoom')}</p>
          <button onClick={handleShare} className="flex items-center gap-2 group justify-center">
            <span className="text-white font-black text-2xl tracking-widest">{roomId}</span>
            <Share2 size={14} className="text-smoke-600 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Empty div to balance grid for center-alignment of Room ID */}
        <div className="w-10" />
      </div>

      {/* Join requests (host only) */}
      <AnimatePresence>
        {isHost && requests.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 px-6 pt-4 overflow-hidden">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2"
              style={{ color: accentColor }}>{t('joinRequests')}</p>
            <div className="flex flex-col gap-2">
              {requests.map(([uid, req]) => (
                <motion.div key={uid} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8 bg-white/5">
                  <Avatar uid={uid} name={req.name} avatar={req.avatar} size="xs" />
                  <p className="flex-1 text-white font-bold text-sm">{req.name}</p>
                  <button onClick={() => handleResolveReq(uid, true)}
                    className="h-8 px-4 rounded-xl text-[9px] font-black uppercase text-black"
                    style={{ background: accentColor }}>{t('approve')}</button>
                  <button onClick={() => handleResolveReq(uid, false)}
                    className="h-8 px-4 rounded-xl text-[9px] font-black uppercase bg-white/8 text-smoke-400">{t('deny')}</button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round table */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4 overflow-hidden">
        <AnimatePresence>
          {count > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}>
              <RoundTable
                players={playerList} myPlayerId={playerId}
                isHost={isHost} onKick={setKickTarget} language={language}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role breakdown pill */}
        {count >= minPlayers && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 px-5 py-2 rounded-full border border-white/8 bg-white/[0.04] text-[10px] font-black">
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
          </motion.div>
        )}
      </div>

      {/* CTA footer */}
      <div className="relative z-10 px-6 pb-safe pb-8 pt-4 border-t border-white/5 backdrop-blur-xl">
        {isHost ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleStart}
            disabled={!canStart || starting}
            className="h-16 w-full rounded-[2rem] font-black text-lg transition-all overflow-hidden relative"
            style={canStart ? {
              background: isSpy
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : 'linear-gradient(135deg,#b8860b,#c9943a)',
              boxShadow: `0 0 40px ${accentColor}55`,
              color: '#000',
            } : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)',
            }}>
            {starting ? <Spinner size={24} /> : (
              canStart ? t('startGame') : t('needMorePlayers', { n: minPlayers - count })
            )}
          </motion.button>
        ) : (
          <div className="h-16 flex items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-white/[0.03]">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
            <span className="text-smoke-400 text-xs font-black uppercase tracking-widest">{t('waitingForHost')}</span>
          </div>
        )}
      </div>

      {/* Kick confirm modal */}
      <AnimatePresence>
        {kickTarget && (
          <KickConfirmModal
            player={kickTarget} language={language}
            onConfirm={confirmKick} onCancel={() => setKickTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
