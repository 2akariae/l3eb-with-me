import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { TimerRing, PremiumCard } from '../../../components/ui/index.jsx';
import { useTimer } from '../../../hooks/useTimer.js';
import { Ghost, Shield, HelpCircle, Terminal } from 'lucide-react';
import { useTranslation } from '../../../constants/translations.js';
import BackButton from '../../../components/ui/BackButton.jsx';
import { SpyParallaxBackground } from './SpyParallaxBackground.jsx';

function GlitchText({ text, className }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <motion.span className="absolute inset-0 text-emerald-500 z-0 opacity-50"
        animate={{ x: [-2, 2, -2], opacity: [0.5, 0.8, 0.5] }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}>{text}</motion.span>
      <motion.span className="absolute inset-0 text-blue-500 z-0 opacity-50"
        animate={{ x: [2, -2, 2], opacity: [0.5, 0.8, 0.5] }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}>{text}</motion.span>
    </div>
  );
}

export default function SpyRevealScreen({ user, onExpire }) {
  const { myRole, gameState, language } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const t    = useTranslation(language);
  const { remaining } = useTimer(gameState, onExpire);

  const isSpy = myRole === 'spy';
  const displayWord = typeof gameState?.word === 'object' ? (gameState?.word?.[language] ?? gameState?.word?.en ?? '') : (gameState?.word ?? '');
  const displayHint = typeof gameState?.hint === 'object' ? (gameState?.hint?.[language] ?? gameState?.hint?.en ?? '') : (gameState?.hint ?? '');

  const { clearRoom } = useGameStore();

  return (
    <div className="screen overflow-hidden flex flex-col items-center justify-center p-6 gap-6">
      <SpyParallaxBackground />
      <BackButton onClick={clearRoom} />

      <div className="absolute top-8 right-8 z-20">
        <TimerRing remaining={remaining} total={10} size={60} color={isSpy ? '#10b981' : '#3b82f6'} />
      </div>

      {/* Stable 3D Flip Container */}
      <div 
        className="w-[300px] h-[450px] [perspective:1000px] cursor-pointer"
        onClick={() => setRevealed(!revealed)}
      >
        <motion.div 
          className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-700"
          animate={{ rotateY: revealed ? 180 : 0 }}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
            <PremiumCard mode="online" role={isSpy ? 'spy' : 'citizen'} className="w-full h-full flex flex-col items-center justify-center p-8 gap-6">
              <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center animate-pulse">
                <HelpCircle size={40} className="text-white" />
              </div>
              <p className="text-white text-xs font-black uppercase tracking-[0.3em]">{t('tapToDecrypt')}</p>
            </PremiumCard>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <PremiumCard mode="online" role={isSpy ? 'spy' : 'citizen'} className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-6">
              <div className="p-4 rounded-3xl bg-black/40 border border-white/10">
                {isSpy ? <Ghost size={48} className="text-cyan-400" /> : <Shield size={48} className="text-rose-400" />}
              </div>

              <div className="w-full">
                <h3 className="text-2xl font-black text-white uppercase tracking-widest text-center">
                  {isSpy ? t('theSpy').toUpperCase() : t('citizen').toUpperCase()}
                </h3>
                <div className="h-px w-16 bg-white/20 mx-auto mt-4 mb-4" />

                {isSpy ? (
                  <div className="space-y-4">
                    <p className="text-white text-sm font-bold leading-relaxed px-2">
                      {t('spyRoleDesc')}
                    </p>
                    {displayHint && (
                      <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30">
                        <p className="text-[10px] text-cyan-400 uppercase font-black tracking-widest mb-1">{t('wordHint')}</p>
                        <p className="text-white font-bold text-sm">{displayHint}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{t('secretWordIs').toUpperCase()}:</p>
                    <p className="text-white text-2xl font-black tracking-wider uppercase">{displayWord}</p>
                    {displayHint && (
                      <p className="text-[10px] text-rose-400 uppercase font-black tracking-widest">
                        {t('wordHint').toUpperCase()}: {displayHint}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </PremiumCard>
          </div>
        </motion.div>
      </div>

      <p className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.2em] font-mono text-center">
        {revealed ? t('maintainSilence') : t('tapToDecrypt')}
      </p>
    </div>
  );
}
