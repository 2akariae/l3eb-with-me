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

      <div className="flex w-full flex-col items-center justify-center min-h-[60vh] overflow-hidden">
        
        {/* The strict anchor frame */}
        <div className="relative w-[280px] h-[400px] flex-shrink-0 [perspective:1000px]">
          
          <motion.div
            className="w-full h-full relative [transform-style:preserve-3d]"
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          >
            
            {/* 1. FRONT FACE */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
              {/* Inner Box with Flex Centering */}
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b071a] border-[2px] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-3xl p-6">
                
                {/* Top Icon */}
                <div className="text-cyan-400 mb-6">
                  <HelpCircle size={48} />
                </div>
                
                <p className="text-cyan-400 text-xl font-bold tracking-wider">{t('tapToDecrypt')}</p>
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
                    {isSpy ? t('theSpy').toUpperCase() : t('citizen').toUpperCase()}
                  </h2>
                  <p className="text-blue-400 text-xl font-medium">{isSpy ? t('spyRoleDesc') : displayWord}</p>
                </div>

                {/* Bottom Content: The NEXT Button STRICTLY INSIDE the card */}
                <button 
                  onClick={() => setRevealed(false)}
                  className="w-full py-3 mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-medium"
                >
                  {t('tapToDecrypt')}
                </button>
                
              </div>
            </div>

          </motion.div>
        </div>
      </div>
      
      <p className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.2em] font-mono text-center">
        {revealed ? t('maintainSilence') : t('tapToDecrypt')}
      </p>
    </div>
  );
}
