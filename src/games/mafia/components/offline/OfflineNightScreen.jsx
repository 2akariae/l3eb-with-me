// OfflineNightScreen.jsx — v10-fixed (emojis -> SVG / Lucide)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore } from '../../../../store/offlineStore.js';
import { useTranslation } from '../../../../constants/translations.js';
import { resolveNightAndGoDawn } from '../../../../services/offlineEngine.js';
import { GameBackground } from '../../../components/game/GameBackground.jsx';
import { Check, AlertTriangle } from 'lucide-react';

const STEPS = [
  { color:'#e02020', titleK:'mafiaWakesUp',  qK:'mafiaKills',      tipK:'mafiaInstruction'     },
  { color:'#10b981', titleK:'doctorWakesUp', qK:'doctorProtects',  tipK:'doctorInstruction'    },
  { color:'#3b82f6', titleK:'detectiveWakes',qK:'detectiveChecks', tipK:'detectiveInstruction' },
  { color:'#c9943a', titleK:'dawnBreaks',    qK:'confirmNight',    tipK:'everyoneOpens'        },
];

function ResultDot({ isMafia }) {
  const c = isMafia ? '#e02020' : '#10b981';
  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="22" fill={c} opacity="0.15" />
      <circle cx="26" cy="26" r="14" fill={c} opacity="0.65" />
      <circle cx="26" cy="26" r="7"  fill={c} />
    </svg>
  );
}

function TargetBtn({ player, selected, onSelect, color, disabled, mafiaLabel }) {
  const isSel = selected === player.id;
  return (
    <motion.button whileTap={{ scale:0.97 }}
      onClick={() => !disabled && onSelect(isSel ? null : player.id)}
      disabled={disabled}
      className="relative w-full h-16 rounded-2xl flex items-center justify-center font-black text-sm tracking-widest overflow-hidden transition-all"
      style={{
        background: isSel ? `${color}44` : disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isSel ? color : disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
        color: disabled ? 'rgba(255,255,255,0.25)' : 'white',
        boxShadow: isSel ? `0 0 22px ${color}55` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}>
      <span className="relative z-10">{player.name.toUpperCase()}</span>
      {isSel && (
        <motion.span initial={{ scale:0 }} animate={{ scale:1 }} className="ml-3 relative z-10">
          <Check size={16} color={color} strokeWidth={3} />
        </motion.span>
      )}
      {disabled && <span className="ml-2 text-[10px] opacity-40 relative z-10">({mafiaLabel})</span>}
    </motion.button>
  );
}

export default function OfflineNightScreen() {
  const { players, alivePlayers, roles, round, mafiaKill, doctorSave, detectiveCheck,
          setMafiaKill, setDoctorSave, setDetectiveCheck, language } = useOfflineStore();
  const t    = useTranslation(language);
  const isAr = language === 'ar';
  const [step,      setStep]      = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [detecting, setDetecting] = useState(null);

  const alive    = players.filter(p => alivePlayers.includes(p.id));
  const mafiaIds = new Set(alive.filter(p => roles[p.id]==='mafia').map(p=>p.id));
  const sk       = STEPS[step];

  function confirmStep(val) {
    if (step===0) setMafiaKill(val);
    if (step===1) setDoctorSave(val);
    if (step===2) {
      setDetectiveCheck(val);
      if (val) {
        const isMafia = roles[val]==='mafia';
        setDetecting({ name: players.find(p=>p.id===val)?.name, isMafia });
        setTimeout(() => { setDetecting(null); setSelected(null); setStep(3); }, 2200);
        return;
      }
    }
    setSelected(null);
    setStep(s => s+1);
  }

  const labels = [t('mafia'), t('doctor'), t('sheikh'), t('dawnBreaks')];

  return (
    <div className="screen overflow-hidden relative" dir={isAr?'rtl':'ltr'}>
      <GameBackground />
      <div className="absolute inset-0 bg-black/42 z-0" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="px-6 pt-6 pb-3 text-center">
          <motion.p key={step} initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
            className="text-xs font-black uppercase tracking-[0.3em] mb-1" style={{color:sk.color}}>
            {t('nightPhase')} · {t('round')} {round}
          </motion.p>
          <motion.p key={`tip${step}`} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}}
            className="text-smoke-400 text-xs">{t(sk.tipK)}</motion.p>
        </div>
        <div className="flex-1 flex flex-col px-6 overflow-y-auto gap-4">
          <AnimatePresence mode="popLayout">
            {step < 3 ? (
              <motion.div key={step} initial={{x:24,opacity:0}} animate={{x:0,opacity:1}}
                exit={{x:-24,opacity:0}} transition={{duration:0.28}} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black"
                    style={{background:`${sk.color}20`,border:`1px solid ${sk.color}40`,color:sk.color}}>
                    {step+1}
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{t(sk.titleK)}</p>
                    <p className="text-smoke-400 text-xs">{t(sk.qK)}</p>
                  </div>
                </div>
                {step===0 && mafiaIds.size>1 && (
                  <div className="px-4 py-2.5 rounded-xl flex items-center gap-2.5"
                    style={{background:'rgba(224,32,32,0.08)',border:'1px solid rgba(224,32,32,0.2)'}}>
                    <AlertTriangle size={14} className="text-crimson-400 shrink-0" />
                    <p className="text-crimson-400 text-xs font-bold">
                      {isAr?'المافيا لا تستطيع استهداف أعضائها':'Mafia cannot target their own members'}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  {alive.map(p=>(
                    <TargetBtn key={p.id} player={p} selected={selected} onSelect={setSelected}
                      color={sk.color} disabled={step===0 && mafiaIds.has(p.id)} mafiaLabel={t('mafia')} />
                  ))}
                  <motion.button whileTap={{scale:0.97}} onClick={()=>confirmStep(null)}
                    className="w-full h-14 rounded-2xl font-black text-xs tracking-widest text-smoke-500"
                    style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                    {t('skipNobody')}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {selected && (
                    <motion.button initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} exit={{y:6,opacity:0}}
                      whileTap={{scale:0.97}} onClick={()=>confirmStep(selected)}
                      className="w-full h-14 rounded-2xl font-black text-sm tracking-widest text-white"
                      style={{background:sk.color,boxShadow:`0 0 28px ${sk.color}66`}}>
                      {t('confirm')}
                    </motion.button>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {detecting && (
                    <motion.div initial={{opacity:0,scale:0.85}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
                      <div className="text-center px-10 py-8 rounded-3xl bg-white/5 border border-white/15 mx-6">
                        <div className="mb-4 flex justify-center"><ResultDot isMafia={detecting.isMafia} /></div>
                        <p className="text-white font-black text-2xl">{detecting.name}</p>
                        <p className={`text-lg font-bold mt-2 ${detecting.isMafia?'text-crimson-400':'text-emerald-400'}`}>
                          {detecting.isMafia ? t('isMafia') : t('isInnocent')}
                        </p>
                        <p className="text-smoke-500 text-xs mt-5">{t('detectiveOnly')}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="resolve" initial={{x:24,opacity:0}} animate={{x:0,opacity:1}}
                className="flex flex-col gap-4 mt-1">
                <h2 className="text-white font-black text-lg text-center">{t('nightSummary')}</h2>
                <div className="flex flex-col gap-2">
                  {[
                    {label:t('mafiaKills'),     val:mafiaKill,     color:'#e02020'},
                    {label:t('doctorProtects'),  val:doctorSave,    color:'#10b981'},
                    {label:t('detectiveChecks'), val:detectiveCheck,color:'#3b82f6'},
                  ].map(({label,val,color})=>(
                    <div key={label} className="flex items-center justify-between h-12 px-4 rounded-xl bg-white/5 border border-white/8">
                      <span className="text-smoke-400 text-xs font-bold">{label}</span>
                      <span className="text-sm font-black" style={{color:val?color:'rgba(255,255,255,0.2)'}}>
                        {val ? players.find(p=>p.id===val)?.name : (isAr?'لا أحد':'Nobody')}
                      </span>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{scale:0.97}} onClick={resolveNightAndGoDawn}
                  className="w-full h-16 rounded-3xl font-black text-sm tracking-widest text-white mt-2"
                  style={{background:'linear-gradient(135deg,#c9943a,#e8c060)',boxShadow:'0 0 30px rgba(201,148,58,0.4)'}}>
                  {t('revealDawn')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="px-6 pb-5 pt-2 flex gap-2">
          {labels.map((label,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="h-1 w-full rounded-full transition-all duration-500"
                style={{background:i<=step?STEPS[Math.min(i,3)].color:'rgba(255,255,255,0.12)',opacity:i<=step?1:0.3}} />
              <span className="text-[9px] font-black uppercase tracking-wider"
                style={{color:i===step?STEPS[i].color:'rgba(255,255,255,0.25)'}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
