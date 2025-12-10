# InboxPilot AI - Setup Guide

## 🔐 Generated Secure Values

Use these generated values in your `.env` files:

### Backend `.env`
```
JWT_SECRET=86a20153e1e09d4bd7de7454c8d45baa7d1f84718680f0635eb08f0cc70daa2d19eabc8bc5de28eb3c67615ac17b00694d397c2bc4abba1f0fa099c86ee0209b
ENCRYPTION_KEY=0c758a97bffe542ae3752c11748693ce074946af705188322ffac723d29f2198
ENCRYPTION_IV=6fa6b3cb20349966d97f0db1483575a3
```

### Frontend `.env.local`
```
NEXTAUTH_SECRET=cIDB1Tz+qb3lLJy1Wba3fUli9dFmGgHDm6YercX9s0E=
```

## 🔗 Google OAuth Configuration

### 1. GOOGLE_REDIRECT_URI

The redirect URI is where Google sends users after they authenticate. For your backend, use:

```
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

**For production**, change to your production backend URL:
```
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/auth/google/callback
```

### 2. Google Cloud Console Setup

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

#### Step 1: Create OAuth 2.0 Client ID

1. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
2. Choose **"Web application"** as the application type
3. Fill in the following:

#### Authorized JavaScript origins
(For use with requests from a browser)

Add these URLs:
```
http://localhost:3000
http://localhost:5000
```

**For production**, add:
```
https://your-frontend-domain.com
https://your-backend-domain.com
```

#### Authorized redirect URIs
(For use with requests from a web server)

Add these URIs:
```
http://localhost:5000/api/auth/google/callback
http://localhost:3000/api/auth/callback/google
```

**For production**, add:
```
https://your-backend-domain.com/api/auth/google/callback
https://your-frontend-domain.com/api/auth/callback/google
```

### 3. OAuth Scopes Required

Make sure your OAuth consent screen includes these scopes:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### 4. Copy Credentials

After creating the OAuth client:
1. Copy the **Client ID** → paste into `GOOGLE_CLIENT_ID` in `backend/.env`
2. Copy the **Client Secret** → paste into `GOOGLE_CLIENT_SECRET` in `backend/.env`

## 📝 Complete .env File Examples

### backend/.env
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# AI API (Gemini only)
GEMINI_API_KEY=your_gemini_api_key_here

# Database
MONGO_URI=mongodb://localhost:27017/inboxpilot

# Security (Use the generated values above)
JWT_SECRET=86a20153e1e09d4bd7de7454c8d45baa7d1f84718680f0635eb08f0cc70daa2d19eabc8bc5de28eb3c67615ac17b00694d397c2bc4abba1f0fa099c86ee0209b
ENCRYPTION_KEY=0c758a97bffe542ae3752c11748693ce074946af705188322ffac723d29f2198
ENCRYPTION_IV=6fa6b3cb20349966d97f0db1483575a3

# Server
PORT=5000
NODE_ENV=development
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cIDB1Tz+qb3lLJy1Wba3fUli9dFmGgHDm6YercX9s0E=
```

## 🔑 Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key → paste into `GEMINI_API_KEY` in `backend/.env`

### MongoDB URI
- **Local**: `mongodb://localhost:27017/inboxpilot`
- **MongoDB Atlas**: Get connection string from your cluster dashboard
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/inboxpilot`

## ✅ Verification Checklist

- [ ] Google OAuth Client ID and Secret added to `backend/.env`
- [ ] `GOOGLE_REDIRECT_URI` set correctly
- [ ] Authorized JavaScript origins configured in Google Console
- [ ] Authorized redirect URIs configured in Google Console
- [ ] Gemini API key added to `backend/.env`
- [ ] MongoDB URI configured
- [ ] All security secrets (JWT, encryption) added
- [ ] `NEXTAUTH_SECRET` added to `frontend/.env.local`
- [ ] `NEXT_PUBLIC_API_URL` points to your backend

## 🚀 Next Steps

1. Fill in all the values in your `.env` files
2. Start MongoDB (if using local)
3. Run `npm install` in both `backend` and `frontend`
4. Start backend: `cd backend && npm run dev`
5. Start frontend: `cd frontend && npm run dev`
6. Open `http://localhost:3000` and test Google OAuth login

## 🔒 Security Notes

- **Never commit `.env` files to Git** (they're in `.gitignore`)
- **Use different secrets for production**
- **Keep your Client Secret secure**
- **Regenerate secrets if compromised**

