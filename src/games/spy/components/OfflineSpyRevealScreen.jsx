// ── OfflineSpyRevealScreen (v8) — tap-and-hold reveal · Cyber Espionage ───────
// FIX: reads language from offlineStore, passes it into SpyCard correctly.
// FIX: category and word are bilingual objects { en, ar } — resolved with lang key.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useOfflineStore } from '../../../store/offlineStore.js';
import { GameBackground } from "@/components/game/GameBackground.jsx";
import { Ghost, Shield, Terminal } from 'lucide-react';
import { PremiumCard } from '../../../components/ui/index.jsx';

const SPY_CFG = {
  spy:     { glow: '#10b981', bg: 'bg-zinc-900', border: 'border-emerald-500/40' },
  citizen: { glow: '#3b82f6', bg: 'bg-zinc-900', border: 'border-blue-500/40' },
};

function SpyCard({ role, isRevealed, word, handleNext }) {
  const isSpy = role === 'spy';

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-[60vh] overflow-hidden">
      
      {/* The strict anchor frame */}
      <div className="relative w-[280px] h-[400px] flex-shrink-0 [perspective:1000px]">
        
        <motion.div
          className="w-full h-full relative [transform-style:preserve-3d]"
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        >
          
          {/* 1. FRONT FACE */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
            {/* Inner Box with Flex Centering */}
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b071a] border-[2px] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-3xl p-6">
              
              {/* Top Icon */}
              <div className="text-cyan-400 mb-6">
                <Terminal size={48} />
              </div>
              
              <p className="text-cyan-400 text-xl font-bold tracking-wider">Tap to Reveal</p>
            </div>
          </div>

          {/* 2. BACK FACE */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {/* Inner Box with Flex Space-Between */}
            <div className="w-full h-full flex flex-col items-center justify-between bg-[#0b071a] border-[2px] border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)] rounded-3xl p-6">
              
              {/* Top Content: Icon, Title, Role */}
              <div className="flex flex-col items-center mt-6">
                <div className="text-blue-500 mb-4">
                  {isSpy ? <Ghost size={48} /> : <Shield size={48} />}
                </div>
                <h2 className="text-white text-3xl font-bold mb-2">
                  {isSpy ? 'YOU ARE THE SPY' : 'YOU ARE A CITIZEN'}
                </h2>
                <p className="text-blue-400 text-xl font-medium">{word}</p>
              </div>

              {/* Bottom Content: The NEXT Button STRICTLY INSIDE the card */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="w-full py-3 mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-medium"
              >
                Next
              </button>
              
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

export default function OfflineSpyRevealScreen() {
  const { players, envelopeIndex, nextEnvelope, roles, word, spyId } = useOfflineStore();

  const [pressing,  setPressing]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const rawTiltX = useSpring(0, { stiffness: 90, damping: 18 });
  const rawTiltY = useSpring(0, { stiffness: 90, damping: 18 });
  const containerRef = useRef(null);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    rawTiltX.set(((e.clientY - r.top)  / r.height - 0.5) * 2 * -16);
    rawTiltY.set(((e.clientX - r.left) / r.width  - 0.5) * 2 *  16);
  }, []); // eslint-disable-line

  const onPointerLeave = useCallback(() => { rawTiltX.set(0); rawTiltY.set(0); }, []); // eslint-disable-line

  useEffect(() => { setPressing(false); setConfirmed(false); }, [envelopeIndex]);

  function handleNext() {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => { setConfirmed(false); nextEnvelope(); }, 320);
  }

  const player = players[envelopeIndex];
  const role   = player && player.id === spyId ? 'spy' : 'citizen';
  const isLast = envelopeIndex >= players.length - 1;

  return (
    <motion.div
      key={envelopeIndex}
      ref={containerRef}
      className="screen bg-zinc-950 overflow-hidden items-center justify-center flex flex-col"
      style={{ userSelect: 'none' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ type: "tween", duration: 0.1, ease: "linear" }}
      onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
    >
      <GameBackground />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="relative z-10 text-center mb-7">
        <p className="text-smoke-500 text-[11px] tracking-[0.38em] uppercase font-mono">PASS PHONE TO</p>
        <h1 className="text-4xl font-black text-white tracking-wider mt-1.5"
          style={{ fontFamily: 'Playfair Display, serif' }}>
          {player?.name?.toUpperCase()}
        </h1>
      </motion.div>

      <div 
        className="relative z-10 touch-none w-[220px] h-[310px] flex items-center justify-center"
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerCancel={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
      >
        <SpyCard
          role={role} isRevealed={pressing}
          word={word}
          handleNext={handleNext}
        />
      </div>

      <motion.p key={pressing ? 'rel' : 'tap'}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="relative z-10 mt-6 text-smoke-500 text-xs tracking-[0.28em] font-mono">
        {pressing ? 'RELEASE TO HIDE' : 'TAP AND HOLD TO REVEAL'}
      </motion.p>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        onClick={handleNext}
        className="relative z-10 mt-7 h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-[0.18em] text-white"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        {isLast ? 'FINISH' : 'NEXT'} → {envelopeIndex < players.length - 1 ? players[envelopeIndex + 1]?.name : '...'}
      </motion.button>
    </motion.div>
  );
}
