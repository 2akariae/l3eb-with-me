import React, { useMemo, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Ghost, Spade, Wifi, Smartphone, Globe, UserCheck, Search } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { useOfflineStore } from '../../store/offlineStore.js';
import { ParallaxStars } from '../game/ParallaxStars.jsx';
import { useTranslation } from '../../constants/translations.js';

function TiltButton({ onClick, children, className, accentColor }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 120, damping: 24 });
  const y = useSpring(0, { stiffness: 120, damping: 24 });
  
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);
  const glowX = useTransform(x, [-0.5, 0.5], ['20%', '80%']);
  const glowY = useTransform(y, [-0.5, 0.5], ['20%', '80%']);

  const onMove = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }, [x, y]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      style={{ rotateX, rotateY, perspective: 1200, transformStyle: 'preserve-3d' }}
      className={`relative w-full rounded-[2.5rem] overflow-hidden group h-36 ${className}`}
    >
      <div className="absolute inset-0 bg-noir-900/40 backdrop-blur-2xl border border-white/5 group-hover:border-white/10 transition-colors" />
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
        style={{ 
          background: `radial-gradient(circle at ${glowX} ${glowY}, ${accentColor}, transparent 70%)` 
        }}
      />
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center gap-8 px-8 h-full" style={{ transform: 'translateZ(40px)' }}>
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
            <TiltButton onClick={onOnline} accentColor="#3b82f6">
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
            <TiltButton onClick={onOffline} accentColor="#e8c060">
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
