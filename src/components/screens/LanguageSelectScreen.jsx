// ─── THE PLATFORM — LanguageSelectScreen.jsx (v8) ────────────────────────────
// FIX: no hardcoded strings — gatekeeper screen needs its own minimal string
//      table since the global translation hook hasn't been initialised yet.
//      Using both languages simultaneously is the correct UX here.
import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export default function LanguageSelectScreen({ onSelect }) {
  return (
    <div className="screen bg-noir-950 flex flex-col items-center justify-center p-6 gap-12 overflow-hidden">
      {/* Animated glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/30 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gold-900/20 blur-[120px]"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-12">
          <Globe size={40} className="text-gold-400" />
        </div>
        <h1 className="display text-4xl font-black tracking-tight text-white uppercase mb-2">
          Welcome · مرحباً
        </h1>
        <p className="text-smoke-500 text-xs font-black uppercase tracking-[0.4em] opacity-60">
          Choose language · اختر اللغة
        </p>
      </motion.div>

      {/* Language Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-5 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('en')}
          className="group relative w-full h-24 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between px-8">
            <div className="text-left">
              <p className="text-white font-black text-xl tracking-tight">ENGLISH</p>
              <p className="text-smoke-500 text-[10px] font-bold uppercase tracking-widest mt-1">LTR interface</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">🇺🇸</div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('ar')}
          className="group relative w-full h-24 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all"
          dir="rtl"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-gold-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between px-8">
            <div className="text-right">
              <p className="text-white font-black text-xl tracking-tight">العربية</p>
              <p className="text-smoke-500 text-[10px] font-bold uppercase tracking-widest mt-1">واجهة RTL كاملة</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">🇸🇦</div>
          </div>
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 1 }}
        className="text-smoke-600 text-[10px] font-black uppercase tracking-[0.2em] relative z-10"
      >
        Universal Translation · ترجمة شاملة
      </motion.p>
    </div>
  );
}
