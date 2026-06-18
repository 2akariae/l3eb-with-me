// ─── THE MAFIA — server.js (DigitalOcean App Platform) ───────────────────────
// Simple Express server that:
//  1. Serves the Vite-built frontend (dist/)
//  2. Handles /api/agoraToken serverless-style
//  3. Proxies /api/gemini/word — server-side Gemini call so the API key never
//     ships to the client bundle (see useGeminiWords.js for the previous
//     client-side implementation this replaces).
// Required env vars (set in DO App Platform → App Settings → Environment Variables):
//   AGORA_APP_ID, AGORA_APP_CERTIFICATE, GEMINI_API_KEY, PORT (auto-set by DO)
//
// SECURITY FIX: GEMINI_API_KEY (no VITE_ prefix) lives only in this server
//   process's environment — Vite never bundles unprefixed env vars into the
//   client. Previously the key was read as import.meta.env.VITE_GEMINI_API_KEY
//   directly in the browser, which means it shipped in plaintext inside the
//   production JS bundle and was visible to anyone via DevTools → Sources.
// ─────────────────────────────────────────────────────────────────────────────
import express    from 'express';
import path       from 'path';
import { fileURLToPath } from 'url';
import rateLimit  from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3000;

app.use(express.json());

// ── Security headers ─────────────────────────────────────────────────────────
// SECURITY FIX [HIGH]: The repo's public/_headers documents CSP, HSTS,
// X-Frame-Options, etc. — but that file is a Netlify/Cloudflare-Pages/Vercel
// static-host convention. server.js is a plain Express app serving dist/
// directly; Express never reads _headers files, so none of these
// protections were actually applied in production. This middleware applies
// the exact same policy that was already decided on (including the
// Firebase-Auth-popup-compatible CSP — 'unsafe-eval', accounts.google.com
// frame-src, identitytoolkit/securetoken endpoints, and the
// Cross-Origin-Opener-Policy needed for the Google Sign-In popup flow to
// actually complete), just in a form Express actually executes.
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://*.agora.io; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' wss://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com https://*.agora.io wss://*.agora.io https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
    "img-src 'self' data: https: blob:; frame-src https://accounts.google.com https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  next();
});

// ── Rate limiters ────────────────────────────────────────────────────────────
const agoraLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 30,                // 30 token requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,                // 20 word-generation requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// ── /api/agoraToken ──────────────────────────────────────────────────────────
app.get('/api/agoraToken', agoraLimiter, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { channel, uid } = req.query;
  const APP_ID          = process.env.AGORA_APP_ID;
  const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

  if (!channel || !uid)
    return res.status(400).json({ error: 'Missing params: channel, uid' });

  if (!APP_ID)
    return res.status(500).json({ error: 'AGORA_APP_ID not configured' });

  if (!APP_CERTIFICATE)
    return res.status(200).json({ token: null, mode: 'testing' });

  try {
    const { RtcTokenBuilder, RtcRole } = await import('agora-token');
    const numericUid     = parseInt(uid, 10) || 0;
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID, APP_CERTIFICATE, channel,
      numericUid, RtcRole.PUBLISHER,
      expirationTime, expirationTime,
    );
    return res.status(200).json({ token });
  } catch (err) {
    console.error('[agoraToken] failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── /api/gemini/word — server-side proxy, key never reaches the client ───────
app.post('/api/gemini/word', geminiLimiter, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY; // intentionally NOT VITE_-prefixed

  if (!apiKey) {
    return res.status(503).json({ error: 'Word generation service unavailable' });
  }

  const prompt = `Generate ONE secret word for the party game "The Spy".
Return ONLY valid JSON — no markdown, no code fences, no explanation:
{"word":{"en":"Airport","ar":"مطار"},"hint":{"en":"Travel","ar":"سفر"}}
Rules: word must be a common, concrete noun (one word). hint must be 1-2
vague words that don't give the word away. Be creative and varied — avoid
repeating the same category twice in a row.`;

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.2, maxOutputTokens: 150 },
        }),
      }
    );

    if (!upstream.ok) {
      const errBody = await upstream.json().catch(() => ({}));
      console.error('[gemini/word] upstream error:', upstream.status, errBody?.error?.message);
      return res.status(502).json({ error: errBody?.error?.message ?? 'Upstream error' });
    }

    const data  = await upstream.json();
    const raw   = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed?.word?.en || !parsed?.hint?.en) {
      throw new Error('Malformed response shape from Gemini');
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[gemini/word] failed:', err.message);
    return res.status(500).json({ error: 'Generation failed' });
  }
});

// ── Serve Vite build ─────────────────────────────────────────────────────────
// On Vercel, static serving is handled by rewrites in vercel.json.
// On DigitalOcean/Local, we serve from the root dist folder.
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — all routes → index.html
app.get('*', (req, res) => {
  // Check if file exists to avoid infinite loops in some environments
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[THE MAFIA] Server running on port ${PORT}`);
  });
}
