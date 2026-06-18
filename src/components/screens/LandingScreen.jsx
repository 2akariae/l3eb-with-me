// ─── THE MAFIA — LandingScreen.jsx (v10-fixed) ────────────────────────────────
// BUG FIXED (P3 × 3): PhotoPicker component used emoji characters as interactive
//   UI elements — '👤' as a photo placeholder, '📷' and '🖼' as button labels.
//   Replaced with Lucide vector icons (User, Camera, ImageIcon) per the
//   Anti-Emoji Policy.

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { signOut, auth as firebaseAuth } from '../../services/firebaseConfig.js';
import { db } from '../../services/firebaseConfig.js';
import { get, ref } from 'firebase/database';
import { createRoom, joinRoom, submitJoinRequest } from '../../games/mafia/hooks/useMafiaEngine.js';
import { useGameStore } from '../../store/gameStore.js';
import { toast, Spinner } from '../ui/index.jsx';
import { useTranslation } from '../../constants/translations.js';
import { ParallaxStars } from '../game/ParallaxStars.jsx';
import BackButton from '../ui/BackButton.jsx';
// FIX (P3): Lucide icons replace emoji in PhotoPicker
import { User, Camera, ImageIcon } from 'lucide-react';

const TABS = { HOME: 'home', CREATE: 'create', JOIN: 'join' };

// ── Interactive Tilt Title ────────────────────────────────────────────────────
function TiltTitle({ t, gameType }) {
  const x = useSpring(0, { stiffness: 100, damping: 30 });
  const y = useSpring(0, { stiffness: 100, damping: 30 });
  const rotateX = useTransform(y, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-15, 15]);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  const isSpy = gameType === 'spy';

  return (
    <motion.div
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX, rotateY, perspective: 1000, transformStyle: 'preserve-3d' }}
      className="text-center relative py-10 cursor-default"
    >
      <motion.h1
        className="display font-black tracking-[0.2em] uppercase select-none"
        style={{
          fontSize: 'clamp(2.2rem, 10vw, 4rem)',
          background: isSpy
            ? 'linear-gradient(180deg, #ffffff 0%, #10b981 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #c9943a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: isSpy
            ? 'drop-shadow(0 0 40px rgba(16,185,129,0.25))'
            : 'drop-shadow(0 0 40px rgba(201,148,58,0.25))',
          transform: 'translateZ(50px)',
        }}
        animate={{ 
          opacity: [0.9, 1, 0.9],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      >
        {isSpy ? t('spyTitle') : t('mafiaTitle')}
      </motion.h1>
      <p className="text-gold-500/50 text-[10px] uppercase tracking-[0.6em] mt-4 font-black"
        style={{ transform: 'translateZ(30px)' }}>
        {t('welcome')}
      </p>
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

    // SECURITY / PERF: Limit initial file size to 5MB to prevent mobile crashes
    if (file.size > 5 * 1024 * 1024) {
      toast(language === 'ar' ? 'الصورة كبيرة جداً (الحد الأقصى 5 ميجابايت)' : 'Image too large (max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast(language === 'ar' ? 'فشل قراءة الملف' : 'Failed to read file', 'error');
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => toast(language === 'ar' ? 'فشل تحميل الصورة' : 'Failed to load image', 'error');
      img.onload = () => {
        const SIZE   = 160;
        const canvas = document.createElement('canvas');
        canvas.width  = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const src = Math.min(img.width, img.height);
        const sx  = (img.width  - src) / 2;
        const sy  = (img.height - src) / 2;
        ctx.drawImage(img, sx, sy, src, src, 0, 0, SIZE, SIZE);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          onChange(dataUrl);
        } catch (err) {
          toast(language === 'ar' ? 'فشل معالجة الصورة' : 'Failed to process image', 'error');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [onChange, language]);

  const isAr = language === 'ar';

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={() => openPicker(false)}
        className="w-28 h-28 rounded-[2rem] overflow-hidden border-2 cursor-pointer transition-all duration-300 flex items-center justify-center relative shadow-2xl"
        style={{
          borderColor: photo ? 'rgba(201,148,58,0.8)' : 'rgba(255,255,255,0.1)',
          background:  photo ? 'transparent' : 'rgba(255,255,255,0.03)',
        }}
      >
        {photo ? (
          <img src={photo} alt="You" className="w-full h-full object-cover" />
        ) : (
          // FIX (P3): replaced '👤' emoji with Lucide User icon
          <div className="flex flex-col items-center gap-1 text-smoke-600">
            <User size={40} className="opacity-40" />
          </div>
        )}
      </motion.div>

      <div className="flex gap-3">
        {/* FIX (P3): replaced '📷' emoji with Lucide Camera icon */}
        <button
          onClick={() => openPicker(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest glass border border-white/5 text-smoke-400 hover:text-white transition-all uppercase min-h-[44px]"
        >
          <Camera size={12} />
          {isAr ? 'كاميرا' : 'Camera'}
        </button>
        {/* FIX (P3): replaced '🖼' emoji with Lucide ImageIcon */}
        <button
          onClick={() => openPicker(false)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest glass border border-white/5 text-smoke-400 hover:text-white transition-all uppercase min-h-[44px]"
        >
          <ImageIcon size={12} />
          {isAr ? 'معرض' : 'Gallery'}
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase().slice(0, 6));
      setTab(TABS.JOIN);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Persist name + avatar to profile so next visit pre-populates the fields
  function saveToProfile(nameVal, avatarVal) {
    try {
      const existing = JSON.parse(localStorage.getItem('mafia_profile') || '{}');
      const updated  = { ...existing, name: nameVal, avatar: avatarVal, photo: avatarVal };
      localStorage.setItem('mafia_profile', JSON.stringify(updated));
    } catch { /* storage blocked — non-fatal */ }
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

  const slide = {
    enter:  { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit:   { opacity: 0, y: -20 },
  };

  return (
    <div className="screen bg-noir-950 overflow-hidden items-center justify-center">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <ParallaxStars count={100} />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-40"
          style={{
            background: gameType === 'spy'
              ? 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(80,40,160,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <BackButton onClick={() => resetSession()} />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">

          {tab === TABS.HOME && (
            <motion.div key="home" variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', damping: 25 }} className="w-full max-w-sm flex flex-col items-center gap-14">

              <TiltTitle t={t} gameType={gameType} />

              <div className="w-full flex flex-col gap-5">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setTab(TABS.JOIN)}
                  className="h-20 rounded-[2rem] bg-white text-black font-black text-xl flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.12)] tracking-tight">
                  {t('joinRoom')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setTab(TABS.CREATE)}
                  className="h-20 rounded-[2rem] glass border border-white/10 text-white font-black text-xl flex items-center justify-center tracking-tight shadow-2xl">
                  {t('createRoom')}
                </motion.button>
              </div>

              <div className="flex gap-8 text-smoke-600 text-[9px] font-black uppercase tracking-[0.3em] opacity-50">
                <span>4-20 Players</span><span>●</span><span>Voice Enabled</span>
              </div>
            </motion.div>
          )}

          {(tab === TABS.CREATE || tab === TABS.JOIN) && (
            <motion.div key={tab} variants={slide} initial="enter" animate="center" exit="exit"
              className="w-full max-w-sm flex flex-col gap-6">

              <button
                onClick={() => setTab(TABS.HOME)}
                className="text-smoke-500 text-[10px] font-black tracking-widest hover:text-white flex items-center gap-3 transition-all min-h-[44px]"
              >
                <span>{t('backToHome').toUpperCase()}</span>
              </button>

              <div className="bg-noir-900/60 rounded-[3rem] p-10 border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                <div className="mb-10 text-center">
                  <h3 className="display text-3xl font-black text-white tracking-tight">
                    {tab === TABS.CREATE ? t('createRoom') : t('joinRoom')}
                  </h3>
                </div>

                <div className="flex flex-col gap-8 relative z-10">
                  {/* FIX: pass language prop so PhotoPicker can localise button text */}
                  <PhotoPicker photo={avatar} onChange={setAvatar} t={t} language={language} />

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] px-2">{t('enterName')}</label>
                    <input
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-bold focus:border-gold-500/50 outline-none transition-all shadow-inner text-center"
                      placeholder="..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={28}
                    />
                  </div>

                  {tab === TABS.JOIN && (
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] px-2">{t('roomCode')}</label>
                      <input
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-3xl text-center tracking-[0.4em] focus:border-gold-500/50 outline-none transition-all uppercase shadow-inner"
                        placeholder="XXXXXX"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                      />
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={tab === TABS.CREATE ? handleCreate : handleJoin}
                    disabled={loading}
                    className="h-20 rounded-[2rem] bg-gold-500 text-black font-black text-xl mt-4 shadow-[0_15px_40px_rgba(201,148,58,0.25)] transition-all"
                  >
                    {loading
                      ? <Spinner size={24} />
                      : tab === TABS.CREATE ? t('createRoom') : t('joinRoom')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
