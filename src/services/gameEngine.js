// ─── THE MAFIA PLATFORM — services/gameEngine.js (v10-fixed) ─────────────────
// BUG FIXED (P1): createRoom / joinRoom were registering
//   onDisconnect(playerNode).remove() which removed the entire player node on
//   ANY disconnect — including mobile backgrounding. This caused:
//   1. The graceful-presence system in App.jsx (which registers
//      onDisconnect(connectedPath).set(false)) to be overridden; the full node
//      removal won, leaving the set(false) write pointing at a dangling path.
//   2. On reconnect, App.jsx's unsubPlayer listener saw !snap.exists() and
//      fired a spurious "You have been kicked" toast.
//   FIX: replaced .remove() with onDisconnect(connectedPath).set(false) +
//        dbSet(connectedPath, true) — matching the App.jsx presence design.
//        Players are now marked "away" on disconnect and restored on reconnect.
//
// BUG FIXED (P2): resolveVoting(roomId) ignored its gameType argument because
//   the signature only accepted one parameter. The function now accepts
//   resolveVoting(roomId, gameType = 'mafia') and passes it to getGamePath.

import {
  db, ref, set, get, push, update, remove,
  onValue, onDisconnect, serverTimestamp,
} from './firebaseConfig.js';
import { set as dbSet } from 'firebase/database';
import { assignRoles, getAlphaMafia, PHASES, PHASE_TIMING } from '../constants/game.js';
import { generateSpyWord } from '../games/spy/hooks/useGeminiWords.js';

// ── Path helper ───────────────────────────────────────────────────────────────
function getGamePath(roomId, gameType) {
  return `rooms/${roomId}/${gameType || 'mafia'}`;
}

// ── Room ID generation ────────────────────────────────────────────────────────
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function findUniqueRoomId() {
  let attempts = 0;
  while (attempts < 10) {
    const rid  = generateRoomId();
    const snap = await get(ref(db, `rooms/${rid}/meta`));
    if (!snap.exists()) return rid;
    attempts++;
  }
  throw new Error('Could not generate unique room ID. Try again.');
}

// ── Room Management ───────────────────────────────────────────────────────────

export async function restartRoom(roomId, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  const snap     = await get(ref(db, `${gamePath}/gameState`));
  const gs       = snap.val() ?? {};
  
  const updates = {};
  updates[`${gamePath}/gameState`] = {
    phase:     PHASES.LOBBY,
    round:     0,
    usedWords: gs.usedWords || [],
  };
  updates[`rooms/${roomId}/meta/status`] = 'waiting';
  
  // Clear roles and other game state but keep players
  updates[`${gamePath}/roles`]        = null;
  updates[`${gamePath}/history`]      = null;
  updates[`${gamePath}/chat`]         = null;
  updates[`${gamePath}/mafiaChat`]    = null;
  updates[`${gamePath}/nightActions`] = null;
  updates[`${gamePath}/votes`]        = null;
  updates[`${gamePath}/skipVotes`]    = null;

  await update(ref(db), updates);
}

export async function createRoom(user, name, avatar, tabPlayerId, gameType = 'mafia') {
  const roomId   = await findUniqueRoomId();
  const playerId = tabPlayerId || user.uid;

  await set(ref(db, `rooms/${roomId}`), {
    meta: {
      status:    'waiting',
      createdAt: serverTimestamp(),
      hostUid:   user.uid,
      hostName:  name,
      gameType,
    },
    players: {
      [playerId]: {
        uid:     playerId,
        authUid: user.uid,
        name,
        avatar:  avatar || '',
        isHost:  true,
        isAlive: true,
        joinedAt: serverTimestamp(),
      },
    },
  });

  await set(ref(db, `${getGamePath(roomId, gameType)}/gameState`), {
    phase: PHASES.LOBBY,
    round: 0,
  });

  // FIX (P1): Use graceful presence — mark as "away" on disconnect, do NOT
  // remove the entire player node. This prevents spurious "kicked" toasts on
  // reconnect and is consistent with the App.jsx presence design.
  const connectedPath = ref(db, `rooms/${roomId}/players/${playerId}/connected`);
  onDisconnect(connectedPath).set(false);
  dbSet(connectedPath, true).catch(() => {});

  return { roomId, playerId };
}

export async function joinRoom(user, roomId, name, avatar, tabPlayerId) {
  const metaSnap = await get(ref(db, `rooms/${roomId}/meta`));
  if (!metaSnap.exists()) throw new Error('Room not found.');

  const meta     = metaSnap.val();
  if (meta.status === 'closed') throw new Error('This room is closed.');

  const gameType = meta.gameType || 'mafia';
  const gsSnap   = await get(ref(db, `${getGamePath(roomId, gameType)}/gameState`));
  const phase    = gsSnap.val()?.phase ?? PHASES.LOBBY;
  if (phase !== PHASES.LOBBY) throw new Error('Game already started.');

  const playerId = tabPlayerId || user.uid;
  await set(ref(db, `rooms/${roomId}/players/${playerId}`), {
    uid:     playerId,
    authUid: user.uid,
    name,
    avatar:  avatar || '',
    isHost:  false,
    isAlive: true,
    joinedAt: serverTimestamp(),
  });

  // FIX (P1): graceful presence — same as createRoom above.
  const connectedPath = ref(db, `rooms/${roomId}/players/${playerId}/connected`);
  onDisconnect(connectedPath).set(false);
  dbSet(connectedPath, true).catch(() => {});

  return { roomId, playerId, gameType };
}

export async function leaveRoom(playerId, authUid, roomId) {
  try {
    // Cancel the onDisconnect handler before intentional removal so it doesn't
    // fire redundantly after the node is already gone.
    await onDisconnect(ref(db, `rooms/${roomId}/players/${playerId}/connected`)).cancel();
    await remove(ref(db, `rooms/${roomId}/players/${playerId}`));
    const snap = await get(ref(db, `rooms/${roomId}/players`));
    if (!snap.exists()) await remove(ref(db, `rooms/${roomId}`));
  } catch { /* room may already be gone */ }
}

export async function kickPlayer(roomId, targetPlayerId, targetAuthUid) {
  await remove(ref(db, `rooms/${roomId}/players/${targetPlayerId}`));
  if (targetAuthUid) {
    await set(ref(db, `rooms/${roomId}/banned/${targetAuthUid}`), true);
  }
}

export async function submitJoinRequest(roomId, user, name, avatar, tabPlayerId) {
  await set(ref(db, `rooms/${roomId}/joinRequests/${user.uid}`), {
    name,
    avatar:      avatar || '',
    tabPlayerId: tabPlayerId || user.uid,
    requestedAt: serverTimestamp(),
  });
}

export async function resolveJoinRequest(roomId, targetAuthUid, approved) {
  if (approved) {
    const reqSnap = await get(ref(db, `rooms/${roomId}/joinRequests/${targetAuthUid}`));
    if (reqSnap.exists()) {
      const req = reqSnap.val();
      const pid = req.tabPlayerId || targetAuthUid;
      await set(ref(db, `rooms/${roomId}/players/${pid}`), {
        uid:     pid,
        authUid: targetAuthUid,
        name:    req.name,
        avatar:  req.avatar || '',
        isHost:  false,
        isAlive: true,
        joinedAt: serverTimestamp(),
      });
      await remove(ref(db, `rooms/${roomId}/banned/${targetAuthUid}`));
    }
  }
  await remove(ref(db, `rooms/${roomId}/joinRequests/${targetAuthUid}`));
}

export function subscribeJoinRequests(roomId, callback) {
  return onValue(ref(db, `rooms/${roomId}/joinRequests`), (snap) => callback(snap.val() ?? {}));
}

// ── Game Start (MAFIA) ────────────────────────────────────────────────────────

export async function startGame(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}/players`));
  if (!snap.exists()) throw new Error('No players found.');

  const players   = snap.val();
  const playerIds = Object.keys(players);
  if (playerIds.length < 4) throw new Error('Need at least 4 players to start.');

  const roles    = assignRoles(playerIds, players);
  const alphaUid = getAlphaMafia(roles);
  const gamePath = getGamePath(roomId, 'mafia');
  const updates  = {};

  playerIds.forEach((pid) => {
    updates[`${gamePath}/roles/${pid}`]               = roles[pid];
    updates[`rooms/${roomId}/players/${pid}/isAlive`] = true;
  });

  updates[`${gamePath}/meta/alphaMafiaUid`] = alphaUid ?? null;
  updates[`${gamePath}/doctorState`]        = { selfHealUsed: false, lastProtected: null };
  updates[`${gamePath}/gameState`]          = {
    phase:          PHASES.ENVELOPE,
    round:          1,
    timerStartedAt: serverTimestamp(),
    timerDuration:  PHASE_TIMING.envelope,
  };
  updates[`rooms/${roomId}/meta/status`] = 'playing';

  await update(ref(db), updates);
}

// ── Game Start (SPY) ──────────────────────────────────────────────────────────

export async function startSpyGame(roomId) {
  const [playersSnap, gsSnap] = await Promise.all([
    get(ref(db, `rooms/${roomId}/players`)),
    get(ref(db, `${getGamePath(roomId, 'spy')}/gameState`))
  ]);
  
  if (!playersSnap.exists()) throw new Error('No players found.');

  const players = playersSnap.val();
  const pids    = Object.keys(players);
  if (pids.length < 3) throw new Error('Need at least 3 players for Spy game.');

  const spyId     = pids[Math.floor(Math.random() * pids.length)];
  const gamePath  = getGamePath(roomId, 'spy');
  const usedWords = gsSnap.val()?.usedWords || [];

  let picked = await generateSpyWord();
  let attempts = 0;
  while (usedWords.includes(picked.word.en) && attempts < 15) {
    picked = await generateSpyWord();
    attempts++;
  }

  const updates = {};
  pids.forEach((pid) => {
    updates[`${gamePath}/roles/${pid}`]               = pid === spyId ? 'spy' : 'citizen';
    updates[`rooms/${roomId}/players/${pid}/isAlive`] = true;
  });

  updates[`${gamePath}/gameState`] = {
    phase:          PHASES.ENVELOPE,
    round:          1,
    word:           picked.word,
    hint:           picked.hint,
    spyId,
    usedWords:      [...usedWords, picked.word.en],
    timerStartedAt: serverTimestamp(),
    timerDuration:  10,
  };
  updates[`rooms/${roomId}/meta/status`] = 'playing';

  await update(ref(db), updates);
}

// ── Phase Transitions ─────────────────────────────────────────────────────────

export async function advanceToNight(roomId, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  await update(ref(db, `${gamePath}/gameState`), {
    phase:          PHASES.NIGHT,
    timerStartedAt: serverTimestamp(),
    timerDuration:  PHASE_TIMING.night,
  });
  await remove(ref(db, `${gamePath}/nightActions`));
}

export async function advanceToDiscussion(roomId, gameType = 'mafia', duration = 180) {
  const gamePath = getGamePath(roomId, gameType);
  await update(ref(db, `${gamePath}/gameState`), {
    phase:          PHASES.DISCUSSION,
    timerStartedAt: serverTimestamp(),
    timerDuration:  duration,
  });
  await remove(ref(db, `${gamePath}/skipVotes`));
}

export async function advanceToVoting(roomId, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  await update(ref(db, `${gamePath}/gameState`), {
    phase:          PHASES.VOTING,
    timerStartedAt: serverTimestamp(),
    timerDuration:  PHASE_TIMING.voting,
  });
  await remove(ref(db, `${gamePath}/votes`));
  await remove(ref(db, `${gamePath}/skipVotes`));
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export function subscribeGameState(roomId, callback, gameType) {
  return onValue(ref(db, `${getGamePath(roomId, gameType)}/gameState`), (snap) => callback(snap.val() ?? null));
}

export function subscribePlayers(roomId, callback) {
  return onValue(ref(db, `rooms/${roomId}/players`), (snap) => callback(snap.val() ?? {}));
}

export function subscribeMyRole(roomId, playerId, callback, gameType) {
  return onValue(ref(db, `${getGamePath(roomId, gameType)}/roles/${playerId}`), (snap) => callback(snap.val() ?? null));
}

export function subscribeRoles(roomId, callback, gameType) {
  return onValue(ref(db, `${getGamePath(roomId, gameType)}/roles`), (snap) => callback(snap.val() ?? {}));
}

export function subscribeHistory(roomId, callback, gameType) {
  return onValue(ref(db, `${getGamePath(roomId, gameType)}/history`), (snap) => {
    const data = snap.val() ?? {};
    const arr  = Object.entries(data)
      .map(([k, v]) => ({ id: k, ...v }))
      .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
    callback(arr);
  });
}

export async function nextRound(roomId, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  const snap     = await get(ref(db, `${gamePath}/gameState`));
  const gs       = snap.val() ?? {};
  const nextRoundNum = (gs.round ?? 1) + 1;

  await update(ref(db, `${gamePath}/gameState`), {
    phase:          PHASES.NIGHT,
    round:          nextRoundNum,
    timerStartedAt: serverTimestamp(),
    timerDuration:  PHASE_TIMING.night,
    lastKilled:     null,
    lastSaved:      null,
    lastExecuted:   null,
  });

  await remove(ref(db, `${gamePath}/nightActions`));
  await remove(ref(db, `${gamePath}/votes`));
  await remove(ref(db, `${gamePath}/skipVotes`));
}

// ── Night Actions (MAFIA) ─────────────────────────────────────────────────────

export async function submitNightAction(roomId, playerId, targetId, authUid = null) {
  const gamePath = getGamePath(roomId, 'mafia');
  const actorKey = authUid || playerId;
  await set(ref(db, `${gamePath}/nightActions/${actorKey}`), {
    targetId,
    submittedAt: serverTimestamp(),
  });
}

export function subscribeNightActions(roomId, callback) {
  const gamePath = getGamePath(roomId, 'mafia');
  return onValue(ref(db, `${gamePath}/nightActions`), (snap) => callback(snap.val() ?? {}));
}

export async function resolveNight(roomId) {
  const gamePath = getGamePath(roomId, 'mafia');

  const [actionsSnap, playersSnap, rolesSnap, doctorStateSnap, metaSnap, gsSnap] = await Promise.all([
    get(ref(db, `${gamePath}/nightActions`)),
    get(ref(db, `rooms/${roomId}/players`)),
    get(ref(db, `${gamePath}/roles`)),
    get(ref(db, `${gamePath}/doctorState`)),
    get(ref(db, `${gamePath}/meta`)),
    get(ref(db, `${gamePath}/gameState`)),
  ]);

  const actions     = actionsSnap.val()     ?? {};
  const players     = playersSnap.val()     ?? {};
  const roles       = rolesSnap.val()       ?? {};
  const doctorState = doctorStateSnap.val() ?? { selfHealUsed: false, lastProtected: null };
  const alphaMafiaUid = metaSnap.val()?.alphaMafiaUid ?? null;

  let mafiaTarget  = null;
  let doctorSave   = null;
  let sheikhTarget = null;
  let doctorUid    = null;

  Object.entries(actions).forEach(([pid, action]) => {
    const role = roles[pid];
    if (role === 'mafia') {
      if (!alphaMafiaUid || pid === alphaMafiaUid) {
        if (!mafiaTarget) mafiaTarget = action.targetId;
      }
    }
    if (role === 'doctor') { doctorSave = action.targetId; doctorUid = pid; }
    if (role === 'sheikh') { sheikhTarget = action.targetId; }
  });

  const alivePlayers  = Object.entries(players).filter(([, p]) => p.isAlive);
  const criticalPhase = alivePlayers.length <= 2;

  if (doctorSave && doctorUid && !criticalPhase) {
    if (doctorSave === doctorUid && doctorState.selfHealUsed) doctorSave = null;
    if (doctorSave && doctorSave === doctorState.lastProtected) doctorSave = null;
  }

  const updates    = {};
  let   lastKilled = null;
  let   lastSaved  = null;

  if (mafiaTarget && mafiaTarget !== doctorSave) {
    updates[`rooms/${roomId}/players/${mafiaTarget}/isAlive`] = false;
    lastKilled = mafiaTarget;
  } else if (mafiaTarget && mafiaTarget === doctorSave) {
    lastSaved = mafiaTarget;
  }

  const updatedPlayers = { ...players };
  if (lastKilled) updatedPlayers[lastKilled] = { ...updatedPlayers[lastKilled], isAlive: false };

  const winnerTeam   = checkWinCondition(updatedPlayers, roles);
  const currentRound = gsSnap.val()?.round ?? 1;

  const histRef = push(ref(db, `${gamePath}/history`));
  updates[`${gamePath}/history/${histRef.key}`] = {
    round:  currentRound,
    phase:  'night',
    killed: lastKilled ? players[lastKilled]?.name : null,
    saved:  lastSaved  ? players[lastSaved]?.name  : null,
    ts:     serverTimestamp(),
  };

  updates[`${gamePath}/gameState/lastKilled`] = lastKilled;
  updates[`${gamePath}/gameState/lastSaved`]  = lastSaved;

  if (doctorUid) {
    updates[`${gamePath}/doctorState/lastProtected`] = doctorSave ?? null;
    if (doctorSave === doctorUid) updates[`${gamePath}/doctorState/selfHealUsed`] = true;
  }

  if (sheikhTarget) {
    const sheikhUid = Object.keys(roles).find((pid) => roles[pid] === 'sheikh') ?? null;
    updates[`${gamePath}/gameState/privateResult`] = {
      sheikhUid,
      sheikhTarget,
      isMafia:     roles[sheikhTarget] === 'mafia',
      checkedName: players[sheikhTarget]?.name,
    };
  } else {
    updates[`${gamePath}/gameState/privateResult`] = null;
  }

  if (winnerTeam) {
    updates[`${gamePath}/gameState/phase`]  = PHASES.GAME_OVER;
    updates[`${gamePath}/gameState/winner`] = winnerTeam;
    updates[`rooms/${roomId}/meta/status`]  = 'finished';
  } else {
    updates[`${gamePath}/gameState/phase`] = PHASES.DAWN_SCROLL;
  }

  await update(ref(db), updates);
}

// ── Voting (Mafia) ────────────────────────────────────────────────────────────

export async function submitVote(roomId, playerId, targetId, gameType = 'mafia', authUid = null) {
  const gamePath = getGamePath(roomId, gameType);
  const voterKey = authUid || playerId;
  await set(ref(db, `${gamePath}/votes/${voterKey}`), targetId);
}

export async function submitSkipVote(roomId, playerId, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  await set(ref(db, `${gamePath}/skipVotes/${playerId}`), true);
}

export function subscribeVotes(roomId, callback, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  return onValue(ref(db, `${gamePath}/votes`), (snap) => callback(snap.val() ?? {}));
}

export function subscribeSkipVotes(roomId, callback, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  return onValue(ref(db, `${gamePath}/skipVotes`), (snap) => callback(snap.val() ?? {}));
}

// FIX (P2): resolveVoting now accepts gameType parameter so the function can be
// called correctly by both Mafia and future game modes. Defaults to 'mafia' for
// backwards compatibility with existing callers.
export async function resolveVoting(roomId, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  const [votesSnap, playersSnap, rolesSnap, gsSnap] = await Promise.all([
    get(ref(db, `${gamePath}/votes`)),
    get(ref(db, `rooms/${roomId}/players`)),
    get(ref(db, `${gamePath}/roles`)),
    get(ref(db, `${gamePath}/gameState`)),
  ]);

  const votes   = votesSnap.val()   ?? {};
  const players = playersSnap.val() ?? {};
  const roles   = rolesSnap.val()   ?? {};
  const gs      = gsSnap.val()      ?? {};

  const tally = {};
  Object.values(votes).forEach((targetId) => { tally[targetId] = (tally[targetId] ?? 0) + 1; });

  let executed = null, maxVotes = 0;
  Object.entries(tally).forEach(([pid, count]) => {
    if (count > maxVotes) { maxVotes = count; executed = pid; }
  });

  const isTie = Object.values(tally).filter((c) => c === maxVotes).length > 1;
  if (isTie) executed = null;

  const updates = {};
  if (executed) updates[`rooms/${roomId}/players/${executed}/isAlive`] = false;

  const updatedPlayers = { ...players };
  if (executed) updatedPlayers[executed] = { ...updatedPlayers[executed], isAlive: false };
  const winnerTeam = checkWinCondition(updatedPlayers, roles);

  const histRef = push(ref(db, `${gamePath}/history`));
  updates[`${gamePath}/history/${histRef.key}`] = {
    round:    gs.round ?? 1,
    phase:    'vote',
    executed: executed ? players[executed]?.name : null,
    ts:       serverTimestamp(),
  };
  updates[`${gamePath}/gameState/lastExecuted`] = executed;
  updates[`${gamePath}/gameState/executedRole`] = executed ? roles[executed] ?? 'citizen' : null;

  if (winnerTeam) {
    updates[`${gamePath}/gameState/phase`]  = PHASES.GAME_OVER;
    updates[`${gamePath}/gameState/winner`] = winnerTeam;
    updates[`rooms/${roomId}/meta/status`]  = 'finished';
  } else {
    updates[`${gamePath}/gameState/phase`]          = PHASES.EXECUTION;
    updates[`${gamePath}/gameState/timerStartedAt`] = serverTimestamp();
    updates[`${gamePath}/gameState/timerDuration`]  = PHASE_TIMING.execution;
  }

  await update(ref(db), updates);
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function sendChatMessage(roomId, playerId, name, avatar, text, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  const msgRef   = push(ref(db, `${gamePath}/chat`));
  await set(msgRef, { uid: playerId, name, avatar: avatar || '', text, ts: serverTimestamp() });
}

export function subscribeChat(roomId, callback, gameType = 'mafia') {
  const gamePath = getGamePath(roomId, gameType);
  return onValue(ref(db, `${gamePath}/chat`), (snap) => {
    const data = snap.val() ?? {};
    callback(Object.entries(data)
      .map(([k, v]) => ({ id: k, ...v }))
      .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)));
  });
}

export async function sendMafiaChat(roomId, playerId, name, avatar, text) {
  const gamePath = getGamePath(roomId, 'mafia');
  const msgRef   = push(ref(db, `${gamePath}/mafiaChat`));
  await set(msgRef, { uid: playerId, name, avatar: avatar || '', text, ts: serverTimestamp() });
}

export function subscribeMafiaChat(roomId, callback) {
  const gamePath = getGamePath(roomId, 'mafia');
  return onValue(ref(db, `${gamePath}/mafiaChat`), (snap) => {
    const data = snap.val() ?? {};
    callback(Object.entries(data)
      .map(([k, v]) => ({ id: k, ...v }))
      .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0)));
  });
}

// ── Win Condition ─────────────────────────────────────────────────────────────

function checkWinCondition(players, roles) {
  const alive      = Object.entries(players).filter(([, p]) => p.isAlive);
  const aliveMafia = alive.filter(([pid]) => roles[pid] === 'mafia').length;
  const aliveTown  = alive.length - aliveMafia;

  if (aliveMafia === 0)        return 'town';
  if (aliveMafia >= aliveTown) return 'mafia';
  return null;
}

// ── Spy Game Logic ────────────────────────────────────────────────────────────
// CANONICAL WIN CONDITIONS:
//   Spy wins ONLY by guessing the secret word correctly in the SPY_GUESS phase.
//   Citizens win ONLY if they vote out the Spy AND the Spy then fails to guess.
//   If the wrong player is voted out → Spy wins immediately (no guess needed).

export async function resolveSpyVoting(roomId) {
  const gamePath = getGamePath(roomId, 'spy');
  const [votesSnap, gsSnap] = await Promise.all([
    get(ref(db, `${gamePath}/votes`)),
    get(ref(db, `${gamePath}/gameState`)),
  ]);

  const votes = votesSnap.val() ?? {};
  const gs    = gsSnap.val()    ?? {};
  const spyId = gs.spyId;

  const tally = {};
  Object.values(votes).forEach((vid) => { tally[vid] = (tally[vid] ?? 0) + 1; });

  let mostVotedId = null, maxVotes = 0;
  Object.entries(tally).forEach(([vid, count]) => {
    if (count > maxVotes) { maxVotes = count; mostVotedId = vid; }
  });

  const updates = {};
  updates[`${gamePath}/gameState/votedOutId`] = mostVotedId;

  if (mostVotedId === spyId) {
    updates[`${gamePath}/gameState/phase`]          = PHASES.SPY_GUESS;
    updates[`${gamePath}/gameState/timerStartedAt`] = serverTimestamp();
    updates[`${gamePath}/gameState/timerDuration`]  = 60;
  } else {
    updates[`${gamePath}/gameState/phase`]  = PHASES.GAME_OVER;
    updates[`${gamePath}/gameState/winner`] = 'spy';
    updates[`rooms/${roomId}/meta/status`]  = 'finished';
  }

  await update(ref(db), updates);
}

// ── Levenshtein fuzzy match ───────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i-1] === b[j-1]
        ? d[i-1][j-1]
        : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1]);
    }
  }
  return d[m][n];
}

function normalize(s) {
  return (s ?? '')
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s]/g, '');
}

function fuzzyMatch(guess, secret) {
  const g = normalize(guess);
  const s = normalize(secret);
  if (g === s) return true;
  const threshold = s.length >= 5 ? 2 : 1;
  return levenshtein(g, s) <= threshold;
}

export async function submitSpyGuess(roomId, word) {
  if (!word || word.trim().length === 0) throw new Error('Guess cannot be empty.');

  const gamePath = getGamePath(roomId, 'spy');
  const gsSnap   = await get(ref(db, `${gamePath}/gameState`));
  const gs       = gsSnap.val() ?? {};

  const secretVariants = typeof gs.word === 'object'
    ? Object.values(gs.word).filter(Boolean)
    : [gs.word].filter(Boolean);

  const isCorrect = secretVariants.some((v) => fuzzyMatch(word, v));

  const updates = {};
  updates[`${gamePath}/gameState/phase`]    = PHASES.GAME_OVER;
  updates[`${gamePath}/gameState/winner`]   = isCorrect ? 'spy' : 'town';
  updates[`${gamePath}/gameState/spyGuess`] = word.trim();
  updates[`rooms/${roomId}/meta/status`]    = 'finished';

  await update(ref(db), updates);
}

export async function expireSpyGuess(roomId) {
  const gamePath = getGamePath(roomId, 'spy');
  const updates  = {};
  updates[`${gamePath}/gameState/phase`]    = PHASES.GAME_OVER;
  updates[`${gamePath}/gameState/winner`]   = 'town';
  updates[`${gamePath}/gameState/spyGuess`] = null;
  updates[`rooms/${roomId}/meta/status`]    = 'finished';
  await update(ref(db), updates);
}
