# 🚀 Complete Deployment Guide - Vercel + Render

This guide will walk you through deploying InboxPilot AI to production.

---

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] GitHub account (and your code pushed to GitHub)
- [ ] Google Cloud Project with OAuth credentials
- [ ] MongoDB Atlas account (free tier works)
- [ ] Gemini API key
- [ ] Vercel account (free tier)
- [ ] Render account (free tier)

---

## 🔧 Step 1: Prepare Google Cloud Console

### 1.1 Get Your OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `InboxPilot Production`
7. **Authorized redirect URIs** (add these - we'll update with actual URLs later):
   - `https://your-backend.onrender.com/api/auth/google/callback`
   - `https://your-frontend.vercel.app/api/auth/callback/google`
   - `http://localhost:5000/api/auth/google/callback` (for local testing)
   - `http://localhost:3000/api/auth/callback/google` (for local testing)
8. Click **Create**
9. **Copy Client ID and Client Secret** - Save these!

### 1.2 Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - **Gmail API**
   - **Google Calendar API**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. User Type: **External** (or Internal if only for your organization)
3. Fill in:
   - App name: `InboxPilot AI`
   - User support email: Your email
   - Developer contact: Your email
4. Click **Save and Continue**
5. **Scopes** - Click **Add or Remove Scopes**, add:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click **Save and Continue**
7. **Test users** - Add your email address
8. Click **Save and Continue**

---

## 🗄️ Step 2: Set Up MongoDB Atlas

### 2.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free tier available)
3. Create a new cluster (free tier: M0)
4. Choose a cloud provider and region
5. Click **Create Cluster**

### 2.2 Configure Database Access

1. Go to **Database Access**
2. Click **Add New Database User**
3. Username: `inboxpilot` (or your choice)
4. Password: Generate secure password (save it!)
5. Database User Privileges: **Read and write to any database**
6. Click **Add User**

### 2.3 Configure Network Access

1. Go to **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (or add specific IPs)
4. Click **Confirm**

### 2.4 Get Connection String

1. Go to **Database** → **Connect**
2. Click **Connect your application**
3. Driver: **Node.js**
4. Version: **5.5 or later**
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `inboxpilot` (or your choice)
8. **Save this connection string!**

Example: `mongodb+srv://inboxpilot:yourpassword@cluster0.xxxxx.mongodb.net/inboxpilot?retryWrites=true&w=majority`

---

## 🔑 Step 3: Generate Encryption Keys

Run these commands in your terminal:

```bash
# Generate 32-character hex encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 16-character hex IV
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate JWT secret (any long random string)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate NextAuth secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Save all these values!** You'll need them for environment variables.

---

## 🚀 Step 4: Deploy Backend to Render

### 4.1 Create Render Account

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 4.2 Create Web Service

1. In Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository
3. Select your repository: `InboxPilot-AI`
4. Configure:
   - **Name**: `inboxpilot-backend` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (or paid if you want)

### 4.3 Add Environment Variables

Click **Environment** tab and add these variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-backend-name.onrender.com/api/auth/google/callback

# AI Service
GEMINI_API_KEY=your_gemini_api_key_here

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/inboxpilot?retryWrites=true&w=majority

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_char_hex_encryption_key
ENCRYPTION_IV=your_16_char_hex_iv

# Frontend URL (we'll update this after deploying frontend)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Important Notes:**
- Replace `your-backend-name` with your actual Render service name
- Replace all placeholder values with your actual values
- **Don't add quotes** around values in Render
- For `GOOGLE_REDIRECT_URI`, use your Render URL: `https://your-service-name.onrender.com/api/auth/google/callback`

### 4.4 Deploy

1. Click **Create Web Service**
2. Render will start building and deploying
3. Wait for deployment to complete (5-10 minutes)
4. **Copy your service URL**: `https://your-service-name.onrender.com`
5. Test it: Visit `https://your-service-name.onrender.com/health`

### 4.5 Update Google Cloud Redirect URI

1. Go back to Google Cloud Console
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add redirect URI: `https://your-service-name.onrender.com/api/auth/google/callback`
5. Save

---

## 🎨 Step 5: Deploy Frontend to Vercel

### 5.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 5.2 Import Project

1. Click **Add New** → **Project**
2. Import your repository: `InboxPilot-AI`
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)
   - **Install Command**: `npm install` (auto)

### 5.3 Add Environment Variables

Before deploying, click **Environment Variables** and add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api
NEXTAUTH_URL=https://your-frontend-name.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_here
```

**Important:**
- Replace `your-backend-name` with your actual Render backend URL
- Replace `your-frontend-name` with your Vercel project name
- Use the NextAuth secret you generated earlier

### 5.4 Deploy

1. Click **Deploy**
2. Wait for deployment (2-5 minutes)
3. **Copy your frontend URL**: `https://your-project-name.vercel.app`

### 5.5 Update Backend Environment Variable

1. Go back to Render dashboard
2. Edit your web service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` to: `https://your-project-name.vercel.app`
5. Save changes (this will trigger a redeploy)

### 5.6 Update Google Cloud Redirect URI

1. Go to Google Cloud Console
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add redirect URI: `https://your-project-name.vercel.app/api/auth/callback/google`
5. Save

---

## ✅ Step 6: Test Your Deployment

### 6.1 Test Backend

```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Should return: {"success":true,"message":"InboxPilot API is running"}
```

### 6.2 Test Frontend

1. Visit: `https://your-frontend.vercel.app`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect to dashboard

### 6.3 Test API Connection

1. Open browser console on your frontend
2. Check for any API errors
3. Try logging in - should work!

---

## 🔄 Step 7: Update Extension/Add-on (Optional)

### 7.1 Update Extension Files

Update these files with your production backend URL:

**File: `extension/background.js`**
- Line 140: Change `http://localhost:5000/api` to `https://your-backend.onrender.com/api`

**File: `extension/services/apiService.js`**
- Line 6: Change `http://localhost:5000/api` to `https://your-backend.onrender.com/api`

**File: `extension/manifest.json`**
- Update `host_permissions` to include: `https://your-backend.onrender.com/*`

### 7.2 Update Add-on

**File: `addon/main.gs`**
- Line 45: Change `http://localhost:5000/api` to `https://your-backend.onrender.com/api`

---

## 📝 Step 8: Final Checklist

- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] All environment variables set correctly
- [ ] Google Cloud OAuth redirect URIs updated
- [ ] MongoDB Atlas connected
- [ ] Backend health check works
- [ ] Frontend can connect to backend
- [ ] OAuth login works
- [ ] Extension/add-on updated (if using)

---

## 🆘 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check environment variables are set correctly
- Check build logs in Render
- Ensure MongoDB connection string is correct

**Problem**: CORS errors
- Backend CORS is configured to allow all origins
- Check `FRONTEND_URL` is set correctly

**Problem**: OAuth redirect fails
- Verify redirect URI in Google Cloud Console matches exactly
- Check `GOOGLE_REDIRECT_URI` in Render matches

### Frontend Issues

**Problem**: Can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is running (check Render logs)
- Check browser console for errors

**Problem**: OAuth not working
- Verify `NEXTAUTH_URL` matches your Vercel URL
- Check `NEXTAUTH_SECRET` is set
- Verify redirect URI in Google Cloud Console

### Database Issues

**Problem**: MongoDB connection fails
- Check network access in MongoDB Atlas (allow all IPs)
- Verify connection string is correct
- Check username/password are correct

---

## 🎉 Success!

Your InboxPilot AI is now live! Users can:
- Visit your frontend URL
- Sign in with Google
- Use all features
- Everything works in the cloud!

---

## 📞 Next Steps

1. Test all features end-to-end
2. Update extension/add-on with production URLs
3. Share your app with users
4. Monitor logs in Render and Vercel
5. Set up error tracking (optional)

Good luck! 🚀

