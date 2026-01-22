# InboxPilot AI - Executive Email Assistant

A full-stack AI-powered email management platform built with Next.js, TypeScript, and Node.js. Access your Gmail inbox with AI-powered features directly from our beautiful web interface.

## Features

- **Full Gmail Access**: Read, compose, reply, and manage your emails from a modern web interface
- **AI-Powered Replies**: Generate intelligent email replies with customizable tone (formal, friendly, assertive, short)
- **Email Summarization**: Get instant AI summaries of long emails
- **Smart Compose**: AI-enhanced email composition with tone adjustment
- **Follow-up Generation**: Generate follow-up emails automatically
- **Email Actions**: Star, archive, trash, and manage emails
- **Beautiful Dashboard**: Modern analytics and insights about your email patterns
- **Secure**: OAuth 2.0 authentication, encrypted tokens, your data stays private

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB
- **AI**: Google Gemini (free tier)
- **Authentication**: Google OAuth 2.0

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Google Cloud Project with Gmail API enabled
- Google Gemini API key (free)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/InboxPilot-AI.git
cd InboxPilot-AI
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (see configuration section below)
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### 4. Open the App

Visit `http://localhost:3000` and sign in with your Google account!

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - Gmail API
   - Google Calendar API
4. Go to "APIs & Services" → "Credentials"
5. Create "OAuth 2.0 Client ID" (Web application)
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://your-backend.com/api/auth/google/callback` (production)
7. Copy Client ID and Client Secret to your `.env` file

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key (free tier available)
3. Add to your backend `.env` file as `GEMINI_API_KEY`

### Backend Environment Variables

Create `backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# MongoDB
MONGO_URI=mongodb://localhost:27017/inboxpilot

# Security (generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_byte_hex_key
ENCRYPTION_IV=your_16_byte_hex_iv

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Project Structure

```
InboxPilot-AI/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic (Gmail, AI)
│   │   ├── utils/        # Utility functions
│   │   ├── middlewares/  # Express middlewares
│   │   └── cron/         # Scheduled tasks
│   └── package.json
├── frontend/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Landing page
│   │   ├── login/        # Login page
│   │   ├── dashboard/    # Dashboard
│   │   ├── inbox/        # Email inbox
│   │   ├── compose/      # Compose email
│   │   └── settings/     # Settings
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   ├── store/            # Zustand store
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/url` - Get Google OAuth URL
- `GET /api/auth/google/callback` - OAuth callback

### Gmail
- `GET /api/gmail/messages` - Get email list
- `GET /api/gmail/message/:id` - Get specific email
- `GET /api/gmail/message/:id/full` - Get full email with body
- `GET /api/gmail/thread/:threadId` - Get email thread
- `POST /api/gmail/send` - Send new email
- `POST /api/gmail/message/:id/reply` - Reply to email
- `POST /api/gmail/message/:id/read` - Mark as read
- `POST /api/gmail/message/:id/star` - Star email
- `POST /api/gmail/message/:id/trash` - Move to trash
- `POST /api/gmail/message/:id/archive` - Archive email

### AI
- `POST /api/ai/summarize` - Summarize email
- `POST /api/ai/reply` - Generate reply
- `POST /api/ai/rewrite` - Rewrite/enhance text
- `POST /api/ai/followup` - Generate follow-up

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats

## Deployment

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Update `GOOGLE_REDIRECT_URI` to your Render URL

### Frontend (Vercel)

1. Import project on [Vercel](https://vercel.com)
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy!

### Environment Variables for Production

Backend:
- Update `GOOGLE_REDIRECT_URI` to production URL
- Update `FRONTEND_URL` to production frontend URL
- Use MongoDB Atlas for `MONGO_URI`

Frontend:
- Update `NEXT_PUBLIC_API_URL` to production backend URL

## Troubleshooting

### "Failed to connect to server"
- Make sure backend is running on port 5000
- Check that MongoDB is running
- Verify CORS settings allow your frontend URL

### "OAuth error"
- Verify redirect URI matches exactly in Google Console
- Check Client ID and Secret are correct
- Ensure Gmail API is enabled

### "AI generation failed"
- Verify Gemini API key is correct
- Check API quota at Google AI Studio
- Ensure key starts with "AIza"

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
