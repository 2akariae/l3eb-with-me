// useGeminiWords.js — v11-fixed (security hardening)
//
// SECURITY FIX [CRITICAL]: Previously this module read
// `import.meta.env.VITE_GEMINI_API_KEY` and called Google's Generative
// Language API directly from the browser. Any env var prefixed VITE_ is
// inlined into the production JS bundle by Vite at build time — meaning the
// API key was shipped in plaintext to every client and visible to anyone via
// DevTools → Sources → search for the key string, or by inspecting the
// Network tab on any "Spy" round. An attacker could harvest the key and run
// unlimited requests against the studio's Gemini quota/billing.
//
// FIX: The key now lives ONLY in the server process as `GEMINI_API_KEY`
// (no VITE_ prefix — Vite will not bundle it). The actual Gemini call moved
// to server.js → POST /api/gemini/word, which this module calls instead.
// The exported `generateSpyWord()` interface is UNCHANGED so every existing
// caller (gameEngine.js, offlineEngine.js) needs no changes.

import { WORD_PACKS } from '../../../constants/wordPack.js';

function getLocalWord() {
  const flat = WORD_PACKS.flatMap((pack) => pack.words);
  return flat[Math.floor(Math.random() * flat.length)];
}

async function fetchWordFromProxy() {
  const res = await fetch('/api/gemini/word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Proxy ${res.status}: ${errData?.error || 'Unknown error'}`);
  }
  const parsed = await res.json();
  if (!parsed?.word?.en || !parsed?.hint?.en) throw new Error('Invalid response shape');
  return parsed;
}

export async function generateSpyWord() {
  try {
    return await fetchWordFromProxy();
  } catch (e) {
    console.warn(`[Gemini proxy] Using local fallback: ${e.message}`);
    return getLocalWord();
  }
}
