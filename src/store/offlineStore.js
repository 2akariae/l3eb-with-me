// offlineStore.js — v10-fixed-b2
// FIX-B1: removed illegal useTranslation hook call from resolveNight().
// FIX-B2: reset() now preserves gameType+language so restarting an offline
//         Spy game stays in Spy, not Mafia.
import { create } from 'zustand';
import { useTranslation } from '../constants/translations.js';

export const OFFLINE_PHASES = {
  LOBBY:          'lobby',
  ENVELOPE:       'envelope',
  CLOSE_EYES:     'close_eyes',
  NIGHT:          'night',
  DAWN:           'dawn',
  DISCUSSION:     'discussion',
  VOTING:         'voting',
  EXECUTION:      'execution',
  GAME_OVER:      'game_over',
  SPY_INTERROGATE:'spy_interrogate',
};

export function useOfflineLang(lang = 'en') {
  return useTranslation(lang);
}

// Ephemeral state reset per game — does NOT include gameType or language.
const RESETTABLE = {
  phase:           OFFLINE_PHASES.LOBBY,
  players:         [],
  roles:           {},
  word:            null,
  category:        null,
  spyId:           null,
  round:           0,
  envelopeIndex:   0,
  envelopeDone:    false,
  nightStep:       0,
  mafiaKill:       null,
  doctorSave:      null,
  detectiveCheck:  null,
  lastKilled:      null,
  lastExecuted:    null,
  lastExecutedRole:null,
  detectiveResult: null,
  scrollLines:     [],
  exileTarget:     null,
  history:         [],
  winner:          null,
  alivePlayers:    [],
  settings:        { discussionTime: 180 },
};

const INITIAL = {
  ...RESETTABLE,
  gameType: 'mafia',
  language: 'en',
};

export const useOfflineStore = create((set, get) => ({
  ...INITIAL,

  // Preserves gameType and language — so restarting Spy stays in Spy.
  reset: () => set((s) => ({ ...RESETTABLE, gameType: s.gameType, language: s.language })),

  setPhase:         (phase)  => set({ phase }),
  setGameType:      (gt)     => set({ gameType: gt }),
  setPlayers:       (p)      => set({ players: p }),
  setRoles:         (r)      => set({ roles: r }),
  setLanguage:      (lang)   => set({ language: lang }),
  setMafiaKill:     (id)     => set({ mafiaKill: id }),
  setDoctorSave:    (id)     => set({ doctorSave: id }),
  setDetectiveCheck:(id)     => set({ detectiveCheck: id }),
  setNightStep:     (s)      => set({ nightStep: s }),
  setExileTarget:   (id)     => set({ exileTarget: id }),
  setWinner:        (w)      => set({ winner: w }),
  setRound:         (r)      => set({ round: r }),
  setAlivePlayers:  (a)      => set({ alivePlayers: a }),
  updateSettings:   (s)      => set((st) => ({ settings: { ...st.settings, ...s } })),

  nextEnvelope: () => {
    const { envelopeIndex, players, gameType } = get();
    const next = envelopeIndex + 1;
    if (next >= players.length) {
      set({ envelopeDone: true, phase: gameType === 'spy' ? OFFLINE_PHASES.SPY_INTERROGATE : OFFLINE_PHASES.CLOSE_EYES });
    } else {
      set({ envelopeIndex: next });
    }
  },

  resolveNight: () => {
    const { mafiaKill, doctorSave, detectiveCheck, roles, players, alivePlayers, history, round, language } = get();
    const killed     = (mafiaKill && mafiaKill !== doctorSave) ? mafiaKill : null;
    const doctorSaved= (mafiaKill && mafiaKill === doctorSave) ? doctorSave : null;
    const newAlive   = killed ? alivePlayers.filter(id => id !== killed) : [...alivePlayers];
    const victimName = killed ? (players.find(p => p.id === killed)?.name ?? '?') : null;
    let lines;
    if (killed) {
      lines = language === 'ar'
        ? [`المدينة تستيقظ على مأساة...`, `وُجد ${victimName} ميتاً.`, `على المدينة إيجاد القاتل.`]
        : [`The city wakes to tragedy...`, `${victimName} was found dead.`, `The town must find the killer.`];
    } else if (doctorSaved) {
      lines = language === 'ar'
        ? [`عمل الطبيب طوال الليل.`, `بفضل مهارته، لم يمت أحد.`, `المدينة بخير... في الوقت الحالي.`]
        : [`The Doctor worked through the night.`, `Thanks to their skill, no one died.`, `The town lives to fight another day.`];
    } else {
      lines = language === 'ar'
        ? [`مرت ليلة هادئة.`, `لم يُصَب أحد بأذى.`, `لكن المافيا لا تزال بينكم.`]
        : [`A quiet night passed.`, `No one was harmed.`, `But the Mafia is still among you.`];
    }
    set({
      lastKilled: killed,
      detectiveResult: detectiveCheck ? (roles[detectiveCheck] === 'mafia') : null,
      alivePlayers: newAlive,
      scrollLines: lines,
      history: [...history, { round, event: killed ? `${victimName} killed` : 'No kill' }],
      mafiaKill: null, doctorSave: null, detectiveCheck: null, nightStep: 0,
    });
  },

  resolveExecution: () => {
    const { exileTarget, roles, alivePlayers, players, history, round } = get();
    if (!exileTarget) { set({ lastExecuted: null, lastExecutedRole: null }); return; }
    const newAlive   = alivePlayers.filter(id => id !== exileTarget);
    const exiledName = players.find(p => p.id === exileTarget)?.name ?? '?';
    set({
      lastExecuted: exileTarget,
      lastExecutedRole: roles[exileTarget] ?? 'citizen',
      alivePlayers: newAlive,
      history: [...history, { round, event: `${exiledName} exiled` }],
    });
  },

  checkWinner: () => {
    const { alivePlayers, roles } = get();
    const aliveMafia = alivePlayers.filter(id => roles[id] === 'mafia').length;
    const aliveTown  = alivePlayers.filter(id => roles[id] !== 'mafia').length;
    if (aliveMafia === 0)        return 'town';
    if (aliveMafia >= aliveTown) return 'mafia';
    return null;
  },
}));
