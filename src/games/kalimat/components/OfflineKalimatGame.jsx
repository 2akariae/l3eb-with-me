import React, { useState } from 'react';
import { useOfflineStore, useOfflineLang } from '../../../store/offlineStore.js';

const panel = 'w-full max-w-xl rounded-3xl border border-cyan-300/10 bg-white/[.035] p-6 shadow-2xl';
const validWord = (s) => /^\p{L}{1,20}$/u.test(s.trim());

export default function OfflineKalimatGame({ onBackToMode }) {
  const { players, setPlayers, reset, language } = useOfflineStore();
  const t = useOfflineLang(language);
  const [phase, setPhase] = useState('lobby');
  const [name, setName] = useState('');
  const [word, setWord] = useState('');
  const [words, setWords] = useState({});
  const [ready, setReady] = useState(false);
  const [turnPool, setTurnPool] = useState([]);
  const [guesser, setGuesser] = useState(null);
  const [chosenWord, setChosenWord] = useState(null);
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');
  const alive = players.filter((p) => p.alive !== false);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  function addPlayer() {
    const value = name.trim();
    if (value.length < 2 || players.length >= 15 || players.some((p) => p.name.toLowerCase() === value.toLowerCase())) return;
    setPlayers([...players, { id: `kalimat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: value }]);
    setName('');
  }
  function begin() {
    if (players.length < 3) return;
    setPlayers(players.map((p) => ({ ...p, alive: true })));
    setWords(Object.fromEntries(players.map((p) => [p.id, null])));
    setPhase('writing'); setReady(false); setMessage('');
  }
  function submitWord() {
    const normalized = word.trim().normalize('NFKC').toLowerCase();
    if (!validWord(word) || Object.values(words).some((w) => w?.normalized === normalized)) {
      setMessage(language === 'ar' ? 'دخل كلمة وحدة مختلفة، بالحروف فقط (حتى 20 حرف).' : 'Enter a unique word using letters only (up to 20).');
      return;
    }
    const current = players.find((p) => !words[p.id]);
    if (!current) return;
    const next = { ...words, [current.id]: { text: word.trim(), normalized } };
    setWords(next); setWord(''); setReady(false); setMessage('');
    if (players.every((p) => next[p.id])) {
      const pool = [...players].sort(() => Math.random() - 0.5).map((p) => p.id);
      setTurnPool(pool); setGuesser(pool.shift()); setTurnPool(pool); setPhase('guess');
    }
  }
  function resolveGuess() {
    if (!chosenWord || !target || target === guesser) return;
    if (chosenWord === target) {
      const nextPlayers = players.map((p) => p.id === target ? { ...p, alive: false } : p);
      const nextWords = { ...words }; delete nextWords[target];
      setPlayers(nextPlayers); setWords(nextWords); setMessage(`${players.find((p) => p.id === target)?.name} · ${words[target].text}`);
      setChosenWord(null); setTarget(null);
      if (nextPlayers.filter((p) => p.alive !== false).length <= 1) setPhase('over');
    } else {
      let pool = turnPool.filter((id) => alive.some((p) => p.id === id) && id !== guesser);
      if (!pool.length) pool = alive.filter((p) => p.id !== guesser).map((p) => p.id);
      const nextGuesser = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      setTurnPool(pool); setGuesser(nextGuesser); setMessage(language === 'ar' ? 'غلط، دور لاعب آخر.' : 'Wrong guess. Another player’s turn.');
      setChosenWord(null); setTarget(null);
    }
  }
  function leave() { reset(); onBackToMode(); }

  return <main className="screen items-center justify-center gap-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.08),transparent_50%),#03020a] p-5" dir={dir}>
    <button onClick={leave} className="absolute left-4 top-4 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60">{t('back')}</button>
    <header className="text-center"><p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/60">LKALIMAT · {t('offlineMode')}</p><h1 className="display mt-3 text-4xl font-bold text-white">{t('kalimatTitle')}</h1></header>
    {phase === 'lobby' && <section className={panel}><p className="mb-4 text-sm text-white/50">{language === 'ar' ? 'زيدو 3 لاعبين على الأقل. غادي تدوزو التلفون بيناتكم.' : 'Add at least 3 players, then pass the phone around.'}</p><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-white" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder={t('addPlayer')}/><button className="rounded-xl bg-cyan-200 px-5 font-bold text-slate-950" onClick={addPlayer}>+</button></div><div className="my-4 space-y-2">{players.map((p) => <div key={p.id} className="flex justify-between rounded-xl bg-white/5 px-4 py-3 text-white">{p.name}<button onClick={() => setPlayers(players.filter((x) => x.id !== p.id))} className="text-rose-300">×</button></div>)}</div><button disabled={players.length < 3} onClick={begin} className="w-full rounded-xl bg-cyan-200 py-3 font-bold text-slate-950 disabled:opacity-40">{t('startGame')} · {players.length}/3</button></section>}
    {phase === 'writing' && (() => { const current = players.find((p) => !words[p.id]); return <section className={`${panel} text-center`}><h2 className="text-2xl font-bold text-white">{current?.name}</h2>{!ready ? <><p className="my-5 text-white/55">{language === 'ar' ? 'خد التلفون، وملي تكون بوحدك ضغط واجد.' : 'Take the phone. When you are ready and alone, tap Ready.'}</p><button onClick={() => setReady(true)} className="w-full rounded-xl bg-cyan-200 py-3 font-bold text-slate-950">{language === 'ar' ? 'واجد' : 'Ready'}</button></> : <><p className="my-4 text-sm text-white/50">{t('kalimatSecretHint')}</p><input autoFocus value={word} maxLength={20} onChange={(e) => setWord(e.target.value.replace(/\s/gu, ''))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-center text-xl text-white" placeholder={t('kalimatWordPlaceholder')}/><button onClick={submitWord} className="mt-3 w-full rounded-xl bg-cyan-200 py-3 font-bold text-slate-950">{t('kalimatLockWord')}</button></>}{message && <p className="mt-3 text-rose-300">{message}</p>}</section>; })()}
    {phase === 'guess' && <section className={`${panel} text-center`}><p className="text-xs uppercase tracking-widest text-cyan-200/60">{t('kalimatGuessTurn')}</p><h2 className="mb-5 mt-2 text-3xl font-bold text-white">{players.find((p) => p.id === guesser)?.name}</h2><p className="mb-3 text-sm text-white/45">{t('kalimatYourGuess')}</p><div className="grid grid-cols-2 gap-2">{Object.entries(words).filter(([id]) => id !== guesser).map(([id, entry]) => <button key={id} onClick={() => setChosenWord(id)} className={`rounded-xl border px-3 py-3 text-white ${chosenWord === id ? 'border-cyan-200 bg-cyan-200/10' : 'border-white/10'}`}>{entry.text}</button>)}</div><p className="mb-2 mt-5 text-sm text-white/45">{language === 'ar' ? 'شكون كتبها؟' : 'Who wrote it?'}</p><div className="flex flex-wrap justify-center gap-2">{alive.filter((p) => p.id !== guesser).map((p) => <button key={p.id} onClick={() => setTarget(p.id)} className={`rounded-xl border px-4 py-3 text-white ${target === p.id ? 'border-cyan-200 bg-cyan-200/10' : 'border-white/10'}`}>{p.name}</button>)}</div><button disabled={!chosenWord || !target} onClick={resolveGuess} className="mt-5 w-full rounded-xl bg-cyan-200 py-3 font-bold text-slate-950 disabled:opacity-40">{t('confirm')}</button>{message && <p className="mt-4 text-emerald-200">{message}</p>}</section>}
    {phase === 'over' && <section className={`${panel} text-center`}><h2 className="text-3xl font-bold text-white">{players.find((p) => p.alive !== false)?.name || t('kalimatNoWinner')}</h2><p className="my-3 text-white/50">{t('kalimatWinner')}</p><button onClick={leave} className="rounded-xl bg-cyan-200 px-6 py-3 font-bold text-slate-950">{t('leave')}</button></section>}
  </main>;
}
