// ── OfflineEnvelopeScreen — tap-and-hold reveal · 3D tilt · parallax ─────────
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { ROLE_META } from '../../../../constants/game.js';
import { GameBackground } from '../../../components/game/GameBackground.jsx';

/* ── Role display config ─────────────────────────────────────────────────── */
const ROLE_CONFIG = {
  mafia:   { label:'MAFIA',    labelAr:'مافيا',    desc:'Kill one villager each night. Stay hidden.',      descAr:'اقتل مواطناً كل ليلة.',      glow:'#e02020', border:'rgba(224,32,32,0.65)',  bg:'linear-gradient(155deg,rgba(224,32,32,0.28) 0%,rgba(4,1,12,0.96) 100%)' },
  doctor:  { label:'DOCTOR',   labelAr:'طبيب',     desc:'Each night protect one player from death.',      descAr:'احمِ لاعباً كل ليلة.',        glow:'#10b981', border:'rgba(16,185,129,0.65)', bg:'linear-gradient(155deg,rgba(16,185,129,0.28) 0%,rgba(2,12,8,0.96) 100%)' },
  sheikh:  { label:'DETECTIVE',labelAr:'محقق',     desc:'Each night investigate one player\'s alignment.',descAr:'حقق مع لاعب كل ليلة.',        glow:'#3b82f6', border:'rgba(59,130,246,0.65)', bg:'linear-gradient(155deg,rgba(59,130,246,0.28) 0%,rgba(2,4,16,0.96) 100%)' },
  citizen: { label:'CIVILIAN', labelAr:'مدني',     desc:'Find and exile the Mafia through debate.',       descAr:'اكشف المافيا عبر النقاش.',    glow:'#c9943a', border:'rgba(201,148,58,0.65)', bg:'linear-gradient(155deg,rgba(201,148,58,0.18) 0%,rgba(10,6,2,0.96) 100%)' },
};

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

/* ── The actual card ──────────────────────────────────────────────────────── */
function RoleCard({ role, pressing, tiltX, tiltY, isAr }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.citizen;
  const sparks = useMemo(() => Array.from({length:8},(_,i)=>({ angle:(i/8)*Math.PI*2, delay:i*0.3 })),[]);

  return (
    <div style={{ perspective:1000, width:220, height:310 }}>
      <motion.div
        style={{ width:'100%', height:'100%', transformStyle:'preserve-3d', rotateX:tiltX, rotateY:tiltY }}
        animate={{ y:[0,-10,0] }}
        transition={{ duration:3.8, repeat:Infinity, ease:'easeInOut' }}
      >
        {/* Card flip wrapper */}
        <motion.div
          style={{ width:'100%', height:'100%', transformStyle:'preserve-3d' }}
          animate={{ rotateY: pressing ? 180 : 0 }}
          transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
        >

          {/* ── FRONT (hidden) ──────────────────────────────────────── */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden',
            background:'linear-gradient(155deg,rgba(78,24,160,0.4) 0%,rgba(4,1,14,0.97) 100%)',
            border:'1px solid rgba(124,58,237,0.35)', borderRadius:28 }}
            className="flex flex-col items-center justify-center gap-5 overflow-hidden select-none">
            {/* Shimmer */}
            <motion.div className="absolute inset-0 opacity-20"
              style={{ background:'linear-gradient(135deg,transparent 35%,rgba(255,255,255,0.55) 50%,transparent 65%)' }}
              animate={{ x:['-110%','110%'] }} transition={{ duration:1.6, repeat:Infinity, repeatDelay:3.5 }} />
            {/* Sealed envelope */}
            <motion.div className="text-purple-300 opacity-60"
              animate={{ scale:[1,1.1,1], rotate:[0,4,-4,0] }}
              transition={{ duration:4.5, repeat:Infinity }}>
              <Mail size={64} strokeWidth={1.25} />
            </motion.div>
            <div className="w-10 h-px bg-white/15 rounded-full" />
            <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-smoke-500">
              HOLD TO REVEAL
            </p>
          </div>

          {/* ── BACK (role revealed) ────────────────────────────────── */}
          <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)',
            background:cfg.bg, border:`1.5px solid ${cfg.border}`,
            boxShadow:`0 0 55px ${cfg.glow}55, 0 0 100px ${cfg.glow}20, inset 0 0 28px ${cfg.glow}14`,
            borderRadius:28 }}
            className="flex flex-col items-center justify-center gap-5 relative overflow-hidden select-none">

            {/* Glow pulse */}
            <motion.div className="absolute inset-0 rounded-[28px]"
              animate={{ opacity:[0.3,0.75,0.3] }} transition={{ duration:2.2, repeat:Infinity }}
              style={{ boxShadow:`0 0 70px ${cfg.glow}88` }} />

            {/* Shimmer sweep */}
            <motion.div className="absolute inset-0 opacity-25"
              style={{ background:`linear-gradient(135deg,transparent 30%,${cfg.glow}55 50%,transparent 70%)` }}
              animate={{ x:['-120%','120%'] }} transition={{ duration:1.4, repeat:Infinity, repeatDelay:4 }} />

            {/* Corner sparks */}
            {sparks.map((s,i) => <Spark key={i} color={cfg.glow} angle={s.angle} radius={48} delay={s.delay} />)}

            {/* Icon */}
            <motion.div className="relative z-10"
              animate={{ scale:[1,1.12,1] }} transition={{ duration:2.5, repeat:Infinity }}>
              <RoleIcon role={role} size={46} glow={cfg.glow} />
            </motion.div>

            {/* Role name */}
            <p className="text-2xl font-black tracking-[0.2em] relative z-10"
              style={{ color:cfg.glow, textShadow:`0 0 22px ${cfg.glow}` }}>
              {isAr ? cfg.labelAr : cfg.label}
            </p>

            <div className="w-14 h-px rounded-full relative z-10" style={{ background:cfg.glow, opacity:0.4 }} />

            {/* Description */}
            <p className="text-smoke-300 text-xs text-center px-7 leading-relaxed relative z-10">
              {isAr ? cfg.descAr : cfg.desc}
            </p>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Main screen ─────────────────────────────────────────────────────────── */
export default function OfflineEnvelopeScreen() {
  const { players, roles, envelopeIndex, nextEnvelope, language } = useOfflineStore();
  const t      = useOfflineLang(language);
  const isAr   = language === 'ar';

  const [pressing,  setPressing]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  /* ── 3D card tilt from touch/mouse ────────────────────────────────────── */
  const rawTiltX = useSpring(0, { stiffness:90, damping:18 });
  const rawTiltY = useSpring(0, { stiffness:90, damping:18 });
  /* ── Parallax: opposite direction ─────────────────────────────────────── */
  const pxSpring = useSpring(0, { stiffness:38, damping:22 });
  const pySpring = useSpring(0, { stiffness:38, damping:22 });
  const parallaxX = useTransform(pxSpring, [-1,1], [20,-20]);
  const parallaxY = useTransform(pySpring, [-1,1], [12,-12]);

  const containerRef = useRef(null);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    rawTiltX.set(dy * -16);
    rawTiltY.set(dx *  16);
    pxSpring.set(dx);
    pySpring.set(dy);
  }, []);

  const onPointerLeave = useCallback(() => {
    rawTiltX.set(0); rawTiltY.set(0);
    pxSpring.set(0); pySpring.set(0);
  }, []);

  // Reset state on player change
  useEffect(() => { setPressing(false); setConfirmed(false); }, [envelopeIndex]);

  function handleNext() {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => { setConfirmed(false); nextEnvelope(); }, 320);
  }

  const player = players[envelopeIndex];
  const role   = player ? roles[player.id] : 'citizen';
  const isLast = envelopeIndex >= players.length - 1;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={envelopeIndex}
        ref={containerRef}
        className="screen bg-noir-950 overflow-hidden items-center justify-center"
        style={{ userSelect:'none' }}
        initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
        exit={{ opacity:0, scale:0.96 }} transition={{ duration:0.35 }}
        onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
      >
        {/* ── Parallax stars (move OPPOSITE to cursor = depth) ─────── */}
        <motion.div className="absolute inset-0" style={{ x:parallaxX, y:parallaxY }}>
          <GameBackground count={80} />
        </motion.div>

        {/* ── Role colour nebula ───────────────────────────────────── */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none blur-3xl"
          animate={{ opacity: pressing ? 0.55 : 0.1, scale: pressing ? 1.2 : 0.9 }}
          transition={{ duration:0.5 }}
          style={{ background:`radial-gradient(ellipse, ${(ROLE_CONFIG[role]??ROLE_CONFIG.citizen).glow}66 0%, transparent 70%)` }}
        />

        {/* ── "Pass phone to" header ───────────────────────────────── */}
        <motion.div initial={{ y:-18, opacity:0 }} animate={{ y:0, opacity:1 }}
          className="relative z-10 text-center mb-7">
          <p className="text-smoke-500 text-[11px] tracking-[0.38em] uppercase font-mono">{t('passPhoneTo')}</p>
          <h1 className="text-4xl font-black text-white tracking-wider mt-1.5"
            style={{ fontFamily:'Playfair Display, serif', textShadow:'0 0 30px rgba(255,255,255,0.2)' }}>
            {player?.name?.toUpperCase()}
          </h1>
        </motion.div>

        {/* ── Card (tap & hold) ────────────────────────────────────── */}
        <div className="relative z-10 touch-none"
          onPointerDown={() => setPressing(true)}
          onPointerUp={() => setPressing(false)}
          onPointerCancel={() => setPressing(false)}
          onPointerLeave={() => setPressing(false)}
        >
          <RoleCard role={role} pressing={pressing} tiltX={rawTiltX} tiltY={rawTiltY} isAr={isAr} />
        </div>

        {/* ── Hold hint ───────────────────────────────────────────── */}
        <motion.p key={pressing ? 'rel' : 'tap'}
          initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
          className="relative z-10 mt-6 text-smoke-500 text-xs tracking-[0.28em] font-mono">
          {pressing ? t('releaseToHide') : t('tapHoldReveal')}
        </motion.p>

        {/* ── Next / Start Night button ────────────────────────────── */}
        <motion.button initial={{ y:16, opacity:0 }} animate={{ y:0, opacity:1 }}
          transition={{ delay:0.4 }}
          whileTap={{ scale:0.96 }} onClick={handleNext}
          className="relative z-10 mt-7 h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-[0.18em] text-white overflow-hidden"
          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)' }}>
          <motion.div className="absolute inset-0"
            animate={{ background:['rgba(255,255,255,0)','rgba(255,255,255,0.04)','rgba(255,255,255,0)'] }}
            transition={{ duration:2.5, repeat:Infinity }} />
          <span className="relative z-10">
            {isLast ? t('startNight') : `${t('nextPlayer')} ${players[envelopeIndex+1]?.name}`}
          </span>
        </motion.button>

        {/* ── Progress dots ────────────────────────────────────────── */}
        <div className="relative z-10 flex gap-2 mt-5">
          {players.map((_,i) => (
            <motion.div key={i}
              animate={{ width:i===envelopeIndex?24:8, opacity:i>envelopeIndex?0.18:i===envelopeIndex?1:0.5 }}
              className="h-2 rounded-full bg-white" transition={{ duration:0.3 }} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
