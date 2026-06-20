// src/games/detective/routes/DetectiveRoutes.jsx
// BUG FIX: Previously accepted no props and read currentPhase from the store
//   directly, but the store's roomId/myUid were never populated (useDetectiveRoom
//   was never called). Now receives user/roomId/playerId/isHost from OnlineRouter
//   and forwards them to DetectiveLobby (which calls useDetectiveRoom to wire
//   Firebase listeners).

import React from 'react';
import { useDetectiveStore } from '../store/detectiveStore.js';
import { PHASES } from '../constants/detectiveConstants.js';

import { DetectiveLobby }    from '../components/lobby/DetectiveLobby.jsx';
import { SetupPhase }        from '../components/phases/SetupPhase.jsx';
import { WitnessPhase }      from '../components/phases/WitnessPhase.jsx';
import { DiscussionPhase }   from '../components/phases/DiscussionPhase.jsx';
import { AccusationPhase }   from '../components/phases/AccusationPhase.jsx';
import { ResolutionScreen }  from '../components/resolution/ResolutionScreen.jsx';

/**
 * @param {Object} props
 * @param {Object} props.user       - Firebase auth user object
 * @param {string} props.roomId     - Active room ID from platform gameStore
 * @param {string} props.playerId   - Stable player ID for this tab
 * @param {boolean} props.isHost    - Whether this client is the room host
 */
export default function DetectiveRoutes({ user, roomId, playerId, isHost }) {
  const { currentPhase } = useDetectiveStore();

  switch (currentPhase) {
    case PHASES.LOBBY:
      return (
        <DetectiveLobby
          key="detective-lobby"
          user={user}
          roomId={roomId}
          playerId={playerId}
          isHost={isHost}
        />
      );
    case PHASES.SETUP:
      return (
        <SetupPhase
          key="detective-setup"
          user={user}
          roomId={roomId}
          playerId={playerId}
          isHost={isHost}
        />
      );
    case PHASES.WITNESS:
      return (
        <WitnessPhase
          key="detective-witness"
          user={user}
          roomId={roomId}
          playerId={playerId}
        />
      );
    case PHASES.DISCUSSION:
      return (
        <DiscussionPhase
          key="detective-discussion"
          user={user}
          roomId={roomId}
          playerId={playerId}
        />
      );
    case PHASES.ACCUSATION:
      return (
        <AccusationPhase
          key="detective-accusation"
          user={user}
          roomId={roomId}
          playerId={playerId}
        />
      );
    case PHASES.RESOLUTION:
      return (
        <ResolutionScreen
          key="detective-resolution"
          roomId={roomId}
          playerId={playerId}
        />
      );
    default:
      return (
        <DetectiveLobby
          key="detective-lobby-fallback"
          user={user}
          roomId={roomId}
          playerId={playerId}
          isHost={isHost}
        />
      );
  }
}
