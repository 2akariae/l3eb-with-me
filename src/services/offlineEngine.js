// ─── THE MAFIA PLATFORM — services/offlineEngine.js (v8) ─────────────────────
// FIX: getRandomWord now returns { word: {en,ar}, category: {en,ar} } — stored
//      as bilingual objects in offlineStore so components resolve with language key.
// FIX: confirmExile — single atomic setState prevents stale-read of exileTarget.
// FIX: startOfflineGame resets ALL Spy-specific fields when switching to Mafia.

import { assignRoles } from '../constants/game.js';
import { useOfflineStore, OFFLINE_PHASES } from '../store/offlineStore.js';
import { getRandomWord } from '../constants/wordPack.js';
import { generateSpyWord } from '../games/spy/hooks/useGeminiWords.js';

export async function startOfflineGame() {
  const { players, gameType, usedWords, addUsedWord } = useOfflineStore.getState();
  const isSpy      = gameType === 'spy';
  const minPlayers = isSpy ? 3 : 4;

  if (players.length < minPlayers) {
    throw new Error(`Need at least ${minPlayers} players`);
  }

  const ids       = players.map((p) => p.id);
  const playerMap = Object.fromEntries(players.map((p) => [p.id, { name: p.name }]));

  let roles    = {};
  let word     = null;
  let hint     = null;
  let spyId    = null;

  if (isSpy) {
    spyId = ids[Math.floor(Math.random() * ids.length)];
    ids.forEach((id) => { roles[id] = id === spyId ? 'spy' : 'citizen'; });
    
    let picked = await generateSpyWord();
    
    // Prevent repetition logic
    let attempts = 0;
    while (usedWords.includes(picked.word.en) && attempts < 20) {
      picked = await generateSpyWord();
      attempts++;
    }
    addUsedWord(picked.word.en);

    word     = picked.word; // { en, ar }
    hint     = picked.hint; // { en, ar } (Renamed from category)
  } else {
    roles = assignRoles(ids, playerMap);
  }

  useOfflineStore.setState({
    roles,
    alivePlayers:     [...ids],
    envelopeIndex:    0,
    envelopeDone:     false,
    round:            1,
    phase:            OFFLINE_PHASES.ENVELOPE,
    mafiaKill:        null,
    doctorSave:       null,
    detectiveCheck:   null,
    nightStep:        0,
    lastKilled:       null,
    lastExecuted:     null,
    lastExecutedRole: null,
    winner:           null,
    history:          [],
    exileTarget:      null,
    detectiveResult:  null,
    word,
    hint,
    spyId,
  });
}

export async function restartOfflineGame() {
  const { restart } = useOfflineStore.getState();
  restart();
  await startOfflineGame();
}

export function resolveNightAndGoDawn() {
  const store = useOfflineStore.getState();
  store.resolveNight();
  useOfflineStore.setState({ phase: OFFLINE_PHASES.DAWN });
}

export function dawnToDiscussion() {
  const store  = useOfflineStore.getState();
  const winner = store.checkWinner();
  if (winner) {
    store.setWinner(winner);
    useOfflineStore.setState({ phase: OFFLINE_PHASES.GAME_OVER });
  } else {
    useOfflineStore.setState({ phase: OFFLINE_PHASES.DISCUSSION });
  }
}

export function startVoting() {
  useOfflineStore.setState({ phase: OFFLINE_PHASES.VOTING, exileTarget: null });
}

// FIX: single atomic setState — avoids stale-read of exileTarget.
// Bug was: setExileTarget() + resolveExecution() were separate calls.
// resolveExecution() read exileTarget immediately but setState hadn't committed.
export function confirmExile(targetId) {
  if (!targetId) {
    // SKIP — advance to execution screen with no exile
    useOfflineStore.setState({
      exileTarget:      null,
      lastExecuted:     null,
      lastExecutedRole: null,
      phase:            OFFLINE_PHASES.EXECUTION,
    });
    return;
  }

  const { alivePlayers, roles, players, history, round } = useOfflineStore.getState();
  const newAlive   = alivePlayers.filter((id) => id !== targetId);
  const exiledName = players.find((p) => p.id === targetId)?.name ?? '?';

  useOfflineStore.setState({
    exileTarget:      targetId,
    lastExecuted:     targetId,
    lastExecutedRole: roles[targetId] ?? 'citizen',
    alivePlayers:     newAlive,
    history:          [...history, { round, event: `${exiledName} exiled` }],
    phase:            OFFLINE_PHASES.EXECUTION,
  });
}

export function executionToNextRound() {
  const store  = useOfflineStore.getState();
  const winner = store.checkWinner();
  if (winner) {
    store.setWinner(winner);
    useOfflineStore.setState({ phase: OFFLINE_PHASES.GAME_OVER });
  } else {
    useOfflineStore.setState({
      phase:           OFFLINE_PHASES.CLOSE_EYES,
      round:           store.round + 1,
      lastKilled:      null,
      lastExecuted:    null,
      detectiveResult: null,
    });
  }
}

export function closeEyesToNight() {
  useOfflineStore.setState({ phase: OFFLINE_PHASES.NIGHT, nightStep: 0 });
}

export function genPlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
