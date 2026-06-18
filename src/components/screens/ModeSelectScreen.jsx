import React, { useMemo, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Ghost, Spade, Wifi, Smartphone } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { useOfflineStore } from '../../store/offlineStore.js';
import { ParallaxStars } from '../game/ParallaxStars.jsx';
import { useTranslation } from '../../constants/translations.js';

function useStars(n) {
  return useMemo(() => Array.from({ length: n }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    size: Math.random() < 0.08 ? 3 : Math.random() < 0.25 ? 2 : 1,
    dur: 2 + Math.random() * 4, delay: Math.random() * 6, bright: Math.random() < 0.05,
  })), []);
}

function TiltButton({ onClick, children, className, gradient, border }) {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 150, damping: 20 });
  const y = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

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
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      style={{ rotateX, rotateY, perspective: 1000 }}
      className={`relative w-full rounded-[2rem] overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-100 opacity-80"
        style={{ background: gradient, border: `1.5px solid ${border}` }} />
      
      {/* Shimmer */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: 'linear-gradient(135deg,transparent 30%,rgba(255,255,255,0.4) 50%,transparent 70%)' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
      />

      <div className="relative z-10 flex items-center gap-6 px-8 h-full">
        {children}
      </div>
    </motion.button>
  );
}

export default function ModeSelectScreen({ onOnline, onOffline, onBack }) {
  const stars    = useStars(120);
  const { language, gameType } = useGameStore();
  const t        = useTranslation(language);
  const isAr     = language === 'ar';
  const isSpy    = gameType === 'spy';

  const c = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
  const item = { hidden: { y: 30, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <div className="screen bg-noir-950 flex items-center justify-center overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Starfield */}
      <div className="absolute inset-0 pointer-events-none">
        <ParallaxStars count={100} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: isSpy ? 'radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)' : 'radial-gradient(ellipse, rgba(100,30,200,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
        onClick={onBack}
        className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl glass border border-white/10 text-smoke-400 text-[10px] font-black tracking-widest hover:text-white transition-all uppercase"
      >
        <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
        {isAr ? 'العودة' : 'BACK'}
      </motion.button>

      <motion.div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center gap-10"
        variants={c} initial="hidden" animate="show">

        {/* Logo Section */}
        <motion.div variants={item} className="text-center">
          <motion.div 
            className="mb-6 flex items-center justify-center select-none cursor-default"
            animate={{ 
              y: [0, -12, 0], 
              rotate: [0, 8, -8, 0],
              filter: isSpy 
                ? ['drop-shadow(0 0 10px rgba(16,185,129,0.3))', 'drop-shadow(0 0 30px rgba(16,185,129,0.6))', 'drop-shadow(0 0 10px rgba(16,185,129,0.3))']
                : ['drop-shadow(0 0 10px rgba(124,58,237,0.3))', 'drop-shadow(0 0 30px rgba(124,58,237,0.6))', 'drop-shadow(0 0 10px rgba(124,58,237,0.3))']
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            {isSpy
              ? <Ghost size={72} strokeWidth={1.5} className="text-emerald-400" />
              : <Spade size={72} strokeWidth={1.5} className="text-violet-400" />
            }
          </motion.div>
          <h1 className="text-5xl font-black tracking-[0.2em] uppercase"
            style={{ 
              fontFamily: 'Playfair Display, serif', 
              background: isSpy ? 'linear-gradient(180deg, #fff 0%, #10b981 100%)' : 'linear-gradient(180deg, #fff 0%, #c9943a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: isSpy ? 'drop-shadow(0 0 20px rgba(16,185,129,0.3))' : 'drop-shadow(0 0 20px rgba(201,148,58,0.3))'
            }}>
            {isSpy ? t('spyTitle') : t('mafiaTitle')}
          </h1>
          <p className="text-smoke-500 text-[10px] tracking-[0.5em] mt-4 uppercase font-black opacity-60">
            {isSpy ? t('spyDesc') : t('mafiaDesc')}
          </p>
        </motion.div>

        <motion.div variants={item} className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        {/* Buttons Grid */}
        <motion.div variants={item} className="w-full flex flex-col gap-5">
          {/* Online Mode */}
          <TiltButton 
            onClick={onOnline} 
            className="h-32"
            gradient="linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(124,58,237,0.1) 100%)"
            border="rgba(124,58,237,0.3)"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Wifi size={30} strokeWidth={1.75} className="text-blue-400" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-black text-xl tracking-tight">{t('onlineMode')}</p>
              <p className="text-smoke-400 text-xs mt-1 font-medium">{t('multiDevice')}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest">{t('recommended')}</p>
              </div>
            </div>
          </TiltButton>

          {/* Offline Mode */}
          <TiltButton 
            onClick={onOffline} 
            className="h-32"
            gradient="linear-gradient(135deg, rgba(201,148,58,0.08) 0%, rgba(120,60,180,0.08) 100%)"
            border="rgba(201,148,58,0.3)"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: 'rgba(201,148,58,0.15)', border: '1px solid rgba(201,148,58,0.3)' }}>
              <Smartphone size={30} strokeWidth={1.75} className="text-gold-400" />
            </div>
            <div className="text-left flex-1">
              <p className="text-white font-black text-xl tracking-tight">{t('offlineMode')}</p>
              <p className="text-smoke-400 text-xs mt-1 font-medium">{t('oneDevice')}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                <p className="text-gold-400 text-[9px] font-black uppercase tracking-widest">{t('noInternet')}</p>
              </div>
            </div>
          </TiltButton>
        </motion.div>

        <motion.p variants={item} className="text-smoke-600 text-[10px] font-medium tracking-wide text-center opacity-40 px-6 uppercase leading-relaxed">
          {isAr ? 'هذا الوضع مخصص للعب وجهاً لوجه باستخدام جهاز واحد يتم تمريره بين اللاعبين.' : 'THIS MODE IS DESIGNED FOR IN-PERSON PLAY USING A SINGLE DEVICE PASSED BETWEEN PLAYERS.'}
        </motion.p>
      </motion.div>
    </div>
  );
}
