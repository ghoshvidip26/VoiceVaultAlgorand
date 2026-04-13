# 🚨 Deployment Issues Analysis - Render.com

This document outlines potential issues that may break when deploying the VoiceVault application (frontend and backend) to Render.com.

## 📋 Table of Contents
1. [Frontend Issues](#frontend-issues)
2. [Backend Issues](#backend-issues)
3. [Configuration Issues](#configuration-issues)
4. [File Storage Issues](#file-storage-issues)
5. [Environment Variables](#environment-variables)
6. [CORS & Network Issues](#cors--network-issues)
7. [Build & Runtime Issues](#build--runtime-issues)
8. [Dependencies Issues](#dependencies-issues)

---

## Frontend Issues

### ❌ **CRITICAL: Hardcoded localhost URLs**

**Files Affected:**
- `src/lib/api.ts` (Line 4)
- `src/lib/shelby.ts` (Lines 147, 180)

**Issue:**
```typescript
// src/lib/api.ts
const defaultUrl = 'http://localhost:3000'; // ❌ BREAKS on Render

// src/lib/shelby.ts
const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/shelby/upload`, {
```

**Fix Required:**
- Remove hardcoded `localhost:3000` fallbacks
- Use environment variables only: `import.meta.env.VITE_API_URL`
- Ensure `VITE_API_URL` is set in Render environment variables

**Impact:** ⚠️ **CRITICAL** - Frontend won't be able to communicate with backend

---

### ❌ **Vite Config Port Mismatch**

**File:** `vite.config.ts` (Line 10)

**Issue:**
```typescript
server: {
  host: "::",
  port: 6969, // ❌ Hardcoded port, Render assigns dynamic ports
}
```

**Fix Required:**
- Remove hardcoded port in production
- Render will assign ports automatically
- This only affects dev server, but should be cleaned up

**Impact:** ⚠️ **LOW** - Only affects local development

---

### ❌ **Missing Backend URL Environment Variable Handling**

**File:** `src/lib/api.ts`

**Issue:**
```typescript
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_PROXY_URL || import.meta.env.VITE_API_URL;
  const defaultUrl = 'http://localhost:3000'; // ❌ FALLBACK BREAKS
  const url = envUrl || defaultUrl;
  return url;
};
```

**Fix Required:**
- Throw error if environment variable is missing in production
- Don't fallback to localhost in production builds

**Impact:** ⚠️ **HIGH** - Silent failures if env vars not set

---

### ❌ **Shelby RPC URL Hardcoded Defaults**

**File:** `src/lib/shelby.ts` (Lines 82-95)

**Issue:**
```typescript
export function getDefaultRpcUrl(network: string = "testnet"): string {
  const envUrl = import.meta.env.VITE_SHELBY_RPC_URL;
  if (envUrl) return envUrl;
  
  // ❌ Hardcoded URLs that may not exist in production
  const rpcUrls: Record<string, string> = {
    testnet: "https://rpc-testnet.shelby.net",
    shelbynet: "https://rpc.shelbynet.io",
    mainnet: "https://rpc.shelby.net",
  };
  return rpcUrls[network] || rpcUrls.testnet;
}
```

**Fix Required:**
- Verify these URLs are correct and accessible
- Make environment variable required in production

**Impact:** ⚠️ **MEDIUM** - May cause failures if RPC endpoints are wrong

---

## Backend Issues

### ❌ **CRITICAL: CORS Configuration Too Permissive**

**File:** `backend/server.js` (Line 20)

**Issue:**
```javascript
app.use(cors()); // ❌ Allows ALL origins - security risk
```

**Fix Required:**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Impact:** ⚠️ **CRITICAL** - Security vulnerability, may cause CORS errors if Render enforces stricter policies

---

### ❌ **CRITICAL: File Storage Persistence**

**File:** `backend/shelby.js` (Line 18)

**Issue:**
```javascript
const STORAGE_ROOT = path.resolve(__dirname, "storage", "shelby");
// ❌ Render filesystem is EPHEMERAL - data will be lost on restart/deploy
```

**Problem:**
- Render's filesystem is **ephemeral**
- All files in `backend/storage/` will be **deleted** on:
  - Deploy
  - Service restart
  - Container recreation

**Fix Required:**
- **OPTION 1:** Use Render's persistent disk (add to render.yaml)
- **OPTION 2:** Migrate to external storage (S3, Google Cloud Storage, etc.)
- **OPTION 3:** Use actual Shelby RPC (not local file storage)

**Impact:** ⚠️ **CRITICAL** - All voice model data will be lost

---

### ❌ **Port Binding Issue**

**File:** `backend/server.js` (Line 651-653)

**Issue:**
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Voice server running → http://localhost:${PORT}`);
  // ❌ Should bind to 0.0.0.0, not localhost
});
```

**Fix Required:**
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Voice server running on port ${PORT}`);
});
```

**Impact:** ⚠️ **HIGH** - Backend may not be accessible from outside container

---

### ❌ **.env File Path Assumption**

**File:** `backend/server.js` (Line 18)

**Issue:**
```javascript
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
// ❌ .env file won't exist on Render - use environment variables
```

**Fix Required:**
- Environment variables should be set in Render dashboard
- Remove `.env` file dependency (it's already in .gitignore)
- Document required environment variables

**Impact:** ⚠️ **MEDIUM** - Environment variables won't load from file (but Render uses env vars directly)

---

### ❌ **FFmpeg Dependency Missing**

**File:** `backend/voiceModel.js` (Lines 51-56)

**Issue:**
```javascript
async function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-version"]);
    // ❌ FFmpeg may not be installed on Render containers
  });
}
```

**Fix Required:**
- Add FFmpeg installation to Dockerfile/build script
- Or use a service that provides FFmpeg
- Document FFmpeg requirement

**Impact:** ⚠️ **MEDIUM** - Audio normalization will fail silently

---

### ❌ **Missing Error Handling for External APIs**

**Files:** `backend/server.js` (Multiple locations)

**Issue:**
- ElevenLabs API calls may fail
- No retry logic
- No rate limiting handling
- Errors may crash the service

**Fix Required:**
- Add proper error handling
- Implement retry logic with exponential backoff
- Handle rate limits gracefully
- Add health check endpoints

**Impact:** ⚠️ **MEDIUM** - Service may crash on external API failures

---

## Configuration Issues

### ❌ **Missing render.yaml**

**Issue:** No `render.yaml` or `render.yaml.template` file exists

**Fix Required:** Create `render.yaml`:
```yaml
services:
  - type: web
    name: voicevault-backend
    env: node
    buildCommand: npm install
    startCommand: npm run start:backend
    envVars:
      - key: PORT
        value: 3000
      - key: ELEVENLABS_API_KEY
        sync: false
      - key: NODE_ENV
        value: production
    
  - type: web
    name: voicevault-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        fromService:
          type: web
          name: voicevault-backend
          property: host
```

**Impact:** ⚠️ **HIGH** - Manual configuration required on Render

---

### ❌ **Missing Build Scripts for Production**

**File:** `package.json`

**Issue:**
```json
{
  "scripts": {
    "dev": "vite",
    "server": "node backend/server.js",
    "build": "vite build",
    "start:backend": "node backend/server.js", // ✅ Good
    "start:frontend": "vite preview --port 4173" // ❌ Wrong for production
  }
}
```

**Fix Required:**
- Frontend should use nginx (already has Dockerfile)
- Backend start script is correct
- Ensure build output is correct

**Impact:** ⚠️ **LOW** - Frontend preview won't work, but Dockerfile handles it

---

## File Storage Issues

### ❌ **CRITICAL: Local File Storage in Ephemeral Filesystem**

**Files:**
- `backend/shelby.js`
- `backend/storage/` directory

**Problem:**
- All voice model files stored in `backend/storage/shelby/`
- Render filesystem is **ephemeral**
- Data will be **permanently lost** on every deploy

**Solutions:**

1. **Use Render Persistent Disk:**
   ```yaml
   # render.yaml
   services:
     - type: web
       name: voicevault-backend
       disk:
         name: shelby-storage
         mountPath: /opt/render/project/src/backend/storage
         sizeGB: 10
   ```

2. **Migrate to External Storage (RECOMMENDED):**
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - Actual Shelby RPC service

3. **Database-backed metadata:**
   - Store file metadata in database
   - Use external storage for actual files

**Impact:** ⚠️ **CRITICAL** - Data loss on every deploy/restart

---

## Environment Variables

### Required Environment Variables

#### Frontend (Render Environment Variables)
```
VITE_API_URL=https://your-backend.onrender.com
VITE_SHELBY_RPC_URL=https://rpc-testnet.shelby.net (optional)
```

#### Backend (Render Environment Variables)
```
PORT=3000 (Render sets this automatically)
ELEVENLABS_API_KEY=your-api-key (REQUIRED)
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.onrender.com,http://localhost:6969
```

### Missing Environment Variable Validation

**Issue:** No validation that required env vars are set

**Fix Required:** Add startup validation:
```javascript
// backend/server.js
const requiredEnvVars = ['ELEVENLABS_API_KEY'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

**Impact:** ⚠️ **HIGH** - Service may start with missing config

---

## CORS & Network Issues

### ❌ **CORS Not Configured for Render URLs**

**Issue:**
- Frontend and backend will have different domains on Render
- CORS must allow the frontend domain
- Current CORS allows all origins (security risk)

**Fix Required:**
```javascript
// backend/server.js
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:6969', // Development
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

**Impact:** ⚠️ **CRITICAL** - API calls will be blocked by CORS

---

### ❌ **Proxy Configuration Missing**

**Issue:**
- Frontend may need to proxy API calls
- Vite proxy config only works in dev
- Production needs nginx proxy or direct API calls

**Current nginx.conf:** Only serves static files, no API proxy

**Fix Required (if needed):**
```nginx
# nginx.conf
location /api {
    proxy_pass http://voicevault-backend.onrender.com;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**Impact:** ⚠️ **MEDIUM** - Depends on deployment strategy

---

## Build & Runtime Issues

### ❌ **Missing Node Version Specification**

**File:** `package.json`

**Issue:** No `engines` field specified

**Fix Required:**
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**Impact:** ⚠️ **MEDIUM** - May use wrong Node version

---

### ❌ **Dockerfile for Backend Missing**

**Issue:** Only frontend Dockerfile exists

**Files:**
- ✅ `Dockerfile` (frontend)
- ❌ No `backend/Dockerfile` or separate backend Dockerfile

**Fix Required:** Create backend Dockerfile or use Node.js runtime directly on Render

**Impact:** ⚠️ **LOW** - Render supports Node.js directly

---

### ❌ **Build Dependencies May Be Missing**

**Issue:** Some dependencies may require build tools

**Check:**
- Native Node modules (if any)
- FFmpeg installation
- Build tools (gcc, make, python) if needed

**Fix Required:** Document build requirements or use buildpacks

**Impact:** ⚠️ **LOW** - Most packages are pure JS

---

## Dependencies Issues

### ❌ **node-fetch ESM Import Issue**

**File:** `backend/server.js` (Line 4)

**Issue:**
```javascript
import fetch from "node-fetch";
// node-fetch v3 is ESM-only, but may have issues in some Node versions
```

**Potential Fix:**
- Ensure Node.js 18+ (supports native fetch)
- Or use node-fetch v2 for CommonJS compatibility

**Impact:** ⚠️ **LOW** - Node 18+ has native fetch support

---

### ❌ **Multer Memory Storage Limits**

**File:** `backend/server.js` (Line 39)

**Issue:**
```javascript
const upload = multer({ 
  storage: multer.memoryStorage(), // ❌ Stores files in RAM
  // No file size limits configured
});
```

**Problems:**
- Large files will consume server memory
- Render has memory limits
- No file size validation

**Fix Required:**
```javascript
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10
  }
});
```

**Impact:** ⚠️ **MEDIUM** - Large uploads may crash server

---

## Additional Recommendations

### 1. Health Check Endpoints

**Missing:** Health check endpoint for Render monitoring

**Add:**
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});
```

### 2. Logging

**Issue:** Console.log only, no structured logging

**Recommendation:** Use winston or pino for production logging

### 3. Rate Limiting

**Missing:** No rate limiting on API endpoints

**Recommendation:** Add express-rate-limit

### 4. Error Monitoring

**Missing:** No error tracking (Sentry, etc.)

**Recommendation:** Add error tracking service

---

## Priority Summary

| Priority | Issue | Impact | File |
|----------|-------|--------|------|
| 🔴 **CRITICAL** | Hardcoded localhost URLs | Frontend can't connect | `src/lib/api.ts`, `src/lib/shelby.ts` |
| 🔴 **CRITICAL** | Ephemeral file storage | Data loss on deploy | `backend/shelby.js` |
| 🔴 **CRITICAL** | CORS too permissive | Security + CORS errors | `backend/server.js` |
| 🟠 **HIGH** | Port binding to localhost | Backend inaccessible | `backend/server.js` |
| 🟠 **HIGH** | Missing render.yaml | Manual config needed | (missing) |
| 🟠 **HIGH** | No env var validation | Silent failures | `backend/server.js` |
| 🟡 **MEDIUM** | FFmpeg missing | Audio processing fails | `backend/voiceModel.js` |
| 🟡 **MEDIUM** | No file size limits | Memory issues | `backend/server.js` |
| 🟢 **LOW** | Hardcoded vite port | Dev only issue | `vite.config.ts` |

---

## Quick Fix Checklist

Before deploying to Render:

- [ ] Remove all hardcoded `localhost:3000` URLs
- [ ] Set `VITE_API_URL` environment variable
- [ ] Configure CORS with specific origins
- [ ] Bind server to `0.0.0.0` instead of localhost
- [ ] Set up persistent storage OR migrate to external storage
- [ ] Create `render.yaml` configuration file
- [ ] Add environment variable validation
- [ ] Add health check endpoint
- [ ] Configure file upload size limits
- [ ] Document all required environment variables
- [ ] Test build process locally
- [ ] Verify FFmpeg installation (if using audio processing)

---

## Testing After Deployment

1. **Frontend:**
   - Verify API calls work (check browser console)
   - Test wallet connection
   - Test voice upload/processing

2. **Backend:**
   - Test health check endpoint
   - Verify CORS headers
   - Test file upload/download
   - Verify ElevenLabs API integration

3. **Integration:**
   - Test complete voice processing flow
   - Verify data persistence (if using persistent disk)
   - Monitor logs for errors

---

**Last Updated:** 2024
**Author:** Deployment Analysis
**Status:** ⚠️ **REQUIRES FIXES BEFORE DEPLOYMENT**

