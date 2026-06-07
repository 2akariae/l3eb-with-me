// ─── THE MAFIA — NightScreen.jsx (v10-fixed) ─────────────────────────────────
// BUG FIXED (P1 × 2):
//   alphaMafiaUid was read from rooms/${roomId}/meta/alphaMafiaUid  ← WRONG
//   Correct path is rooms/${roomId}/mafia/meta/alphaMafiaUid
//   This caused all multi-mafia games to treat every mafia member as alpha,
//   breaking the alpha-coordination mechanic entirely.
//
//   doctorState was read from rooms/${roomId}/doctorState  ← WRONG
//   Correct path is rooms/${roomId}/mafia/doctorState
//   This caused the doctor's self-heal restriction and repeat-target restriction
//   to never apply.
//
// BUG FIXED (P3 × 7): Replaced all emoji characters ('⚔', '✚', '◉', '◯',
//   '👁', '🎯', '✓') with Lucide vector icons per the Anti-Emoji Policy.
//
// IMPROVEMENT: Replaced dynamic imports of Firebase inside useEffect with
//   static top-level imports (modules were already in the bundle).

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import { submitNightAction, resolveNight, subscribeNightActions } from '../../games/mafia/hooks/useMafiaEngine.js';
import { Avatar, toast } from '../ui/index.jsx';
import { ROLES, ROLE_META } from '../../constants/game.js';
import { useTimer } from '../../hooks/useTimer.js';
import { useTranslation } from '../../constants/translations.js';
import HauntedHouseBg from '../game/HauntedHouseBg.jsx';
// FIX: static imports instead of dynamic imports inside useEffect
import { db } from '../../services/firebaseConfig.js';
import { ref as fbRef, get as fbGet } from 'firebase/database';
// FIX: Lucide icons replacing all emoji characters
import { Swords, Plus, Eye, CircleDot, Target, Check } from 'lucide-react';

// ── Role icon map — vector SVG, no emoji ──────────────────────────────────────
function RoleIcon({ role, color, size = 18 }) {
  const props = { size, color, strokeWidth: 2 };
  if (role === ROLES.MAFIA)   return <Swords    {...props} />;
  if (role === ROLES.DOCTOR)  return <Plus      {...props} />;
  if (role === ROLES.SHEIKH)  return <Eye       {...props} />;
  return                             <CircleDot {...props} />;
}

export default function NightScreen({ user, playerId }) {
  const { roomId, isHost, myRole, players, roles, gameState, language } = useGameStore();
  const [selected,      setSelected]      = useState(null);
  const [submitted,     setSubmitted]     = useState(false);
  const [resolving,     setResolving]     = useState(false);
  const [nightActions,  setNightActions]  = useState({});
  const [alphaMafiaUid, setAlphaMafiaUid] = useState(null);
  const [doctorState,   setDoctorState]   = useState({ selfHealUsed: false, lastProtected: null });

  const t = useTranslation(language);

  useEffect(() => {
    if (!roomId || !isHost) return;
    return subscribeNightActions(roomId, setNightActions);
  }, [roomId, isHost]);

  // FIX (P1): corrected Firebase paths.
  // Old (wrong): rooms/${roomId}/meta/alphaMafiaUid
  // New (right):  rooms/${roomId}/mafia/meta/alphaMafiaUid
  //
  // Old (wrong): rooms/${roomId}/doctorState
  // New (right):  rooms/${roomId}/mafia/doctorState
  useEffect(() => {
    if (!roomId) return;
    fbGet(fbRef(db, `rooms/${roomId}/mafia/meta/alphaMafiaUid`))
      .then((s) => setAlphaMafiaUid(s.val()))
      .catch(() => {});
    fbGet(fbRef(db, `rooms/${roomId}/mafia/doctorState`))
      .then((s) => { if (s.val()) setDoctorState(s.val()); })
      .catch(() => {});
  }, [roomId]);

  async function doResolve() {
    if (!isHost || resolving) return;
    setResolving(true);
    try { await resolveNight(roomId); }
    catch (e) { toast(e.message, 'error'); setResolving(false); }
  }

  const { remaining } = useTimer(gameState, doResolve);

  async function handleSubmit() {
    if (!selected || submitted) return;
    setSubmitted(true);
    try {
      await submitNightAction(roomId, playerId, selected, user?.uid);
      toast(t('confirm'), 'success');
    } catch (e) {
      toast(e.message, 'error');
      setSubmitted(false);
    }
  }

  const alivePlayers = Object.entries(players)
    .filter(([, p]) => p.isAlive)
    .map(([uid, p]) => ({ uid, ...p }));

  const me           = players[playerId];
  const isAlphaMafia = !alphaMafiaUid || myRole !== ROLES.MAFIA || (myRole === ROLES.MAFIA && playerId === alphaMafiaUid);
  const canAct       = me?.isAlive && myRole !== ROLES.CITIZEN && !submitted && isAlphaMafia;
  const isMafiaObserver = myRole === ROLES.MAFIA && !isAlphaMafia;
  const isCitizen    = myRole === ROLES.CITIZEN || !myRole;

  const doctorDisabled = (uid) => {
    if (myRole !== ROLES.DOCTOR || alivePlayers.length <= 2) return false;
    if (uid === playerId && doctorState.selfHealUsed) return true;
    if (uid === doctorState.lastProtected) return true;
    return false;
  };

  const targets = alivePlayers.filter((p) => {
    if (myRole === ROLES.DOCTOR) return true;
    if (p.uid === playerId)      return false;
    if (myRole === ROLES.MAFIA && roles[p.uid] === ROLES.MAFIA) return false;
    return true;
  });

  const meta = myRole ? ROLE_META[myRole] : null;
  const isAr = language === 'ar';

  const roleColor = meta
    ? myRole === ROLES.MAFIA  ? '#e02020'
    : myRole === ROLES.DOCTOR ? '#10b981'
    : myRole === ROLES.SHEIKH ? '#3b82f6'
    : '#c9943a'
    : '#c9943a';

  const submittedCount = Object.keys(nightActions).length;

  return (
    <div className="screen noise overflow-hidden">
      <HauntedHouseBg isNight={true} />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.22, 0.38, 0.22] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at 68% 15%, rgba(124,38,220,0.45) 0%, transparent 60%)' }}
      />
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe pt-3 pb-3 border-b border-white/8 bg-black/20 backdrop-blur-xl flex-shrink-0">
        <div>
          <h1 className="display text-lg font-black text-white">{t('night')}</h1>
          <p className="text-purple-400/60 text-[10px] font-black uppercase tracking-widest">
            {t('round')} {gameState?.round ?? 1}
          </p>
        </div>
        <div
          className="h-9 px-3 rounded-full flex items-center gap-2"
          style={{ background: 'rgba(124,38,220,0.18)', border: '1px solid rgba(124,38,220,0.4)' }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-black text-purple-300 text-sm font-mono">{remaining}s</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-4 py-5 overflow-y-auto gap-5 min-h-0">
        {/* Role card */}
        {meta && (
          <motion.div
            initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="rounded-[1.75rem] flex items-center gap-4 px-5 py-4 flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${roleColor}1a 0%, rgba(255,255,255,0.04) 100%)`,
              border:     `1px solid ${roleColor}40`,
              boxShadow:  `0 0 24px ${roleColor}22`,
            }}
          >
            {/* FIX (P3): replaced emoji role characters with Lucide vector icons */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${roleColor}22`, border: `1px solid ${roleColor}44` }}
            >
              <RoleIcon role={myRole} color={roleColor} size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: roleColor }}>
                {isAr ? meta.label?.ar : meta.label?.en ?? myRole}
              </p>
              {/* FIX: meta.description now exists — added to ROLE_META in game.js */}
              <p className="text-white text-sm font-bold opacity-75 leading-snug">
                {isAr ? meta.descriptionAr : meta.description}
              </p>
            </div>
          </motion.div>
        )}

        {/* Non-alpha mafia observer — FIX (P3): replaced '👁' emoji with Eye icon */}
        {isMafiaObserver && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
            <Eye size={40} className="text-crimson-300 opacity-70" />
            <p className="text-crimson-300 font-black text-center">{t('alphaMafiaTarget')}</p>
            <p className="text-smoke-500 text-xs text-center">{t('coordinateViaChat')} →</p>
          </div>
        )}

        {/* Citizen waiting view */}
        {isCitizen && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
            <motion.div
              animate={{ scale: [1, 1.06, 1], y: [0, -4, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div
                className="w-28 h-28 rounded-full"
                style={{
                  background:  'radial-gradient(circle at 38% 35%, #fffcee 0%, #f5d878 55%, #c89010 100%)',
                  boxShadow:   '0 0 40px 16px rgba(245,216,118,0.3), 0 0 80px 36px rgba(245,216,118,0.12)',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(245,216,118,0.4) 0%, transparent 70%)' }}
              />
            </motion.div>
            <div className="text-center space-y-1">
              <p className="text-white text-xl font-black display">{t('citySleeps')}</p>
              <p className="text-purple-300/50 text-xs font-bold uppercase tracking-[0.25em]">{t('waitForDawn')}</p>
            </div>
          </div>
        )}

        {/* Target selection */}
        {canAct && !submitted && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-smoke-500 uppercase tracking-[0.3em] px-1">{t('selectTarget')}</h2>
            <div className="flex flex-col gap-2">
              {targets.map((p) => {
                const isSel     = selected === p.uid;
                const isDisabled = doctorDisabled(p.uid);
                return (
                  <motion.button
                    key={p.uid}
                    whileTap={isDisabled ? {} : { scale: 0.97 }}
                    onClick={() => !isDisabled && setSelected(p.uid)}
                    className="relative h-16 rounded-[1.5rem] flex items-center gap-4 px-5 transition-all duration-250 overflow-hidden"
                    style={{
                      background: isSel ? `linear-gradient(135deg, ${roleColor}33 0%, ${roleColor}18 100%)` : 'rgba(255,255,255,0.05)',
                      border:     `1px solid ${isSel ? roleColor : 'rgba(255,255,255,0.08)'}`,
                      boxShadow:  isSel ? `0 0 22px ${roleColor}44` : 'none',
                      color:      'white',
                      opacity:    isDisabled ? 0.4 : 1,
                      cursor:     isDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSel && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{ opacity: [0.08, 0.18, 0.08] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ background: `radial-gradient(ellipse at left, ${roleColor}50 0%, transparent 70%)` }}
                      />
                    )}
                    <Avatar uid={p.uid} name={p.name} avatar={p.avatar} size="sm" />
                    <span className="font-black text-base relative z-10 flex-1 text-left truncate">{p.name}</span>
                    {/* FIX (P3): replaced '🎯' emoji with Lucide Target icon */}
                    {isSel && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="ml-auto relative z-10"
                      >
                        <Target size={18} style={{ color: roleColor }} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submitted confirmation */}
        {submitted && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `${roleColor}22`, border: `2px solid ${roleColor}55`, boxShadow: `0 0 32px ${roleColor}33` }}
            >
              {/* FIX (P3): replaced '✓' emoji with Lucide Check icon */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Check size={32} style={{ color: roleColor }} strokeWidth={3} />
              </motion.div>
            </motion.div>
            <p className="text-white font-black text-center text-lg">{t('actionSubmitted')}</p>
            <p className="text-smoke-500 text-xs uppercase tracking-widest">{t('waitingForOthers')}</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="relative z-10 px-4 pb-safe pb-5 pt-3 border-t border-white/8 bg-black/30 backdrop-blur-xl flex-shrink-0">
        {canAct && selected && !submitted ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="h-14 w-full rounded-2xl font-black text-base text-white"
            style={{ background: `linear-gradient(135deg, ${roleColor}cc 0%, ${roleColor}99 100%)`, boxShadow: `0 0 28px ${roleColor}44` }}
          >
            {t('confirm')}
          </motion.button>
        ) : isHost && !resolving ? (
          <button
            onClick={doResolve}
            className="h-14 w-full rounded-2xl text-smoke-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {submittedCount > 0 ? `${t('resolveNight').toUpperCase()} (${submittedCount} IN)` : t('skipToDawn').toUpperCase()}
          </button>
        ) : null}
      </div>
    </div>
  );
}
