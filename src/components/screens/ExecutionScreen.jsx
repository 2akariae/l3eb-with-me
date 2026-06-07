// ─── THE MAFIA — ExecutionScreen.jsx (PREMIUM REFACTOR) ──────────────────────
// Fixes:
//   1. "No Execution" screen freeze → auto-advances after MAX 4s (host fires nextRound).
//   2. Audio glitch: executed player gets dramatic static/radio-cut SFX before mic mutes.
//   3. Full premium visual overhaul: HauntedHouseBg (day), cinematic typewriter reveal,
//      luxury card frame, phase-atmosphere gradient aligned with offline aesthetic.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore.js';
import { nextRound } from '../../games/mafia/hooks/useMafiaEngine.js';
import { Avatar, toast } from '../ui/index.jsx';
import { ROLE_META, getRoleLabel } from '../../constants/game.js';
import { useTimer } from '../../hooks/useTimer.js';
import HauntedHouseBg from '../game/HauntedHouseBg.jsx';

// ── Dramatic radio-glitch static sound (Web Audio API — no external file) ────
function playGlitchSFX() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const dur   = 1.4;
    const buf   = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data  = buf.getChannelData(0);

    // White noise bursts shaped like radio static
    for (let i = 0; i < data.length; i++) {
      const t        = i / ctx.sampleRate;
      const envelope = t < 0.05 ? t / 0.05
                     : t > 1.2  ? (dur - t) / (dur - 1.2)
                     : 1;
      // Modulated static: dense bursts with brief silences
      const on = Math.sin(t * 180) > -0.3 ? 1 : 0;
      data[i] = (Math.random() * 2 - 1) * envelope * on * 0.35;
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;

    // Band-pass to sound like a radio (cut bass + highs)
    const bpf = ctx.createBiquadFilter();
    bpf.type            = 'bandpass';
    bpf.frequency.value = 1400;
    bpf.Q.value         = 0.8;

    source.connect(bpf);
    bpf.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + dur);
    source.onended = () => ctx.close();
  } catch {
    // Audio not available — silently skip
  }
}

// ── Cinematic letter-by-letter typewriter (character-scroll reveal) ────────────
function TypewriterText({ text, speed = 38, className = '', onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done,      setDone]      = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    setDone(false);
    const id = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text]); // eslint-disable-line

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="text-gold-400 animate-pulse">|</span>}
    </span>
  );
}

// ── Static glitch overlay on avatar before mute ───────────────────────────────
function GlitchOverlay({ active }) {
  if (!active) return null;
  return (
    <motion.div
      className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0, 1, 0, 0.8, 0] }}
      transition={{ duration: 1.3, times: [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1] }}
    >
      {/* Horizontal scan lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-[3px]"
          style={{
            top:        `${(i / 8) * 100}%`,
            background: `rgba(255,${i % 2 === 0 ? 30 : 200},${i % 3 === 0 ? 30 : 80}, 0.6)`,
          }}
          animate={{ x: [0, i % 2 === 0 ? -8 : 8, 0, i % 3 === 0 ? 12 : -12, 0] }}
          transition={{ duration: 0.18, repeat: 6 }}
        />
      ))}
      <div className="absolute inset-0 bg-crimson-600/20 mix-blend-screen" />
    </motion.div>
  );
}

export default function ExecutionScreen() {
  const { roomId, isHost, players, gameState, playerId, language } = useGameStore();
  const [phase,       setPhase]       = useState('reveal');  // reveal → role → continue
  const [advancing,   setAdvancing]   = useState(false);
  const [glitching,   setGlitching]   = useState(false);
  const [titleDone,   setTitleDone]   = useState(false);
  const [nameDone,    setNameDone]    = useState(false);

  const executed = gameState?.lastExecuted;
  const victim   = executed ? players[executed] : null;
  const roleName = gameState?.executedRole;
  const meta     = roleName ? ROLE_META[roleName] : null;

  // ── Sequence timing ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('role'),     2200);
    const t2 = setTimeout(() => setPhase('continue'), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Audio glitch SFX + force-mute the executed player's mic ─────────────────
  useEffect(() => {
    if (!executed) return;
    const timer = setTimeout(() => {
      setGlitching(true);
      playGlitchSFX();
      // If the local player is the one being executed, mute their mic via the hook
      if (executed === playerId && window.__agoraMuteSelf) {
        window.__agoraMuteSelf();
      }
      setTimeout(() => setGlitching(false), 1500);
    }, 600);
    return () => clearTimeout(timer);
  }, [executed, playerId]);

  // ── CRITICAL FIX: "No Execution" freeze ─────────────────────────────────────
  // When there is NO execution (tie/skip), the server-synced timer drives nextRound.
  // We also force a 4-second client-side hard cap so the screen NEVER gets stuck.
  useEffect(() => {
    if (executed) return; // has a victim → handled by timer below
    const hardCap = setTimeout(async () => {
      if (!isHost || advancing) return;
      setAdvancing(true);
      try { await nextRound(roomId); }
      catch (e) { toast(e.message, 'error'); setAdvancing(false); }
    }, 4000); // ≤ 4 seconds max
    return () => clearTimeout(hardCap);
  }, [executed, isHost, roomId]); // eslint-disable-line

  // Server-synced timer — drives next-round advance for the host
  async function handleExpire() {
    if (!isHost || advancing) return;
    setAdvancing(true);
    try { await nextRound(roomId); }
    catch (e) { toast(e.message, 'error'); setAdvancing(false); }
  }
  useTimer(gameState, handleExpire);

  const noExec = !executed;

  return (
    <div className="screen noise overflow-hidden">
      {/* ── Premium atmospheric background (day scene = HauntedHouseBg isNight=false) */}
      <HauntedHouseBg isNight={false} />

      {/* ── Crimson overlay for dramatic execution mood ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at center, rgba(160,0,0,0.35) 0%, rgba(3,2,10,0.72) 100%)' }}
      />

      {/* ── Spotlight from above ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: noExec ? 0.04 : 0.1 }}
        transition={{ duration: 1.2 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, white 0%, transparent 70%)',
          filter:     'blur(24px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center gap-8">

        {/* ── Phase Label ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-smoke-500 text-xs uppercase tracking-[0.4em] font-mono">The Verdict</p>
          <h1 className="display text-4xl font-bold mt-1">
            {noExec ? (
              <TypewriterText
                text="No Execution"
                speed={55}
                className="text-gold-300"
                onDone={() => setTitleDone(true)}
              />
            ) : (
              <TypewriterText
                text="Executed"
                speed={70}
                className="text-crimson-400"
                onDone={() => setTitleDone(true)}
              />
            )}
          </h1>
        </motion.div>

        {/* ── No-Execution: brief dramatic wait ────────────────────────────────── */}
        {noExec && (
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ type: 'spring', damping: 14, delay: 0.4 }}
              className="flex flex-col items-center gap-5"
            >
              {/* Balance scale icon with glow */}
              <div
                className="w-28 h-28 rounded-[2rem] flex items-center justify-center"
                style={{
                  background:  'rgba(201,148,58,0.08)',
                  border:      '1px solid rgba(201,148,58,0.25)',
                  boxShadow:   '0 0 40px rgba(201,148,58,0.2)',
                }}
              >
                <motion.span
                  className="text-6xl"
                  animate={{ rotate: [-4, 4, -4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ⚖
                </motion.span>
              </div>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-smoke-300 text-sm max-w-[240px] leading-relaxed font-bold"
              >
                The vote was tied.
                <br />
                <span className="text-gold-400/70">No one faces execution today.</span>
              </motion.p>

              {/* Countdown dots to next round */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="flex gap-1"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gold-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Execution: victim reveal ──────────────────────────────────────────── */}
        {!noExec && victim && (
          <>
            {/* Premium luxury card with glitch overlay */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1,   opacity: 1, y: 0  }}
              transition={{ type: 'spring', damping: 14, delay: 0.3 }}
              className="relative"
              style={{
                background:   'rgba(255,255,255,0.04)',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderRadius: '2rem',
                padding:      '1.5rem',
                boxShadow:    '0 8px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Glitch effect on avatar */}
              <div className="relative">
                <motion.div
                  animate={{
                    filter: phase !== 'reveal' ? 'grayscale(1) brightness(0.35)' : 'grayscale(0) brightness(1)',
                  }}
                  transition={{ duration: 1.6, delay: 0.4 }}
                >
                  <Avatar uid={executed} name={victim.name} avatar={victim.avatar} size="xl" />
                </motion.div>
                <GlitchOverlay active={glitching} />

                {/* ✕ Cross */}
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={phase !== 'reveal' ? { scale: 1, opacity: 1, rotate: 0 } : {}}
                  transition={{ type: 'spring', delay: 0.6 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-4xl text-crimson-500 font-bold drop-shadow-[0_0_12px_rgba(224,32,32,0.8)]">✕</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Victim name — typewriter */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            >
              <p className="display text-2xl font-bold text-white">
                {titleDone ? (
                  <TypewriterText
                    text={victim.name}
                    speed={60}
                    onDone={() => setNameDone(true)}
                  />
                ) : victim.name}
              </p>
            </motion.div>

            {/* Role reveal pill */}
            {meta && (phase === 'role' || phase === 'continue') && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1,   opacity: 1, y: 0  }}
                transition={{ type: 'spring', damping: 12 }}
                className={`rounded-2xl border px-8 py-5 flex flex-col items-center gap-3 ${meta.borderClass}`}
                style={{
                  background:  'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  boxShadow:   `0 0 40px ${meta.glowColor}`,
                }}
              >
                <p className="text-smoke-400 text-xs uppercase tracking-widest font-mono">Was</p>
                <span className="text-4xl drop-shadow-lg">
                  {roleName === 'mafia' ? '⚔' : roleName === 'doctor' ? '✚' : roleName === 'sheikh' ? '◉' : '◯'}
                </span>
                <p className={`display text-2xl font-bold ${meta.textClass}`}>{getRoleLabel(roleName, language)}</p>
              </motion.div>
            )}
          </>
        )}

        {/* Advancing status */}
        {phase === 'continue' && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-smoke-500 text-xs font-mono tracking-widest"
          >
            {isHost ? 'Advancing to next round…' : 'Waiting for host…'}
          </motion.p>
        )}
      </div>
    </div>
  );
}
