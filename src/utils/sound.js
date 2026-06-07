// ─── THE MAFIA PLATFORM — utils/sound.js (v10) ───────────────────────────────
// Web Audio API ambient sound system. All methods are no-ops if the browser
// doesn't support AudioContext or if the user hasn't interacted yet.
// Two ambient "worlds":
//   mafia  → low dark drone + occasional heartbeat thud
//   spy    → high-tension ticking loop + interference crackle
// All sounds use OscillatorNode + GainNode only — zero external audio files.

let ctx = null;
let masterGain = null;
let activeLoops = [];

function getCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.18; // quiet — ambient, not distracting
    masterGain.connect(ctx.destination);
  } catch { ctx = null; }
  return ctx;
}

function stopAll() {
  activeLoops.forEach((n) => { try { n.stop(); } catch {} });
  activeLoops = [];
}

// ── Mafia Ambient: dark 50Hz drone + 1Hz pulse ─────────────────────────────
export function startMafiaAmbient() {
  const c = getCtx();
  if (!c) return;
  stopAll();

  // Drone
  const drone = c.createOscillator();
  drone.type = 'sawtooth';
  drone.frequency.value = 50;
  const droneGain = c.createGain();
  droneGain.gain.value = 0.06;
  drone.connect(droneGain);
  droneGain.connect(masterGain);
  drone.start();
  activeLoops.push(drone);

  // Sub rumble
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 28;
  const subGain = c.createGain();
  subGain.gain.value = 0.08;
  sub.connect(subGain);
  subGain.connect(masterGain);
  sub.start();
  activeLoops.push(sub);

  // Slow pulse (LFO modulating gain)
  const lfo = c.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.4;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain);
  lfoGain.connect(droneGain.gain);
  lfo.start();
  activeLoops.push(lfo);
}

// ── Spy Ambient: ticking click + high sine interference ────────────────────
export function startSpyAmbient() {
  const c = getCtx();
  if (!c) return;
  stopAll();

  // High tension pad
  const pad = c.createOscillator();
  pad.type = 'sine';
  pad.frequency.value = 440;
  const padGain = c.createGain();
  padGain.gain.value = 0.02;
  pad.connect(padGain);
  padGain.connect(masterGain);
  pad.start();
  activeLoops.push(pad);

  // Ticking — scheduled impulses
  function scheduleTick() {
    if (!ctx || activeLoops.length === 0) return;
    const t = c.createOscillator();
    t.type = 'square';
    t.frequency.value = 1200;
    const g = c.createGain();
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
    t.connect(g);
    g.connect(masterGain);
    t.start(c.currentTime);
    t.stop(c.currentTime + 0.03);
    setTimeout(scheduleTick, 500);
  }
  scheduleTick();
}

// ── Stab sounds ────────────────────────────────────────────────────────────
export function playKillStab() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.4);
  const g = c.createGain();
  g.gain.setValueAtTime(0.2, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
  osc.connect(g); g.connect(masterGain);
  osc.start(); osc.stop(c.currentTime + 0.5);
}

export function playSuccess() {
  const c = getCtx();
  if (!c) return;
  [523, 659, 784].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine'; osc.frequency.value = freq;
    const g = c.createGain();
    const t = c.currentTime + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.35);
  });
}

export function playReveal() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, c.currentTime);
  osc.frequency.linearRampToValueAtTime(880, c.currentTime + 0.6);
  const g = c.createGain();
  g.gain.setValueAtTime(0.15, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
  osc.connect(g); g.connect(masterGain);
  osc.start(); osc.stop(c.currentTime + 0.7);
}

export function playVote() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 660;
  const g = c.createGain();
  g.gain.setValueAtTime(0.1, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(g); g.connect(masterGain);
  osc.start(); osc.stop(c.currentTime + 0.15);
}

export function stopAmbient() { stopAll(); }

// ── Volume control ─────────────────────────────────────────────────────────
export function setMasterVolume(v) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

// ── Resume context on first user gesture ─────────────────────────────────
export function resumeCtx() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
