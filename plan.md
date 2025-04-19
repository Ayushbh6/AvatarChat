<!-- plan.md: Responsive & Secure Mobile Support Plan -->
# Dual‑Device Web App Optimization Plan

## Objective
Ensure the existing D‑ID Agents SDK web app:
  - Remains exactly as deployed on desktop (laptop/computer).
  - Gains secure, reliable Speech‑to‑Text via a server‑side proxy.
  - Adapts to narrow/mobile viewports with a responsive UI (≤600px).

**Key requirement:** All desktop layouts, controls, and visual styles must remain unchanged.

## Overview of Changes
1. Centralize Speech‑to‑Text through Express proxy (`/api/transcribe`).
2. Configure Vite dev server proxy to forward `/api/transcribe` to the backend.
3. Adjust CORS policy on the Express server for mobile access.
4. Implement responsive CSS media queries for mobile layouts.
5. (Optional) Provide HLS fallback for avatars on mobile if WebRTC fails.

---

## 1. Speech‑to‑Text Proxy Setup

**Why:**
- Fix mobile CORS/400 errors.
- Protect your OpenAI API key by keeping it server‑side.
- Provide a single `/api/transcribe` endpoint for all clients.

### Steps
1. Client (webSpeechAPI.js):
   - Replace direct OpenAI call:
     ```js
     // OLD
     fetch('https://api.openai.com/v1/audio/transcriptions', { /* ... */ });
     // NEW
     fetch('/api/transcribe', { method: 'POST', body: formData });
     ```
   - Impact on desktop: None (logic unchanged, only URL updated).

2. Remove client‑side API key usage:
   - Delete `import.meta.env.VITE_OPENAI_API_KEY` references.
   - All transcription requests go through `/api/transcribe`.

3. Server (server/server.js):
   - Implement `/api/transcribe` POST route:
     • Validate `formData` (audio blob, model, etc.).
     • Use `process.env.OPENAI_API_KEY` for OpenAI STT API call.
     • Return JSON transcription to client.
   - Keep existing `sendTranscribedText` event dispatch unchanged.

---

## 2. Vite Dev Server Proxy

**Why:**
Allow mobile (LAN) browsers to call `/api/transcribe` on port 3000, proxied to backend port 3001 without CORS.

### Steps
1. In **vite.config.js**:
   ```js
   export default defineConfig({
     server: {
       host: '0.0.0.0',
       port: 3000,
       proxy: {
         '/api/transcribe': {
           target: 'http://localhost:3001',
           changeOrigin: true
         }
       }
     }
   });
   ```
2. Restart dev server: `npm run dev`.

---

## 3. Express CORS Configuration

**Why:**
Different origins in development: desktop (`localhost:3000`) vs mobile (`<PC_LAN_IP>:3000`).

### Steps
1. In **server/server.js** (development only):
   ```js
   // BEFORE
   app.use(cors({ origin: 'http://localhost:3000' }));
   // AFTER (dev)
   app.use(cors({
     origin: true,
     methods: ['GET','POST'],
     allowedHeaders: ['Content-Type']
   }));
   ```
2. In production, restrict `origin` to your domain (e.g., `['https://yourdomain.com']`).

---

## 4. Responsive UI with CSS

**Why:**
Adapt layout, typography, and controls for narrow/mobile screens without touching desktop styles.

### Steps
1. Append to **style.css**:
   ```css
   /* Mobile-specific overrides (viewport ≤600px) */
   @media (max-width: 600px) {
     /* Layout: vertical stacking */
     #container {
       flex-direction: column;
       padding: 0.5rem;
     }

     /* Video: full width, fixed height */
     .video-container {
       width: 100%;
       height: 200px;
     }

     /* Controls: wrap, center, gap */
     .top-controls,
     .bottom-controls {
       display: flex;
       flex-wrap: wrap;
       justify-content: space-around;
       gap: 0.5rem;
     }

     /* Text input: full width, legible typography */
     .inputsDiv textarea {
       width: 100%;
       font-size: 1rem;
       line-height: 1.4;
     }

     /* Touch targets: minimum 44×44px */
     .material-symbols-outlined,
     button {
       font-size: 1.5rem;
       min-width: 44px;
       min-height: 44px;
     }

     /* Override any fixed-width styles */
     [style*="width: 600px"] {
       width: 100% !important;
     }
   }
   ```
2. Use mobile emulation in devtools to verify no overflow or overlapping.

---

## 5. Progressive Enhancement: HLS Fallback (Optional)

**Why:**
Some mobile browsers lack stable WebRTC support—fallback to HLS helps.

### Steps
1. In **main.js**:
   ```js
   const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
   agentManager.connect().catch(() => {
     if (isMobile && agentManager.agent.presenter.hls_url) {
       videoElement.src = agentManager.agent.presenter.hls_url;
     }
   });
   ```
2. Desktop users continue with WebRTC stream as before.

---

## 6. Testing & Quality Assurance

### Desktop (unchanged)
- Navigate to `http://localhost:3000` or your prod URL.
- Verify ALL existing features (chat, video, STT) behave identically.

### Mobile (LAN development)
- Connect phone to same WLAN.
- Open `http://<YOUR_PC_LAN_IP>:3000`.
- Verify:
  - Layout stacks and scales correctly (no overflow).
  - Speech button records, transcribes, and sends to chat.
  - Controls meet touch‑target guidelines (≥44×44px).
  - Text and icons are legible.

### Browsers to test
- Chrome on Android
- Safari on iOS
- (Optional) Firefox mobile

---

## 7. Deployment Recommendations

1. Build client: `npm run build`.
2. Serve via production server (e.g. nginx):
   - Serve static assets and proxy `/api/transcribe` to your Express backend on the same domain.
3. Configure CORS in production:
   - Restrict `origin` to your production domain (e.g., `https://yourdomain.com`).
4. Environment variables:
   - Ensure `OPENAI_API_KEY` is set in your server environment.

---
*This plan scopes all changes to mobile viewports and server‑side logic, ensuring zero impact on the existing desktop experience.*