// components/ui/index.jsx — v10-fixed (dead avatar emoji → SVG)
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarColor, AVATAR_INITIALS, AGENT_AVATARS } from '../../constants/game.js';
import { vibrate, HAPTICS } from '../../utils/haptics.js';

const SHAPES = {
  A: (<g><polygon points="16,4 28,4 32,12 32,22 24,30 8,30 4,22 4,12" fill="rgba(255,255,255,0.85)"/><circle cx="16" cy="14" r="4" fill="rgba(0,0,0,0.35)"/><rect x="10" y="22" width="12" height="3" rx="1.5" fill="rgba(0,0,0,0.25)"/></g>),
  B: (<g><ellipse cx="16" cy="16" rx="12" ry="14" fill="rgba(255,255,255,0.85)"/><ellipse cx="16" cy="13" rx="5" ry="5.5" fill="rgba(0,0,0,0.35)"/><rect x="10" y="21" width="12" height="3" rx="1.5" fill="rgba(0,0,0,0.25)"/></g>),
  C: (<g><polygon points="16,3 27,9 27,23 16,29 5,23 5,9" fill="rgba(255,255,255,0.85)"/><circle cx="16" cy="15" r="4.5" fill="rgba(0,0,0,0.35)"/><rect x="11" y="22" width="10" height="2.5" rx="1.25" fill="rgba(0,0,0,0.25)"/></g>),
  D: (<g><polygon points="16,2 30,16 16,30 2,16" fill="rgba(255,255,255,0.85)"/><circle cx="16" cy="14" r="4" fill="rgba(0,0,0,0.35)"/><ellipse cx="16" cy="21" rx="5" ry="2" fill="rgba(0,0,0,0.25)"/></g>),
  E: (<g><ellipse cx="16" cy="16" rx="13" ry="12" fill="rgba(255,255,255,0.85)"/><rect x="8" y="12" width="16" height="6" rx="3" fill="rgba(0,0,0,0.4)"/><rect x="11" y="21" width="10" height="2.5" rx="1.25" fill="rgba(0,0,0,0.25)"/></g>),
  F: (<g><rect x="12" y="3" width="8" height="26" rx="4" fill="rgba(255,255,255,0.85)"/><rect x="3" y="12" width="26" height="8" rx="4" fill="rgba(255,255,255,0.85)"/><circle cx="16" cy="16" r="4" fill="rgba(0,0,0,0.4)"/></g>),
};

function AgentSVG({ agent, size }) {
  const [from, to] = agent.gradient;
  const gid = `av-${agent.id}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius:'30%', display:'block' }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="8" fill={`url(#${gid})`} />
      {SHAPES[agent.shape]}
    </svg>
  );
}

function DeadX({ size }) {
  const s = Math.round(size * 0.38);
  const p = Math.round(s * 0.2);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.92)" strokeWidth={3.5} strokeLinecap="round">
      <line x1={p} y1={p} x2={24-p} y2={24-p} />
      <line x1={24-p} y1={p} x2={p} y2={24-p} />
    </svg>
  );
}

export function PremiumCard({ children, className, mode='online', style, padding='p-6', ...props }) {
  const isOnline = mode === 'online';
  const borderColor = isOnline ? 'border-cyan-500/40' : 'border-amber-500/40';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ ...style }}
      className={`relative rounded-2xl bg-zinc-900/95 border ${borderColor} ${padding} ${className}`}
      {...props}
    >
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}

export function Avatar({ uid, name, avatar, size='md', speaking=false, dead=false }) {
  const color    = getAvatarColor(uid);
  const initials = AVATAR_INITIALS(name);
  const isAgentId = avatar && /^a\d{2}$/.test(avatar);
  const isPhoto   = avatar && (avatar.startsWith('data:') || avatar.startsWith('http'));
  const agent     = isAgentId ? AGENT_AVATARS.find(a => a.id === avatar) : null;
  const px = { xs:32, sm:48, md:56, lg:80, xl:96 };
  const sz = px[size] ?? 56;
  return (
    <div className="relative flex-shrink-0 select-none"
      style={{ width:sz, height:sz, borderRadius:'30%', overflow:'hidden',
        filter: dead ? 'grayscale(1) brightness(0.4)' : 'none', transition:'filter 0.3s',
        background: agent ? 'transparent' : `linear-gradient(135deg, ${color}cc, ${color})` }}>
      {isPhoto  ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
       : agent  ? <AgentSVG agent={agent} size={sz} />
       : <div className="w-full h-full flex items-center justify-center">
           <span className="text-white font-black drop-shadow-md" style={{ fontSize:sz*0.3 }}>{initials}</span>
         </div>}
      {speaking && (
        <motion.div className="absolute inset-0 rounded-[30%] border-2 border-gold-500"
          animate={{ scale:[1,1.12,1], opacity:[1,0.3,1] }} transition={{ duration:1.4, repeat:Infinity }} />
      )}
      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/65">
          <DeadX size={sz} />
        </div>
      )}
    </div>
  );
}

export function Spinner({ size=24 }) {
  return (
    <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
      style={{ width:size, height:size }} className="rounded-full border-2 border-white/10 border-t-white" />
  );
}

const toastEvents = [];
export function toast(message, type='info', duration=3200) {
  if (type==='success')    vibrate(HAPTICS.SUCCESS);
  else if (type==='error') vibrate(HAPTICS.ERROR);
  else                     vibrate(HAPTICS.NOTIFICATION);
  toastEvents.forEach(fn => fn({ message, type, duration, id: Date.now()+Math.random() }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const sub = t => {
      setToasts(p => [...p.slice(-2), t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), t.duration);
    };
    toastEvents.push(sub);
    return () => { const i=toastEvents.indexOf(sub); if(i>-1) toastEvents.splice(i,1); };
  }, []);
  const map = { info:'bg-white text-black', success:'bg-gold-500 text-black', error:'bg-crimson-600 text-white' };
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 pointer-events-none w-[90%] max-w-xs">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ y:20, opacity:0, scale:0.88 }}
            animate={{ y:0, opacity:1, scale:1 }} exit={{ opacity:0, scale:0.88, y:-8 }}
            transition={{ type:'spring', damping:18, stiffness:300 }}
            className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl text-center ${map[t.type]}`}>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function GoldDivider() { return <div className="h-px w-full bg-white/5" />; }

export function TimerRing({ remaining, total, size=60, color, strokeWidth=3 }) {
  const r      = Number.isFinite(remaining) ? remaining : 0;
  const t      = Number.isFinite(total) && total>0 ? total : 1;
  const radius = (size - strokeWidth*2) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, r/t)));
  const isUrgent = r <= 5;
  const stroke   = color ?? (isUrgent ? '#e02020' : '#c9943a');
  return (
    <div style={{ width:size, height:size }} className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={stroke}
          strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circ}
          animate={{ strokeDashoffset:offset }} transition={{ duration:0.5, ease:'linear' }} />
      </svg>
      <span className="absolute font-black font-mono" style={{ fontSize:size*0.24, color:stroke }}>{r}</span>
    </div>
  );
}
