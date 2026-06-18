// ─── L3EBWITHME PLATFORM — App.jsx (v11 — modular routing refactor) ──────────
// REFACTORED: This file previously contained two `render*Screen()` functions
//   (renderOnlineScreen, renderOfflineScreen) that were plain JS functions
//   called during render — NOT React components. That meant React could
//   never key or diff their returned trees independently, and every phase
//   change forced a full re-render + re-execution of every hook in this
//   file (5 separate useEffects, audio orchestration, presence tracking).
//   Extracted into:
//     - router/OnlineRouter.jsx   — real component, phase→screen mapping
//     - router/OfflineRouter.jsx  — real component, offline phase→screen
//     - hooks/useFirebaseSubscriptions.js — gameState/players/role/roles/history
//     - hooks/useRoomPresence.js          — meta/kick watcher + online presence
//     - hooks/useGamePhaseEffects.js      — ambient audio + transition overlay
//   App.jsx now only owns: top-level mode gates (loading/lang/game/mode),
//   the shared chrome (HUD, chat, history, settings, toasts), and wiring the
//   extracted hooks together. ~150 lines instead of ~454.
//
// BUG FIXED (P2, retained): Loading spinner uses Framer Motion exclusively
//   (no mixed CSS `animation` + FM `animate` fighting for the same layer).
// BUG FIXED (P2, retained): GameSelector back button uses onLangReset callback
//   instead of window.location.reload() (clean in-memory transition).

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebaseConfig.js';
import { useGameStore } from './store/gameStore.js';
import { useOfflineStore } from './store/offlineStore.js';
import { getPlayerId } from './utils/session.js';
import { useTranslation } from './constants/translations.js';

import { useFirebaseSubscriptions } from './hooks/useFirebaseSubscriptions.js';
import { useRoomPresence } from './hooks/useRoomPresence.js';
import { useGamePhaseEffects } from './hooks/useGamePhaseEffects.js';
import { useMouseTracker } from './hooks/useMouseTracker.js';

import OnlineRouter from './router/OnlineRouter.jsx';
import OfflineRouter from './router/OfflineRouter.jsx';
import { useOnlineRouteInfo } from './hooks/useOnlineRouteInfo.js';

import ModeSelectScreen     from './components/screens/ModeSelectScreen.jsx';
import GameSelector         from './components/screens/GameSelector.jsx';
import LanguageSelectScreen from './components/screens/LanguageSelectScreen.jsx';
import MafiaChat            from './games/mafia/components/MafiaChat.jsx';

import { PhaseTransitionOverlay } from './components/game/PhaseTransitionOverlay.jsx';
import { CinematicOverlay }       from './components/game/CinematicOverlay.jsx';
import { CursorGlow }             from './components/game/CursorGlow.jsx';
import { GameHUD }                from './components/game/GameHUD.jsx';
import { FloatingPlayerList }     from './components/game/FloatingPlayerList.jsx';
import { HistoryLog }             from './components/game/HistoryLog.jsx';
import { ToastContainer }         from './components/ui/index.jsx';
import SettingsPanel              from './components/ui/SettingsPanel.jsx';
import SettingsButton             from './components/ui/SettingsButton.jsx';

function lsGet(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch {}
}

export default function App() {
  const [appMode,    setAppModeRaw] = useState('loading');
  const [langChosen, setLangChosen] = useState(false);
  const [authReady,  setAuthReady]  = useState(false);

  const setAppMode = (mode) => {
    lsSet('mafia_appMode', mode);
    setAppModeRaw(mode);
  };

  const {
    user, setUser, roomId, isHost, playerId, myRole,
    setRoom, language, setLanguage, gameType,
    resetSession, settingsOpen, toggleSettings,
  } = useGameStore();

  const offlinePhase   = useOfflineStore((s) => s.phase);
  const setOfflineLang = useOfflineStore((s) => s.setLanguage);

  const t     = useTranslation(language);
  const isRTL = language === 'ar';
  const tabPlayerId = getPlayerId();

  useMouseTracker();

  // ── One-time boot: restore language, force Home on every refresh ───────
  useEffect(() => {
    const savedLang = lsGet('mafia_lang');
    if (savedLang) {
      setLanguage(savedLang);
      setLangChosen(true);
    }
    setAppModeRaw(null);
    lsSet('mafia_appMode', null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setOfflineLang(language); }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Room persistence (write-through to localStorage) ───────────────────
  useEffect(() => {
    if (roomId && playerId) {
      lsSet('mafia_room', JSON.stringify({ roomId, isHost, playerId }));
    } else if (!roomId) {
      lsSet('mafia_room', null);
    }
  }, [roomId, isHost, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Room restoration on auth resolve ────────────────────────────────────
  useEffect(() => {
    if (!user || roomId) return;
    try {
      const saved = lsGet('mafia_room');
      if (!saved) return;
      const { roomId: rid, isHost: host, playerId: pid } = JSON.parse(saved);
      if (rid) setRoom(rid, host ?? false, pid || tabPlayerId);
    } catch { /* ignore */ }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Extracted concerns (see file headers for rationale) ─────────────────
  useFirebaseSubscriptions(appMode, tabPlayerId);
  useRoomPresence(appMode, tabPlayerId);

  const { phase, round, myPlayerId } = useOnlineRouteInfo(tabPlayerId);
  const { showTransition, setShowTransition } = useGamePhaseEffects(phase, gameType);

  // ── Loading: wait for useEffect hydration tick ─────────────────────────
  if (appMode === 'loading') {
    return (
      <div className="screen bg-noir-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360, opacity: [0.4, 1, 0.4] }}
            transition={{
              rotate:  { duration: 1.5, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 2,   repeat: Infinity, ease: 'easeInOut' },
            }}
            className="w-16 h-16 rounded-full border-[3px] border-gold-500/10 border-t-gold-500 shadow-[0_0_40px_rgba(201,148,58,0.2)]"
          />
          <div className="absolute inset-0 blur-xl bg-gold-500/10 rounded-full animate-pulse" />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gold-500/60 text-[10px] uppercase tracking-[0.3em] font-black"
        >
          {t('loading')}
        </motion.p>
        <CinematicOverlay />
        <CursorGlow />
      </div>
    );
  }

  // ── Language selection gate ──────────────────────────────────────────
  if (!langChosen) {
    return (
      <div className="relative w-full overflow-hidden" style={{ height: '100dvh' }}>
        <AnimatePresence>
          <motion.div key="langsel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0">
            <LanguageSelectScreen onSelect={(lang) => {
              setLanguage(lang);
              lsSet('mafia_lang', lang);
              setLangChosen(true);
            }} />
          </motion.div>
        </AnimatePresence>
        <ToastContainer />
        <CursorGlow />
      </div>
    );
  }

  // ── Game Selector ────────────────────────────────────────────────────
  if (!gameType) {
    return (
      <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
        <AnimatePresence>
          <motion.div key="gamesel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }} className="absolute inset-0">
            <GameSelector onLangReset={() => {
              setLanguage('');
              setLangChosen(false);
              lsSet('mafia_lang', null);
            }} />
          </motion.div>
        </AnimatePresence>
        <ToastContainer />
        <CursorGlow />
      </div>
    );
  }

  // ── Mode Select ──────────────────────────────────────────────────────
  if (!appMode) {
    return (
      <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
        <AnimatePresence>
          <motion.div key="modesel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }} className="absolute inset-0">
            <ModeSelectScreen
              onOnline={() => setAppMode('online')}
              onOffline={() => {
                useOfflineStore.getState().setGameType(gameType);
                setAppMode('offline');
              }}
              onBack={() => resetSession()}
            />
          </motion.div>
        </AnimatePresence>
        <ToastContainer />
        <CursorGlow />
      </div>
    );
  }

  // ── Offline shell ────────────────────────────────────────────────────
  if (appMode === 'offline') {
    return (
      <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
        <AnimatePresence>
          <motion.div key={offlinePhase ?? 'fallback'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} className="absolute inset-0">
            <OfflineRouter onBackToMode={() => setAppModeRaw(null)} />
          </motion.div>
        </AnimatePresence>
        <SettingsButton />
        {settingsOpen && <SettingsPanel onClose={toggleSettings} />}
        <ToastContainer />
        <CinematicOverlay />
        <CursorGlow />
      </div>
    );
  }

  // ── Online shell ─────────────────────────────────────────────────────
  return (
    <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
      <AnimatePresence>
        <motion.div key={`${gameType}__${roomId ?? 'none'}__${phase}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }} className="absolute inset-0">
          <OnlineRouter authReady={authReady} tabPlayerId={tabPlayerId} />
        </motion.div>
      </AnimatePresence>

      {roomId && <GameHUD phase={phase} round={round} myRole={myRole} />}

      {roomId && phase !== 'lobby' && (
        <FloatingPlayerList myPlayerId={myPlayerId} />
      )}

      {roomId && phase !== 'lobby' && gameType === 'mafia' && myRole === 'mafia' && (
        <MafiaChat user={user} playerId={myPlayerId} />
      )}

      <HistoryLog />

      {showTransition && gameType === 'mafia' && (
        <PhaseTransitionOverlay phase={phase} onDone={() => setShowTransition(false)} />
      )}

      <SettingsButton />
      {settingsOpen && <SettingsPanel onClose={toggleSettings} />}
      <ToastContainer />
      <CinematicOverlay />
      <CursorGlow />
    </div>
  );
}
