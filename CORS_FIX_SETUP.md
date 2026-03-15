# 🔧 CORS Fix: Backend API Setup Guide

## Problem

You were getting CORS errors when calling the OpenAI API directly from the browser:

```
❌ Access to fetch at 'https://api.openai.com/v1/chat/completions' from origin 'http://localhost:4174' 
has been blocked by CORS policy
```

## Solution

Created a secure backend API server that:
- ✅ Proxies all API calls (keeps keys server-side)
- ✅ Handles CORS properly
- ✅ Provides secure authentication
- ✅ Enables better error handling

## Architecture

```
Browser (Frontend)          Backend Server         OpenAI API
   |                             |                    |
   |-- HTTP Request -----------> |                    |
   |    (no API key)             |                    |
   |                             |-- API Request ---> |
   |                             |   (with key)       |
   |                             |                    |
   |                             | <-- Response ---- |
   |  <-- HTTP Response ---------|                    |
   |    (secure)                 |                    |
```

## Setup Instructions

### Step 1: Install Backend Dependencies

Dependencies are already installed via:
```bash
npm install express cors dotenv node-fetch@2 concurrently nodemon
```

### Step 2: Configure Environment Variables

The `.env` file has been created. Update it with your OpenAI API key:

```bash
# In .env file (already created)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_BACKEND_URL=http://localhost:3001
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Step 3: Get Your OpenAI API Key

1. Go to https://platform.openai.com/account/api-keys
2. Create a new API key
3. Copy the key and paste it into `.env`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

### Step 4: Start Both Frontend & Backend

**Option A: Start Both Simultaneously (Recommended)**
```bash
npm run dev:all
# or
npm start
```

This will start:
- Frontend: http://localhost:5173 (Vite)
- Backend: http://localhost:3001 (Express)

**Option B: Start Separately (For Debugging)**

Terminal 1 - Start Frontend:
```bash
npm run dev
```

Terminal 2 - Start Backend:
```bash
npm run server
```

**Option C: Development with Auto-Reload**
```bash
npm run server:dev
# Requires nodemon (auto-restarts on file changes)
```

## Verify Setup

### Check Backend Health

```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T...",
  "openaiConfigured": true
}
```

### Check Frontend Logs

Open browser console (F12) and look for:
```
📤 Sending image analysis request to backend...
✅ Image analysis successful
```

## API Endpoints

The backend provides these secure endpoints:

### 1. Analyze Product Image
```
POST /api/openai/analyze-image
Content-Type: application/json

{
  "imageBase64": "base64_encoded_image",
  "prompt": "Extract product name and brand from this image"
}

Response:
{
  "success": true,
  "content": "Product: Coca-Cola\nBrand: The Coca-Cola Company",
  "model": "gpt-4-vision-preview",
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 56,
    "total_tokens": 1290
  }
}
```

### 2. Chat Completion
```
POST /api/openai/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "What is this product?"}
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}
```

### 3. Health Check
```
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "...",
  "openaiConfigured": true
}
```

## Frontend Changes

The frontend now uses the backend client:

```typescript
// Before (CORS Error ❌)
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // ❌ BAD: Exposes key
});

// After (Secure ✅)
import { analyzeProductImage } from '@/services/api/backend-client';
const response = await analyzeProductImage(imageBase64, prompt);
```

## Files Created/Modified

**New Files:**
- `server.js` - Backend Express server
- `src/services/api/backend-client.ts` - Frontend API client
- `.env` - Environment variables (UPDATE WITH YOUR KEY)
- `.env.example` - Environment template

**Modified Files:**
- `package.json` - Added npm scripts and dependencies

## Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### CORS still failing
```bash
# Make sure VITE_BACKEND_URL is set correctly
echo $VITE_BACKEND_URL
# Should output: http://localhost:3001
```

### OpenAI API key not working
```bash
# Verify key in .env
cat .env | grep OPENAI_API_KEY

# Test with curl
curl -H "Authorization: Bearer sk-..." \
  https://api.openai.com/v1/models
```

### Port conflicts
Change ports in `.env`:
```
PORT=3002  # Change from 3001 to 3002
VITE_BACKEND_URL=http://localhost:3002
```

## Production Deployment

For production, deploy the backend and frontend separately:

### Backend (Node.js Server)
```bash
# Deploy to Heroku, AWS, Azure, DigitalOcean, etc.
npm run server
```

### Frontend (Static Files)
```bash
# Build static files
npm run build

# Deploy to Vercel, Netlify, GitHub Pages, etc.
# Update VITE_BACKEND_URL to production server URL
```

### Example: Vercel + Render

1. **Frontend on Vercel:**
   - Deploy via `npm run build`
   - Set env: `VITE_BACKEND_URL=https://your-backend.onrender.com`

2. **Backend on Render:**
   - Connect GitHub repo
   - Set env: `OPENAI_API_KEY=sk-...`
   - Command: `npm run server`

## Security Best Practices

✅ **Implemented:**
- API keys kept on server only
- CORS properly configured
- Environment variables for sensitive data
- Input validation and error handling

⚠️ **Additional (Optional):**
- Add rate limiting middleware
- Add request logging/monitoring
- Add API key rotation
- Use HTTPS only in production

## Summary

Your app now has:
- ✅ Secure API key handling (server-side)
- ✅ CORS-compliant architecture
- ✅ Production-ready backend
- ✅ Easy deployment options
- ✅ Better error handling

**Ready to test!** 🚀

```bash
npm start
```

Then go to http://localhost:5173 and try uploading a product image!

