// ─── THE MAFIA — EnvelopeScreen.jsx (Cinematic Unified Design) ───────────────
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { TimerRing } from '../ui/index.jsx';
import { useTimer } from '../../hooks/useTimer.js';
import { ParallaxStars } from '../game/ParallaxStars.jsx';
import { useTranslation } from '../../constants/translations.js';

/* ── Clean SVG role icon ──────────────────────────────────────────────────── */
function RoleIcon({ role, size = 40, glow }) {
  const s = size;
  const props = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:glow, strokeWidth:'1.5', strokeLinecap:'round', strokeLinejoin:'round' };
  switch (role) {
    case 'mafia':   return <svg {...props}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z"/></svg>;
    case 'doctor':  return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'sheikh':  return <svg {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    default:        return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  }
}

/* ── Orbiting particle spark ──────────────────────────────────────────────── */
function Spark({ color, angle, radius, delay }) {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return (
    <motion.div className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
      style={{ left:'50%', top:'50%', marginLeft:-3, marginTop:-3, background:color, boxShadow:`0 0 6px ${color}` }}
      animate={{ x:[x*0.5,x,x*0.7,x*0.5], y:[y*0.5,y,y*0.7,y*0.5], opacity:[0,1,0.5,0], scale:[0.4,1.3,0.9,0.4] }}
      transition={{ duration:2.6, repeat:Infinity, delay, ease:'easeInOut' }}
    />
  );
}

const ROLE_COLORS = {
  mafia:   '#e02020',
  doctor:  '#10b981',
  sheikh:  '#3b82f6',
  citizen: '#c9943a',
};

/* ── The actual card ──────────────────────────────────────────────────────── */
function RoleCard({ role, revealed, tiltX, tiltY, t }) {
  const ROLE_CONFIG = useMemo(() => ({
    mafia:   { label: t('mafiaLabel'),   desc: t('mafiaDesc'),   glow: ROLE_COLORS.mafia,   border:'rgba(224,32,32,0.65)',  bg:'linear-gradient(155deg,rgba(224,32,32,0.28) 0%,rgba(4,1,12,0.96) 100%)' },
    doctor:  { label: t('doctorLabel'),  desc: t('doctorDesc'),  glow: ROLE_COLORS.doctor,  border:'rgba(16,185,129,0.65)', bg:'linear-gradient(155deg,rgba(16,185,129,0.28) 0%,rgba(2,12,8,0.96) 100%)' },
    sheikh:  { label: t('sheikhLabel'),  desc: t('sheikhDesc'),  glow: ROLE_COLORS.sheikh,  border:'rgba(59,130,246,0.65)', bg:'linear-gradient(155deg,rgba(59,130,246,0.28) 0%,rgba(2,4,16,0.96) 100%)' },
    citizen: { label: t('citizenLabel'), desc: t('citizenDesc'), glow: ROLE_COLORS.citizen, border:'rgba(201,148,58,0.65)', bg:'linear-gradient(155deg,rgba(201,148,58,0.18) 0%,rgba(10,6,2,0.96) 100%)' },
  }), [t]);

  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.citizen;
  const sparks = useMemo(() => Array.from({length:8},(_,i)=>({ angle:(i/8)*Math.PI*2, delay:i*0.3 })),[]);

  return (
    <div style={{ perspective:1000, width:240, height:340 }}>
      <motion.div
        style={{ width:'100%', height:'100%', transformStyle:'preserve-3d', rotateX:tiltX, rotateY:tiltY }}
        animate={{ y:[0,-10,0] }}
        transition={{ duration:3.8, repeat:Infinity, ease:'easeInOut' }}
      >
        <motion.div
          style={{ width:'100%', height:'100%', transformStyle:'preserve-3d' }}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={{ duration:0.65, ease:[0.22,1,0.36,1] }}
        >
          {/* ── FRONT (hidden) ──────────────────────────────────────── */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden',
            background:'linear-gradient(155deg,rgba(78,24,160,0.4) 0%,rgba(4,1,14,0.97) 100%)',
            border:'1px solid rgba(124,58,237,0.35)', borderRadius:32 }}
            className="flex flex-col items-center justify-center gap-5 overflow-hidden select-none">
            <motion.div className="absolute inset-0 opacity-20"
              style={{ background:'linear-gradient(135deg,transparent 35%,rgba(255,255,255,0.55) 50%,transparent 65%)' }}
              animate={{ x:['-110%','110%'] }} transition={{ duration:1.6, repeat:Infinity, repeatDelay:3.5 }} />
            <motion.div className="text-purple-300 opacity-60"
              animate={{ scale:[1,1.05,1], rotate:[0,2,-2,0] }}
              transition={{ duration:4.5, repeat:Infinity }}>
              <Mail size={64} strokeWidth={1.25} />
            </motion.div>
            <div className="w-12 h-px bg-white/15 rounded-full" />
            <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-smoke-500">
              {t('tapToReveal')}
            </p>
          </div>

          {/* ── BACK (role revealed) ────────────────────────────────── */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)',
            background:cfg.bg, border:`1.5px solid ${cfg.border}`,
            boxShadow:`0 0 55px ${cfg.glow}55, 0 0 100px ${cfg.glow}20, inset 0 0 28px ${cfg.glow}14`,
            borderRadius:32 }}
            className="flex flex-col items-center justify-center gap-6 relative overflow-hidden select-none">

            <motion.div className="absolute inset-0 rounded-[32px]"
              animate={{ opacity:[0.3,0.75,0.3] }} transition={{ duration:2.2, repeat:Infinity }}
              style={{ boxShadow:`0 0 70px ${cfg.glow}88` }} />

            <motion.div className="absolute inset-0 opacity-25"
              style={{ background:`linear-gradient(135deg,transparent 30%,${cfg.glow}55 50%,transparent 70%)` }}
              animate={{ x:['-120%','120%'] }} transition={{ duration:1.4, repeat:Infinity, repeatDelay:4 }} />

            {sparks.map((s,i) => <Spark key={i} color={cfg.glow} angle={s.angle} radius={52} delay={s.delay} />)}

            <motion.div className="relative z-10"
              animate={{ scale:[1,1.12,1] }} transition={{ duration:2.5, repeat:Infinity }}>
              <RoleIcon role={role} size={50} glow={cfg.glow} />
            </motion.div>

            <p className="text-3xl font-black tracking-[0.2em] relative z-10"
              style={{ color:cfg.glow, textShadow:`0 0 22px ${cfg.glow}` }}>
              {cfg.label}
            </p>

            <div className="w-16 h-px rounded-full relative z-10" style={{ background:cfg.glow, opacity:0.4 }} />

            <p className="text-smoke-300 text-xs text-center px-8 leading-relaxed relative z-10">
              {cfg.desc}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function EnvelopeScreen({ user, onExpire }) {
  const { myRole, gameState, language } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const autoFlippedRef = useRef(false);
  const t = useTranslation(language);
  const isAr = language === 'ar';

  const { remaining } = useTimer(gameState, onExpire);

  useEffect(() => {
    if (remaining <= 7 && myRole && !autoFlippedRef.current) {
      autoFlippedRef.current = true;
      setTimeout(() => setRevealed(true), 200);
    }
  }, [remaining, myRole]);

  const rawTiltX = useSpring(0, { stiffness:90, damping:18 });
  const rawTiltY = useSpring(0, { stiffness:90, damping:18 });
  const pxSpring = useSpring(0, { stiffness:38, damping:22 });
  const pySpring = useSpring(0, { stiffness:38, damping:22 });
  const parallaxX = useTransform(pxSpring, [-1,1], [25,-25]);
  const parallaxY = useTransform(pySpring, [-1,1], [15,-15]);

  const containerRef = useRef(null);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    rawTiltX.set(dy * -18);
    rawTiltY.set(dx *  18);
    pxSpring.set(dx);
    pySpring.set(dy);
  }, [pxSpring, pySpring, rawTiltX, rawTiltY]);

  const onPointerLeave = useCallback(() => {
    rawTiltX.set(0); rawTiltY.set(0);
    pxSpring.set(0); pySpring.set(0);
  }, [pxSpring, pySpring, rawTiltX, rawTiltY]);

  const role = myRole ?? 'citizen';

  return (
    <div 
      ref={containerRef}
      className="screen bg-noir-950 noise items-center justify-center overflow-hidden"
      onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
    >
      <motion.div className="absolute inset-0" style={{ x:parallaxX, y:parallaxY }}>
        <ParallaxStars count={100} />
      </motion.div>

      {myRole && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full pointer-events-none blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 0.6 : 0.1, scale: revealed ? 1.2 : 0.9 }}
          transition={{ duration:1.5 }}
          style={{ background:`radial-gradient(ellipse, ${ROLE_COLORS[role]??ROLE_COLORS.citizen}77 0%, transparent 70%)` }}
        />
      )}

      <div className="absolute top-safe top-8 right-8 z-20">
        <TimerRing remaining={remaining} total={10} size={64} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-10"
      >
        <p className="text-smoke-400 text-xs uppercase tracking-[0.4em] font-mono">
          {t('yourIdentity')}
        </p>
        <h2 className="display text-3xl font-black text-white mt-2 tracking-tight">
          {revealed ? t('youAre') : t('yourEnvelope')}
        </h2>
      </motion.div>

      <div 
        className="relative z-10 touch-none cursor-pointer"
        onClick={() => { if (!revealed && myRole) setRevealed(true); }}
      >
        <RoleCard role={role} revealed={revealed} tiltX={rawTiltX} tiltY={rawTiltY} t={t} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-12 text-center"
      >
        <p className="text-smoke-500 text-xs tracking-[0.2em] font-mono">
          {!revealed ? t('tapToRevealRole') : t('keepRoleSecret')}
        </p>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-smoke-400 text-[10px] uppercase tracking-widest">
              {t('gameStartingSoon')}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
