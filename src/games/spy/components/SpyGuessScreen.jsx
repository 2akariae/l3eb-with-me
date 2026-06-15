// ─── THE SPY — SpyGuessScreen.jsx (v10-fixed) ────────────────────────────────
// BUG FIXED (P0): useGameStore() was called inside a conditional branch:
//
//   if (!isSpy) {
//     const { clearRoom } = useGameStore();   // ← ILLEGAL: hook in conditional
//     return (...);
//   }
//
//   React's "Rules of Hooks" mandate that hooks are never called conditionally.
//   This caused "React has detected a change in the order of Hooks called by
//   SpyGuessScreen" on every render for non-spy players — crashing the game-over
//   screen for the entire citizen team in every Spy game.
//
//   Fix: clearRoom moved into the unconditional useGameStore() destructure at
//   the top of the component.
//
// UX FIX: Removed BackButton from the citizens' waiting view. Citizens seeing
//   this screen should not be able to abandon the room while the spy is guessing
//   — doing so cleared their room state and stranded them. The game concludes
//   automatically when the spy submits or the timer expires.

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import {
  submitSpyGuess,
  expireSpyGuess,
} from '../../../services/gameEngine.js';
import { TimerRing, toast } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Ghost, ShieldAlert, Terminal, Send } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';

// Scanline / terminal effect
function ScanLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
      }}
    />
  );
}

export default function SpyGuessScreen({ user, playerId }) {
  // FIX (P0): clearRoom is now destructured unconditionally at the top level,
  // instead of inside the `if (!isSpy)` branch where it caused a hook violation.
  const { roomId, isHost, myRole, gameState, language, players, clearRoom } = useGameStore();

  const [guess,   setGuess]   = useState('');
  const [sending, setSending] = useState(false);
  const [cursor,  setCursor]  = useState(true);
  const inputRef = useRef(null);

  const t    = useTranslation(language);
  const isAr = language === 'ar';
  const isSpy = myRole === 'spy';

  const { remaining } = useTimer(gameState, async () => {
    if (isHost) await expireSpyGuess(roomId);
  });

  // Blinking cursor effect
  useEffect(() => {
    const id = setInterval(() => setCursor((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Auto-focus input on mount for the spy
  useEffect(() => {
    if (isSpy) setTimeout(() => inputRef.current?.focus(), 600);
  }, [isSpy]);

  const handleSubmit = async () => {
    if (!guess.trim() || sending) return;
    setSending(true);
    try {
      await submitSpyGuess(roomId, guess.trim());
    } catch (e) {
      toast(e.message, 'error');
      setSending(false);
    }
  };

  const votedOutId = gameState?.votedOutId;
  const votedName  = votedOutId ? (players[votedOutId]?.name ?? '???') : '???';

  // Resolve bilingual word hint shown to Spy
  const rawHint  = gameState?.hint;
  const displayHint  = typeof rawHint === 'object'
    ? (rawHint?.[language] ?? rawHint?.en ?? '')
    : (rawHint ?? '');

  // ── Citizens waiting view ──────────────────────────────────────────────────
  // FIX (UX): BackButton removed — citizens must not be able to leave the room
  // while the spy's guess timer is active. The screen auto-advances when the
  // game result is written to Firebase.
  if (!isSpy) {
    return (
      <div
        className="screen bg-noir-950 flex flex-col items-center justify-center p-8 text-center"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <ScanLines />

        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-8 mx-auto"
        >
          <ShieldAlert size={48} className="text-emerald-500" />
        </motion.div>

        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">
          {isAr ? 'الجاسوس يخمّن...' : 'The Spy Is Guessing...'}
        </h1>
        <p className="text-smoke-500 text-sm mb-6">
          {isAr
            ? `${votedName} لديه فرصة أخيرة لتخمين الكلمة السرية`
            : `${votedName} has one last chance to guess the secret word`}
        </p>

        <div className="mt-4">
          <TimerRing remaining={remaining} total={60} size={80} color="#10b981" strokeWidth={4} />
        </div>

        <motion.p
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.3em] mt-10 font-mono"
        >
          {isAr ? 'بانتظار الجاسوس...' : 'Awaiting transmission...'}
        </motion.p>
      </div>
    );
  }

  // ── Spy guess view ─────────────────────────────────────────────────────────
  return (
    <div
      className="screen flex flex-col overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(170deg, #020c08 0%, #000 100%)' }}
    >
      <ScanLines />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 pt-safe pt-8 pb-6 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] font-mono">
              {isAr ? 'المحطة الأخيرة' : 'FINAL TRANSMISSION'}
            </span>
          </div>
          <TimerRing remaining={remaining} total={60} size={50} color="#10b981" strokeWidth={3} />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.25)]"
        >
          <Ghost size={40} className="text-emerald-400" />
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 justify-center gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-tight mb-2">
            {isAr ? 'خمّن الكلمة السرية' : 'GUESS THE SECRET WORD'}
          </h1>
          <p className="text-smoke-500 text-xs leading-relaxed">
            {isAr
              ? 'تخمين واحد فقط. إذا أصبت، فزت. إذا أخطأت، المواطنون يفوزون.'
              : 'One guess only. Get it right and you win. Miss it and the Citizens take the game.'}
          </p>
        </motion.div>

        {/* Category hint */}
        {displayHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
          >
            <Terminal size={16} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 mb-0.5">
                {t('wordHint')}
              </p>
              <p className="text-white font-bold text-sm">{displayHint}</p>
            </div>
          </motion.div>
        )}

        {/* Terminal input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          {/* Terminal chrome */}
          <div className="px-4 py-2 rounded-t-2xl bg-white/5 border border-white/10 border-b-0 flex items-center gap-2">
            <div className="flex gap-1.5">
              {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.6 }} />
              ))}
            </div>
            <span className="text-smoke-600 text-[10px] font-mono ml-2">spy@terminal ~ $</span>
          </div>

          <div className="flex items-center bg-black/60 border border-white/10 border-t-0 rounded-b-2xl px-5 py-4 gap-3">
            <span className="text-emerald-500 font-mono text-sm shrink-0">{'>'}</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-white font-mono text-base outline-none placeholder-smoke-700 uppercase"
              placeholder={isAr ? 'اكتب تخمينك...' : 'TYPE YOUR GUESS...'}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={sending}
              maxLength={40}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="text-emerald-500 font-mono" style={{ opacity: cursor ? 1 : 0 }}>█</span>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!guess.trim() || sending}
          className="w-full h-16 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
          style={
            guess.trim() && !sending
              ? {
                  background:  'linear-gradient(135deg, #059669, #10b981)',
                  boxShadow:   '0 0 40px rgba(16,185,129,0.4)',
                  color:       '#fff',
                }
              : {
                  background: 'rgba(255,255,255,0.05)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                  color:      'rgba(255,255,255,0.25)',
                }
          }
        >
          {sending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
            />
          ) : (
            <>
              <Send size={18} />
              {isAr ? 'إرسال التخمين' : 'TRANSMIT GUESS'}
            </>
          )}
        </motion.button>
      </div>

      <div className="relative z-10 px-6 pb-8 text-center">
        <p className="text-smoke-700 text-[9px] font-mono uppercase tracking-[0.3em]">
          {isAr ? 'هذه الشاشة تظهر للجاسوس فقط' : 'THIS SCREEN IS VISIBLE TO THE SPY ONLY'}
        </p>
      </div>
    </div>
  );
}
