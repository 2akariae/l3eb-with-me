// ─── L3EBWITHME PLATFORM — router/OnlineRouter.jsx ────────────────────────────
// Extracted from App.jsx's `renderOnlineScreen()` — previously a plain
// function called during render (not a React component), which meant React
// could never key/diff its returned tree independently of the parent.
// As a *real* component, AnimatePresence in App.jsx can key off it cleanly
// and React can skip reconciling the rest of the shell when only the phase
// changes.
//
// This file owns ONLY phase→screen mapping for online mode. It has no
// Firebase subscriptions, no audio logic, no presence logic — those live in
// dedicated hooks (useFirebaseSubscriptions, useRoomPresence,
// useGamePhaseEffects) called once from App.jsx.

import React from 'react';
import { useGameStore } from '../store/gameStore.js';
import { PHASES } from '../constants/game.js';
import { advanceToNight, advanceToDiscussion } from '../games/mafia/hooks/useMafiaEngine.js';

import AuthScreen        from '../components/screens/AuthScreen.jsx';
import LandingScreen     from '../components/screens/LandingScreen.jsx';
import LobbyScreen       from '../components/screens/LobbyScreen.jsx';
import EnvelopeScreen    from '../components/screens/EnvelopeScreen.jsx';
import NightScreen       from '../components/screens/NightScreen.jsx';
import DawnScrollScreen  from '../components/screens/DawnScrollScreen.jsx';
import DiscussionScreen  from '../components/screens/DiscussionScreen.jsx';
import VotingScreen      from '../components/screens/VotingScreen.jsx';
import ExecutionScreen   from '../components/screens/ExecutionScreen.jsx';
import GameOverScreen    from '../components/screens/GameOverScreen.jsx';

import SpyRevealScreen     from '../games/spy/components/SpyRevealScreen.jsx';
import SpyDiscussionScreen from '../games/spy/components/SpyDiscussionScreen.jsx';
import SpyVotingScreen     from '../games/spy/components/SpyVotingScreen.jsx';
import SpyGuessScreen      from '../games/spy/components/SpyGuessScreen.jsx';
import DetectiveRoutes     from '../games/detective/routes/DetectiveRoutes.jsx';

/**
 * @param {Object} props
 * @param {boolean} props.authReady - whether Firebase auth has resolved at least once
 * @param {string} props.tabPlayerId - stable per-tab id from utils/session.js
 */
export default function OnlineRouter({ authReady, tabPlayerId }) {
  const { user, roomId, isHost, playerId, gameState, gameType } = useGameStore();
  const phase      = gameState?.phase ?? PHASES.LOBBY;
  const myPlayerId = playerId || tabPlayerId;

  if (!authReady) return null;
  if (!user)      return <AuthScreen key="auth" />;
  if (!roomId)    return <LandingScreen key="landing" user={user} tabPlayerId={tabPlayerId} />;

  if (gameType === 'detective') return <DetectiveRoutes />;

  if (gameType === 'spy') {
    switch (phase) {
      case PHASES.LOBBY:
        return <LobbyScreen key="spy-lobby" user={user} playerId={myPlayerId} />;
      case PHASES.ENVELOPE:
        return (
          <SpyRevealScreen
            key="spy-reveal"
            user={user}
            onExpire={async () => { if (isHost) await advanceToDiscussion(roomId, 'spy', 180); }}
          />
        );
      case PHASES.DISCUSSION:
        return <SpyDiscussionScreen key="spy-disc" user={user} playerId={myPlayerId} />;
      case PHASES.VOTING:
        return <SpyVotingScreen key="spy-vote" user={user} playerId={myPlayerId} />;
      case PHASES.SPY_GUESS:
        return <SpyGuessScreen key="spy-guess" user={user} playerId={myPlayerId} />;
      case PHASES.GAME_OVER:
        return <GameOverScreen key="spy-over" user={user} playerId={myPlayerId} />;
      default:
        return <LobbyScreen key="spy-fallback" user={user} playerId={myPlayerId} />;
    }
  }

  switch (phase) {
    case PHASES.LOBBY:
      return <LobbyScreen key="lobby" user={user} playerId={myPlayerId} />;
    case PHASES.ENVELOPE:
      return (
        <EnvelopeScreen
          key="envelope"
          user={user}
          playerId={myPlayerId}
          onExpire={async () => { if (isHost) await advanceToNight(roomId); }}
        />
      );
    case PHASES.NIGHT:
      return <NightScreen key="night" user={user} playerId={myPlayerId} />;
    case PHASES.DAWN_SCROLL:
      return <DawnScrollScreen key="dawn" user={user} playerId={myPlayerId} />;
    case PHASES.DISCUSSION:
      return <DiscussionScreen key="discussion" user={user} playerId={myPlayerId} />;
    case PHASES.VOTING:
      return <VotingScreen key="voting" user={user} playerId={myPlayerId} />;
    case PHASES.EXECUTION:
      return <ExecutionScreen key="execution" user={user} playerId={myPlayerId} />;
    case PHASES.GAME_OVER:
      return <GameOverScreen key="gameover" user={user} playerId={myPlayerId} />;
    default:
      return <LobbyScreen key="lobby-fb" user={user} playerId={myPlayerId} />;
  }
}
