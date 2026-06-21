// ─── THE MAFIA — OfflineDiscussionScreen.jsx ─────────────────────────────────
// Complete layout overhaul:
//  • Player cards are the HERO — centered grid, luxury PlayerCard component
//  • Timer ring prominent at top center
//  • Bottom sheet CTA for voting
//  • Pause/resume hidden behind long-press on timer (UX clean)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { useOfflineStore, useOfflineLang } from '../../../../store/offlineStore.js';
import { startVoting } from '../../../../services/offlineEngine.js';
import { GameBackground } from '../../../components/game/GameBackground.jsx';


function pad(n) { return String(n).padStart(2, '0'); }

// ── Compact player chip for the centered grid ─────────────────────────────────
function AliveChip({ player, index }) {
  const initials  = (player.name ?? '??').slice(0, 2).toUpperCase();
  const colors    = ['#7c3aed','#dc2626','#059669','#d97706','#2563eb','#db2777','#0891b2','#65a30d'];
  let h = 0;
  for (let i = 0; i < (player.id ?? '').length; i++) h = player.id.charCodeAt(i) + ((h << 5) - h);
  const color = colors[Math.abs(h) % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1,  scale: 1,    y: 0  }}
      transition={{ type: 'spring', damping: 18, stiffness: 260, delay: index * 0.05 }}
      className="relative flex flex-col items-center gap-2 rounded-[1.4rem] p-3"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border:     '1px solid rgba(255,255,255,0.09)',
        minWidth:   0,
      }}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white flex-shrink-0"
        style={{ background: `${color}33`, border: `1.5px solid ${color}55` }}>
        {initials}
      </div>

      {/* Name */}
      <p className="text-white font-black text-xs text-center w-full truncate leading-tight px-1">
        {player.name}
      </p>

      {/* Alive pulse */}
      <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        animate={{ opacity: [1, 0.25, 1], scale: [1, 1.4, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.28 }} />
    </motion.div>
  );
}

export default function OfflineDiscussionScreen() {
  const { players, alivePlayers, round, settings, language } = useOfflineStore();
  const t = useOfflineLang(language);

  const [seconds, setSeconds] = useState(settings.discussionTime ?? 180);
  const [running, setRunning] = useState(true);
  const [expired, setExpired] = useState(false);
  const interval = useRef(null);

  const alive      = players.filter((p) => alivePlayers.includes(p.id));
  const pct        = seconds / Math.max(1, settings.discussionTime ?? 180);
  const mins       = Math.floor(seconds / 60);
  const secs       = seconds % 60;
  const timerColor = seconds > 60 ? '#10b981' : seconds > 20 ? '#f59e0b' : '#e02020';
  const C          = 2 * Math.PI * 44; // radius 44

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setExpired(true);
          clearInterval(interval.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval.current);
  }, [running]);

  return (
    <div className="screen overflow-hidden relative flex flex-col">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <GameBackground />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom,rgba(3,2,10,0.5) 0%,rgba(3,2,10,0.1) 35%,rgba(3,2,10,0.72) 100%)' }} />
      </div>

      {/* ── Header: phase label + timer ───────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center pt-safe pt-5 pb-2 px-5 flex-shrink-0">
        <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-1">
          {t('discussionPhase') ?? 'Discussion'} · Round {round}
        </p>

        {/* Timer ring — tap to pause/resume */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => !expired && setRunning((r) => !r)}
          className="relative w-28 h-28 flex items-center justify-center mt-1"
        >
          <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="44" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            <motion.circle cx="56" cy="56" r="44" fill="none"
              stroke={timerColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C * (1 - pct) }}
              transition={{ duration: 0.55, ease: 'linear' }} />
          </svg>
          <div className="text-center z-10">
            <p className="text-2xl font-black text-white font-mono leading-none">{pad(mins)}:{pad(secs)}</p>
            <div className="flex items-center justify-center mt-1.5 gap-1 text-smoke-500">
              {running
                ? <Pause size={10} strokeWidth={2.5} />
                : <Play  size={10} strokeWidth={2.5} />
              }
              <span className="text-[8px] font-bold uppercase tracking-wider">
                {running ? t('tapToPause') ?? 'tap to pause' : t('tapToResume') ?? 'tap to resume'}
              </span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* ── Player grid — HERO ────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3">

        {/* Section label */}
        <p className="text-[9px] font-black text-smoke-500 uppercase tracking-[0.3em] text-center mb-3">
          {t('alivePlayers') ?? 'Alive'} · {alive.length}
        </p>

        {/* 3-column centered grid */}
        <div className="grid gap-2.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(alive.length, 3)}, 1fr)` }}>
          {alive.map((p, i) => (
            <AliveChip key={p.id} player={p} index={i} />
          ))}
        </div>

        {/* Expired banner */}
        <AnimatePresence>
          {expired && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-5 rounded-2xl p-3 text-center"
              style={{ background: 'rgba(201,148,58,0.12)', border: '1px solid rgba(201,148,58,0.3)' }}>
              <p className="text-gold-400 text-xs font-black uppercase tracking-widest">
                {t('timeIsUp') ?? 'Time is up!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-4 pb-safe pb-6 pt-2"
        style={{ background: 'linear-gradient(to top,rgba(3,2,10,0.95) 0%,transparent 100%)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={startVoting}
          className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-[0.15em] text-black flex items-center justify-center gap-3"
          style={{
            background:  'linear-gradient(135deg,#c9943a 0%,#e8b84b 60%,#c9943a 100%)',
            boxShadow:   '0 0 32px rgba(201,148,58,0.4), 0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <span>{t('proceedVoting') ?? 'Proceed to Vote'}</span>
          <ArrowRight size={17} strokeWidth={2.5} />
        </motion.button>
      </div>

    </div>
  );
}
