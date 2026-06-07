// ─── THE MAFIA — api/agoraToken.js (Vercel Serverless Function) ───────────────
// FIX: package.json has "type":"module" but Vercel API routes need CJS.
// Solution: use .js with module.exports AND add vercel.json functions config
// to set runtime to nodejs20.x which handles this correctly.
//
// ROOT CAUSE of HTTP 500:
//   "type":"module" in package.json makes Node treat .js files as ESM.
//   But Vercel serverless functions use CommonJS internally.
//   Fix: rename to explicit CJS pattern OR use the vercel functions config below.
// ─────────────────────────────────────────────────────────────────────────────

const { RtcTokenBuilder, RtcRole } = require('agora-token');

const TOKEN_TTL_SEC = 3600;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET')     { return res.status(405).json({ error: 'Method not allowed' }); }

  const { channel, uid } = req.query;

  const APP_ID          = process.env.AGORA_APP_ID          || process.env.VITE_AGORA_APP_ID;
  const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || process.env.VITE_AGORA_APP_CERTIFICATE;

  if (!channel || !uid)
    return res.status(400).json({ error: 'Missing params: channel, uid' });

  if (!APP_ID)
    return res.status(500).json({ error: 'AGORA_APP_ID not configured in Vercel env vars' });

  // No certificate = Testing Mode, return null token (still works)
  if (!APP_CERTIFICATE)
    return res.status(200).json({ token: null, mode: 'testing' });

  try {
    const numericUid     = parseInt(uid, 10) || 0;
    const nowSec         = Math.floor(Date.now() / 1000);
    const expirationTime = nowSec + TOKEN_TTL_SEC;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID, APP_CERTIFICATE, channel,
      numericUid, RtcRole.PUBLISHER,
      expirationTime, expirationTime,
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error('[agoraToken] generation failed:', err.message);
    return res.status(500).json({ error: 'Token generation failed: ' + err.message });
  }
};
