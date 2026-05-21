# LIFEOS Dashboard — Setup & Deployment Guide

Your personal lifestyle dashboard with **live WHOOP integration**.
Deployed on Vercel (free tier) in ~10 minutes.

---

## What You're Getting

- ⚡ Command Center — daily overview with live WHOOP recovery score
- 🏋️ Fitness — live strain, calories burned, HRV, resting HR, 7-day history
- 😴 Sleep — live sleep hours, performance %, stages (light/deep/REM)
- 💼 Business — todo list with priorities, weekly goal tracker
- 💰 Finance — all accounts in one view, budget tracker, savings goals
- 📓 Journal — daily prompts, wins log
- 🎯 Focus — Pomodoro timer, deep work log
- 🔥 Habits — streak tracker

---

## Step 1 — WHOOP Developer App Setup

1. Go to **https://developer-dashboard.whoop.com**
2. Sign in with your WHOOP account credentials
3. Click **"Get Started"** and create a Team (any name, e.g. "My Dashboard")
4. Click **"Create App"**
5. Fill in:
   - **App Name:** LIFEOS Dashboard (or anything you like)
   - **Redirect URI:** `https://YOUR-APP-NAME.vercel.app/api/auth/callback`
     *(You'll get this URL after Step 3 — you can update it later)*
   - **Scopes:** Check all of these:
     - ✅ `offline`
     - ✅ `read:recovery`
     - ✅ `read:cycles`
     - ✅ `read:workout`
     - ✅ `read:sleep`
     - ✅ `read:profile`
     - ✅ `read:body_measurement`
6. Click **Create**
7. **Copy your `Client ID` and `Client Secret`** — save them somewhere safe.
   Your Client Secret is shown only once.

---

## Step 2 — Deploy to Vercel

### Option A: GitHub (Recommended — easiest updates)

1. Create a free account at **https://github.com** if you don't have one
2. Create a new repository called `lifeos-dashboard` (set to Private)
3. Upload all these project files to the repo
4. Go to **https://vercel.com** and sign in with GitHub
5. Click **"Add New Project"** → Import your `lifeos-dashboard` repo
6. Vercel auto-detects Next.js — just click **Deploy**
7. After deploy, note your URL: `https://lifeos-dashboard-xxxx.vercel.app`

### Option B: Vercel CLI (No GitHub needed)

```bash
# Install Node.js from https://nodejs.org if you don't have it

# Install Vercel CLI
npm install -g vercel

# From inside the lifeos folder:
cd lifeos
npm install
vercel

# Follow the prompts — it will give you a URL at the end
```

---

## Step 3 — Set Environment Variables on Vercel

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add each of these:

| Variable | Value |
|---|---|
| `WHOOP_CLIENT_ID` | Your Client ID from Step 1 |
| `WHOOP_CLIENT_SECRET` | Your Client Secret from Step 1 |
| `WHOOP_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback` |
| `SESSION_SECRET` | A random 32+ character string (see below) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

**To generate a SESSION_SECRET**, open Terminal (Mac) or Command Prompt (Windows) and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as your SESSION_SECRET.

3. After adding all variables, click **Redeploy** in Vercel (Deployments tab → the 3-dot menu → Redeploy)

---

## Step 4 — Update WHOOP Redirect URI

1. Go back to **https://developer-dashboard.whoop.com**
2. Click your app → Edit (pencil icon)
3. Update the Redirect URI to exactly:
   `https://your-actual-app-url.vercel.app/api/auth/callback`
4. Save

---

## Step 5 — Connect & Launch

1. Visit your Vercel URL (e.g. `https://lifeos-dashboard.vercel.app`)
2. Click **"Connect WHOOP & Launch Dashboard"**
3. You'll be redirected to WHOOP to authorize — log in and approve
4. You're in! Your live data will appear automatically.

---

## How Data Refreshes

- **On page load** — always fetches fresh data from WHOOP
- **Every 15 minutes** — auto-syncs in the background while the page is open
- **Manual sync** — click the ↻ Sync button in the top bar anytime
- **Token refresh** — happens automatically every hour (you never need to re-login)

---

## Running Locally (Optional)

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local with your real values
# Set WHOOP_REDIRECT_URI=http://localhost:3000/api/auth/callback
# Add http://localhost:3000/api/auth/callback to your WHOOP app's Redirect URIs

npm install
npm run dev
# Open http://localhost:3000
```

---

## Troubleshooting

**"Auth error: token_exchange_failed"**
→ Your Redirect URI in the WHOOP dashboard doesn't exactly match your `WHOOP_REDIRECT_URI` env variable. Check for trailing slashes or http vs https.

**"⚠ Retry WHOOP" button showing**
→ Click it to retry. If it keeps failing, your session may have expired — click "Sign out" and reconnect WHOOP.

**Blank/loading data**
→ Make sure all 5 environment variables are set in Vercel and you've redeployed after adding them.

**"Session expired. Please reconnect WHOOP."**
→ Go to the homepage and click Connect WHOOP again. This shouldn't happen often — iron-session keeps you logged in for 30 days.

---

## Project Structure

```
lifeos/
├── pages/
│   ├── index.js              # Login / landing page
│   ├── dashboard.js          # Main dashboard UI
│   ├── _app.js
│   └── api/
│       ├── auth/
│       │   ├── login.js      # Redirects to WHOOP OAuth
│       │   ├── callback.js   # Handles OAuth callback, saves tokens
│       │   ├── logout.js     # Clears session
│       │   └── status.js     # Checks if user is logged in
│       └── whoop/
│           └── data.js       # Fetches all WHOOP data (auto-refreshes token)
├── lib/
│   ├── whoop.js              # WHOOP API client + data normalization
│   └── session.js            # iron-session config
├── styles/
│   └── globals.css
├── .env.local.example        # Template for your env variables
├── next.config.js
└── package.json
```

---

## Security Notes

- Your WHOOP tokens are stored in an encrypted, HTTP-only cookie (iron-session)
- Your `CLIENT_SECRET` and `SESSION_SECRET` never leave Vercel's servers
- All WHOOP API calls are made server-side — your token is never exposed to the browser
- This is a personal-use app — no database, no third-party data sharing

---

*Built with Next.js · WHOOP Developer API v2 · Deployed on Vercel*
