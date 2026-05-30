<p align="center">
  <img src="assets/logo.png" alt="InboxPilot AI" width="120" height="120" />
</p>

<h1 align="center">InboxPilot AI</h1>
<p align="center">
  <strong>Executive Email Assistant</strong> — AI-powered Gmail management
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#color-palette">Design</a> •
  <a href="#deployment">Deploy</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-darkgreen?style=flat-square&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Google-Gemini-orange?style=flat-square" alt="Gemini" />
</p>

***

## Overview

**InboxPilot AI** is a full-stack, AI-powered email management platform. Connect your Gmail, manage inbox/starred/sent from a modern web UI, and use AI for summaries, smart replies, follow-ups, compose enhancements, and bulk cold email campaigns. Built with **Next.js**, **Express**, **MongoDB**, **OpenAI GPT-4o**, and **Google Gemini**.

***

## Features

| Feature | Description |
|--------|-------------|
| **Gmail integration** | Read, compose, reply, star, archive, trash — full inbox control |
| **AI replies & summaries** | Generate context-aware replies with custom tones and one-click thread summaries |
| **Smart compose** | AI-enhanced drafts with tone adjustment to match your writing style |
| **Automated Follow-ups** | Schedule auto follow-up emails with customizable delays (minutes, hours, days). Manage cron-jobs straight from the inbox or dashboard |
| **AI Chat Assistant** | Interactive "Talk to my AI" side-panel to manage your inbox, summarize data, and ask general questions |
| **Cold Email Campaigns** | Upload a PDF or paste email addresses, choose Direct Send or AI Generate mode, attach files (resume, portfolio, etc.), and blast bulk emails at 50/hour to stay safe with Gmail limits |
| **Priority & categories** | Smart categorization labels: Work, Task, Meeting, Promotions, Reply Needed, etc. |
| **Dashboard & Settings** | Analytics, priority tracking, custom email signatures, and global follow-up management |
| **Secure auth** | Google OAuth 2.0, encrypted tokens |

***

## Screenshots

**1. Landing**

![Landing](assets/landing_page.png)

**2. Inbox**

![Inbox](assets/inbox.png)

**3. Dashboard**

![Dashboard](assets/dashboard.png)

***

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB |
| **AI (Primary)** | OpenAI GPT-4o / GPT-4o-mini |
| **AI (Fallback)** | Google Gemini 2.0 Flash |
| **Auth** | Google OAuth 2.0 |

***

## Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Google Cloud** project with Gmail API enabled
- **OpenAI** API key ([platform.openai.com](https://platform.openai.com/api-keys)) — primary AI
- **Google Gemini** API key ([AI Studio](https://makersuite.google.com/app/apikey)) — fallback AI

### 1. Clone & install

```bash
git clone https://github.com/gauravjain0377/InboxPilot-AI.git
cd InboxPilot-AI
```

### 2. Backend

```bash
cd backend
npm install
# Edit .env (see Configuration)
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api in .env.local
npm run dev
```

### 4. Open app

Visit **http://localhost:3000** and sign in with Google.

***

## Configuration

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → your project
2. Enable **Gmail API** and **Google Calendar API**
3. **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID** (Web)
4. **Authorized redirect URIs**:
   - Dev: `http://localhost:5000/api/auth/google/callback`
   - Prod: `https://your-backend-domain.com/api/auth/google/callback`
5. Use Client ID and Secret in backend `.env`

### AI API Keys

The app uses **OpenAI first**, then falls back to **Gemini** if OpenAI fails or is not configured.

**OpenAI** (primary — text generation + image/PDF reading):
1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Create secret key
2. Add as `OPENAI_API_KEY` in backend `.env`

**Gemini** (fallback):
1. [Google AI Studio](https://makersuite.google.com/app/apikey) → Create API key
2. Add as `GEMINI_API_KEY` in backend `.env`

### Backend `.env`

```env
# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# AI Keys
OPENAI_API_KEY=sk-proj-...        # Primary — GPT-4o for vision, GPT-4o-mini for text
GEMINI_API_KEY=AIza...            # Fallback — used if OpenAI fails

# Database
MONGO_URI=mongodb://localhost:27017/inboxpilot

# Security
JWT_SECRET=your_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_32_byte_hex_key
ENCRYPTION_IV=your_16_byte_hex_iv

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

***

## Cold Email Campaigns

The **Campaigns** feature lets you send bulk cold emails directly from your connected Gmail account.

### How it works

1. **Add recipients** — Upload a PDF (even scanned/image-based) or paste email addresses. The app uses a 3-strategy pipeline to extract every valid email:
   - PDF text layer parsing
   - OpenAI GPT-4o Vision (for scanned/image PDFs)
   - Raw UTF-8 text fallback

2. **Choose a mode**:
   - **Direct Send** — Write your exact email once. Sent as-is to every recipient with zero AI changes.
   - **AI Generate** — Provide your context, role, name, tone, and signature. AI writes a professional, human-sounding email (no `[brackets]`, no clichés).

3. **Attach files** — Attach your resume, portfolio, images, or any files. They are included as real email attachments.

4. **Launch** — Campaign sends at **50 emails/hour** automatically to stay within Gmail limits. Safe to close the page after launching.

### Gmail safety limits

| Recipients | Estimated time |
|-----------|---------------|
| 1–50 | Under 1 hour |
| 51–100 | ~2 hours |
| 101–500 | ~10 hours |

***

## Color Palette

InboxPilot AI uses a **black, white & gray** theme. Typography: **Space Grotesk** (headings) and **Inter** (body).

### Primary palette

| Role | Hex | Usage |
|------|-----|--------|
| **Background** | `#FFFFFF` | Page background |
| **Foreground** | `#171717` | Primary text |
| **Primary** | `#111111` | Buttons, icons, active states |
| **Muted** | `#737373` | Secondary text |
| **Border** | `#E5E5E5` | Borders, dividers |
| **Destructive** | `#EF4444` | Delete, errors |

### Category & priority colors (emails)

| Type | Hex | Example |
|------|-----|---------|
| High priority | `#FEE2E2` / `#B91C1C` | Red |
| Medium | `#FEF3C7` / `#B45309` | Amber |
| Low priority | `#D1FAE5` / `#047857` | Green |
| Work | `#DBEAFE` / `#1D4ED8` | Blue |
| Task | `#F3E8FF` / `#7C3AED` | Purple |
| Meeting | `#E0E7FF` / `#4338CA` | Indigo |
| Promotion | `#FCE7F3` / `#BE185D` | Pink |
| Finance | `#D1FAE5` / `#047857` | Emerald |

***

## Project Structure

```
InboxPilot-AI/
├── backend/
│   └── src/
│       ├── config/         # DB, env
│       ├── controllers/    # Auth, Gmail, AI, Analytics, Campaign
│       ├── models/         # User, Email, Preferences, etc.
│       ├── routes/         # API routes
│       ├── services/       # Gmail, AI (OpenAI+Gemini)
│       ├── middlewares/    # Auth, rate limit
│       └── cron/           # Email sync, follow-ups
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Landing
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── inbox/
│   │   ├── compose/
│   │   ├── campaigns/      # Cold email campaigns
│   │   └── settings/
│   ├── components/         # UI, layout, inbox, dashboard
│   ├── lib/                # Axios, utils
│   ├── store/              # Zustand (user)
│   └── public/             # app assets (Next.js)
├── assets/                 # README images (logo, screenshots)
└── README.md
```

***

## API Overview

| Area | Endpoints |
|------|-----------|
| **Auth** | `GET /api/auth/url`, `GET /api/auth/google/callback` |
| **Gmail** | `GET /api/gmail/messages`, `GET /api/gmail/message/:id`, `POST /api/gmail/send`, `POST /api/gmail/message/:id/reply`, `POST /api/gmail/message/:id/star`, `POST /api/gmail/message/:id/trash`, `POST /api/gmail/message/:id/archive` |
| **AI** | `POST /api/ai/summarize`, `POST /api/ai/reply`, `POST /api/ai/rewrite`, `POST /api/ai/followup` |
| **Campaigns** | `POST /api/campaigns/extract-emails`, `POST /api/campaigns/send` |
| **Analytics** | `GET /api/analytics/dashboard` |

***

## Deployment

### Backend (Render)

- **Root Directory**: `backend`
- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`
- **Required env vars** (set in Render dashboard):

| Key | Description |
|-----|-------------|
| `OPENAI_API_KEY` | OpenAI secret key (primary AI) |
| `GEMINI_API_KEY` | Gemini API key (fallback AI) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://your-app.onrender.com/api/auth/google/callback` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min 32-char secret |
| `ENCRYPTION_KEY` | 32-byte hex key |
| `ENCRYPTION_IV` | 16-byte hex IV |
| `FRONTEND_URL` | `https://your-app.vercel.app` |

### Frontend (Vercel)

- **Root Directory**: `frontend`
- **Framework**: Next.js (auto-detected)
- **Env vars** needed:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` |

> No `OPENAI_API_KEY` needed on Vercel — all AI runs server-side on the backend.

### Post-deploy checklist

1. Add production redirect URI in Google Cloud Console OAuth settings.
2. Add frontend origin to **Authorized JavaScript origins**.
3. Update `FRONTEND_URL` on Render to your Vercel URL.
4. Verify: `GET https://your-backend.onrender.com/health` returns `{ success: true }`.

***

## Troubleshooting

| Issue | Checks |
|-------|--------|
| **Failed to connect** | Backend on 5000, MongoDB up, CORS includes frontend URL |
| **OAuth error** | Redirect URI exact match, Gmail API enabled, Client ID/Secret correct |
| **AI generation failed** | Valid `OPENAI_API_KEY` or `GEMINI_API_KEY`, check quota |
| **Campaign emails not attaching** | File size under 25 MB per attachment |
| **PDF extraction returning wrong emails** | Try OpenAI Vision (add `OPENAI_API_KEY`) — it reads scanned PDFs much better |
| **Render build failed** | Check Node ≥18, all env vars set, `npm run build` passes locally |

***

## Contributing

Contributions are welcome. Open an issue or submit a pull request.

***

## Author

**Gaurav Jain**

| Platform   | Link |
|------------|------|
| **Portfolio** | [gauravjain.tech](https://www.gauravjain.tech/) |
| **GitHub** | [@gauravjain0377](https://github.com/gauravjain0377) |
| **LinkedIn** | [linkedin.com/in/this-is-gaurav-jain](https://www.linkedin.com/in/this-is-gaurav-jain/) |
| **X** | [@gauravjain0377](https://x.com/gauravjain0377) |

***

<p align="center">
  <strong>InboxPilot AI</strong> ~ Smarter email, less noise.
</p>
