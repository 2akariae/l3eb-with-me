// src/games/detective/components/shared/DetectiveSVGRegistry.jsx
import React from 'react';

const ICONS = {
  // Weapons
  weapon_poison: (<path d="M12 2v20M5 7l14 10M5 17l14-10M12 2h0" stroke="currentColor" />), // Placeholder paths, need real paths
  weapon_garrote: (<path d="M4 12h16" stroke="currentColor" />),
  weapon_pistol: (<path d="M4 12h16M15 8l5 4-5 4" stroke="currentColor" />),
  weapon_blade: (<path d="M4 20l16-16" stroke="currentColor" />),
  weapon_blunt: (<path d="M12 2v20" stroke="currentColor" />),
  weapon_explosive: (<path d="M12 2l4 8-4 8-4-8z" stroke="currentColor" />),
  
  // Clues (placeholders)
  clue_glove: (<path d="M12 2l2 4 2-2 4 4-2 2 4 4-2 2-4-4-2 2-4-4z" stroke="currentColor" />),
  clue_photo: (<path d="M3 3h18v18H3zM3 15l4-4 4 4 4-4 4 4" stroke="currentColor" />),
  clue_note: (<path d="M3 3h18v18H3zM7 7h10M7 11h10M7 15h6" stroke="currentColor" />),
  clue_cigarette: (<path d="M2 12h16" stroke="currentColor" />),
  clue_watch: (<path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" stroke="currentColor" />),
  clue_soil: (<path d="M2 20h20" stroke="currentColor" />),
  
  // UI
  icon_mic: (<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" stroke="currentColor" />),
  icon_mic_active: (<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" stroke="currentColor" strokeWidth="2" />),
  icon_play: (<path d="M5 3l14 9-14 9z" stroke="currentColor" />),
  icon_pause: (<path d="M6 3h4v18H6zM14 3h4v18h-4z" stroke="currentColor" />),
  icon_send: (<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" />),
  icon_user: (<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" />),
  icon_shield: (<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" />),
  icon_crown: (<path d="M2 12l5-5 5 5 5-5 5 5v10H2z" stroke="currentColor" />),
  icon_eye: (<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" stroke="currentColor" />),
  icon_check: (<path d="M20 6L9 17l-5-5" stroke="currentColor" />),
  icon_clock: (<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" stroke="currentColor" />),
  icon_alert: (<path d="M12 2L2 22h20L12 2zm0 14h.01M12 10v4" stroke="currentColor" />),
};

export function DetectiveIcon({ name, size=24, color='currentColor' }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icon}
    </svg>
  );
}
