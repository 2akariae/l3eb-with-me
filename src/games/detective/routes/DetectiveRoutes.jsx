// src/games/detective/routes/DetectiveRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DetectiveLobby } from '../components/lobby/DetectiveLobby.jsx';
import { SetupPhase } from '../components/phases/SetupPhase.jsx';
import { WitnessPhase } from '../components/phases/WitnessPhase.jsx';
import { DiscussionPhase } from '../components/phases/DiscussionPhase.jsx';
import { AccusationPhase } from '../components/phases/AccusationPhase.jsx';
import { ResolutionScreen } from '../components/resolution/ResolutionScreen.jsx';

export default function DetectiveRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DetectiveLobby />} />
      <Route path="/lobby" element={<DetectiveLobby />} />
      <Route path="/room/:roomId" element={
        // This would normally render the active phase component based on store
        <SetupPhase /> 
      } />
      <Route path="/room/:roomId/result" element={<ResolutionScreen />} />
    </Routes>
  );
}
