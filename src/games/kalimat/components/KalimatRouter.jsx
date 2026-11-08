import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useGameStore } from '../../../store/gameStore.js';
import { PHASES } from '../../../constants/game.js';
import { useKalimatEngine } from '../hooks/useKalimatEngine.js';
import { leaveRoom } from '../../../services/gameEngine.js';
import { useTranslation } from '../../../constants/translations.js';
import { Check, RotateCcw, Trophy, Users } from 'lucide-react';

const panel = 'w-full max-w-xl rounded-3xl border border-cyan-300/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl';

function PlayerChip({ player, selected, onClick, disabled }) {
  return <button disabled={disabled} onClick={onClick} className={`min-h-12 rounded-2xl border px-4 py-3 text-sm transition ${player.isAlive === false ? 'cursor-not-allowed border-white/5 text-white/25' : selected ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,.12)]' : 'border-white/10 bg-white/[.03] text-white/75 hover:border-white/20'}`}>{player.isAlive === false ? '🔒 ' : ''}{player.name}</button>;
}

export function KalimatWritingScreen({ engine, players, playerId, isHost, t }) {
  const [word, setWord] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submitted = engine.state.submitted || {};
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await engine.submitWord(word); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="screen items-center justify-center gap-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.08),transparent_50%),#03020a] p-5" dir={t('direction')}>
    <header className="text-center"><p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/60">LKALIMAT · {t('kalimatWriting')}</p><h1 className="display mt-3 text-4xl font-bold text-white">{t('kalimatPickWord')}</h1><p className="mt-2 text-sm text-white/45">{t('kalimatSecretHint')}</p></header>
    <motion.form onSubmit={submit} className={panel} animate={submitted[playerId] ? { scale: [1, 1.025, 1] } : {}}>
      {submitted[playerId] ? <div className="flex items-center justify-center gap-3 py-6 text-emerald-300"><Check />{t('kalimatSubmitted')}</div> : <><input autoComplete="off" maxLength={20} value={word} onChange={(e) => setWord(e.target.value.replace(/\s/gu, ''))} placeholder={t('kalimatWordPlaceholder')} className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-5 text-center text-xl text-white outline-none transition focus:border-cyan-300/50 focus:shadow-[0_0_24px_rgba(34,211,238,.16)]"/><button disabled={busy || !word.trim()} className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-200 px-5 font-bold text-slate-950 disabled:opacity-30">{busy ? '…' : t('kalimatLockWord')}</button>{error && <p role="alert" className="mt-3 text-center text-sm text-rose-300">{error}</p>}</>}
    </motion.form>
    <section className={panel}><div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-white/50"><span>{t('kalimatProgress')}</span><span>{Object.keys(submitted).length}/{Object.keys(players).length}</span></div><div className="space-y-3">{Object.entries(players).map(([id, p]) => <div key={id} className="flex items-center justify-between rounded-xl bg-white/[.025] px-4 py-3"><span className="text-white/75">{p.name}{id === playerId ? ` · ${t('you')}` : ''}</span><span className={submitted[id] ? 'text-emerald-300' : 'text-white/25'}>{submitted[id] ? <Check size={18}/> : '○'}</span></div>)}</div></section>
    {!isHost && <p className="text-xs text-white/30">{t('waitingForHost')}</p>}
  </main>;
}

export function KalimatRouletteScreen({ state, players, t }) {
  const reduceMotion = useReducedMotion();
  const [angle, setAngle] = useState(0);
  useEffect(() => { if (state.spin) setAngle((n) => n + 1440 + (state.spin.seed % 600)); }, [state.spin?.seed]);
  const selected = state.spin?.target || state.guesser;
  return <main className="screen items-center justify-center gap-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,.12),transparent_45%),#03020a] p-5" dir={t('direction')}>
    <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.35em] text-violet-200/60">LKALIMAT</p><h1 className="display mt-3 text-4xl font-bold text-white">{t('kalimatRoulette')}</h1><p className="mt-2 text-sm text-white/45">{t('kalimatRouletteHint')}</p></div>
    <motion.div animate={{ rotate: reduceMotion ? 0 : angle }} transition={reduceMotion ? { duration: 0 } : { duration: 3.2, ease: [0.08, 0.72, 0.12, 1] }} className="relative grid h-64 w-64 place-items-center rounded-full border border-cyan-200/30 bg-[conic-gradient(from_0deg,rgba(34,211,238,.13),rgba(139,92,246,.06),rgba(217,70,239,.14),rgba(34,211,238,.13))] shadow-[0_0_50px_rgba(34,211,238,.08)]"><div className="absolute inset-5 rounded-full border border-white/10"/><div className="text-center"><span className="block text-[10px] uppercase tracking-[.3em] text-white/40">{selected ? t('kalimatYourTurn') : t('kalimatSpinning')}</span><strong className="mt-2 block max-w-44 truncate text-2xl text-cyan-100">{players[selected]?.name || '···'}</strong></div><div className="absolute -top-2 h-5 w-5 rounded-full bg-cyan-200 shadow-[0_0_18px_5px_rgba(34,211,238,.38)]"/></motion.div>
    <div className={`${panel} grid grid-cols-2 gap-2`}>{Object.entries(players).map(([id, player]) => <PlayerChip key={id} player={player} selected={id === selected} disabled />)}</div>
  </main>;
}

export function KalimatGuessScreen({ engine, state, players, playerId, t }) {
  const [word, setWord] = useState(null); const [target, setTarget] = useState(null); const [confirming, setConfirming] = useState(false);
  useEffect(() => { setWord(null); setTarget(null); setConfirming(false); }, [state.result?.id]);
  const ownTurn = state.guesser === playerId && players[playerId]?.isAlive !== false;
  async function confirm() { if (!word || !target) return; setConfirming(true); await new Promise((r) => setTimeout(r, 900)); try { await engine.selectGuess(word, target); } finally { setConfirming(false); } }
  const result = state.result;
  return <main className="screen items-center justify-start gap-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.07),transparent_48%),#03020a] p-5 pt-10" dir={t('direction')}>
    <header className="text-center"><p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/60">{t('kalimatGuessTurn')}</p><h1 className="display mt-2 text-3xl font-bold text-white">{players[state.guesser]?.name || '—'}</h1><p className="mt-2 text-sm text-white/40">{ownTurn ? t('kalimatYourGuess') : t('kalimatWatchingGuess')}</p></header>
    <section className={`${panel} grid grid-cols-2 gap-3`}>{(state.words || []).map((entry) => <button key={entry.wordId} disabled={!ownTurn || !!state.pendingGuess || entry.wordId === state.ownWordId} onClick={() => setWord(entry.wordId)} className={`min-h-14 rounded-2xl border px-3 text-center text-white transition ${word === entry.wordId ? 'border-cyan-200/50 bg-cyan-200/10 text-cyan-100' : 'border-white/10 bg-white/[.025]'} disabled:opacity-70`}>{entry.text}</button>)}</section>
    <section className={`${panel} flex flex-wrap justify-center gap-2`}>{Object.entries(players).filter(([id, p]) => p.isAlive !== false && !(ownTurn && id === playerId)).map(([id, p]) => <PlayerChip key={id} player={p} selected={target === id} disabled={!ownTurn || !!state.pendingGuess} onClick={() => setTarget(id)}/>)}</section>
    {ownTurn && <button disabled={!word || !target || confirming || !!state.pendingGuess} onClick={confirm} className="min-h-12 w-full max-w-xl rounded-2xl bg-cyan-200 font-bold text-slate-950 disabled:opacity-35">{confirming ? t('kalimatConfirming') : state.pendingGuess ? t('kalimatRevealing') : t('confirm')}</button>}
    <AnimatePresence>{result && <motion.div key={result.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${panel} text-center ${result.correct ? 'border-emerald-300/30' : 'border-rose-300/25'}`}><p className="text-xl font-bold text-white">{result.correct ? t('kalimatCorrect') : t('kalimatWrong')}</p>{result.correct && <p className="mt-2 text-cyan-100">{result.word} · {players[result.owner]?.name}</p>}</motion.div>}</AnimatePresence>
    {state.eliminated?.length > 0 && <div className={`${panel} space-y-2`}>{state.eliminated.slice(-2).map((entry) => <motion.div key={entry.playerId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-rose-400/20 bg-rose-500/[.06] px-4 py-3 text-center"><span className="text-rose-200">{players[entry.playerId]?.name || t('kalimatEliminated')} · {entry.word}</span><span className="ms-3 text-[10px] font-bold tracking-widest text-rose-300">{t('kalimatFound')}</span></motion.div>)}</div>}
  </main>;
}

export function KalimatGameOverScreen({ engine, state, players, isHost, roomId, t, onLeave }) {
  const ranking = [...(state.eliminated || [])].reverse(); const winner = state.winner;
  return <main className="screen items-center justify-center gap-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.12),transparent_45%),#03020a] p-5" dir={t('direction')}><div className="text-center"><Trophy className="mx-auto text-cyan-200" size={48}/><p className="mt-4 text-xs uppercase tracking-[.4em] text-cyan-100/50">{t('gameOver')}</p><h1 className="display mt-2 text-4xl font-bold text-white">{players[winner]?.name || t('kalimatNoWinner')}</h1><p className="text-white/50">{t('kalimatWinner')}</p></div><section className={panel}><h2 className="mb-4 text-center text-xs uppercase tracking-widest text-white/45">{t('kalimatRanking')}</h2>{ranking.map((p, i) => <div key={p.playerId} className="flex justify-between border-b border-white/5 py-3 text-white/70"><span>#{i + 2} · {players[p.playerId]?.name || '—'}</span><span>{p.word}</span></div>)}{winner && <div className="flex justify-between py-3 font-bold text-cyan-100"><span>#1 · {players[winner]?.name}</span><span>{state.winnerWord || '—'}</span></div>}<p className="mt-4 flex items-center gap-2 text-xs text-white/30"><Users size={14}/>{t('kalimatRoomCodeHint')} <strong className="text-cyan-100">{roomId}</strong></p></section>{isHost && <button onClick={engine.restart} className="flex min-h-12 w-full max-w-xl items-center justify-center gap-2 rounded-2xl bg-cyan-200 font-bold text-slate-950"><RotateCcw size={18}/>{t('playAgain')}</button>}<button onClick={onLeave} className="min-h-12 rounded-2xl border border-white/10 px-8 text-white/60">{t('leave')}</button></main>;
}

export default function KalimatRouter({ user, playerId }) {
  const { roomId, isHost, players, language, clearRoom } = useGameStore();
  const engine = useKalimatEngine({ roomId, playerId, isHost, players });
  const t = (key) => key === 'direction' ? (language === 'ar' ? 'rtl' : 'ltr') : useTranslation(language)(key);
  const [error, setError] = useState('');
  async function leave() { await leaveRoom(playerId, user.uid, roomId); clearRoom(); }
  const shared = { engine, state: engine.state, players, playerId, isHost, roomId, t };
  if (engine.state.phase === PHASES.LOBBY) return <main className="screen items-center justify-center gap-6 bg-noir-950 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}><div className={panel}><p className="text-xs uppercase tracking-widest text-cyan-200/60">LKALIMAT · {roomId}</p><h1 className="display my-4 text-3xl text-white">{t('waitingRoom')}</h1>{Object.values(players).map((p) => <p key={p.uid} className="py-2 text-white/65">{p.name}</p>)}{error && <p className="text-rose-300">{error}</p>}{isHost ? <button disabled={Object.keys(players).length < 3} onClick={() => engine.start().catch((e) => setError(e.message))} className="mt-4 min-h-12 w-full rounded-xl bg-cyan-200 font-bold text-slate-950 disabled:opacity-40">{t('startGame')} · {Object.keys(players).length}/3</button> : <p className="mt-4 text-white/40">{t('waitingForHost')}</p>}<button onClick={leave} className="mt-3 min-h-12 w-full text-white/40">{t('leave')}</button></div></main>;
  if (engine.state.phase === PHASES.WRITING) return <KalimatWritingScreen {...shared}/>;
  if (engine.state.phase === PHASES.ROULETTE) return <KalimatRouletteScreen {...shared}/>;
  if (engine.state.phase === PHASES.GAME_OVER) return <KalimatGameOverScreen {...shared} onLeave={leave}/>;
  return <KalimatGuessScreen {...shared}/>;
}
