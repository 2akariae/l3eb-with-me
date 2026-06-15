// ─── THE PLATFORM — SettingsPanel.jsx (v10) ──────────────────────────────────
// v10: EMOJI_AVATARS replaced with AvatarMatrix (SVG agent personas).
//      Added Logout section + multi-account display.
//      All strings via t(). Accessible from every screen.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Globe, Check, ChevronRight, LogOut, UserPlus, Camera, ImageIcon } from 'lucide-react';
import { signOut, auth } from '../../services/firebaseConfig.js';
import { useGameStore } from '../../store/gameStore.js';
import { useOfflineStore } from '../../store/offlineStore.js';
import { useTranslation } from '../../constants/translations.js';
import { Avatar } from './index.jsx';

// ── Custom Profile Picture Picker ────────────────────────────────────────────
function ProfilePicturePicker({ photo, onChange }) {
  function handleFile(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 200;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        const src = Math.min(img.width, img.height);
        const sx = (img.width - src) / 2;
        const sy = (img.height - src) / 2;
        ctx.drawImage(img, sx, sy, src, src, 0, 0, SIZE, SIZE);
        onChange(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white/5 shadow-2xl bg-white/5 transition-all group-hover:border-gold-500/30">
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-smoke-600">
              <User size={64} />
            </div>
          )}
        </div>
        <label className="absolute -bottom-2 -right-2 p-3 bg-gold-500 rounded-2xl cursor-pointer shadow-lg hover:scale-105 transition-transform">
          <Camera size={20} className="text-black" />
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

  const t    = useTranslation(language);
  const isAr = language === 'ar';

  const [sec,       setSec]       = useState(SEC.MAIN);
  const [editName,  setEditName]  = useState(profile?.name  ?? '');
  const [editPhoto, setEditPhoto] = useState((profile?.avatar || profile?.photo) ?? '');
  const [saved,     setSaved]     = useState(false);
  const [loggingOut,setLoggingOut]= useState(false);

  function savePro() {
    const name = editName.trim();
    if (name.length < 1) return;
    setProfile({ name, avatar: editPhoto, photo: editPhoto });
    setSaved(true);
    setTimeout(() => { setSaved(false); setSec(SEC.MAIN); }, 850);
  }

  function handleLang(l) { setLanguage(l); setOfflineLang(l); setSec(SEC.MAIN); }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut(auth);
      resetSession();
      onClose();
    } catch (e) {
      console.error(e);
    } finally { setLoggingOut(false); }
  }

  const displayName = profile?.name || user?.displayName || (isAr ? 'ضيف' : 'Guest');
  const isGuest = user?.isAnonymous ?? !user;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ y: 70, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 70, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="relative w-full max-w-sm rounded-[2.5rem] overflow-hidden"
        style={{
          background: 'linear-gradient(165deg,#141418 0%,#050507 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {sec !== SEC.MAIN && (
              <button onClick={() => setSec(SEC.MAIN)} className="text-smoke-500 hover:text-white transition-colors">
                <ChevronRight size={18} className={isAr ? '' : 'rotate-180'} />
              </button>
            )}
            <h3 className="text-white font-black uppercase tracking-widest text-sm">
              {sec === SEC.MAIN     && t('settings')}
              {sec === SEC.PROFILE  && t('editProfile')}
              {sec === SEC.LANGUAGE && t('language')}
              {sec === SEC.ACCOUNT  && (isAr ? 'الحساب' : 'Account')}
            </h3>
          </div>
          <button onClick={onClose} className="text-smoke-600 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── MAIN ─────────────────────────────────────────────────────── */}
          {sec === SEC.MAIN && (
            <motion.div key="main"
              initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -16, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 flex flex-col gap-3"
            >
              {/* Profile row */}
              <button onClick={() => setSec(SEC.PROFILE)}
                className="flex items-center gap-4 w-full h-[4.5rem] px-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group">
                <Avatar uid={user?.uid ?? 'guest'} name={displayName} avatar={profile?.avatar} size="sm" />
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[9px] font-black text-smoke-600 uppercase tracking-widest mb-0.5">{t('editProfile')}</p>
                  <p className="text-white font-bold text-sm truncate">{displayName}</p>
                </div>
                <ChevronRight size={16} className="text-smoke-600 group-hover:text-white shrink-0" />
              </button>

              {/* Language row */}
              <button onClick={() => setSec(SEC.LANGUAGE)}
                className="flex items-center gap-4 w-full h-16 px-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group">
                <div className="w-11 h-11 rounded-2xl bg-gold-500/15 border border-gold-500/20 flex items-center justify-center shrink-0">
                  <Globe size={20} className="text-gold-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-smoke-600 uppercase tracking-widest mb-0.5">{t('language')}</p>
                  <p className="text-white font-bold text-sm">{language === 'ar' ? 'العربية' : 'English'}</p>
                </div>
                <ChevronRight size={16} className="text-smoke-600 group-hover:text-white shrink-0" />
              </button>

              {/* Account row */}
              <button onClick={() => setSec(SEC.ACCOUNT)}
                className="flex items-center gap-4 w-full h-16 px-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <User size={20} className="text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-smoke-600 uppercase tracking-widest mb-0.5">
                    {isAr ? 'الحساب' : 'Account'}
                  </p>
                  <p className="text-white font-bold text-sm">
                    {isGuest ? (isAr ? 'ضيف' : 'Guest') : (user?.email ?? user?.displayName ?? '—')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-smoke-600 group-hover:text-white shrink-0" />
              </button>

              <div className="mt-1 text-center">
                <p className="text-smoke-700 text-[9px] font-black uppercase tracking-[0.3em]">
                  {t('version')} v10.0
                </p>
              </div>
            </motion.div>
          )}

          {/* ── PROFILE ──────────────────────────────────────────────────── */}
          {sec === SEC.PROFILE && (
            <motion.div key="profile"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="p-8 flex flex-col gap-8"
            >
              <ProfilePicturePicker photo={editPhoto} onChange={setEditPhoto} />

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-smoke-500 uppercase tracking-[0.2em]">{t('profileName')}</label>
                <input
                  className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 px-6 text-white font-bold text-lg placeholder-smoke-700 focus:outline-none focus:border-gold-500/50 transition-all duration-300"
                  value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={20}
                  placeholder={isAr ? 'اسمك في اللعبة...' : 'Enter your name...'}
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={savePro} 
                disabled={editName.trim().length < 1}
                className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ 
                  background: saved ? '#059669' : 'linear-gradient(135deg, #c9943a, #b4802c)',
                  boxShadow: saved ? '0 0 20px rgba(5,150,105,0.35)' : '0 10px 30px rgba(201, 148, 58, 0.2)' 
                }}
              >
                {saved ? (
                  <>
                    <Check size={20} />
                    {isAr ? 'تم الحفظ' : 'Saved'}
                  </>
                ) : (
                  t('saveProfile')
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ── LANGUAGE ─────────────────────────────────────────────────── */}
          {sec === SEC.LANGUAGE && (
            <motion.div key="lang"
              initial={{ x: 18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 18, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 flex flex-col gap-3"
            >
              {[
                { code: 'en', label: 'English',  sub: 'Left-to-Right',    flag: '🇺🇸' },
                { code: 'ar', label: 'العربية',  sub: 'يمين إلى يسار',   flag: '🇸🇦' },
              ].map(({ code, label, sub, flag }) => (
                <button key={code} onClick={() => handleLang(code)}
                  className="flex items-center gap-4 w-full h-16 px-5 rounded-2xl border transition-all"
                  style={{
                    background: language === code ? 'rgba(201,148,58,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: language === code ? 'rgba(201,148,58,0.4)' : 'rgba(255,255,255,0.06)',
                  }}>
                  <span className="text-2xl">{flag}</span>
                  <div className="flex-1 text-left">
                    <p className="text-white font-black text-sm">{label}</p>
                    <p className="text-smoke-600 text-[10px]">{sub}</p>
                  </div>
                  {language === code && <Check size={18} className="text-gold-400" />}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── ACCOUNT ──────────────────────────────────────────────────── */}
          {sec === SEC.ACCOUNT && (
            <motion.div key="acc"
              initial={{ x: 18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 18, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 flex flex-col gap-4"
            >
              {/* Current account info */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/8">
                <p className="text-[9px] font-black text-smoke-600 uppercase tracking-widest mb-2">
                  {isAr ? 'الحساب الحالي' : 'Current Account'}
                </p>
                <p className="text-white font-black text-base">{displayName}</p>
                <p className="text-smoke-500 text-xs mt-0.5">
                  {isGuest ? (isAr ? 'وضع الضيف' : 'Guest Mode') : user?.email ?? '—'}
                </p>
              </div>

              {/* Sign in with different account */}
              <button onClick={async () => { await signOut(auth); resetSession(); onClose(); }}
                className="flex items-center gap-3 w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/8 hover:border-white/20 transition-all text-white font-bold text-sm">
                <UserPlus size={18} className="text-blue-400" />
                {isAr ? 'إضافة حساب آخر' : 'Switch Account'}
              </button>

              {/* Logout */}
              {!isGuest && (
                <button onClick={handleLogout} disabled={loggingOut}
                  className="flex items-center gap-3 w-full h-14 px-5 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 hover:bg-crimson-500/20 transition-all text-crimson-400 font-bold text-sm disabled:opacity-50">
                  <LogOut size={18} />
                  {loggingOut ? (isAr ? 'جاري تسجيل الخروج...' : 'Signing out...') : (isAr ? 'تسجيل الخروج' : 'Sign Out')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
