# 🔐 Environment Variables Reference

Complete list of all environment variables needed for deployment.

---

## 📦 Backend (Render) Environment Variables

Add these in **Render Dashboard** → **Your Service** → **Environment** tab.

### Required Variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id_from_google_cloud
GOOGLE_CLIENT_SECRET=your_client_secret_from_google_cloud
GOOGLE_REDIRECT_URI=https://your-backend-name.onrender.com/api/auth/google/callback

# AI Service - Gemini API
GEMINI_API_KEY=your_gemini_api_key

# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/inboxpilot?retryWrites=true&w=majority

# Security Keys (generate these - see commands below)
JWT_SECRET=your_jwt_secret_minimum_32_chars
ENCRYPTION_KEY=your_32_character_hex_key
ENCRYPTION_IV=your_16_character_hex_iv

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-frontend-name.vercel.app
```

### How to Generate Security Keys:

Run these commands in your terminal:

```bash
# JWT Secret (64 bytes = 128 hex characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 bytes = 64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption IV (16 bytes = 32 hex characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Important Notes:

1. **No quotes needed** - Render doesn't require quotes around values
2. **Replace placeholders** - Replace all `your_*` values with actual values
3. **Update URLs** - Replace `your-backend-name` and `your-frontend-name` with actual names
4. **GOOGLE_REDIRECT_URI** - Must match exactly what's in Google Cloud Console

---

## 🎨 Frontend (Vercel) Environment Variables

Add these in **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**.

### Required Variables:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api

# NextAuth Configuration
NEXTAUTH_URL=https://your-frontend-name.vercel.app

# NextAuth Secret (generate this - see command below)
NEXTAUTH_SECRET=your_nextauth_secret_base64
```

### How to Generate NextAuth Secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Important Notes:

1. **NEXT_PUBLIC_API_URL** - Must include `/api` at the end
2. **NEXTAUTH_URL** - Must match your Vercel deployment URL exactly
3. **Update after deployment** - Replace `your-backend-name` and `your-frontend-name` with actual URLs

---

## 🔑 Where to Get Each Value

### Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Create or select OAuth 2.0 Client ID
4. Copy **Client ID** and **Client Secret**

### Gemini API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy the key

### MongoDB Connection String:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Database** → **Connect** → **Connect your application**
3. Copy connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `inboxpilot` (or your choice)

### Security Keys:
- Generate using the commands above
- **Never share these keys**
- Use different keys for production vs development

---

## ✅ Quick Checklist

Before deploying, make sure you have:

- [ ] Google Client ID
- [ ] Google Client Secret
- [ ] Gemini API Key
- [ ] MongoDB Connection String
- [ ] JWT Secret (generated)
- [ ] Encryption Key (generated)
- [ ] Encryption IV (generated)
- [ ] NextAuth Secret (generated)
- [ ] Backend URL (after deploying to Render)
- [ ] Frontend URL (after deploying to Vercel)

---

## 🚨 Common Mistakes

1. **Adding quotes** - Don't add quotes in Render/Vercel dashboard
2. **Wrong redirect URI** - Must match Google Cloud Console exactly
3. **Missing /api** - NEXT_PUBLIC_API_URL must end with `/api`
4. **Wrong environment** - Make sure you're setting production variables
5. **Old URLs** - Update FRONTEND_URL in backend after frontend deploys

---

## 📝 Example Values (Don't Use These!)

```bash
# Backend Example (Render)
NODE_ENV=production
PORT=10000
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://inboxpilot-api.onrender.com/api/auth/google/callback
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
MONGO_URI=mongodb+srv://admin:password123@cluster0.xxxxx.mongodb.net/inboxpilot?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
ENCRYPTION_KEY=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1
ENCRYPTION_IV=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5
FRONTEND_URL=https://inboxpilot.vercel.app

# Frontend Example (Vercel)
NEXT_PUBLIC_API_URL=https://inboxpilot-api.onrender.com/api
NEXTAUTH_URL=https://inboxpilot.vercel.app
NEXTAUTH_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOpQrStUvWxYz1234567890==
```

**Remember**: These are examples! Generate your own unique values!

