import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebaseConfig.js';
import { get, ref } from 'firebase/database';
import { createRoom, joinRoom, submitJoinRequest } from '../../games/mafia/hooks/useMafiaEngine.js';
import { useGameStore } from '../../store/gameStore.js';
import { toast, Spinner } from '../ui/index.jsx';
import { useTranslation } from '../../constants/translations.js';
import BackButton from '../ui/BackButton.jsx';
import { User, Camera, ImageIcon } from 'lucide-react';

const TABS = { HOME: 'home', CREATE: 'create', JOIN: 'join' };

// ── 1. Cinematic Background Engine ──────────────────────────────────────────
function CinematicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#03020a] overflow-hidden">
      {/* Dynamic Gradient Glows */}
      <motion.div 
        className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-900/15 blur-[120px]"
        animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
      />
      <motion.div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/15 blur-[120px]"
        animate={{ x: [0, -80, 0], y: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear', delay: 5 }}
        style={{ willChange: 'transform' }}
      />
      {/* Subtle Matrix-like Geometric Pattern (CSS) */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px' 
        }} 
      />
    </div>
  );
}

// ── 3. Advanced Button Micro-interactions & Text Effects ────────────────────
function ActionButton({ onClick, children, className, variant = 'primary' }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2, boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`h-16 rounded-2xl w-full font-black text-sm tracking-widest uppercase transition-all duration-200 ${
        variant === 'primary' 
          ? 'bg-white/10 text-white border border-white/10' 
          : 'glass border border-white/5 text-white'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ── Photo Picker Component ───────────────────────────────────────────────────
function PhotoPicker({ photo, onChange, t, language }) {
  const openPicker = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 160;
        const ctx = canvas.getContext('2d');
        const src = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width-src)/2, (img.height-src)/2, src, src, 0, 0, 160, 160);
        onChange(canvas.toDataURL('image/jpeg', 0.85));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
    inp.click();
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openPicker}
      className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 cursor-pointer shadow-2xl bg-white/[0.03] backdrop-blur-xl flex items-center justify-center mb-6"
    >
      {photo ? <img src={photo} alt="You" className="w-full h-full object-cover" /> : <User size={32} className="text-white opacity-20" />}
    </motion.div>
  );
}

// ── Main LandingScreen ─────────────────────────────────────────────────────────
export default function LandingScreen({ user, tabPlayerId }) {
  const [tab, setTab] = useState(TABS.HOME);
  const { setRoom, language, gameType, resetSession, profile } = useGameStore();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [avatar, setAvatar] = useState(profile?.avatar || profile?.photo || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslation(language);

  // ... (handleCreate/handleJoin remain the same) ...
  async function handleCreate() {
    if (!name.trim()) { toast(t('enterName'), 'error'); return; }
    setLoading(true);
    try {
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
      const { roomId: actualRid, playerId: pid, gameType: joinedGameType } =
        await joinRoom(user, rid, name.trim(), avatar, tabPlayerId);
      setRoom(actualRid, false, pid, joinedGameType);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  // ── 4. Staggered Intro Mount Animation ─────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      <CinematicBackground />

      <motion.div 
        variants={containerVariants} initial="hidden" animate="visible"
        className="w-full max-w-sm"
      >
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h1 className="display font-black tracking-[0.2em] uppercase text-4xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            {gameType === 'spy' ? t('spyTitle') : gameType === 'detective' ? 'The Detective' : t('mafiaTitle')}
          </h1>
        </motion.div>

        {/* ── 2. Futuristic Glassmorphic Panel ───────────────────────────── */}
        <motion.div variants={itemVariants} className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.07] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            {tab === TABS.HOME ? (
              <motion.div key="home" className="flex flex-col gap-4">
                <ActionButton onClick={() => setTab(TABS.JOIN)}>{t('joinRoom')}</ActionButton>
                <ActionButton onClick={() => setTab(TABS.CREATE)} variant="secondary">{t('createRoom')}</ActionButton>
              </motion.div>
            ) : (
              <motion.div key="form" className="flex flex-col items-center gap-4">
                <PhotoPicker photo={avatar} onChange={setAvatar} t={t} language={language} />
                <input className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-center text-sm" placeholder={t('namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
                {tab === TABS.JOIN && <input className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-center text-lg tracking-[0.3em]" placeholder="XXXXXX" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} />}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={tab === TABS.CREATE ? handleCreate : handleJoin} className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm tracking-widest">
                  {loading ? <Spinner size={20} /> : tab === TABS.CREATE ? t('createRoom') : t('joinRoom')}
                </motion.button>
                <button onClick={() => setTab(TABS.HOME)} className="text-[10px] text-white/30 uppercase tracking-widest mt-2">{t('back')}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
