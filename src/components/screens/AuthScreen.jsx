// AuthScreen.jsx — v10-fixed-b2
// FIX: Google Sign-In now tries popup first (faster), falls back to redirect if blocked.
// FIX: 8-second timeout on getRedirectResult so loading never hangs forever on mobile.
// FIX: Clear error message when domain not in Firebase Auth Authorized Domains.
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  auth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  signInAnonymously,
  getRedirectResult,
} from '../../services/firebaseConfig.js';
import { useGameStore } from '../../store/gameStore.js';
import { useTranslation } from '../../constants/translations.js';
import { Spinner, toast } from '../ui/index.jsx';
import { ParallaxStars } from '../game/ParallaxStars.jsx';
import { Chrome, UserRound } from 'lucide-react';

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function AuthScreen() {
  const { language } = useGameStore();
  const t = useTranslation(language);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setGoogleLoading(true);
    withTimeout(getRedirectResult(auth), 8000)
      .then((result) => {
        if (!mounted.current) return;
        if (result?.user) toast(t('welcome'), 'success');
      })
      .catch((e) => {
        if (!mounted.current) return;
        if (e.message !== 'timeout' && e.code !== 'auth/no-current-user') {
          if (e.code === 'auth/unauthorized-domain') {
            setError('Setup required: add this domain to Firebase Auth → Authorized Domains.');
          }
        }
      })
      .finally(() => { if (mounted.current) setGoogleLoading(false); });
    return () => { mounted.current = false; };
  }, []); // eslint-disable-line

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirError) {
          setError(redirError.message);
          setLoading(false);
        }
      } else {
        setError(e.message);
        setLoading(false);
      }
    }
  }

  async function handleGuest() {
    setError('');
    setLoading(true);
    try { await signInAnonymously(auth); }
    catch (e) { setError(e.message); }
    finally { if (mounted.current) setLoading(false); }
  }

  const isAr = language === 'ar';

  return (
    <div className="screen bg-noir-950 flex flex-col items-center justify-center p-8 overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 pointer-events-none">
        <ParallaxStars count={80} />
        <div className="absolute inset-0"
          style={{ background:'radial-gradient(ellipse at 50% 40%, rgba(80,40,160,0.12) 0%, transparent 70%)' }} />
      </div>
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="text-center">
          <h1 className="display text-4xl font-black tracking-[0.2em] text-white uppercase mb-3">
            l3eb<span className="text-gold-500">.</span>
          </h1>
          <p className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.5em]">
            {isAr ? 'ادخل المدينة' : 'Enter the City'}
          </p>
        </motion.div>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="w-full bg-noir-900/70 rounded-[3rem] p-8 border border-white/5 backdrop-blur-3xl shadow-2xl space-y-4">
          <motion.button whileTap={{ scale:0.98 }} onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="w-full h-16 rounded-2xl bg-white text-black font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 min-h-[44px]">
            {(loading || googleLoading)
              ? <Spinner size={22} />
              : <><Chrome size={20} className="text-blue-600" /><span>{t('signInGoogle')}</span></>}
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-smoke-600 text-[10px] font-black uppercase tracking-widest">{t('orSeparator')}</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <motion.button whileTap={{ scale:0.98 }} onClick={handleGuest} disabled={loading}
            className="w-full h-16 rounded-2xl glass border border-white/8 text-white font-black text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 min-h-[44px]">
            <UserRound size={18} className="text-smoke-400" />
            <span>{t('continueAsGuest')}</span>
          </motion.button>
          <p className="text-smoke-600 text-[9px] text-center leading-relaxed opacity-60">
            {t('guestDisclaimer')}
          </p>
        </motion.div>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="w-full px-5 py-4 rounded-2xl bg-crimson-900/40 border border-crimson-500/30 text-crimson-300 text-xs font-bold text-center leading-relaxed">
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
