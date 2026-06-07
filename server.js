// ─── THE MAFIA — server.js (DigitalOcean App Platform) ───────────────────────
// Simple Express server that:
//  1. Serves the Vite-built frontend (dist/)
//  2. Handles /api/agoraToken serverless-style
// Required env vars (set in DO App Platform → App Settings → Environment Variables):
//   AGORA_APP_ID, AGORA_APP_CERTIFICATE, PORT (auto-set by DO)
// ─────────────────────────────────────────────────────────────────────────────
import express    from 'express';
import path       from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3000;

// ── /api/agoraToken ──────────────────────────────────────────────────────────
app.get('/api/agoraToken', async (req, res) => {
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

// ── Serve Vite build ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — all routes → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[THE MAFIA] Server running on port ${PORT}`);
});
