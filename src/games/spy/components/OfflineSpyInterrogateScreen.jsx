// ── OfflineSpyInterrogateScreen (v8) — Spy climax · no window.confirm/alert ──
// FIX: removed browser-native window.confirm/alert (blocks mobile, breaks UX).
// FIX: Added proper "Play Again" that resets offlineStore and returns to lobby.
// FIX: uses shared useTranslation hook for all strings.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore } from '../../../store/offlineStore.js';
import { useTranslation } from '../../../constants/translations.js';
import { GameBackground } from "@/components/game/GameBackground.jsx";
import { Ghost, Search, RefreshCcw, Eye, EyeOff } from 'lucide-react';

export default function OfflineSpyInterrogateScreen() {
  const { language, restart, word, players, spyId } = useOfflineStore();
  const t    = useTranslation(language);
  const isAr = language === 'ar';

  const [revealed, setRevealed] = useState(false);

  const spyName     = players.find((p) => p.id === spyId)?.name || '???';
  const displayWord = typeof word === 'object' ? (word?.[language] ?? word?.en ?? '?') : (word ?? '?');

  return (
    <div className="screen bg-zinc-950 overflow-hidden items-center justify-center flex flex-col p-8 text-center"
      dir={isAr ? 'rtl' : 'ltr'}>
      <GameBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="relative z-10 mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 mx-auto">
          <Search size={48} className="text-emerald-500" />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-3"
          style={{ fontFamily: 'Playfair Display, serif' }}>
          {isAr ? 'ابحث عن الجاسوس' : 'FIND THE SPY'}
        </h1>

        <p className="text-smoke-500 text-sm tracking-[0.3em] font-mono uppercase">
          {isAr ? 'ابدأ الاستجواب الآن' : 'START THE INTERROGATION'}
        </p>
      </motion.div>

      {/* Mission Rules */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="relative z-10 w-full max-w-sm p-6 rounded-[2.5rem] border border-white/10 bg-zinc-950 mb-8"
      >
        <p className="text-smoke-400 text-xs font-mono tracking-widest uppercase mb-4">
          {isAr ? 'قواعد المهمة' : 'MISSION RULES'}
        </p>
        <div className="flex flex-col gap-4 text-left">
          {[
            isAr ? 'اسألوا بعضكم البعض أسئلة ذكية عن المكان.' : 'Ask each other clever questions about the location.',
            isAr ? 'الجاسوس يحاول معرفة المكان من الأسئلة.'  : 'The Spy tries to deduce the location from questions.',
            isAr ? 'صوتوا على من تعتقدون أنه الجاسوس!'       : 'Vote on who you think is the Spy!',
          ].map((rule, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reveal / Play Again */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        className="relative z-10 flex flex-col w-full max-w-xs gap-4"
      >
        {/* Reveal the Spy toggle */}
        <motion.button
          transition={{ type: "tween", duration: 0.1, ease: "linear" }}
          onClick={() => setRevealed((v) => !v)}
          className="h-16 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/10"
        >
          {revealed ? <EyeOff size={18} /> : <Ghost size={18} />}
          {revealed
            ? (isAr ? `الجاسوس: ${spyName} — الكلمة: ${displayWord}` : `SPY: ${spyName} · WORD: ${displayWord}`)
            : (isAr ? 'كشف الجاسوس والكلمة' : 'REVEAL SPY & WORD')}
        </motion.button>

        <motion.button
          transition={{ type: "tween", duration: 0.1, ease: "linear" }}
          onClick={() => restart()}
          className="h-16 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all"
        >
          <RefreshCcw size={18} />
          {isAr ? 'لعبة جديدة' : 'PLAY AGAIN'}
        </motion.button>
      </motion.div>
    </div>
  );
}

