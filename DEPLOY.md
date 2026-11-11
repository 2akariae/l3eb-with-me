# ♣ L3EBWITHME — Deploy Guide (DigitalOcean App Platform)

> **بالضبط شنو دير:** push على GitHub، DigitalOcean App Platform يبني ويدير
> deploy تلقائياً بحسب `.do/app.yaml`. غير المتغيرات السرية فـ Dashboard.
>
> ⚠️ هاد الملف بدّل النسخة القديمة (Vercel) — المشروع دابا كيستخدم Express
> (`server.js`) و DigitalOcean، شي `vercel.json` وشي `api/agoraToken.js`
> القديمة (Vercel Serverless Function بـ CommonJS) تمسحو من المشروع لأنهم
> كانوا dead code ما عادو يخدموش مع `"type": "module"`.

---

## الخطوة 1 — DigitalOcean: إنشاء App جديد

1. روح على [DigitalOcean App Platform](https://cloud.digitalocean.com/apps) → **Create App**
2. اختار GitHub repo ديالك → الفرع `main`
3. App Platform غادي يقرا `.do/app.yaml` تلقائياً (Build command, Run command, Port كلهم محددين فيه)
4. **لا تكمل حتى تضيف المتغيرات السرية** (خطوة 2)

---

## الخطوة 2 — DigitalOcean: Environment Variables (Secrets)

روح: **App → Settings → App-Level Environment Variables** وضيف:

| Key | Value | Type |
|-----|-------|------|
| `AGORA_APP_ID` | من [Agora Console](https://console.agora.io) | Secret |
| `AGORA_APP_CERTIFICATE` | من Agora Console → Primary Certificate (**⚠️ بلا `VITE_` prefix أبداً**) | Secret |
| `GEMINI_API_KEY` | من [Google AI Studio](https://aistudio.google.com/apikey) (**⚠️ بلا `VITE_` prefix أبداً**) | Secret |
| `VITE_FIREBASE_API_KEY` | من Firebase Console → Project Settings | Secret |
| `VITE_FIREBASE_AUTH_DOMAIN` | `YOUR_PROJECT_ID.firebaseapp.com` | Secret |
| `VITE_FIREBASE_DATABASE_URL` | `https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com` | Secret |
| `VITE_FIREBASE_PROJECT_ID` | ID ديال project ديالك | Secret |
| `VITE_FIREBASE_STORAGE_BUCKET` | `YOUR_PROJECT_ID.firebasestorage.app` | Secret |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | من Firebase Console | Secret |
| `VITE_FIREBASE_APP_ID` | من Firebase Console | Secret |
| `VITE_FIREBASE_MEASUREMENT_ID` | من Firebase Console (يبدأ بـ `G-`) | Secret |
| `VITE_AGORA_APP_ID` | نفس `AGORA_APP_ID` (النصف العمومي، آمن للـ client) | Secret |
| `VITE_APP_URL` | `https://your-app.ondigitalocean.app` (رابط App Platform ديالك بعد أول deploy) | Plain |

بعد تضيفهم كلهم → **Save** → App Platform يعاود deploy تلقائياً.

---

## الخطوة 3 — Firebase Console: أضف Domain

Firebase Console → Authentication → Settings → **Authorized domains**

أضف: `your-app.ondigitalocean.app`

بلا هذا، Google Login ما يشتغلش.

---

## الخطوة 4 — Firebase Database Rules

روح: Firebase Console → Realtime Database → **Rules**

انسخ ولصق محتوى ملف `database.rules.json` من المشروع → **Publish**

بلا هذا، ما يقدر حتى واحد يكري أو يلعب.

أو استخدم Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use mafia-11
firebase database:rules:update database.rules.json
```

---

## الخطوة 5 — Agora Token + Gemini Word Proxy (Express، خدّامين أصلاً)

`server.js` كيخدم الاثنين تلقائياً — ما محتاجش serverless functions ولا
ملفات إضافية:

- `GET /api/agoraToken?channel=X&uid=Y` — يولّد Agora RTC token موقّع
- `POST /api/gemini/word` — يولّد كلمة سرية لـ The Spy عبر Gemini

غير تأكد:
- `AGORA_APP_CERTIFICATE` و`GEMINI_API_KEY` مضافين فـ DigitalOcean Environment
  Variables (بلا `VITE_` prefix — server-side فقط)
- `VITE_APP_URL` مضبوط (بحيث `useAgora` يعرف فين يطلب التوكن)

---

## Workflow ديال التطوير (محلياً)

```bash
cp .env.example .env
# عبّي .env بالقيم الحقيقية (لا تعطيها لحتى شخص، ولا تـ commitيها)

npm install
npm run dev
# يفتح على http://localhost:5173 (Vite dev server)
```

للتجربة المحلية لـ server.js نفسه (بعد build):
```bash
npm run build
npm start
# يفتح على http://localhost:3000
```

---

## كيفاش يشتغل Voice Chat

```
اللاعب يدخل مرحلة النقاش
        ↓
useAgora يطلب: GET /api/agoraToken?channel=ROOM_ID&uid=12345
        ↓
server.js (Express) يولّد token موقّع (يسقط بعد ساعة)
بالـ App Certificate (ما تظهرش أبداً للـ client)
        ↓
useAgora يدخل channel Agora بالتوكن
        ↓
الميكروفون يشتغل — ring ذهبي يظهر حول Avatar اللاعب المتكلم
```

## كيفاش تتولّد كلمة The Spy

```
الـ Host يبدا round جديد
        ↓
generateSpyWord() يطلب: POST /api/gemini/word
        ↓
server.js يستدعي Gemini بالمفتاح السري (ما يظهرش أبداً للـ client)
        ↓
إذا الطلب فشل (quota, network) → fallback تلقائي لـ wordPack.js المحلي
```

---

## ⚠️ أشياء لا تعملها أبداً

- ❌ لا تضيف `AGORA_APP_CERTIFICATE` ولا `GEMINI_API_KEY` بـ `VITE_` prefix — يظهرو فـ bundle للمستخدمين
- ❌ لا تكتب أي credentials مباشرة في الكود
- ❌ لا تـ commit ملف `.env`
- ✅ `.gitignore` فيه `.env` — DigitalOcean يقرا المتغيرات من Dashboard مباشرة
