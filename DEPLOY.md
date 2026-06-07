# ♣ THE MAFIA — Deploy Guide (GitHub → Vercel, Zero CLI)

> **بالضبط شنو دير:** push على GitHub، Vercel يبني ويدير deploy تلقائياً.
> مكاين حتى Firebase CLI، حتى commands. غير المتغيرات فـ Dashboard.

---

## الخطوة 1 — Vercel: ربط GitHub Repo

1. روح على [vercel.com](https://vercel.com) → **New Project**
2. اختار GitHub repo ديالك → **Import**
3. Framework: **Vite** (Vercel يكتشفها تلقائياً)
4. Build Command: `npm run build` ← هكذا هو
5. Output Directory: `dist` ← هكذا هو
6. **لا تكمل حتى تضيف المتغيرات** (خطوة 2)

---

## الخطوة 2 — Vercel: Environment Variables

روح: **Project → Settings → Environment Variables** وضيف كل هذه:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | من Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | `YOUR_PROJECT_ID.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID ديال project ديالك |
| `VITE_FIREBASE_STORAGE_BUCKET` | `YOUR_PROJECT_ID.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | من Firebase Console |
| `VITE_FIREBASE_APP_ID` | من Firebase Console |
| `VITE_FIREBASE_MEASUREMENT_ID` | من Firebase Console (يبدأ بـ `G-`) |
| `VITE_AGORA_APP_ID` | من [Agora Console](https://console.agora.io) → App ID |
| `AGORA_APP_CERTIFICATE` | من Agora Console → Primary Certificate (**⚠️ Server only — لا تضيفها لـ VITE_***) |
| `VITE_APP_URL` | `https://YOUR-APP.vercel.app` (رابط Vercel ديالك) |

بعد تضيفهم كلهم → **Redeploy** (آخر deployment → ثلاث نقاط → Redeploy)

---

## الخطوة 3 — Firebase Console: أضف Domain

Firebase Console → Authentication → Settings → **Authorized domains**

أضف: `YOUR-APP.vercel.app`

بلا هذا، Google Login ما يشتغلش.

---

## الخطوة 4 — Firebase Database Rules

روح: Firebase Console → Realtime Database → **Rules**

انسخ ولصق محتوى ملف `database.rules.json` من المشروع:

```json
// (انسخ من database.rules.json في المشروع)
```

→ **Publish**

بلا هذا، ما يقدر حتى واحد يكري أو يلعب.

---

## الخطوة 5 — Agora Token Server (Vercel API Route)

المشروع فيه `/api/agoraToken.js` — Vercel يشغلها تلقائياً كـ Serverless Function.

**ما محتاجش** Firebase Functions ولا CLI. غير تأكد:
- `AGORA_APP_CERTIFICATE` مضاف في Vercel Environment Variables (بلا `VITE_` prefix — server-side فقط)
- `VITE_APP_URL` مضبوط (بحيث `useAgora` يعرف فين يطلب التوكن)

---

## Workflow ديال التطوير (محلياً)

```bash
cp .env.example .env.local
# عبّي .env.local بالقيم الحقيقية (لا تعطيها لحتى شخص)

npm install
npm run dev
# يفتح على https://localhost:5173
# المتصفح يحذر من self-signed cert — اضغط Advanced → Proceed
# هذا ضروري باش الميكروفون يشتغل (getUserMedia تحتاج HTTPS)
```

---

## كيفاش يشتغل Voice Chat

```
اللاعب يدخل مرحلة النقاش
        ↓
useAgora يطلب: GET /api/agoraToken?channel=ROOM_ID&uid=12345
        ↓
Vercel Serverless Function تولّد token موقّع (يسقط بعد ساعة)
بالـ App Certificate (ما تظهرش أبداً للـ client)
        ↓
useAgora يدخل channel Agora بالتوكن
        ↓
الميكروفون يشتغل — ring ذهبي يظهر حول Avatar اللاعب المتكلم
```

---

## ⚠️ أشياء لا تعملها أبداً

- ❌ لا تضيف `AGORA_APP_CERTIFICATE` بـ `VITE_` prefix — يظهر في bundle للمستخدمين
- ❌ لا تكتب أي credentials مباشرة في الكود
- ❌ لا تـ commit ملف `.env.local`
- ✅ `.gitignore` فيه `*.env*` — Vercel يقرأ المتغيرات من Dashboard مباشرة
