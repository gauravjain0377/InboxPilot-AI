# InboxPilot AI - Executive Email Assistant

A full-stack AI-powered email management platform built with MERN stack, Next.js, and TypeScript. Includes **Gmail Chrome Extension** and **Gmail Add-on** for seamless integration directly into Gmail.

## 🚀 Features

- **Gmail Integration**: OAuth2 authentication with Gmail API
- **AI-Powered Replies**: Generate intelligent email replies using Gemini AI
- **Email Management**: Categorize, prioritize, and organize emails automatically
- **Calendar Integration**: Schedule meetings and suggest available time slots
- **Follow-up Automation**: Track and manage email follow-ups
- **Rule-Based Classification**: Automatically label and categorize emails
- **Beautiful Dashboard**: Modern UI with analytics and insights
- **Chrome Extension**: Direct Gmail integration with injected UI
- **Gmail Add-on**: Sidebar panel in Gmail with AI features

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database
- Google Cloud Project with Gmail and Calendar APIs enabled
- Google Gemini API key (OpenAI removed - Gemini only)

## 🛠️ Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

GEMINI_API_KEY=your_gemini_api_key

MONGO_URI=mongodb://localhost:27017/inboxpilot

JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_character_encryption_key_hex
ENCRYPTION_IV=your_16_character_iv_hex

PORT=5000
NODE_ENV=development
```

4. Generate encryption keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

5. Run the backend:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. Run the frontend:
```bash
npm run dev
```

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env` file

## 📁 Project Structure

```
InboxPilot-AI/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utility functions
│   │   ├── middlewares/  # Express middlewares
│   │   └── cron/         # Scheduled tasks
│   └── package.json
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utilities
│   ├── store/           # Zustand store
│   └── package.json
├── extension/            # Chrome Extension
│   ├── manifest.json
│   ├── contentScript.js
│   ├── injectedUI.js
│   ├── background.js
│   ├── styles.css
│   └── utils/
└── addon/                # Gmail Add-on
    ├── main.gs
    ├── sidebar.html
    └── appsscript.json
```

## 🎯 API Endpoints

### Authentication
- `GET /api/auth/url` - Get Google OAuth URL
- `POST /api/auth/google` - Complete OAuth flow

### Gmail
- `GET /api/gmail/messages` - Get email messages
- `GET /api/gmail/message/:id` - Get specific email
- `POST /api/gmail/draft` - Create draft
- `POST /api/gmail/send` - Send email
- `POST /api/gmail/watch` - Watch inbox for changes

### AI
- `POST /api/ai/summarize` - Summarize email
- `POST /api/ai/reply` - Generate reply
- `POST /api/ai/rewrite` - Rewrite text
- `POST /api/ai/followup` - Generate follow-up

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `GET /api/calendar/free-slots` - Get free time slots
- `POST /api/calendar/event` - Create calendar event
- `POST /api/calendar/suggest` - Suggest meeting times from email

### Gmail Extension
- `POST /api/gmail/apply-label` - Apply label to email

## 🔌 Gmail Extension Setup

### Chrome Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension will inject AI features into Gmail

**Features:**
- Floating sidebar panel with AI actions
- Compose toolbar with rewrite/expand/shorten
- Email action buttons
- Direct integration with backend API

### Gmail Add-on (Google Apps Script)

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Copy `addon/main.gs` to `Code.gs`
4. Create HTML file `sidebar.html` with addon contents
5. Deploy as Gmail add-on

**Features:**
- Sidebar panel in Gmail
- AI summarization and reply generation
- Meeting suggestions
- Follow-up automation

## 🚀 Deployment

### Backend (Render/Railway)
1. Set environment variables
2. Build: `npm run build`
3. Start: `npm start`

### Frontend (Vercel)
1. Connect your repository
2. Set environment variables
3. Deploy automatically

### Extension
1. Package extension folder
2. Submit to Chrome Web Store (or use unpacked for development)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
