# 🎯 What to Do Now - Step-by-Step Action Plan

This document tells you exactly what to do right now to deploy your InboxPilot AI extension and add-on.

---

## ⚡ Immediate Actions (Do These First)

### 1. Deploy Your Backend API (Priority #1)

**Why:** Both extension and add-on need a production API to work.

**Steps:**
1. Choose a hosting provider:
   - **Render** (easiest, free tier available): https://render.com
   - **Railway**: https://railway.app
   - **AWS/Azure/GCP** (more complex)

2. **If using Render:**
   - Sign up at render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `backend` folder
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add all environment variables from your `.env` file
   - Deploy!

3. **Get your production API URL:**
   - Example: `https://inboxpilot-api.onrender.com`
   - Test it: `https://your-api-url.com/api/health` (if you have a health endpoint)

4. **Update OAuth Redirect URIs in Google Cloud Console:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Edit your OAuth 2.0 Client
   - Add: `https://your-api-url.com/api/auth/google/callback`
   - Save

**✅ Done when:** Your API is accessible at a public HTTPS URL.

---

### 2. Deploy Your Frontend (Priority #2)

**Why:** Users need a web dashboard to manage settings.

**Steps:**
1. **If using Vercel (recommended):**
   - Sign up at vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set root directory: `frontend`
   - Add environment variable:
     - `NEXT_PUBLIC_API_URL` = `https://your-backend-api.com/api`
   - Deploy!

2. **Update OAuth Redirect URIs:**
   - Add: `https://your-frontend-url.com/api/auth/callback/google`

**✅ Done when:** Your frontend is live and can connect to your backend API.

---

### 3. Update Extension Files for Production

**Files to edit:**

#### File 1: `extension/background.js`
Find line 140 and change:
```javascript
// FROM:
const baseURL = 'http://localhost:5000/api';

// TO:
const baseURL = 'https://your-backend-api.com/api';
```

#### File 2: `extension/services/apiService.js`
Find line 6 and change:
```javascript
// FROM:
constructor(baseURL = 'http://localhost:5000/api') {

// TO:
constructor(baseURL = 'https://your-backend-api.com/api') {
```

#### File 3: `extension/manifest.json`
Find lines 15-17 and update:
```json
"host_permissions": [
  "https://mail.google.com/*",
  "https://*.google.com/*",
  "https://your-backend-api.com/*"
]
```
(Remove the localhost entries)

**✅ Done when:** All localhost URLs are replaced with your production API URL.

---

### 4. Test Extension Locally

**Steps:**
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select your `extension` folder
5. Open Gmail
6. Test all features to ensure they work with production API

**✅ Done when:** Extension works perfectly in Gmail with production API.

---

### 5. Package Extension for Chrome Web Store

**Steps:**
1. **Create ZIP file:**
   - Windows: Right-click `extension` folder → Send to → Compressed folder
   - Mac/Linux: `cd` to project root, then `zip -r extension.zip extension/`
   
2. **Verify ZIP structure:**
   - Open ZIP file
   - You should see `manifest.json` directly inside (not in a subfolder)
   - If wrong, extract and re-zip correctly

**✅ Done when:** You have a `extension.zip` file ready.

---

### 6. Create Chrome Web Store Account

**Steps:**
1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay **$5 one-time registration fee**
4. Complete account setup

**✅ Done when:** You can access the Chrome Web Store Developer Dashboard.

---

### 7. Prepare Store Listing Materials

**You need:**
- [ ] **Screenshots** (at least 1, up to 5)
  - Take screenshots of extension in Gmail
  - Recommended size: 1280x800 or 640x400
  - Show key features: sidebar, compose toolbar, email actions

- [ ] **Promo tiles:**
  - Small: 440x280 pixels
  - Large: 920x680 pixels (optional)
  - Use your branding/logo

- [ ] **Description** (500+ words):
  - What the extension does
  - Key features
  - How to use it
  - Benefits

- [ ] **Privacy Policy** (REQUIRED):
  - Create a page on your website
  - Or use a free service like https://www.privacypolicygenerator.info/
  - Must explain what data you collect and how you use it

**✅ Done when:** All materials are ready.

---

### 8. Submit Extension to Chrome Web Store

**Steps:**
1. Go to Chrome Web Store Developer Dashboard
2. Click **"New Item"**
3. Upload your `extension.zip`
4. Fill in all store listing information
5. Upload screenshots and graphics
6. Add privacy policy URL
7. Set distribution to **"Public"** (or "Unlisted" for testing)
8. Click **"Submit for Review"**

**✅ Done when:** Extension is submitted and pending review (1-3 days).

---

### 9. Update Add-on for Production

**File to edit:**

#### File: `addon/main.gs`
Find line 45 and change:
```javascript
// FROM:
const apiUrl = 'http://localhost:5000/api' + endpoint;

// TO:
const apiUrl = 'https://your-backend-api.com/api' + endpoint;
```

**✅ Done when:** Add-on code uses production API URL.

---

### 10. Deploy Add-on via Apps Script

**Steps:**
1. Go to: https://script.google.com/
2. Click **"New Project"**
3. Delete default code
4. **Copy `addon/main.gs`** → Paste into `Code.gs`
5. Click **"+"** → **"HTML"** → Name it `sidebar`
6. Copy `addon/sidebar.html` content → Paste into HTML file
7. Click **"Project Settings"** (gear icon)
8. Scroll to **"Script manifest"** → Click **"Edit manifest"**
9. Replace with content from `addon/appsscript.json`
10. **Link to Google Cloud Project:**
    - In Project Settings, click **"Change project"** under GCP Project
    - Select your project (same one used for OAuth)
    - Click **"Set project"**
11. **Save** project (Ctrl+S)
12. **Test:** Click "Run" on `onOpen` function
13. Open Gmail → Should see "InboxPilot AI" menu item

**✅ Done when:** Add-on appears in Gmail and works.

---

### 11. Configure Google Workspace Marketplace

**Steps:**
1. Go to: https://console.cloud.google.com/
2. Select your project
3. **Enable Marketplace SDK:**
   - Navigate to "APIs & Services" → "Google Workspace Marketplace SDK"
   - Click "Enable"
4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: External
   - Fill in app name, support email
   - Add all scopes from `appsscript.json`
   - Add test users (your email)
   - Save
5. **Create Store Listing:**
   - In Marketplace SDK, go to "Store listing" tab
   - Fill in all required fields
   - Upload logo, screenshots
   - Add privacy policy URL (required!)
6. **Deploy Add-on:**
   - In Apps Script, click "Deploy" → "New deployment"
   - Type: "Add-on"
   - Description: "Version 1.0.0"
   - Deploy
   - Copy Deployment ID
7. **Submit:**
   - In Marketplace SDK, go to "Publish" tab
   - Enter Deployment ID
   - Submit for review

**✅ Done when:** Add-on is submitted to marketplace (review: 1-2 weeks).

---

## 📋 Summary Checklist

**Week 1:**
- [ ] Deploy backend API
- [ ] Deploy frontend
- [ ] Update extension files
- [ ] Test extension locally
- [ ] Package extension
- [ ] Create Chrome Web Store account
- [ ] Prepare store materials
- [ ] Submit extension

**Week 2:**
- [ ] Update add-on files
- [ ] Deploy add-on via Apps Script
- [ ] Configure Google Workspace Marketplace
- [ ] Submit add-on

**Ongoing:**
- [ ] Monitor reviews
- [ ] Fix bugs
- [ ] Update features

---

## 🆘 Need Help?

**Common Issues:**

1. **"CORS error"** → Backend needs to allow extension origin
2. **"API not found"** → Check production URL is correct
3. **"OAuth fails"** → Verify redirect URIs in Google Cloud Console
4. **"Add-on not appearing"** → Check deployment type is "Add-on"

**Resources:**
- Full guide: See `DEPLOYMENT_GUIDE.md`
- Checklist: See `DEPLOYMENT_CHECKLIST.md`

---

## 🎉 Success!

Once both are approved:
- ✅ Users can install extension from Chrome Web Store
- ✅ Users can install add-on from Google Workspace Marketplace
- ✅ Your InboxPilot AI is live! 🚀

---

**Start with Step 1 (Deploy Backend) and work through sequentially!**

