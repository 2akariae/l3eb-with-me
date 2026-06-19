// src/games/detective/routes/DetectiveRoutes.jsx
import React from 'react';
import { useDetectiveStore } from '../store/detectiveStore.js';
import { PHASES } from '../constants/detectiveConstants.js';

import { DetectiveLobby } from '../components/lobby/DetectiveLobby.jsx';
import { SetupPhase } from '../components/phases/SetupPhase.jsx';
import { WitnessPhase } from '../components/phases/WitnessPhase.jsx';
import { DiscussionPhase } from '../components/phases/DiscussionPhase.jsx';
import { AccusationPhase } from '../components/phases/AccusationPhase.jsx';
import { ResolutionScreen } from '../components/resolution/ResolutionScreen.jsx';

export default function DetectiveRoutes() {
  const { currentPhase } = useDetectiveStore();

  switch (currentPhase) {
    case PHASES.LOBBY:
      return <DetectiveLobby key="lobby" />;
    case PHASES.SETUP:
      return <SetupPhase key="setup" />;
    case PHASES.WITNESS:
      return <WitnessPhase key="witness" />;
    case PHASES.DISCUSSION:
      return <DiscussionPhase key="discussion" />;
    case PHASES.ACCUSATION:
      return <AccusationPhase key="accusation" />;
    case PHASES.RESOLUTION:
      return <ResolutionScreen key="resolution" />;
    default:
      return <DetectiveLobby key="lobby-fallback" />;
  }
}
