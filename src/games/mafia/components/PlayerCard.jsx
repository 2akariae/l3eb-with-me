// ─── THE MAFIA — PlayerCard.jsx ───────────────────────────────────────────────
// Unified luxury card — ported directly from OfflineEnvelopeScreen RoleCard.
// Features: 3D tilt (useSpring), role glow, corner sparks, speaking wave bars,
// vote count badge, grayscale for dead players. No emojis.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';
import { ROLE_META, getRoleLabel } from '../../../constants/game.js';
import { useGameStore } from '../../../store/gameStore.js';

// ── Role config — matches OfflineEnvelopeScreen ROLE_CONFIG exactly ──────────
const ROLE_CFG = {
  mafia:   { glow:'#e02020', border:'rgba(224,32,32,0.65)',  bg:'linear-gradient(155deg,rgba(224,32,32,0.28) 0%,rgba(4,1,12,0.96) 100%)',   label:{en:'MAFIA',    ar:'مافيا'} },
  doctor:  { glow:'#10b981', border:'rgba(16,185,129,0.65)', bg:'linear-gradient(155deg,rgba(16,185,129,0.28) 0%,rgba(2,12,8,0.96) 100%)',  label:{en:'DOCTOR',   ar:'طبيب'}  },
  sheikh:  { glow:'#3b82f6', border:'rgba(59,130,246,0.65)', bg:'linear-gradient(155deg,rgba(59,130,246,0.28) 0%,rgba(2,4,16,0.96) 100%)',  label:{en:'DETECTIVE',ar:'شيخ'}   },
  citizen: { glow:'#c9943a', border:'rgba(201,148,58,0.65)', bg:'linear-gradient(155deg,rgba(201,148,58,0.18) 0%,rgba(10,6,2,0.96) 100%)',  label:{en:'CIVILIAN', ar:'مواطن'} },
};

const DEFAULT_CFG = ROLE_CFG.citizen;

// ── SVG role icon ─────────────────────────────────────────────────────────────
function RoleIcon({ role, size = 28, color }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color,
               strokeWidth:'1.6', strokeLinecap:'round', strokeLinejoin:'round' };
  switch (role) {
    case 'mafia':   return <svg {...p}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z"/></svg>;
    case 'doctor':  return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'sheikh':  return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    default:        return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  }
}

// ── Orbiting corner spark ─────────────────────────────────────────────────────
function Spark({ color, angle, radius, delay }) {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return (
    <motion.div className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
      style={{ left:'50%', top:'50%', marginLeft:-3, marginTop:-3,
               background:color, boxShadow:`0 0 6px ${color}` }}
      animate={{ x:[x*.5,x,x*.7,x*.5], y:[y*.5,y,y*.7,y*.5],
                 opacity:[0,1,.5,0], scale:[.4,1.3,.9,.4] }}
      transition={{ duration:2.6, repeat:Infinity, delay, ease:'easeInOut' }}
    />
  );
}

// ── Speaking wave bars ────────────────────────────────────────────────────────
function WaveBars({ color = '#c9943a' }) {
  return (
    <div className="flex gap-[3px] h-4 items-end justify-center">
      {[1,2,3,4,5].map((i) => (
        <motion.div key={i} className="w-[3px] rounded-full"
          style={{ background: color }}
          animate={{ height: [3, 10 + Math.random() * 6, 3] }}
          transition={{ duration: 0.4 + i * 0.05, repeat: Infinity,
                        delay: i * 0.08, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Main PlayerCard ───────────────────────────────────────────────────────────
export function PlayerCard({
  uid,
  name,
  isAlive     = true,
  isHost      = false,
  role,                    // undefined = show avatar only (voting mode)
  speaking    = false,
  voteCount   = 0,
  maxVotes    = 0,
  isSelected  = false,
  isMyVote    = false,
  isMe        = false,
  onClick,
  className,
}) {
  const { language } = useGameStore();
  const cfg      = (role && ROLE_CFG[role]) ?? DEFAULT_CFG;
  const votePct  = maxVotes > 0 ? voteCount / maxVotes : 0;
  const sparks   = useMemo(
    () => (isSelected || isMyVote)
      ? Array.from({length:8}, (_,i) => ({ angle:(i/8)*Math.PI*2, delay:i*0.3 }))
      : [],
    [isSelected, isMyVote],
  );

  // 3D tilt — OfflineEnvelopeScreen style
  const cardRef = useRef(null);
  const rawX    = useSpring(0, { stiffness:180, damping:22 });
  const rawY    = useSpring(0, { stiffness:180, damping:22 });
  const rotX    = useTransform(rawY, [-1,1], [7,-7]);
  const rotY    = useTransform(rawX, [-1,1], [-7,7]);

  const onMove  = useCallback((e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const cx = e.touches?.[0]?.clientX ?? e.clientX;
    const cy = e.touches?.[0]?.clientY ?? e.clientY;
    rawX.set((cx - r.left) / r.width  * 2 - 1);
    rawY.set((cy - r.top)  / r.height * 2 - 1);
  }, []); // eslint-disable-line
  const onLeave = useCallback(() => { rawX.set(0); rawY.set(0); }, []); // eslint-disable-line

  const initials = name ? name.slice(0,2).toUpperCase() : '??';
  const isHighlight = isSelected || isMyVote;

  return (
    <motion.div
      ref={cardRef}
      styleOld={{ perspective: 800, transformStyle:'preserve-3d', rotateX:rotX, rotateY:rotY }}
      whileTap={onClick ? { scale:0.96 } : undefined}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
      className={clsx(
        'relative flex flex-col items-center justify-center rounded-[1.75rem] overflow-hidden select-none',
        !isAlive && 'grayscale opacity-40',
        onClick  && 'cursor-pointer active:scale-[0.97]',
        className,
      )}
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
        rotateX: rotX,
        rotateY: rotY,
        background: isHighlight
          ? cfg?.bg ?? DEFAULT_CFG.bg
          : 'linear-gradient(155deg,rgba(255,255,255,0.07) 0%,rgba(3,2,10,0.95) 100%)',
        border: `1.5px solid ${isHighlight ? cfg?.border ?? DEFAULT_CFG.border : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isHighlight
          ? `0 0 28px ${cfg?.glow ?? DEFAULT_CFG.glow}55, 0 0 60px ${cfg?.glow ?? DEFAULT_CFG.glow}18, inset 0 0 18px ${cfg?.glow ?? DEFAULT_CFG.glow}0d`
          : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        minHeight: 120,
        padding: '1.1rem 0.75rem',
      }}
    >
      {/* ── Speaking glow ring ── */}
      <AnimatePresence>
        {speaking && (
          <motion.div key="speak-ring"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 rounded-[1.75rem] pointer-events-none"
            style={{ border:`2px solid ${cfg.glow}`, boxShadow:`0 0 22px ${cfg.glow}66` }}
          >
            {/* Pulse ring */}
            <motion.div className="absolute inset-[-4px] rounded-[1.9rem] border pointer-events-none"
              style={{ borderColor: `${cfg.glow}55` }}
              animate={{ scale:[1,1.05,1], opacity:[.6,0,.6] }}
              transition={{ duration:1.1, repeat:Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shimmer sweep ── */}
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background:`linear-gradient(135deg,transparent 30%,${cfg.glow}18 50%,transparent 70%)` }}
        animate={{ x:['-110%','110%'] }}
        transition={{ duration:2, repeat:Infinity, repeatDelay: isHighlight ? 2.5 : 6 }}
      />

      {/* ── Corner sparks (on select/vote) ── */}
      {sparks.map((s,i) => <Spark key={i} color={cfg.glow} angle={s.angle} radius={52} delay={s.delay} />)}

      {/* ── Vote fill bar background ── */}
      {votePct > 0 && (
        <motion.div className="absolute inset-0 origin-left pointer-events-none rounded-[1.75rem]"
          style={{ background:`${cfg.glow}14` }}
          animate={{ scaleX: votePct }}
          transition={{ duration:0.4 }}
        />
      )}

      {/* ── Avatar ── */}
      <div className="relative mb-2 shrink-0">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white"
          style={{ background:`linear-gradient(135deg,${cfg.glow}44,${cfg.glow}11)`,
                   border:`1px solid ${cfg.glow}44` }}>
          {initials}
        </div>

        {/* Host crown */}
        {isHost && (
          <div className="absolute -top-2 -right-1.5 w-5 h-5">
            <svg viewBox="0 0 24 24" fill="#e8c060" width="100%" height="100%">
              <path d="M2 19l3-10 4 6 3-8 3 8 4-6 3 10z"/>
            </svg>
          </div>
        )}

        {/* Speaking pulse on avatar */}
        <AnimatePresence>
          {speaking && (
            <motion.div key="av-pulse"
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ boxShadow:`0 0 0 2px ${cfg.glow}` }}
            >
              <motion.div className="absolute inset-0 rounded-2xl"
                animate={{ scale:[1,1.35,1], opacity:[.5,0,.5] }}
                transition={{ duration:0.9, repeat:Infinity }}
                style={{ background:`${cfg.glow}33` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Muted badge */}
        {isMe && !speaking && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-smoke-800 border border-white/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-smoke-500" />
          </div>
        )}
      </div>

      {/* ── Name ── */}
      <p className={clsx(
        'font-black text-sm text-center w-full truncate px-1 leading-tight',
        !isAlive ? 'line-through opacity-50 text-smoke-400' : 'text-white',
      )}>
        {name}
      </p>

      {/* ── Role badge (shown when role is revealed) ── */}
      {role && (
        <div className="flex items-center gap-1 mt-1.5">
          <RoleIcon role={role} size={11} color={cfg.glow} />
          <span className="text-[9px] font-black uppercase tracking-wider"
            style={{ color:cfg.glow }}>
            {language === 'ar'
              ? (cfg.label.ar)
              : getRoleLabel(role, language)}
          </span>
        </div>
      )}

      {/* ── Speaking wave bars ── */}
      <AnimatePresence>
        {speaking && (
          <motion.div key="wave"
            initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.8 }}
            className="mt-2">
            <WaveBars color={cfg.glow} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Vote count badge ── */}
      <AnimatePresence mode="popLayout">
        {voteCount > 0 && (
          <motion.div key={voteCount}
            initial={{ scale:1.6, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.6, opacity:0 }}
            transition={{ type:'spring', damping:12 }}
            className="absolute top-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background:`${cfg.glow}30`, color:cfg.glow, border:`1px solid ${cfg.glow}50` }}>
            {voteCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My vote checkmark ── */}
      <AnimatePresence>
        {isMyVote && (
          <motion.div key="check"
            initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
            transition={{ type:'spring', damping:10 }}
            className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background:cfg.glow }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PlayerCard;
