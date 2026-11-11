import { useEffect, useState } from 'react';
import { onValue, ref, set, get, update, runTransaction, remove } from 'firebase/database';
import { db } from '../../../services/firebaseConfig.js';
import { PHASES } from '../../../constants/game.js';

const root = (roomId) => `rooms/${roomId}/kalimat`;
const secrets = (roomId) => `kalimatSecrets/${roomId}`;
const normalize = (word) => word.normalize('NFKC').toLowerCase();
const validWord = (word) => typeof word === 'string' && word.trim().length > 0 && [...word.trim()].length <= 20 && /^\p{L}+$/u.test(word.trim());

export async function startKalimatRoom(roomId, players) {
  const ids = Object.keys(players || {});
  if (ids.length < 3) throw new Error('Need at least 3 players to start.');
  await update(ref(db, root(roomId)), { gameState: { phase: PHASES.WRITING, submitted: {}, words: [], eliminated: [], turnPool: ids, round: 1 }, submissions: null, guesses: null });
  const alive = Object.fromEntries(ids.map((id) => [`rooms/${roomId}/players/${id}/isAlive`, true]));
  await update(ref(db), alive);
  await update(ref(db, `rooms/${roomId}/meta`), { status: 'playing' });
}

export function useKalimatEngine({ roomId, playerId, isHost, players }) {
  const [state, setState] = useState({ phase: PHASES.LOBBY });
  const [ownWordId, setOwnWordId] = useState(null);
  useEffect(() => {
    if (!roomId) return undefined;
    return onValue(ref(db, `${root(roomId)}/gameState`), (snap) => setState(snap.val() || { phase: PHASES.LOBBY }));
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !playerId) return undefined;
    return onValue(ref(db, `${secrets(roomId)}/${playerId}`), (snap) => setOwnWordId(snap.val()?.wordId || null));
  }, [roomId, playerId]);

  useEffect(() => {
    if (!roomId || !isHost) return undefined;
    return onValue(ref(db, `${root(roomId)}/submissions`), async (snap) => {
      const submissions = snap.val() || {};
      for (const [pid, submission] of Object.entries(submissions)) {
        if (submission?.accepted || state.submitted?.[pid]) continue;
        const privateWord = await get(ref(db, `${secrets(roomId)}/${pid}`));
        const secret = privateWord.val();
        if (!secret || state.phase !== PHASES.WRITING) continue;
        if (!validWord(secret.text)) {
          await remove(ref(db, `${secrets(roomId)}/${pid}`));
          await remove(ref(db, `${root(roomId)}/submissions/${pid}`));
          continue;
        }
        const duplicate = (state.words || []).some((entry) => normalize(entry.text) === secret.normalized);
        if (duplicate) {
          await remove(ref(db, `${secrets(roomId)}/${pid}`));
          await remove(ref(db, `${root(roomId)}/submissions/${pid}`));
          continue;
        }
        const accepted = await runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => {
          if (value?.phase !== PHASES.WRITING || value.submitted?.[pid] || (value.words || []).some((entry) => normalize(entry.text) === secret.normalized)) return value;
          return { ...value, submitted: { ...(value.submitted || {}), [pid]: true }, words: [...(value.words || []), { wordId: secret.wordId, text: secret.text }] };
        });
        if (!accepted.committed || !accepted.snapshot.val()?.submitted?.[pid]) {
          await remove(ref(db, `${secrets(roomId)}/${pid}`));
          await remove(ref(db, `${root(roomId)}/submissions/${pid}`));
          continue;
        }
        await set(ref(db, `${root(roomId)}/submissions/${pid}/accepted`), true);
      }
    });
  }, [roomId, isHost, state.phase, state.submitted, state.words]);

  useEffect(() => {
    if (!roomId || !isHost || state.phase !== PHASES.GUESS || state.pendingGuess) return undefined;
    return onValue(ref(db, `${root(roomId)}/guesses`), async (snap) => {
      const guess = snap.val()?.[state.guesser];
      if (!guess || guess.id === state.result?.id) return;
      await runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => value?.phase === PHASES.GUESS && !value.pendingGuess ? { ...value, pendingGuess: guess } : value);
    });
  }, [roomId, isHost, state.phase, state.guesser, state.pendingGuess, state.result?.id]);

  // Host owns resolution, while secrets live outside the publicly readable room tree.
  // RTDB rules grant that resolver (the current host) read access to the secret collection.
  useEffect(() => {
    if (!roomId || !isHost) return undefined;
    return onValue(ref(db, `${root(roomId)}/gameState`), async (snap) => {
      const current = snap.val();
      if (!current) return;
      const active = Object.keys(players || {}).filter((id) => players[id]?.isAlive !== false);
      if (current.phase === PHASES.WRITING) {
        const submitted = current.submitted || {};
        if (active.length >= 2 && active.every((id) => submitted[id])) {
          await runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => value?.phase === PHASES.WRITING ? { ...value, phase: PHASES.ROULETTE, startedAt: Date.now(), turnPool: active } : value);
        }
      } else if (current.phase === PHASES.ROULETTE && !current.spin) {
        const pool = (current.turnPool || []).filter((id) => active.includes(id));
        const candidates = pool.length ? pool : active;
        if (candidates.length < 2) {
          await update(ref(db, root(roomId)), { 'gameState/phase': PHASES.GAME_OVER, 'gameState/winner': candidates[0] || null });
          return;
        }
        const index = Math.floor(Math.random() * candidates.length);
        const target = candidates[index];
        const nextPool = candidates.filter((id) => id !== target);
        await runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => value?.phase === PHASES.ROULETTE && !value.spin ? { ...value, spin: { target, seed: Math.floor(Math.random() * 0x7fffffff), at: Date.now() }, turnPool: nextPool } : value);
      } else if (current.phase === PHASES.GUESS && current.pendingGuess && !current.resolving) {
        const pending = current.pendingGuess;
        await runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => value?.phase === PHASES.GUESS && value.pendingGuess?.id === pending.id && !value.resolving ? { ...value, resolving: true } : value);
        const secretEntries = await Promise.all(active.map(async (id) => [id, (await get(ref(db, `${secrets(roomId)}/${id}`))).val()]));
        const secretMap = Object.fromEntries(secretEntries.filter(([, value]) => value));
        const owner = Object.keys(secretMap).find((id) => secretMap[id]?.wordId === pending.wordId);
        const isCurrentWord = (current.words || []).some((entry) => entry.wordId === pending.wordId);
        const isAliveTarget = players[pending.playerId]?.isAlive !== false;
        const correct = isCurrentWord && isAliveTarget && owner === pending.playerId && owner !== pending.guesser;
        const word = owner ? secretMap[owner]?.text : '';
        const remaining = (current.words || []).filter((entry) => entry.wordId !== pending.wordId);
        const alive = active.filter((id) => !correct || id !== owner);
        const winner = alive.length <= 1 ? alive[0] || null : null;
        if (correct && owner) await update(ref(db, `rooms/${roomId}/players/${owner}`), { isAlive: false });
        await runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => {
          if (value?.pendingGuess?.id !== pending.id || !value.resolving) return value;
          const eliminated = correct ? [...(value.eliminated || []), { playerId: owner, word, by: pending.guesser, order: (value.eliminated || []).length + 1 }] : value.eliminated || [];
          return { ...value, words: correct ? remaining : value.words, eliminated, result: { id: pending.id, correct, owner: correct ? owner : null, word: correct ? word : null }, pendingGuess: null, resolving: false, phase: winner ? PHASES.GAME_OVER : correct ? PHASES.GUESS : PHASES.ROULETTE, guesser: winner || !correct ? null : pending.guesser, winner, winnerWord: winner ? secretMap[winner]?.text || null : null };
        });
        await remove(ref(db, `${root(roomId)}/guesses/${pending.guesser}`));
      }
    });
  }, [roomId, isHost, players]);

  useEffect(() => {
    const spin = state.spin;
    if (!roomId || !isHost || state.phase !== PHASES.ROULETTE || !spin) return undefined;
    const delay = Math.max(0, 3200 - (Date.now() - spin.at));
    const timer = setTimeout(() => runTransaction(ref(db, `${root(roomId)}/gameState`), (value) => value?.phase === PHASES.ROULETTE && value.spin?.target === spin.target ? { ...value, phase: PHASES.GUESS, guesser: spin.target, spin: null, result: null } : value), delay);
    return () => clearTimeout(timer);
  }, [roomId, isHost, state.phase, state.spin]);

  const start = async () => {
    if (!isHost) throw new Error('Only the host can start.');
    await startKalimatRoom(roomId, players);
  };

  const submitWord = async (raw) => {
    const word = raw.trim().normalize('NFKC');
    if (!validWord(word)) throw new Error('Use one word with letters only (up to 20 characters).');
    if (state.phase !== PHASES.WRITING || state.submitted?.[playerId]) throw new Error('Your word is already locked.');
    const id = `${playerId}_${Date.now().toString(36)}`;
    await set(ref(db, `${secrets(roomId)}/${playerId}`), { text: word, normalized: normalize(word), wordId: id });
    await set(ref(db, `${root(roomId)}/submissions/${playerId}`), { accepted: false, submittedAt: Date.now() });
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const approval = await get(ref(db, `${root(roomId)}/submissions/${playerId}`));
      if (!approval.exists()) throw new Error('That word is already taken. Choose another.');
      if (approval.val()?.accepted) return;
    }
    throw new Error('The host is still checking your word. Please try again.');
  };

  const selectGuess = async (wordId, targetId) => {
    if (state.phase !== PHASES.GUESS || state.guesser !== playerId || state.pendingGuess) throw new Error('You cannot guess right now.');
    if (targetId === playerId || wordId === ownWordId || !(state.words || []).some((word) => word.wordId === wordId) || players[targetId]?.isAlive === false) throw new Error('Choose an available word and another player.');
    await set(ref(db, `${root(roomId)}/guesses/${playerId}`), { id: `${playerId}_${Date.now()}`, wordId, playerId: targetId, guesser: playerId });
  };

  const restart = async () => {
    if (!isHost) return;
    await Promise.all(Object.keys(players || {}).map((id) => remove(ref(db, `${secrets(roomId)}/${id}`))));
    await update(ref(db, root(roomId)), { gameState: { phase: PHASES.LOBBY, round: (state.round || 0) + 1 }, submissions: null, guesses: null });
    await update(ref(db, `rooms/${roomId}/meta`), { status: 'waiting' });
  };

  return { state: { ...state, ownWordId }, start, submitWord, selectGuess, restart };
}
