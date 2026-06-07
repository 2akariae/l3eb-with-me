// ─── THE MAFIA PLATFORM — constants/game.js (v10-fixed) ─────────────────────
// BUG FIXED (P3): ROLE_META entries were missing a `description` field.
//   NightScreen rendered `meta.description` for the role card subtitle, which
//   was always `undefined` (rendered blank). Added bilingual description and
//   descriptionAr fields to every ROLE_META entry.

export const PHASES = {
  LOBBY:       'lobby',
  ENVELOPE:    'envelope',
  NIGHT:       'night',
  DAWN_SCROLL: 'dawn_scroll',
  DISCUSSION:  'discussion',
  VOTING:      'voting',
  EXECUTION:   'execution',
  GAME_OVER:   'game_over',
  SPY_GUESS:   'spy_guess',
};

export const SKIP_THRESHOLD = 0.5;

export const PHASE_TIMING = {
  envelope:   10,
  night:      30,
  discussion: 180,
  voting:     30,
  execution:  8,
};

export const ROLES = {
  MAFIA:   'mafia',
  DOCTOR:  'doctor',
  SHEIKH:  'sheikh',
  CITIZEN: 'citizen',
};

export function getMafiaCount(playerCount) {
  if (playerCount <= 5)  return 1;
  if (playerCount <= 10) return 2;
  return 3;
}

export function assignRoles(playerIds, players) {
  const count    = playerIds.length;
  const mafiaNum = getMafiaCount(count);

  const rolePool = [
    ...Array(mafiaNum).fill(ROLES.MAFIA),
    ROLES.DOCTOR,
    ROLES.SHEIKH,
    ...Array(Math.max(0, count - mafiaNum - 2)).fill(ROLES.CITIZEN),
  ];

  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }

  const roles   = {};
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  shuffled.forEach((pid, idx) => { roles[pid] = rolePool[idx] ?? ROLES.CITIZEN; });

  return roles;
}

export function getAlphaMafia(roles) {
  const mafias = Object.entries(roles)
    .filter(([, r]) => r === ROLES.MAFIA)
    .map(([uid]) => uid);
  return mafias.length > 1 ? mafias[0] : null;
}

export function getRoleMeta(role, lang = 'en') {
  const meta = ROLE_META[role];
  if (!meta) return role;
  if (typeof meta.label === 'object') return meta.label[lang] ?? meta.label.en ?? role;
  return meta.label ?? role;
}

export function getRoleLabel(key, lang = 'en', cfg = null) {
  const meta = ROLE_META[key];
  if (meta) {
    if (typeof meta.label === 'object') return meta.label[lang] ?? meta.label.en ?? key;
    return meta.label ?? key;
  }
  if (cfg && cfg.label) {
    if (typeof cfg.label === 'object') return cfg.label[lang] ?? cfg.label.en ?? key;
    return cfg.label ?? key;
  }
  return key;
}

export const ROLE_META = {
  mafia: {
    label:         { en: 'Mafia',   ar: 'مافيا'   },
    color:         '#e02020',
    glow:          'rgba(224,32,32,0.35)',
    // FIX: added bilingual description for NightScreen role card subtitle
    description:   'Eliminate the town without being caught.',
    descriptionAr: 'تخلص من المواطنين في الخفاء.',
  },
  doctor: {
    label:         { en: 'Doctor',  ar: 'طبيب'    },
    color:         '#10b981',
    glow:          'rgba(16,185,129,0.35)',
    description:   'Protect one player each night.',
    descriptionAr: 'احمِ لاعباً واحداً كل ليلة.',
  },
  sheikh: {
    label:         { en: 'Sheikh',  ar: 'شيخ'     },
    color:         '#3b82f6',
    glow:          'rgba(59,130,246,0.35)',
    description:   'Investigate one player per night.',
    descriptionAr: 'تحقق من لاعب واحد كل ليلة.',
  },
  citizen: {
    label:         { en: 'Citizen', ar: 'مواطن'   },
    color:         '#c9943a',
    glow:          'rgba(201,148,58,0.35)',
    description:   'Debate, deduce, and vote out the Mafia.',
    descriptionAr: 'ناقش واستنتج وأخرج المافيا.',
  },
  spy: {
    label:         { en: 'The Spy', ar: 'الجاسوس' },
    color:         '#10b981',
    glow:          'rgba(16,185,129,0.35)',
    description:   'Stay hidden. Guess the secret word to win.',
    descriptionAr: 'ابقَ مخفياً وخمّن الكلمة السرية للفوز.',
  },
};

// ── Avatar system (v10) ───────────────────────────────────────────────────────
export const AGENT_AVATARS = [
  { id: 'a01', gradient: ['#7c3aed','#4f46e5'], shape: 'A' },
  { id: 'a02', gradient: ['#dc2626','#9f1239'], shape: 'B' },
  { id: 'a03', gradient: ['#059669','#065f46'], shape: 'C' },
  { id: 'a04', gradient: ['#d97706','#92400e'], shape: 'D' },
  { id: 'a05', gradient: ['#0891b2','#0e7490'], shape: 'E' },
  { id: 'a06', gradient: ['#db2777','#9d174d'], shape: 'F' },
  { id: 'a07', gradient: ['#6d28d9','#7c3aed'], shape: 'B' },
  { id: 'a08', gradient: ['#b45309','#d97706'], shape: 'A' },
  { id: 'a09', gradient: ['#0f766e','#0d9488'], shape: 'C' },
  { id: 'a10', gradient: ['#1d4ed8','#2563eb'], shape: 'D' },
  { id: 'a11', gradient: ['#be185d','#db2777'], shape: 'E' },
  { id: 'a12', gradient: ['#16a34a','#15803d'], shape: 'F' },
  { id: 'a13', gradient: ['#e11d48','#be123c'], shape: 'A' },
  { id: 'a14', gradient: ['#7c3aed','#a855f7'], shape: 'C' },
  { id: 'a15', gradient: ['#c2410c','#ea580c'], shape: 'B' },
  { id: 'a16', gradient: ['#0369a1','#0284c7'], shape: 'D' },
  { id: 'a17', gradient: ['#064e3b','#065f46'], shape: 'E' },
  { id: 'a18', gradient: ['#3730a3','#4338ca'], shape: 'F' },
  { id: 'a19', gradient: ['#831843','#9d174d'], shape: 'A' },
  { id: 'a20', gradient: ['#713f12','#92400e'], shape: 'C' },
  { id: 'a21', gradient: ['#312e81','#3730a3'], shape: 'B' },
  { id: 'a22', gradient: ['#1e3a5f','#1e40af'], shape: 'D' },
  { id: 'a23', gradient: ['#14532d','#166534'], shape: 'E' },
  { id: 'a24', gradient: ['#4a044e','#7e22ce'], shape: 'F' },
];

export const AVATAR_INITIALS = (name) =>
  name ? name.slice(0, 2).toUpperCase() : '??';

export const AVATAR_COLORS = [
  '#7c3aed','#dc2626','#059669','#d97706',
  '#2563eb','#db2777','#0891b2','#65a30d',
];

export const getAvatarColor = (uid) => {
  if (!uid) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export function getAgentById(id) {
  return AGENT_AVATARS.find((a) => a.id === id) ?? null;
}
