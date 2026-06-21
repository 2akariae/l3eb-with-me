// ─── THE MAFIA — LandingScreen.jsx (v11 — cinematic motion overhaul) ──────────
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { signOut, auth as firebaseAuth } from '../../services/firebaseConfig.js';
import { db } from '../../services/firebaseConfig.js';
import { get, ref } from 'firebase/database';
import { createRoom, joinRoom, submitJoinRequest } from '../../games/mafia/hooks/useMafiaEngine.js';
import { useGameStore } from '../../store/gameStore.js';
import { toast, Spinner } from '../ui/index.jsx';
import { useTranslation } from '../../constants/translations.js';
import { GameBackground } from '../game/GameBackground.jsx';
import BackButton from '../ui/BackButton.jsx';
import { User, Camera, ImageIcon } from 'lucide-react';

const TABS = { HOME: 'home', CREATE: 'create', JOIN: 'join' };

// ── Interactive Tilt Title (Advanced) ──────────────────────────────────────────
function TiltTitle({ t, gameType }) {
  const x = useSpring(0, { stiffness: 120, damping: 24 });
  const y = useSpring(0, { stiffness: 120, damping: 24 });
  
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);
  const translateX = useTransform(x, [-0.5, 0.5], [-15, 15]);
  const translateY = useTransform(y, [-0.5, 0.5], [-10, 10]);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  const isSpy = gameType === 'spy';
  const isDetective = gameType === 'detective';

  return (
    <motion.div
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX, rotateY, perspective: 1200, transformStyle: 'preserve-3d' }}
      className="text-center relative py-12 cursor-default"
    >
      <motion.div style={{ x: translateX, y: translateY, transformStyle: 'preserve-3d' }}>
        <motion.h1
          className="display font-black tracking-[0.25em] uppercase select-none aberration"
          style={{
            fontSize: 'clamp(2.5rem, 12vw, 4.5rem)',
            background: isSpy
              ? 'linear-gradient(180deg, #ffffff 0%, #10b981 100%)'
              : isDetective
              ? 'linear-gradient(180deg, #ffffff 0%, #3b82f6 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #c9943a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: isSpy
              ? 'drop-shadow(0 0 50px rgba(16,185,129,0.3))'
              : isDetective
              ? 'drop-shadow(0 0 50px rgba(59,130,246,0.3))'
              : 'drop-shadow(0 0 50px rgba(201,148,58,0.3))',
            transform: 'translateZ(80px)',
          }}
          animate={{ 
            opacity: [0.95, 1, 0.95],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        >
          {isSpy ? t('spyTitle') : isDetective ? 'The Detective' : t('mafiaTitle')}
        </motion.h1>
      </motion.div>
      
      <motion.p 
        className="text-gold-500/60 text-[10px] uppercase tracking-[0.8em] mt-6 font-black bloom"
        style={{ transform: 'translateZ(40px)' }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {t('welcome')}
      </motion.p>
    </motion.div>
  );
}

// ── Photo capture component ────────────────────────────────────────────────────
function PhotoPicker({ photo, onChange, t, language }) {
  function openPicker(capture) {
    const inp = document.createElement('input');
    inp.type    = 'file';
    inp.accept  = 'image/*';
    if (capture) inp.capture = 'user';
    inp.onchange = handleFile;
    inp.click();
  }

  const handleFile = useCallback((e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast(language === 'ar' ? 'الصورة كبيرة جداً (الحد الأقصى 5 ميجابايت)' : 'Image too large (max 5MB)', 'error');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = async () => {
      try {
        if ('decode' in img) await img.decode();
        
        const SIZE   = 160;
        const canvas = document.createElement('canvas');
        canvas.width  = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        
        const src = Math.min(img.width, img.height);
        const sx  = (img.width  - src) / 2;
        const sy  = (img.height - src) / 2;
        
        ctx.drawImage(img, sx, sy, src, src, 0, 0, SIZE, SIZE);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onChange(dataUrl);
      } catch (err) {
        console.error('Image processing failed:', err);
        toast(language === 'ar' ? 'فشل معالجة الصورة' : 'Image processing failed', 'error');
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      console.error('Image loading failed');
      toast(language === 'ar' ? 'فشل تحميل الصورة' : 'Image loading failed', 'error');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [onChange, language]);

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        whileHover={{ scale: 1.05, borderColor: 'rgba(201,148,58,0.5)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openPicker(false)}
        className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 cursor-pointer transition-all duration-500 flex items-center justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-noir-800/30 backdrop-blur-xl"
        style={{
          borderColor: photo ? 'var(--gold-500)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {photo ? (
          <img src={photo} alt="You" className="w-full h-full object-cover" />
        ) : (
          <User size={48} className="text-white opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <span className="text-[8px] font-black uppercase tracking-widest text-white">{t('changePhoto')}</span>
        </div>
      </motion.div>

      <div className="flex gap-4">
        <button
          onClick={() => openPicker(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[9px] font-black tracking-widest glass border border-white/5 text-smoke-400 hover:text-white hover:bg-white/5 transition-all uppercase min-h-[44px]"
        >
          <Camera size={14} />
          {language === 'ar' ? 'كاميرا' : 'Camera'}
        </button>
        <button
          onClick={() => openPicker(false)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[9px] font-black tracking-widest glass border border-white/5 text-smoke-400 hover:text-white hover:bg-white/5 transition-all uppercase min-h-[44px]"
        >
          <ImageIcon size={14} />
          {language === 'ar' ? 'معرض' : 'Gallery'}
        </button>
      </div>
    </div>
  );
}

// ── Main LandingScreen ─────────────────────────────────────────────────────────
export default function LandingScreen({ user, tabPlayerId }) {
  const [tab,      setTab]      = useState(TABS.HOME);
  const { setRoom, language, gameType, resetSession, profile } = useGameStore();
  const [name,     setName]     = useState(profile?.name || user?.displayName || '');
  const [avatar,   setAvatar]   = useState(profile?.avatar || profile?.photo || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading,  setLoading]  = useState(false);

  const t = useTranslation(language);
  const isRTL = language === 'ar';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase().slice(0, 6));
      setTab(TABS.JOIN);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  function saveToProfile(nameVal, avatarVal) {
    try {
      const existing = JSON.parse(localStorage.getItem('mafia_profile') || '{}');
      const updated  = { ...existing, name: nameVal, avatar: avatarVal, photo: avatarVal };
      localStorage.setItem('mafia_profile', JSON.stringify(updated));
    } catch { /* storage blocked */ }
  }

  async function handleCreate() {
    if (!name.trim()) { toast(t('enterName'), 'error'); return; }
    setLoading(true);
    try {
      saveToProfile(name.trim(), avatar);
      const { roomId: rid, playerId: pid } = await createRoom(user, name.trim(), avatar, tabPlayerId, gameType);
      setRoom(rid, true, pid, gameType);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!name.trim())     { toast(t('enterName'), 'error'); return; }
    if (!roomCode.trim()) { toast(t('roomCode'),  'error'); return; }
    setLoading(true);
    const rid = roomCode.trim().toUpperCase();
    try {
      saveToProfile(name.trim(), avatar);
      const bannedSnap = await get(ref(db, `rooms/${rid}/banned/${user.uid}`));
      if (bannedSnap.exists()) {
        await submitJoinRequest(rid, user, name.trim(), avatar, tabPlayerId);
        toast(t('requestSent'), 'success');
        setLoading(false);
        return;
      }
      const { roomId: actualRid, playerId: pid, gameType: joinedGameType } =
        await joinRoom(user, rid, name.trim(), avatar, tabPlayerId);
      setRoom(actualRid, false, pid, joinedGameType);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.19, 1, 0.22, 1],
        staggerChildren: 0.12
      }
    },
    exit: { 
      opacity: 0, y: -30,
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] } }
  };

  return (
    <div className="min-h-[100dvh] bg-noir-950 flex flex-col justify-between overflow-y-auto scroll-smooth p-6">

      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none">
        <GameBackground count={150} />
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        <BackButton onClick={() => resetSession()} />
        <AnimatePresence mode="wait">

          {tab === TABS.HOME && (
            <motion.div key="home" variants={containerVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-sm flex flex-col items-center gap-16 py-10">

              <TiltTitle t={t} gameType={gameType} />

              <div className="w-full flex flex-col gap-6">
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setTab(TABS.JOIN)}
                  className="h-20 rounded-[2.5rem] bg-white text-black font-black text-xl flex items-center justify-center shadow-[0_25px_60px_rgba(255,255,255,0.15)] tracking-tight overflow-hidden relative group">
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {t('joinRoom')}
                </motion.button>
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -4, background: 'rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.97 }}
                  onClick={() => setTab(TABS.CREATE)}
                  className="h-20 rounded-[2.5rem] glass border border-white/10 text-white font-black text-xl flex items-center justify-center tracking-tight shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  {t('createRoom')}
                </motion.button>
              </div>

              <motion.div variants={itemVariants} className="flex gap-10 text-smoke-600 text-[10px] font-black uppercase tracking-[0.4em] opacity-40 bloom">
                <span>4-20 Players</span><span>●</span><span>Voice HD</span>
              </motion.div>
            </motion.div>
          )}

          {(tab === TABS.CREATE || tab === TABS.JOIN) && (
            <motion.div key={tab} variants={containerVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-sm flex flex-col gap-8 py-10">

              <motion.button
                variants={itemVariants}
                onClick={() => setTab(TABS.HOME)}
                className="text-smoke-500 text-[11px] font-black tracking-widest hover:text-white flex items-center gap-4 transition-all min-h-[44px] group"
              >
                <span className="w-6 h-px bg-smoke-700 group-hover:w-10 group-hover:bg-white transition-all" />
                <span>{t('backToHome').toUpperCase()}</span>
              </motion.button>

              <motion.div variants={itemVariants} className="bg-noir-900/60 rounded-[3.5rem] p-10 border border-white/5 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

                <div className="mb-10 text-center">
                  <h3 className="display text-4xl font-black text-white tracking-tight aberration">
                    {tab === TABS.CREATE ? t('createRoom') : t('joinRoom')}
                  </h3>
                </div>

                <div className="flex flex-col gap-8 relative z-10">
                  <PhotoPicker photo={avatar} onChange={setAvatar} t={t} language={language} />

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-smoke-600 uppercase tracking-[0.3em] px-4 bloom">{t('enterName')}</label>
                    <input
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-white font-bold focus:border-gold-500/50 outline-none transition-all shadow-inner text-center text-lg"
                      placeholder="..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={28}
                    />
                  </div>

                  {tab === TABS.JOIN && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-smoke-600 uppercase tracking-[0.3em] px-4 bloom">{t('roomCode')}</label>
                      <input
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-white font-black text-4xl text-center tracking-[0.5em] focus:border-gold-500/50 outline-none transition-all uppercase shadow-inner"
                        placeholder="XXXXXX"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                      />
                    </div>
                  )}

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={tab === TABS.CREATE ? handleCreate : handleJoin}
                    disabled={loading}
                    className="h-20 rounded-[2.5rem] bg-gold-500 text-noir-950 font-black text-xl mt-4 shadow-[0_20px_50px_rgba(201,148,58,0.3)] transition-all hover:bg-gold-400"
                  >
                    {loading
                      ? <Spinner size={28} color="black" />
                      : tab === TABS.CREATE ? t('createRoom') : t('joinRoom')}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
