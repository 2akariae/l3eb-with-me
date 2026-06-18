# ♣ L3EBWITHME
> A cinematic, real-time social deduction game platform — built with React, Firebase, Framer Motion & Agora.
> Hosts two isolated games today (The Mafia, The Spy), with a registry-based architecture for adding more.

---

## 📦 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS      |
| Animations| Framer Motion (cinematic transitions)|
| Backend   | Firebase Realtime Database           |
| Auth      | Firebase Auth (Google + Anonymous)   |
| Voice     | Agora RTC SDK NG                    |
| State     | Zustand                             |
| Icons     | Lucide React                        |
| Deploy    | DigitalOcean App Platform + Express (`server.js`) |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your real Firebase + Agora values
```

### 3. Deploy Firebase rules
```bash
# Install Firebase CLI if needed
npm install -g firebase-tools
firebase login
firebase use mafia-11
firebase database:rules:update database.rules.json
```

### 4. Run locally
```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Deploy (DigitalOcean App Platform)
```bash
npm run build
# server.js serves the dist/ build + /api/agoraToken + /api/gemini/word
# Set these in App Platform → App Settings → Environment Variables:
#   AGORA_APP_ID, AGORA_APP_CERTIFICATE, GEMINI_API_KEY (server-side only — no VITE_ prefix)
#   Plus all VITE_FIREBASE_* and VITE_AGORA_APP_ID client vars below
npm start
```

---

## 🗂 Project Structure

```
src/
├── App.jsx                        # Top-level mode gates + shared chrome (HUD, chat, settings)
├── router/
│   ├── OnlineRouter.jsx            # Online phase → screen mapping (Mafia + Spy)
│   └── OfflineRouter.jsx           # Offline phase → screen mapping
├── registry/
│   └── gameRegistry.js             # Single source of truth for all platform games
├── hooks/
│   ├── useFirebaseSubscriptions.js # gameState/players/role/roles/history listeners
│   ├── useRoomPresence.js          # meta/kick watcher + Firebase presence
│   ├── useGamePhaseEffects.js      # ambient audio + transition overlay triggers
│   ├── useOnlineRouteInfo.js       # phase/myPlayerId selector for shared chrome
│   ├── useAgora.js                 # Voice chat hook
│   └── useTimer.js                 # Countdown with callback
├── services/
│   ├── gameEngine.js               # Online Firebase read/write ops (both games)
│   ├── offlineEngine.js            # Pure offline state mutations, no network
│   └── firebaseConfig.js           # Firebase SDK init (env vars only)
├── store/
│   ├── gameStore.js                # Zustand global state (online)
│   └── offlineStore.js             # Zustand global state (offline, persisted)
├── constants/
│   ├── game.js                     # Roles, phases, timing, assignments
│   ├── translations.js             # EN/AR UI strings
│   └── wordPack.js                 # Local fallback word list for Spy
├── games/
│   ├── mafia/                      # Isolated Mafia game module
│   │   ├── hooks/useMafiaEngine.js
│   │   └── components/             # Online + offline screens
│   └── spy/                        # Isolated Spy game module
│       ├── hooks/useGeminiWords.js # Calls /api/gemini/word server proxy
│       └── components/
└── components/
    ├── ui/                         # Avatar, TimerRing, Toast, SettingsPanel...
    ├── game/                       # PhaseTransitionOverlay, GameHUD, FloatingPlayerList...
    └── screens/                    # Shared screens used by both games
        ├── AuthScreen.jsx          # Google + Guest sign-in
        ├── LandingScreen.jsx       # Create / Join room
        ├── LobbyScreen.jsx         # Waiting room + player list
        ├── EnvelopeScreen.jsx      # 3D flip role reveal (10s)
        ├── NightScreen.jsx         # Night actions (30s)
        ├── DawnScrollScreen.jsx    # Scroll unroll + typewriter narrative
        ├── DiscussionScreen.jsx    # Voice chat + skip votes (3min)
        ├── VotingScreen.jsx        # Real-time vote tally (30s)
        ├── ExecutionScreen.jsx     # Dramatic kill reveal
        └── GameOverScreen.jsx      # Winner + full role reveal

server.js                           # Express: serves dist/ + agoraToken + gemini/word proxy
```

**Adding a new game:** register it in `registry/gameRegistry.js`, create a `src/games/<name>/` folder
mirroring `mafia/` or `spy/`, and add its phases to the routers. No edits needed to `App.jsx`,
`gameEngine.js`, or `GameSelector.jsx` — see `registry/gameRegistry.js` for details.

---

## 🎭 Game Flow

```
Auth → Landing → Lobby
                    ↓ (Host: Start Game)
              Envelope (10s) — Role reveal 3D flip
                    ↓
              Night (30s) — Mafia kill, Doctor heal, Sheikh investigate
                    ↓
              Dawn Scroll — Scroll unroll + typewriter narrative
                    ↓
              Discussion (3min) — Voice unmuted, skip if 50%+ agree
                    ↓
              Voting (30s) — Real-time vote counts
                    ↓
              Execution — Grayscale fade + role reveal
                    ↓
         [Check win condition → loop or Game Over]
```

---

## 🎲 Roles & Counts

| Players | Mafia | Doctor | Sheikh | Citizens |
|---------|-------|--------|--------|----------|
| 4–5     | 1     | 1      | 1      | 1–2      |
| 6–10    | 2     | 1      | 1      | 2–6      |
| 11–20   | 3     | 1      | 1      | 6–15     |

**Win conditions:**
- 🏆 **Town wins** — All Mafia eliminated
- 💀 **Mafia wins** — Mafia count ≥ Town count

---

## 🔐 Security Architecture

### Firebase Rules (`database.rules.json`)
- ✅ Dead players **cannot** submit votes (`isAlive === true` enforced server-side)
- ✅ Only the host can write `gamestate`
- ✅ Night actions only writable by the acting player (their own UID path)
- ✅ Chat only writable during `discussion` phase
- ✅ All writes require `auth !== null`
- ✅ Message length and timestamp validated at rule level

### Environment
- ✅ All API keys in `.env` — never committed
- ✅ `.gitignore` blocks `.env` and all variants
- ✅ CSP headers block XSS and clickjacking
- ✅ HSTS preload for HTTPS enforcement
- ✅ `server.js` applies CSP, HSTS, and other security headers via Express middleware
  (the previous `_headers` file was a Netlify/Cloudflare-Pages/Vercel-only convention —
  Express never read it, so those protections weren't actually active in production)

### Agora & Gemini
- 🔒 The Agora token is generated server-side in `server.js` using `AGORA_APP_CERTIFICATE`
  (no `VITE_` prefix — never reaches the client bundle)
- 🔒 The Gemini word-generation key is likewise server-side only, as `GEMINI_API_KEY`
  (see `server.js` → `POST /api/gemini/word`, called from `games/spy/hooks/useGeminiWords.js`)
- The certificate/key **must never** be prefixed `VITE_` or referenced from client code —
  doing so bundles the secret in plaintext into the production JS, visible via DevTools

---

## 🌐 Cloudflare Setup (Recommended)

1. Add your domain to Cloudflare (free plan is fine)
2. Set SSL/TLS to **Full (strict)**
3. Enable **WAF** → OWASP ruleset
4. Enable **Bot Fight Mode**
5. Add a Page Rule: `your-domain.com/*` → Cache Level: Bypass (for real-time data)

---

## 🧩 Extending the Game

### Add a new role
1. Add to `ROLES` in `constants/game.js`
2. Add metadata in `ROLE_META`
3. Update `assignRoles()` logic
4. Add night action handling in `resolveNight()` in `gameEngine.js`
5. Add the UI branch in `NightScreen.jsx`

### Add a new language
All UI strings are in component files — extract them to a `constants/i18n.js` following the pattern from Village of Wolves if multilingual support is needed.

---

## 📋 Environment Variables

### Client-side (Vite — `VITE_` prefix, safe to expose, set before `npm run build`)
| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Realtime DB URL |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics (optional) |
| `VITE_AGORA_APP_ID` | Agora App ID (public half — safe client-side) |
| `VITE_APP_URL` | Your deployment URL |

### Server-side only (set in App Platform / host environment — NEVER prefix with `VITE_`)
| Variable | Description |
|---|---|
| `AGORA_APP_CERTIFICATE` | Agora certificate — used by `server.js` to sign RTC tokens |
| `GEMINI_API_KEY` | Gemini API key — used by `server.js` for Spy word generation |
| `PORT` | Auto-set by most hosts (DigitalOcean App Platform sets this) |

---

*Built from scratch — inspired by Village of Wolves, redesigned for the modern web.*
