// ── SettingsMenu — Luxury configuration & language switcher ──────────────────
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Globe, LogOut, Moon, Sun, Shield } from 'lucide-react';
import { useGameStore } from '../../store/gameStore.js';
import { useOfflineStore } from '../../store/offlineStore.js';
import { useTranslation } from '../../constants/translations.js';

export default function SettingsMenu({ isOffline = false }) {
  const [open, setOpen] = useState(false);
  
  // Connect to the right store based on mode
  const gameStore = useGameStore();
  const offlineStore = useOfflineStore();
  
  const language = isOffline ? offlineStore.language : gameStore.language;
  const setLanguage = isOffline ? offlineStore.setLanguage : gameStore.setLanguage;
  
  const t = useTranslation(language);
  const isAr = language === 'ar';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <>
      {/* Floating Toggle Icon */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed top-6 right-6 z-[60] w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-xl hover:bg-white/5 transition-all"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <Settings size={22} className="text-smoke-400" />
      </motion.button>

      {/* Settings Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col"
              style={{ background: 'linear-gradient(165deg, #121216 0%, #050508 100%)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 text-gold-500">
                    <Settings size={18} />
                  </div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">{t('settings')}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-smoke-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Options */}
              <div className="p-8 flex flex-col gap-6">
                
                {/* Language Picker */}
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black text-smoke-500 uppercase tracking-widest px-1">{t('language')}</p>
                  <button 
                    onClick={toggleLanguage}
                    className="flex items-center justify-between w-full h-16 px-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
                        <Globe size={18} />
                      </div>
                      <span className="text-white font-bold">{language === 'en' ? 'English' : 'العربية'}</span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-gold-500/20 text-gold-500 text-[10px] font-black uppercase">
                      {isAr ? 'تغيير' : 'SWITCH'}
                    </div>
                  </button>
                </div>

                {/* Dark Mode (Visual only for now) */}
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black text-smoke-500 uppercase tracking-widest px-1">{t('appearance') || 'Appearance'}</p>
                  <div className="flex items-center justify-between w-full h-16 px-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                        <Moon size={18} />
                      </div>
                      <span className="text-white font-bold">{isAr ? 'الوضع الليلي' : 'Dark Mode'}</span>
                    </div>
                    <div className="w-12 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 p-1 flex justify-end">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                </div>

                {/* Haptics */}
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black text-smoke-500 uppercase tracking-widest px-1">{isAr ? 'الاهتزاز' : 'Haptics'}</p>
                  <div className="flex items-center justify-between w-full h-16 px-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-crimson-500">
                        <Shield size={18} />
                      </div>
                      <span className="text-white font-bold">{isAr ? 'تغذية لمسية' : 'Tactile Feedback'}</span>
                    </div>
                    <div className="w-12 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 p-1 flex justify-end">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 text-center">
                <p className="text-smoke-600 text-[9px] font-black uppercase tracking-[0.2em]">
                  The Mafia Engine v8.0.0
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
