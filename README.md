# Antwerp Unseen — The Living Archive

A *phygital* installation for Visit Antwerp. Camera-sensing street screens display
anonymous local memories as dithered silhouettes; passers-by contribute their own
stories (text, voice, photo, video) by scanning a QR code. This repository contains
the web platform: the public archive, the contribution flow, and the installation
display itself.

**Live:** https://antwerp-unseen.vercel.app
**Repo:** https://github.com/ixtliii/antwerp-unseen
**Gitlab:** https://gitlab.com/integration41504422/integration4

---

## 1. System requirements

You can develop on **macOS, Windows, or Linux** — there is nothing platform-specific.

| Requirement | Version / notes |
|---|---|
| **Node.js** | 18 or newer (20 LTS recommended) |
| **npm** | 9+ (ships with Node; or use pnpm/yarn if you prefer) |
| **Git** | any recent version |
| **Internet connection** | required — the app talks to Supabase (database, storage, realtime) and OpenAI (moderation) at runtime |
| **A modern browser** | Chrome, Edge, Safari, or Firefox. The installation page needs **camera access**, so it must be served over **HTTPS** (or `localhost`, which browsers treat as secure) |
| **Supabase account** | free tier works for development; the live project uses **Pro** (for image transformations) |
| **OpenAI account** | only for text moderation; the moderation endpoint is free but the account must have billing enabled |

Some features have extra needs:
- **Camera** (installation page): a webcam, and the page served over HTTPS or `localhost`.
- **Microphone** (voice submissions): mic access, again over a secure origin.

---

## 2. Tech stack

- **Build tool:** Vite
- **Framework:** React 18 + TypeScript
- **Routing:** React Router
- **3D / graphics:** Three.js, React Three Fiber, Drei, custom GLSL shaders
- **Animation:** GSAP, @react-spring, Framer Motion
- **Camera / segmentation:** MediaPipe (selfie segmentation)
- **Backend:** Supabase (Postgres, Storage, Realtime, Edge Functions)
- **Moderation:** OpenAI Moderation API (via a Supabase Edge Function)
- **Styling:** plain CSS with BEM, co-located per component, design tokens in `tokens.css`
- **Hosting:** Vercel

---

## 3. Environment variables (`.env`)

The app reads its configuration from a `.env` file in the project root. **This file is
not committed to Git** (it is in `.gitignore`) because it contains keys.

Create a file called `.env` in the project root with the following:

```dotenv
# Supabase — found in your Supabase project under Settings → API
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Notes:
- The `VITE_` prefix is **required** — Vite only exposes variables that start with it to the browser.
- The **anon/public** key is safe to ship to the browser (it is the public key, protected by Row Level Security). **Never** put the Supabase *service_role* key or the *OpenAI* key in `.env` — those are secrets and live only on the server (see §6).
- An example file, `.env.example`, is included in the repo. Copy it: `cp .env.example .env`, then fill in your values.

---

## 4. Step-by-step setup

### First time

```bash
# 1. Clone the repository
git clone https://github.com/ixtliii/antwerp-unseen.git
cd antwerp-unseen

# 2. Install dependencies
npm install

# 3. Create your environment file and fill it in
cp .env.example .env
#    then open .env and paste your Supabase URL + anon key

# 4. Start the dev server
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it in your browser.

### Day-to-day

```bash
npm run dev        # start the local dev server with hot reload
```

### Other useful commands

```bash
npm run build      # production build into /dist
npm run preview    # serve the production build locally to test it
npm run lint       # run ESLint (if configured)
```

> **Tip — testing the installation/camera locally:** browsers only allow camera and
> microphone on secure origins. `localhost` counts as secure, so `npm run dev` works
> for the camera on your own machine. To test on a phone or a second laptop, use the
> deployed HTTPS URL (Vercel) instead — plain `http://192.168.x.x` will be blocked.

---

## 5. Setting up Supabase (the database & storage)

The app will not work without a Supabase backend. You can either use the existing
project (ask the team for access) or stand up your own. To create your own:

### 5.1 Create the project
1. Go to [supabase.com](https://supabase.com), create a new project.
2. Once created, go to **Settings → API** and copy the **Project URL** and the **anon public** key into your `.env` (see §3).

### 5.2 Create the database schema
Open **SQL Editor** in the Supabase dashboard and run the contents of
[`supabase/schema.sql`](./supabase/schema.sql) (included in this folder). It creates
the `submissions` table, the `artworks` table, indexes, and the Row Level Security
policies that allow anonymous visitors to submit and read.

### 5.3 Create the storage bucket
1. Go to **Storage → Create bucket**.
2. Name it `submissions`, make it **public** (so uploaded photos/videos/voice can be displayed).
3. (Optional) create a second public bucket `artist-works` if you use the artists archive.

### 5.4 Enable Realtime (required for the live installation)
The installation page updates live as new submissions arrive. For this to work:
1. Go to **Database → Replication** (or **Database → Publications**).
2. Enable replication for the **`submissions`** table.
3. (Optional, for live removal of deleted submissions) run this in the SQL editor:
   ```sql
   ALTER TABLE submissions REPLICA IDENTITY FULL;
   ```

### 5.5 Enable Image Transformations (Pro plan only)
The archive and installation request resized/optimized images. On the **Pro** plan:
1. Go to **Storage → Settings**.
2. Toggle **Enable Image Transformations** on.

If you are on the free plan this feature is unavailable; the app falls back to the
original full-size images automatically, so it still works.

---

## 6. Setting up moderation (OpenAI + Supabase Edge Function)

Submitted **text** is checked for harmful content before it is stored. This runs in a
Supabase Edge Function so the OpenAI key never reaches the browser. It is optional —
if you skip it, submissions still work, they are just not AI-moderated (the function
"fails open").

### 6.1 Get an OpenAI API key
1. Go to [platform.openai.com](https://platform.openai.com) → **API keys** → create a key (`sk-...`).
2. **Important:** the moderation endpoint is *free*, but your OpenAI account must have **billing enabled** (a payment method on file). Without it, the API returns `429 Too Many Requests` even for the free endpoint. Moderation calls themselves are not charged.

### 6.2 Deploy the Edge Function
The function source is in [`supabase/functions/moderate-text/index.ts`](./supabase/functions/moderate-text/index.ts).

**Option A — Dashboard (no CLI):**
1. Supabase dashboard → **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `moderate-text`.
3. Paste the contents of `index.ts`, then **Deploy**.

**Option B — CLI:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy moderate-text
```

### 6.3 Set the secret
The function reads the key from a secret named `OPENAI_API_KEY`.

- **Dashboard:** Edge Functions → **Secrets** → add `OPENAI_API_KEY` = your `sk-...` key.
- **CLI:** `supabase secrets set OPENAI_API_KEY=sk-your-key`

### 6.4 Verify
On the function's page click **Test** and send:
```json
{ "text": "I want to kill you" }
```
A working setup returns `{ "ok": false, "flagged": true, ... }`. If you see
`"warning": "moderation_error"` with `"status": 429`, your OpenAI account needs billing
enabled (see §6.1).

> **Scope note:** moderation covers **text only**. Images, voice, and video are out of
> scope by design. A local keyword filter in `src/lib/moderation.ts` runs first as a
> fallback, so obvious profanity is caught even without the OpenAI layer.

---

## 7. Deploying (Vercel)

The site auto-deploys from the `main` branch via Vercel.

1. Import the repo into [Vercel](https://vercel.com).
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Add the environment variables from your `.env` (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) under **Project → Settings → Environment Variables**.
4. Push to `main` → Vercel builds and deploys automatically.

> Remember: changes only reach the live site after you **commit, push, and Vercel
> rebuilds**. Local changes do not affect the deployed URL until then.

---

## 8. Project structure (overview)

```
antwerp-unseen/
├── public/                  # static assets (videos, fonts, etc.)
├── src/
│   ├── components/
│   │   ├── atoms/           # smallest building blocks (DitherVideo, buttons…)
│   │   ├── molecules/       # composed components (cards, footers…)
│   │   ├── organisms/       # full features (SubmitFlow, Installation…)
│   │   └── globals/         # app-wide UI (transitions…)
│   ├── hooks/               # custom React hooks
│   ├── lib/                 # supabaseClient, moderation helper…
│   ├── context/             # React contexts (language…)
│   ├── data/                # static data (prompts, windows…)
│   └── styles/              # tokens.css, fonts.css, global styles
├── supabase/
│   ├── schema.sql           # database schema + RLS policies
│   └── functions/
│       └── moderate-text/   # moderation Edge Function
├── .env.example             # template for your .env
└── package.json
```

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Blank page, console error about `VITE_SUPABASE_URL` | `.env` missing or not filled in. See §3. Restart `npm run dev` after editing `.env`. |
| Submissions don't save | Row Level Security blocking inserts — make sure the policies from `schema.sql` were applied (§5.2). |
| Installation doesn't update live | Realtime not enabled for `submissions` (§5.4). |
| Camera/mic won't start | Page not on a secure origin. Use `localhost` or the HTTPS deploy, not `http://<ip>`. |
| Images load full-size / slowly | Image Transformations not enabled (Pro only, §5.5) — this is a graceful fallback, not a bug. |
| Moderation never blocks anything | Function not deployed, secret not set, or OpenAI account has no billing (`429`). See §6.4. |
| Changes don't show on the phone | You're viewing the deployed site — commit, push, wait for Vercel, then hard-refresh. |

---

## 10. Credits

Created by Milo for the Digital Experience Design (Devine) programme at Howest,
in response to a client brief for Visit Antwerp.