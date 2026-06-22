import React, { useMemo, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Ghost, Spade, Wifi, Smartphone, Globe, UserCheck, Search } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { useOfflineStore } from '../../store/offlineStore.js';
import { ParallaxStars } from '../game/ParallaxStars.jsx';
import { useTranslation } from '../../constants/translations.js';

function TiltButton({ onClick, children, className, accentColor, mode }) {
  const ref = useRef(null);
  
  // Cyber aesthetic configurations
  const isOnline = mode === 'online';
  const gradient = isOnline 
    ? 'from-cyan-500/20 via-transparent to-purple-600/20'
    : 'from-amber-500/20 via-transparent to-rose-600/20';
  const border = isOnline ? 'border-cyan-500/30' : 'border-amber-500/30';

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      whileHover={{ scale: 1.03, rotateX: 4, rotateY: -4, translateZ: 10 }}
      whileTap={{ scale: 0.98 }}
      style={{ perspective: 1200, transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={`relative w-full rounded-[2rem] overflow-hidden group h-32 bg-zinc-950/90 border ${border} ${className}`}
    >
      {/* Dynamic Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)] animate-pulse" />
      
      <div className="relative z-10 flex items-center gap-6 px-6 h-full">
        {children}
      </div>
    </motion.button>
  );
}

export default function ModeSelectScreen({ onOnline, onOffline, onBack }) {
  const { language, gameType, resetSession } = useGameStore();
  const t        = useTranslation(language);
  const isAr     = language === 'ar';
  const isSpy    = gameType === 'spy';
  const isDetective = gameType === 'detective';

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, duration: 0.8 } }
  };
  
  const item = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    show: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } }
  };

  return (
    <div className="screen bg-noir-950 flex items-center justify-center overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 pointer-events-none">
        <ParallaxStars count={120} />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px]"
          style={{ 
            background: isSpy 
              ? 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' 
              : isDetective
              ? 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(140,40,250,0.08) 0%, transparent 70%)' 
          }} 
        />
      </div>

      <motion.button
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}
        onClick={onBack}
        className="absolute top-10 left-10 z-20 flex items-center gap-4 px-6 py-3 rounded-2xl glass border border-white/10 text-smoke-400 text-[11px] font-black tracking-widest hover:text-white transition-all uppercase group"
      >
        <ArrowLeft size={16} className={`transition-transform group-hover:-translate-x-1 ${isAr ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
        <span>{t('back').toUpperCase()}</span>
      </motion.button>

      <motion.div 
        className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center gap-14"
        variants={container} initial="hidden" animate="show"
      >
        <motion.div variants={item} className="text-center">
          <motion.div 
            className="mb-8 flex items-center justify-center select-none"
            animate={{ 
              y: [0, -15, 0],
              filter: isSpy 
                ? 'drop-shadow(0 0 30px rgba(16,185,129,0.4))'
                : isDetective
                ? 'drop-shadow(0 0 30px rgba(59,130,246,0.4))'
                : 'drop-shadow(0 0 30px rgba(140,40,250,0.4))'
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            {isSpy
              ? <Globe size={80} strokeWidth={1.2} className="text-emerald-400/80" />
              : isDetective
              ? <Search size={80} strokeWidth={1.2} className="text-blue-400/80" />
              : <UserCheck size={80} strokeWidth={1.2} className="text-violet-400/80" />
            }
          </motion.div>
          
          <h1 className="display text-5xl font-black tracking-[0.2em] uppercase aberration"
            style={{ 
              background: isSpy 
                ? 'linear-gradient(180deg, #fff 0%, #10b981 100%)' 
                : isDetective 
                ? 'linear-gradient(180deg, #fff 0%, #3b82f6 100%)'
                : 'linear-gradient(180deg, #fff 0%, #c9943a 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            {isSpy ? t('spyTitle') : isDetective ? 'The Detective' : t('mafiaTitle')}
          </h1>
          <p className="text-gold-500/60 text-[10px] tracking-[0.6em] mt-4 uppercase font-black bloom">
            {t('selectMode')}
          </p>
        </motion.div>

        <div className="w-full flex flex-col gap-6">
          <motion.div variants={item}>
            <TiltButton onClick={onOnline} mode="online">
              <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 bg-blue-500/10 border border-blue-500/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <Wifi size={32} strokeWidth={1.5} className="text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-black text-2xl tracking-tight">{t('onlineMode')}</p>
                <p className="text-smoke-400 text-xs mt-1 font-bold opacity-60 uppercase tracking-tighter">{t('multiDevice')}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_blue]" />
                  <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">{t('recommended')}</p>
                </div>
              </div>
            </TiltButton>
          </motion.div>

          <motion.div variants={item}>
            <TiltButton onClick={onOffline} mode="offline">
              <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 bg-gold-500/10 border border-gold-500/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <Smartphone size={32} strokeWidth={1.5} className="text-gold-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-black text-2xl tracking-tight">{t('offlineMode')}</p>
                <p className="text-smoke-400 text-xs mt-1 font-bold opacity-60 uppercase tracking-tighter">{t('oneDevice')}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse shadow-[0_0_8px_gold]" />
                  <p className="text-gold-400 text-[9px] font-black uppercase tracking-[0.2em]">{t('inPerson')}</p>
                </div>
              </div>
            </TiltButton>
          </motion.div>
        </div>

        <motion.p variants={item} className="text-smoke-600 text-[9px] font-black tracking-[0.2em] text-center opacity-40 px-8 uppercase leading-loose bloom">
          {t('modeInstruction')}
        </motion.p>
      </motion.div>
    </div>
  );
}
