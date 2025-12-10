# Troubleshooting Guide

## Backend ES Module Error

### Error:
```
Error: Must use import to load ES Module: F:\InboxPilot-AI\backend\src\server.ts
```

### Solution:
The backend now uses `tsx` instead of `ts-node-dev` for better ES module support.

1. **Install tsx** (if not already installed):
   ```bash
   cd backend
   npm install tsx --save-dev
   ```

2. **Start the backend**:
   ```bash
   npm run dev
   ```

The `package.json` has been updated to use `tsx watch` instead of `ts-node-dev`.

## Frontend Network Error

### Error:
```
AxiosError: Network Error
ERR_NETWORK
```

### Solution:

1. **Make sure the backend is running**:
   - Check that backend is running on `http://localhost:5000`
   - You should see: `Server running on port 5000`

2. **Check CORS configuration**:
   - The backend now allows requests from `http://localhost:3000`
   - CORS has been updated in `backend/src/server.ts`

3. **Verify environment variables**:
   - Check `frontend/.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
   - Restart the frontend after changing env variables

4. **Test backend directly**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"success":true,"message":"InboxPilot API is running"}`

5. **Check browser console**:
   - Open DevTools (F12)
   - Check Network tab for failed requests
   - Verify the request URL is correct

## Common Issues

### Backend won't start

1. **Check MongoDB connection**:
   - Make sure MongoDB is running
   - Verify `MONGO_URI` in `backend/.env` is correct
   - For local: `mongodb://localhost:27017/inboxpilot`

2. **Check port availability**:
   - Port 5000 might be in use
   - Change `PORT` in `backend/.env` if needed

3. **Missing dependencies**:
   ```bash
   cd backend
   npm install
   ```

### Frontend won't connect

1. **Backend not running**:
   - Start backend first: `cd backend && npm run dev`

2. **Wrong API URL**:
   - Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
   - Must be: `http://localhost:5000/api`

3. **CORS issues**:
   - Backend CORS is configured for `http://localhost:3000`
   - If using different port, update CORS in `backend/src/server.ts`

### Google OAuth not working

1. **Check redirect URI**:
   - Must match exactly in Google Cloud Console
   - Backend: `http://localhost:5000/api/auth/google/callback`

2. **Verify OAuth credentials**:
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
   - Must be from the same Google Cloud project

3. **Check scopes**:
   - All required scopes must be added in OAuth consent screen
   - See `SETUP_GUIDE.md` for details

## Quick Fix Commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
npm run dev

# Check if backend is running
curl http://localhost:5000/health
```

## Still Having Issues?

1. Check all `.env` files are filled correctly
2. Verify MongoDB is running
3. Check both servers are running (backend on 5000, frontend on 3000)
4. Clear browser cache and restart
5. Check console logs for specific error messages

