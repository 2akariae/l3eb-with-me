# ♣ THE MAFIA
> A cinematic, real-time social deduction game — built with React, Firebase, Framer Motion & Agora.

**Live URL:** https://el-mafia3.vercel.app

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
| Deploy    | Vercel + Cloudflare (optional WAF)  |

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

### 5. Deploy to Vercel
```bash
npm run build
# Push to GitHub → Import project in Vercel
# Add all VITE_* env vars in Vercel dashboard
```

---

## 🗂 Project Structure

```
src/
├── App.jsx                        # Root router + phase orchestration
├── firebase.js                    # Firebase SDK init (env vars only)
├── index.css                      # Tailwind + custom noir styles
├── constants/
│   └── game.js                    # Roles, phases, timing, assignments
├── store/
│   └── gameStore.js               # Zustand global state
├── hooks/
│   ├── useAgora.js                # Voice chat hook
│   ├── useTimer.js                # Countdown with callback
│   └── useTypewriter.js           # Character-by-character reveal
├── utils/
│   └── gameEngine.js              # All Firebase read/write operations
└── components/
    ├── ui/                        # Avatar, TimerRing, Toast, Modal...
    ├── game/                      # PhaseTransitionOverlay, GameHUD, PlayerCard
    └── screens/
        ├── AuthScreen.jsx         # Google + Guest sign-in
        ├── LandingScreen.jsx      # Create / Join room
        ├── LobbyScreen.jsx        # Waiting room + player list
        ├── EnvelopeScreen.jsx     # 3D flip role reveal (10s)
        ├── NightScreen.jsx        # Night actions (30s)
        ├── DawnScrollScreen.jsx   # Scroll unroll + typewriter narrative
        ├── DiscussionScreen.jsx   # Voice chat + skip votes (3min)
        ├── VotingScreen.jsx       # Real-time vote tally (30s)
        ├── ExecutionScreen.jsx    # Dramatic kill reveal
        └── GameOverScreen.jsx     # Winner + full role reveal
```

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
- ✅ `vercel.json` sets all security headers at CDN level

### Agora
- 🔒 For production, implement a token server using the provided `VITE_AGORA_CERTIFICATE`
- The certificate **must never** be used client-side — it belongs only on your server
- See: https://github.com/AgoraIO-Community/agora-token-service

---

## 🌐 Cloudflare Setup (Recommended)

1. Add your domain to Cloudflare (free plan is fine)
2. Set SSL/TLS to **Full (strict)**
3. Enable **WAF** → OWASP ruleset
4. Enable **Bot Fight Mode**
5. Add a Page Rule: `el-mafia3.vercel.app/*` → Cache Level: Bypass (for real-time data)

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
| `VITE_AGORA_APP_ID` | Agora App ID |
| `VITE_AGORA_CERTIFICATE` | Agora cert (server-side only!) |
| `VITE_APP_URL` | Your deployment URL |

---

*Built from scratch — inspired by Village of Wolves, redesigned for the modern web.*
