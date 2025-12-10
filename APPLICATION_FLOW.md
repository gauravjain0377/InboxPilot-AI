# InboxPilot AI - Application Flow & Purpose

## 🎯 Core Purpose

InboxPilot AI integrates directly into users' Gmail accounts to provide AI-powered email management. Once users grant permission, all features work **inside their Gmail inbox** - not just in our web app.

## 🔄 Complete User Flow

### 1. Landing Page (`/`)
- Beautiful landing page explaining features
- "Get Started" button → Login page
- Shows: AI replies, prioritization, Gmail integration, etc.

### 2. Login (`/login`)
- User clicks "Sign in with Google"
- Redirects to Google OAuth consent screen
- User grants permissions:
  - Gmail read/write access
  - Calendar access
  - User profile info

### 3. OAuth Callback (`/api/auth/google/callback`)
- Google redirects back with authorization code
- Backend exchanges code for access tokens
- Creates/updates user in database
- Encrypts and stores Gmail tokens
- Redirects to frontend with JWT token

### 4. Auth Callback Page (`/auth/callback`)
- Receives token from backend
- Stores token in localStorage and Zustand
- Redirects to dashboard

### 5. Dashboard (`/dashboard`)
- Shows email statistics
- Quick actions (Inbox, Compose, Settings)
- User is now authenticated

## 📧 Gmail Integration (The Main Feature)

### How It Works in User's Gmail

Once authenticated, users install:

1. **Chrome Extension** (`/extension`)
   - Injects AI features directly into Gmail UI
   - Floating sidebar panel
   - Compose toolbar with AI tools
   - Email action buttons

2. **Gmail Add-on** (`/addon`)
   - Sidebar panel in Gmail
   - Same AI features as extension

### Features Working in User's Gmail

All these work **directly in their Gmail inbox**:

✅ **AI-Powered Replies**
- Click "Generate Reply" on any email
- AI creates professional replies
- User can edit and send

✅ **Email Prioritization**
- Automatically labels emails as High/Medium/Low priority
- Based on sender, keywords, content analysis
- Uses rule engine for smart categorization

✅ **AI Drafts**
- Generate complete emails from scratch
- Rewrite existing drafts
- Change tone (formal/friendly/assertive)
- Expand or shorten text

✅ **Email Summarization**
- One-click summary of long email threads
- Saves time reading lengthy conversations

✅ **Follow-up Automation**
- Tracks sent emails
- Reminds if no reply received
- Auto-generates follow-up drafts

✅ **Meeting Scheduling**
- Detects meeting requests in emails
- Suggests available time slots from Google Calendar
- Creates calendar events

✅ **Smart Labels**
- Auto-categorizes emails (Finance, Scheduling, Promotions, etc.)
- Based on content and rules

## 🔐 Permissions & Security

### What We Access (With User Permission)

- **Gmail**: Read, send, and modify emails
- **Calendar**: Read events and create meetings
- **User Info**: Email and profile (for authentication)

### How We Protect Data

- All tokens encrypted with AES-256
- Stored securely in MongoDB
- No data shared with third parties
- User can revoke access anytime

## 🚀 Technical Flow

```
User → Landing Page → Login → Google OAuth
  ↓
Google → Callback URL → Backend (exchanges code)
  ↓
Backend → Creates User → Stores Encrypted Tokens
  ↓
Backend → Redirects to Frontend with JWT
  ↓
Frontend → Stores Token → Dashboard
  ↓
User → Installs Extension/Add-on
  ↓
Extension → Uses Backend API → AI Features in Gmail
```

## 📱 Where Features Work

### Web App (`/dashboard`, `/inbox`, `/compose`)
- Full-featured dashboard
- Email management interface
- Settings and preferences

### Gmail (via Extension/Add-on)
- **All AI features work here**
- Direct integration in inbox
- No need to leave Gmail
- Seamless user experience

## 🎨 User Experience

1. **First Time**: User visits landing page → Logs in → Grants permissions
2. **Daily Use**: User opens Gmail → AI features available → Uses directly in inbox
3. **Management**: User can visit dashboard for analytics and settings

## 🔧 Backend API Endpoints

All endpoints work with the extension/add-on:

- `POST /api/ai/summarize` - Summarize email
- `POST /api/ai/reply` - Generate reply
- `POST /api/ai/rewrite` - Rewrite text
- `POST /api/ai/followup` - Generate follow-up
- `POST /api/calendar/suggest` - Suggest meeting times
- `GET /api/gmail/messages` - Fetch emails
- `POST /api/gmail/send` - Send email
- `POST /api/gmail/apply-label` - Apply labels

## ✅ What's Fixed

1. ✅ OAuth callback route now handles GET requests
2. ✅ Proper landing page before login
3. ✅ Auth callback page to handle token
4. ✅ Redirect flow works correctly
5. ✅ All features work in user's Gmail via extension/add-on

## 🎯 The Goal

**Users grant email access → We work inside their Gmail → They get AI-powered email management without leaving their inbox.**

This is the core value proposition - seamless integration that makes email management effortless.

