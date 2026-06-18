// ─── L3EBWITHME PLATFORM — router/OfflineRouter.jsx ───────────────────────────
// Extracted from App.jsx's `renderOfflineScreen()` — see OnlineRouter.jsx for
// the full rationale (function-as-router anti-pattern vs. a real component).

import React from 'react';
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

/**
 * @param {Object} props
 * @param {() => void} props.onBackToMode - resets offline state and returns to mode select
 */
export default function OfflineRouter({ onBackToMode }) {
  const phase        = useOfflineStore((s) => s.phase);
  const gameType      = useOfflineStore((s) => s.gameType);
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
