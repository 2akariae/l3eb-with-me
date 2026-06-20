// ─── L3EBWITHME PLATFORM — router/OfflineRouter.jsx ───────────────────────────
// BUG FIX: The Detective was selectable as an offline game but OfflineRouter
//   had NO switch cases for gameType === 'detective'. Selecting "The Detective"
//   then "Offline" fell through to the Mafia lobby (default case) because the
//   offline detective flow doesn't exist yet.
//
//   FIX: Added an explicit guard at the top of the render — if gameType is
//   'detective', show a clear "Detective is online-only" screen instead of
//   silently rendering the Mafia lobby. This prevents the ghost-lobby bug
//   until a native offline Detective mode is implemented.
//
// NO OTHER LOGIC CHANGED. Mafia and Spy offline flows are untouched.

import React from 'react';
import { motion } from 'framer-motion';
import { useOfflineStore, OFFLINE_PHASES } from '../store/offlineStore.js';
import { useGameStore } from '../store/gameStore.js';

import OfflineLobbyScreen          from '../games/mafia/components/offline/OfflineLobbyScreen.jsx';
import OfflineEnvelopeScreen       from '../games/mafia/components/offline/OfflineEnvelopeScreen.jsx';
import OfflineCloseEyesScreen      from '../games/mafia/components/offline/OfflineCloseEyesScreen.jsx';
import OfflineNightScreen          from '../games/mafia/components/offline/OfflineNightScreen.jsx';
import OfflineDawnScreen           from '../games/mafia/components/offline/OfflineDawnScreen.jsx';
import OfflineDiscussionScreen     from '../games/mafia/components/offline/OfflineDiscussionScreen.jsx';
import OfflineVotingScreen         from '../games/mafia/components/offline/OfflineVotingScreen.jsx';
import OfflineExecutionScreen      from '../games/mafia/components/offline/OfflineExecutionScreen.jsx';
import OfflineGameOverScreen       from '../games/mafia/components/offline/OfflineGameOverScreen.jsx';
import OfflineSpyRevealScreen      from '../games/spy/components/OfflineSpyRevealScreen.jsx';
import OfflineSpyInterrogateScreen from '../games/spy/components/OfflineSpyInterrogateScreen.jsx';

function lsSet(key, val) {
  try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch {}
}

// ── Detective Online-Only Guard Screen ─────────────────────────────────────────
function DetectiveOnlineOnlyScreen({ onBack }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] p-8 text-center"
      style={{ background: '#080B12' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-8 max-w-sm"
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'rgba(59,158,255,0.08)',
            border: '1px solid rgba(59,158,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B9EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h2
            className="text-3xl font-black uppercase text-white mb-3"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.15em' }}
          >
            Online Only
          </h2>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'rgba(148,163,184,0.8)' }}
          >
            The Detective requires a live internet connection and real players.
            An offline mode is coming soon.
          </p>
        </div>

        {/* Back Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.03 }}
          onClick={onBack}
          style={{
            minWidth: 180,
            minHeight: 48,
            borderRadius: 99,
            background: 'rgba(59,158,255,0.12)',
            border: '1px solid rgba(59,158,255,0.25)',
            color: '#3B9EFF',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Go Back
        </motion.button>
      </motion.div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {() => void} props.onBackToMode - resets offline state and returns to mode select
 */
export default function OfflineRouter({ onBackToMode }) {
  const phase        = useOfflineStore((s) => s.phase);
  const gameType     = useOfflineStore((s) => s.gameType);
  const resetOffline = useOfflineStore((s) => s.reset);
  const resetSession = useGameStore((s) => s.resetSession);

  function handleBackToMode() {
    resetOffline();
    lsSet('mafia_appMode', null);
    onBackToMode();
  }

  function handlePlayAgain() {
    resetSession();
    resetOffline();
    lsSet('mafia_appMode', null);
    onBackToMode();
  }

  // ── BUG FIX: Detective has no offline mode — show guard screen instead of
  //   falling through to the Mafia lobby (which was the previous behavior).
  if (gameType === 'detective') {
    return <DetectiveOnlineOnlyScreen key="detective-offline-guard" onBack={handleBackToMode} />;
  }

  switch (phase) {
    case OFFLINE_PHASES.LOBBY:
      return <OfflineLobbyScreen key="off-lobby" onBackToMode={handleBackToMode} />;
    case OFFLINE_PHASES.ENVELOPE:
      return gameType === 'spy'
        ? <OfflineSpyRevealScreen key="off-spy-reveal" />
        : <OfflineEnvelopeScreen  key="off-env" />;
    case OFFLINE_PHASES.CLOSE_EYES:
      return <OfflineCloseEyesScreen key="off-eyes" />;
    case OFFLINE_PHASES.NIGHT:
      return <OfflineNightScreen key="off-night" />;
    case OFFLINE_PHASES.DAWN:
      return <OfflineDawnScreen key="off-dawn" />;
    case OFFLINE_PHASES.DISCUSSION:
      return <OfflineDiscussionScreen key="off-disc" />;
    case OFFLINE_PHASES.VOTING:
      return <OfflineVotingScreen key="off-vote" />;
    case OFFLINE_PHASES.EXECUTION:
      return <OfflineExecutionScreen key="off-exec" />;
    case OFFLINE_PHASES.SPY_INTERROGATE:
      return <OfflineSpyInterrogateScreen key="off-spy-int" />;
    case OFFLINE_PHASES.GAME_OVER:
      return <OfflineGameOverScreen key="off-gameover" onPlayAgain={handlePlayAgain} />;
    default:
      return <OfflineLobbyScreen key="off-lobby-fb" onBackToMode={handleBackToMode} />;
  }
}
