// ─── THE PLATFORM — SettingsPanel.jsx (v11 — cinematic refresh) ─────────────
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Globe, Check, ChevronRight, LogOut, UserPlus, Camera, Smartphone, Shield, Settings2 } from 'lucide-react';
import { signOut, auth } from '../../services/firebaseConfig.js';
import { useGameStore } from '../../store/gameStore.js';
import { useOfflineStore } from '../../store/offlineStore.js';
import { useTranslation } from '../../constants/translations.js';
import { Avatar, toast } from './index.jsx';

function ProfilePicturePicker({ photo, onChange, language }) {
  function handleFile(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(language === 'ar' ? 'الصورة كبيرة جداً' : 'Image too large', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 240;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const src = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width-src)/2, (img.height-src)/2, src, src, 0, 0, SIZE, SIZE);
        onChange(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-36 h-36 rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-noir-800/40 backdrop-blur-xl transition-all group-hover:border-gold-500/40"
        >
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-smoke-700">
              <User size={64} strokeWidth={1.2} />
            </div>
          )}
        </motion.div>
        <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-gold-500 rounded-2xl cursor-pointer shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group-hover:bg-gold-400">
          <Camera size={20} className="text-noir-950" />
          <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

const SEC = { MAIN: 'main', PROFILE: 'profile', LANGUAGE: 'language', ACCOUNT: 'account' };

export default function SettingsPanel({ onClose }) {
  const { language, setLanguage, profile, setProfile, user, resetSession } = useGameStore();
  const setOfflineLang = useOfflineStore((s) => s.setLanguage);
  const t = useTranslation(language);
  const isAr = language === 'ar';

  const [sec, setSec] = useState(SEC.MAIN);
  const [editName, setEditName] = useState(profile?.name ?? '');
  const [editPhoto, setEditPhoto] = useState((profile?.avatar || profile?.photo) ?? '');
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function savePro() {
    const name = editName.trim();
    if (name.length < 1) return;
    setProfile({ name, avatar: editPhoto, photo: editPhoto });
    setSaved(true);
    setTimeout(() => { setSaved(false); setSec(SEC.MAIN); }, 1000);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try { await signOut(auth); resetSession(); onClose(); } catch (e) { console.error(e); } finally { setLoggingOut(false); }
  }

  const displayName = profile?.name || user?.displayName || (isAr ? 'ضيف' : 'Guest');
  const isGuest = user?.isAnonymous ?? !user;

  const rowClasses = "flex items-center gap-5 w-full h-20 px-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all group relative overflow-hidden";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0 bg-noir-950/80 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-[3.5rem] overflow-hidden bg-noir-900 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-8 pb-6 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {sec !== SEC.MAIN && (
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setSec(SEC.MAIN)} 
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-smoke-500 hover:text-white transition-colors"
              >
                <ChevronRight size={20} className={isAr ? '' : 'rotate-180'} />
              </motion.button>
            )}
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gold-500/60 uppercase tracking-[0.4em] mb-0.5 bloom">System</span>
              <h3 className="text-white font-black uppercase tracking-[0.15em] text-sm aberration">
                {sec === SEC.MAIN     && t('settings')}
                {sec === SEC.PROFILE  && t('editProfile')}
                {sec === SEC.LANGUAGE && t('language')}
                {sec === SEC.ACCOUNT  && (isAr ? 'الحساب' : 'Account')}
              </h3>
            </div>
          </div>
          <motion.button 
            whileHover={{ rotate: 90 }} whileTap={{ scale: 0.8 }}
            onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-smoke-600 hover:text-white transition-all"
          >
            <X size={20} />
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {sec === SEC.MAIN && (
            <motion.div key="main" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="p-8 flex flex-col gap-4"
            >
              <button onClick={() => setSec(SEC.PROFILE)} className={rowClasses}>
                <Avatar uid={user?.uid ?? 'guest'} name={displayName} avatar={profile?.avatar} size="sm" className="shadow-2xl border border-white/10" />
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] mb-1">{t('editProfile')}</p>
                  <p className="text-white font-black text-base truncate tracking-tight">{displayName}</p>
                </div>
                <ChevronRight size={18} className="text-smoke-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

              <button onClick={() => setSec(SEC.LANGUAGE)} className={rowClasses}>
                <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Globe size={24} className="text-gold-500 bloom" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] mb-1">{t('language')}</p>
                  <p className="text-white font-black text-base tracking-tight">{language === 'ar' ? 'العربية' : 'English'}</p>
                </div>
                <ChevronRight size={18} className="text-smoke-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

              <button onClick={() => setSec(SEC.ACCOUNT)} className={rowClasses}>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Shield size={24} className="text-blue-500 bloom" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-smoke-600 uppercase tracking-[0.2em] mb-1">{isAr ? 'الحساب' : 'Account'}</p>
                  <p className="text-white font-black text-base tracking-tight truncate">
                    {isGuest ? (isAr ? 'ضيف' : 'Guest') : (user?.email ?? user?.displayName ?? '—')}
                  </p>
                </div>
                <ChevronRight size={18} className="text-smoke-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5">
                  <Settings2 size={12} className="text-smoke-700" />
                  <span className="text-smoke-700 text-[9px] font-black uppercase tracking-[0.4em] bloom">v11.0 Build</span>
                </div>
              </div>
            </motion.div>
          )}

          {sec === SEC.PROFILE && (
            <motion.div key="pro" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
              className="p-10 flex flex-col gap-10"
            >
              <ProfilePicturePicker photo={editPhoto} onChange={setEditPhoto} language={language} />

              <div className="space-y-4">
                <label className="text-[10px] font-black text-smoke-600 uppercase tracking-[0.3em] px-4 bloom">{t('profileName')}</label>
                <input
                  className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 px-8 text-white font-black text-lg focus:border-gold-500/50 outline-none transition-all shadow-inner text-center tracking-tight"
                  value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={20}
                  placeholder={isAr ? 'اسمك...' : 'Your name...'}
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={savePro} 
                className="w-full h-20 rounded-[2.5rem] font-black text-lg uppercase tracking-[0.25em] text-noir-950 flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl"
                style={{ 
                  background: saved ? '#10b981' : 'var(--gold-500)',
                  boxShadow: saved ? '0 15px 40px rgba(16,185,129,0.3)' : '0 15px 40px rgba(201,148,58,0.3)' 
                }}
              >
                {saved ? <Check size={24} strokeWidth={3} /> : t('saveProfile')}
              </motion.button>
            </motion.div>
          )}

          {sec === SEC.LANGUAGE && (
            <motion.div key="lang" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
              className="p-8 flex flex-col gap-4"
            >
              {[
                { code: 'en', label: 'English', sub: 'Latin Interface', icon: '🇺🇸' },
                { code: 'ar', label: 'العربية', sub: 'واجهة عربية', icon: '🇸🇦' },
              ].map((l) => (
                <button key={l.code} onClick={() => { setLanguage(l.code); setOfflineLang(l.code); setSec(SEC.MAIN); }}
                  className={`flex items-center gap-5 w-full h-20 px-6 rounded-[2.5rem] border transition-all ${language === l.code ? 'bg-gold-500/10 border-gold-500/40 shadow-2xl' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'}`}>
                  <span className="text-3xl filter saturate-[0.8]">{l.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-white font-black text-lg tracking-tight">{l.label}</p>
                    <p className="text-smoke-600 text-[10px] font-bold uppercase tracking-widest">{l.sub}</p>
                  </div>
                  {language === l.code && <motion.div layoutId="check" className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center"><Check size={16} className="text-noir-950" strokeWidth={3} /></motion.div>}
                </button>
              ))}
            </motion.div>
          )}

          {sec === SEC.ACCOUNT && (
            <motion.div key="acc" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
              className="p-8 flex flex-col gap-5"
            >
              <div className="p-8 rounded-[2.5rem] bg-white/[0.04] border border-white/8 backdrop-blur-md shadow-inner text-center">
                <p className="text-[10px] font-black text-smoke-600 uppercase tracking-[0.4em] mb-4 bloom">Active Persona</p>
                <p className="text-white font-black text-2xl tracking-tighter aberration mb-1">{displayName}</p>
                <p className="text-smoke-500 text-xs font-bold uppercase tracking-widest opacity-60">
                  {isGuest ? (isAr ? 'وضع الضيف' : 'Guest Mode') : user?.email ?? 'Verified Account'}
                </p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={async () => { await signOut(auth); resetSession(); onClose(); }}
                className="flex items-center justify-center gap-4 w-full h-16 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
              >
                <UserPlus size={18} className="text-blue-500 bloom" />
                {isAr ? 'تبديل الحساب' : 'Switch Identity'}
              </motion.button>

              {!isGuest && (
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleLogout} disabled={loggingOut}
                  className="flex items-center justify-center gap-4 w-full h-16 rounded-[2rem] bg-crimson-500/10 border border-crimson-500/20 hover:bg-crimson-500/20 text-crimson-400 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-40"
                >
                  <LogOut size={18} />
                  {loggingOut ? '...' : (isAr ? 'تسجيل الخروج' : 'Terminate Session')}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

