// src/games/detective/constants/detectiveConstants.js
// Static game content and timing parameters for "The Detective".
// This file is the single source of truth for all game options, roles, phases, and timings.

export const WEAPONS = [
  { id: 'w1', name: 'Poison Vial V2',       svgKey: 'weapon_poison'   },
  { id: 'w2', name: 'Wire Garrote',      svgKey: 'weapon_garrote'  },
  { id: 'w3', name: 'Silenced Pistol',   svgKey: 'weapon_pistol'   },
  { id: 'w4', name: 'Carbon Blade',      svgKey: 'weapon_blade'    },
  { id: 'w5', name: 'Blunt Instrument',  svgKey: 'weapon_blunt'    },
  { id: 'w6', name: 'Explosive Device',  svgKey: 'weapon_explosive'},
];

export const CLUES = [
  { id: 'c1', name: 'Monogrammed Glove', svgKey: 'clue_glove'      },
  { id: 'c2', name: 'Torn Photograph',   svgKey: 'clue_photo'      },
  { id: 'c3', name: 'Encrypted Note',    svgKey: 'clue_note'       },
  { id: 'c4', name: 'Cigarette Stub',    svgKey: 'clue_cigarette'  },
  { id: 'c5', name: 'Broken Watch',      svgKey: 'clue_watch'      },
  { id: 'c6', name: 'Soil Sample',       svgKey: 'clue_soil'       },
];

export const ROLES = {
  DETECTIVE: 'detective',
  KILLER:    'killer',
  WITNESS:   'witness',
  CITIZEN:   'citizen',
};

export const PHASES = {
  LOBBY:        'lobby',
  SETUP:        'setup',
  WITNESS:      'witness',
  DISCUSSION:   'discussion',
  ACCUSATION:   'accusation',
  KILLER_GUESS: 'killerGuess',
  RESOLUTION:   'resolution',
};

export const PHASE_DURATIONS_MS = {
  SETUP:        60_000,
  WITNESS:      30_000,
  DISCUSSION:  180_000,
  ACCUSATION:   60_000,
  KILLER_GUESS: 30_000,
};
