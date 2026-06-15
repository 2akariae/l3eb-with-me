// ─── THE MAFIA PLATFORM — App.jsx (v10-fixed) ─────────────────────────────────
// BUG FIXED (P2): Loading spinner was mixing Framer Motion `animate` prop with
//   a raw CSS `animation` property on the same element. Both systems fought for
//   control of the element's composited layer, producing a jittery spin.
//   Fixed by using Framer Motion exclusively.
//
// BUG FIXED (P2): GameSelector's back button used window.location.reload() to
//   return to language selection — a lossy hard reload that flushed all state.
//   Fixed by passing an onLangReset callback prop so the navigation is a clean
//   in-memory state transition (setLangChosen(false) + clear persisted lang).

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref, onDisconnect, set as dbSet } from 'firebase/database';
import { auth, db } from './services/firebaseConfig.js';
import { useGameStore } from './store/gameStore.js';
import { useOfflineStore, OFFLINE_PHASES } from './store/offlineStore.js';
import { getPlayerId } from './utils/session.js';
import {
  subscribeGameState, subscribePlayers, subscribeMyRole,
  subscribeRoles, subscribeHistory, advanceToNight, advanceToDiscussion,
} from './games/mafia/hooks/useMafiaEngine.js';
import { PHASES } from './constants/game.js';
import { vibrate, HAPTICS } from './utils/haptics.js';
import { startMafiaAmbient, startSpyAmbient, stopAmbient, resumeCtx } from './utils/sound.js';
import { useTranslation } from './constants/translations.js';

import ModeSelectScreen     from './components/screens/ModeSelectScreen.jsx';
import GameSelector         from './components/screens/GameSelector.jsx';
import LanguageSelectScreen from './components/screens/LanguageSelectScreen.jsx';
import AuthScreen           from './components/screens/AuthScreen.jsx';
import LandingScreen        from './components/screens/LandingScreen.jsx';
import LobbyScreen          from './components/screens/LobbyScreen.jsx';
import EnvelopeScreen       from './components/screens/EnvelopeScreen.jsx';
import NightScreen          from './components/screens/NightScreen.jsx';
import DawnScrollScreen     from './components/screens/DawnScrollScreen.jsx';
import DiscussionScreen     from './components/screens/DiscussionScreen.jsx';
import VotingScreen         from './components/screens/VotingScreen.jsx';
import ExecutionScreen      from './components/screens/ExecutionScreen.jsx';
import GameOverScreen       from './components/screens/GameOverScreen.jsx';

import SpyRevealScreen             from './games/spy/components/SpyRevealScreen.jsx';
import SpyDiscussionScreen         from './games/spy/components/SpyDiscussionScreen.jsx';
import SpyVotingScreen             from './games/spy/components/SpyVotingScreen.jsx';
import SpyGuessScreen              from './games/spy/components/SpyGuessScreen.jsx';
import OfflineSpyRevealScreen      from './games/spy/components/OfflineSpyRevealScreen.jsx';
import OfflineSpyInterrogateScreen from './games/spy/components/OfflineSpyInterrogateScreen.jsx';
import MafiaChat                   from './games/mafia/components/MafiaChat.jsx';

import OfflineLobbyScreen      from './games/mafia/components/offline/OfflineLobbyScreen.jsx';
import OfflineEnvelopeScreen   from './games/mafia/components/offline/OfflineEnvelopeScreen.jsx';
import OfflineCloseEyesScreen  from './games/mafia/components/offline/OfflineCloseEyesScreen.jsx';
import OfflineNightScreen      from './games/mafia/components/offline/OfflineNightScreen.jsx';
import OfflineDawnScreen       from './games/mafia/components/offline/OfflineDawnScreen.jsx';
import OfflineDiscussionScreen from './games/mafia/components/offline/OfflineDiscussionScreen.jsx';
import OfflineVotingScreen     from './games/mafia/components/offline/OfflineVotingScreen.jsx';
import OfflineExecutionScreen  from './games/mafia/components/offline/OfflineExecutionScreen.jsx';
import OfflineGameOverScreen   from './games/mafia/components/offline/OfflineGameOverScreen.jsx';

import { PhaseTransitionOverlay } from './components/game/PhaseTransitionOverlay.jsx';
import { CinematicOverlay }       from './components/game/CinematicOverlay.jsx';
import { CursorGlow }             from './components/game/CursorGlow.jsx';
import { useMouseTracker }        from './hooks/useMouseTracker.js';
import { GameHUD }                from './components/game/GameHUD.jsx';
import { FloatingPlayerList }     from './components/game/FloatingPlayerList.jsx';
import { HistoryLog }             from './components/game/HistoryLog.jsx';
import { ToastContainer, toast }  from './components/ui/index.jsx';
import SettingsPanel              from './components/ui/SettingsPanel.jsx';
import SettingsButton             from './components/ui/SettingsButton.jsx';

const MAFIA_TRANSITION_PHASES = new Set([
  PHASES.NIGHT, PHASES.DISCUSSION, PHASES.VOTING, PHASES.EXECUTION, PHASES.GAME_OVER,
]);

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
    user, setUser,
    roomId, isHost, playerId,
    gameState, setGameState,
    setPlayers, setRoles,
    setMyRole, setHistory,
    myRole, clearRoom, setRoom,
    language, setLanguage,
    gameType, setGameType,
    resetSession,
    settingsOpen, toggleSettings,
  } = useGameStore();

  const offlinePhase   = useOfflineStore((s) => s.phase);
  const offlineGameType= useOfflineStore((s) => s.gameType);
  const resetOffline   = useOfflineStore((s) => s.reset);
  const setOfflineLang = useOfflineStore((s) => s.setLanguage);

  const t     = useTranslation(language);
  const isRTL = language === 'ar';

  const [showTransition, setShowTransition] = useState(false);
  const prevPhaseRef = useRef(null);
  const tabPlayerId  = getPlayerId();
  useMouseTracker();

  useEffect(() => {
    const savedLang = lsGet('mafia_lang');
    if (savedLang) {
      setLanguage(savedLang);
      setLangChosen(true);
    }

    // Always start at null (Home) on refresh
    setAppModeRaw(null);
    lsSet('mafia_appMode', null);
  }, []); // eslint-disable-line

  useEffect(() => { setOfflineLang(language); }, [language]); // eslint-disable-line

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (roomId && playerId) {
      lsSet('mafia_room', JSON.stringify({ roomId, isHost, playerId }));
    } else if (!roomId) {
      lsSet('mafia_room', null);
    }
  }, [roomId, isHost, playerId]); // eslint-disable-line

  useEffect(() => {
    if (!user || roomId) return;
    try {
      const saved = lsGet('mafia_room');
      if (!saved) return;
      const { roomId: rid, isHost: host, playerId: pid } = JSON.parse(saved);
      if (rid) setRoom(rid, host ?? false, pid || tabPlayerId);
    } catch { /* ignore */ }
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!roomId || !user || appMode !== 'online' || !gameType) return;
    const pid = playerId || tabPlayerId;
    const u1 = subscribeGameState(roomId, setGameState, gameType);
    const u2 = subscribePlayers(roomId, setPlayers);
    const u3 = subscribeMyRole(roomId, pid, setMyRole, gameType);
    const u4 = subscribeRoles(roomId, setRoles, gameType);
    const u5 = subscribeHistory(roomId, setHistory, gameType);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [roomId, user?.uid, gameType, appMode]); // eslint-disable-line

  useEffect(() => {
    if (!roomId || !user || appMode !== 'online') return;
    const pid = playerId || tabPlayerId;

    const unsubMeta = onValue(ref(db, `rooms/${roomId}/meta`), (snap) => {
      if (isHost) return;
      if (!snap.exists()) { toast(t('hostEndedGame'), 'info'); clearRoom(); return; }
      if (snap.val()?.status === 'closed') { toast(t('hostLeftGame'), 'info'); clearRoom(); }
    });

    const unsubPlayer = onValue(ref(db, `rooms/${roomId}/players/${pid}`), (snap) => {
      if (!snap.exists() && roomId) {
        toast(t('kickedMessage'), 'error');
        vibrate(HAPTICS.ERROR);
        clearRoom();
      }
    });

    return () => { unsubMeta(); unsubPlayer(); };
  }, [roomId, isHost, user?.uid, playerId, language, appMode]); // eslint-disable-line

  useEffect(() => {
    if (!roomId || !playerId) return;
    const connPath = ref(db, '.info/connected');
    const presPath = ref(db, `rooms/${roomId}/players/${playerId}/connected`);

    const unsub = onValue(connPath, (snap) => {
      if (snap.val() !== true) return;
      onDisconnect(presPath).set(false);
      dbSet(presPath, true).catch(() => {});
    });

    return () => {
      unsub();
      dbSet(presPath, false).catch(() => {});
    };
  }, [roomId, playerId]); // eslint-disable-line

  const phase = gameState?.phase ?? PHASES.LOBBY;
  useEffect(() => {
    resumeCtx();
    if (
      gameType === 'mafia' &&
      prevPhaseRef.current &&
      prevPhaseRef.current !== phase &&
      MAFIA_TRANSITION_PHASES.has(phase)
    ) {
      setShowTransition(true);
      vibrate(HAPTICS.NOTIFICATION);
      if (phase === PHASES.NIGHT) startMafiaAmbient();
      else if (phase === PHASES.DISCUSSION || phase === PHASES.VOTING) stopAmbient();
    }
    if (gameType === 'spy' && phase === PHASES.DISCUSSION) startSpyAmbient();
    if (phase === PHASES.GAME_OVER || phase === PHASES.LOBBY) stopAmbient();
    prevPhaseRef.current = phase;
  }, [phase, gameType]);

  const myPlayerId = playerId || tabPlayerId;

  // ── Loading: wait for useEffect hydration tick ─────────────────────────────
  if (appMode === 'loading') {
    return (
      <div className="screen bg-noir-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <motion.div
            animate={{
              rotate:  360,
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              rotate:  { duration: 1.5, repeat: Infinity, ease: 'linear'     },
              opacity: { duration: 2,   repeat: Infinity, ease: 'easeInOut'  },
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

  // ── Language selection gate ────────────────────────────────────────────────
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

  // ── Game Selector ──────────────────────────────────────────────────────────
  if (!gameType) {
    return (
      <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
        <AnimatePresence>
          <motion.div key="gamesel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }} className="absolute inset-0">
            {/* FIX (P2): pass onLangReset so GameSelector's back button triggers a
                clean in-memory state reset instead of window.location.reload(). */}
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

  // ── Mode Select ────────────────────────────────────────────────────────────
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

  // ── Offline screen router ──────────────────────────────────────────────────
  function renderOfflineScreen() {
    switch (offlinePhase) {
      case OFFLINE_PHASES.LOBBY:
        return <OfflineLobbyScreen key="off-lobby" onBackToMode={() => {
          resetOffline();
          lsSet('mafia_appMode', null);
          setAppModeRaw(null);
        }} />;
      case OFFLINE_PHASES.ENVELOPE:
        return offlineGameType === 'spy'
          ? <OfflineSpyRevealScreen key="off-spy-reveal" />
          : <OfflineEnvelopeScreen  key="off-env" />;
      case OFFLINE_PHASES.CLOSE_EYES:      return <OfflineCloseEyesScreen  key="off-eyes" />;
      case OFFLINE_PHASES.NIGHT:           return <OfflineNightScreen       key="off-night" />;
      case OFFLINE_PHASES.DAWN:            return <OfflineDawnScreen        key="off-dawn" />;
      case OFFLINE_PHASES.DISCUSSION:      return <OfflineDiscussionScreen  key="off-disc" />;
      case OFFLINE_PHASES.VOTING:          return <OfflineVotingScreen      key="off-vote" />;
      case OFFLINE_PHASES.EXECUTION:       return <OfflineExecutionScreen   key="off-exec" />;
      case OFFLINE_PHASES.SPY_INTERROGATE: return <OfflineSpyInterrogateScreen key="off-spy-int" />;
      case OFFLINE_PHASES.GAME_OVER:
        return (
          <OfflineGameOverScreen key="off-gameover" onPlayAgain={() => {
            resetSession();
            resetOffline();
            lsSet('mafia_appMode', null);
            setAppModeRaw(null);
          }} />
        );
      default:
        return <OfflineLobbyScreen key="off-lobby-fb" onBackToMode={() => {
          resetOffline();
          lsSet('mafia_appMode', null);
          setAppModeRaw(null);
        }} />;
    }
  }

  // ── Online screen router ───────────────────────────────────────────────────
  function renderOnlineScreen() {
    if (!authReady) return null;
    if (!user)      return <AuthScreen key="auth" />;
    if (!roomId)    return <LandingScreen key="landing" user={user} tabPlayerId={tabPlayerId} />;

    if (gameType === 'spy') {
      switch (phase) {
        case PHASES.LOBBY:      return <LobbyScreen         key="spy-lobby"    user={user} playerId={myPlayerId} />;
        case PHASES.ENVELOPE:
          return <SpyRevealScreen key="spy-reveal" user={user}
            onExpire={async () => { if (isHost) await advanceToDiscussion(roomId, 'spy', 180); }} />;
        case PHASES.DISCUSSION: return <SpyDiscussionScreen key="spy-disc"     user={user} playerId={myPlayerId} />;
        case PHASES.VOTING:     return <SpyVotingScreen     key="spy-vote"     user={user} playerId={myPlayerId} />;
        case PHASES.SPY_GUESS:  return <SpyGuessScreen      key="spy-guess"    user={user} playerId={myPlayerId} />;
        case PHASES.GAME_OVER:  return <GameOverScreen      key="spy-over"     user={user} playerId={myPlayerId} />;
        default:                return <LobbyScreen         key="spy-fallback" user={user} playerId={myPlayerId} />;
      }
    }

    switch (phase) {
      case PHASES.LOBBY:       return <LobbyScreen      key="lobby"      user={user} playerId={myPlayerId} />;
      case PHASES.ENVELOPE:
        return <EnvelopeScreen key="envelope" user={user} playerId={myPlayerId}
          onExpire={async () => { if (isHost) await advanceToNight(roomId); }} />;
      case PHASES.NIGHT:       return <NightScreen      key="night"      user={user} playerId={myPlayerId} />;
      case PHASES.DAWN_SCROLL: return <DawnScrollScreen key="dawn"       user={user} playerId={myPlayerId} />;
      case PHASES.DISCUSSION:  return <DiscussionScreen key="discussion" user={user} playerId={myPlayerId} />;
      case PHASES.VOTING:      return <VotingScreen     key="voting"     user={user} playerId={myPlayerId} />;
      case PHASES.EXECUTION:   return <ExecutionScreen  key="execution"  user={user} playerId={myPlayerId} />;
      case PHASES.GAME_OVER:   return <GameOverScreen   key="gameover"   user={user} playerId={myPlayerId} />;
      default:                 return <LobbyScreen      key="lobby-fb"   user={user} playerId={myPlayerId} />;
    }
  }

  // ── Offline shell ──────────────────────────────────────────────────────────
  if (appMode === 'offline') {
    return (
      <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
        <AnimatePresence>
          <motion.div key={offlinePhase ?? 'fallback'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} className="absolute inset-0">
            {renderOfflineScreen()}
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

  // ── Online shell ───────────────────────────────────────────────────────────
  return (
    <div className="relative w-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100dvh' }}>
      <AnimatePresence>
        <motion.div key={`${gameType}__${roomId ?? 'none'}__${phase}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }} className="absolute inset-0">
          {renderOnlineScreen()}
        </motion.div>
      </AnimatePresence>

      {roomId && <GameHUD phase={phase} round={gameState?.round} myRole={myRole} />}

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
