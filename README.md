# ⚡ FrontFix AI — Technical Issue Resolution Chatbot
> **Team B: Frontend Support Chatbot & Browser Debugger**  
> *AI-Powered Diagnostics, Root-Cause Analysis & Step-by-Step Fixes for Web Developers*

[![Team](https://img.shields.io/badge/Team-Team_B_(Frontend)-0284c7?style=for-the-badge&logo=react)](https://github.com/AdnanAK8/FrontFix)
[![Knowledge Base](https://img.shields.io/badge/Knowledge_Base-34_Canonical_Issues-10b981?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)
[![AI Grounding](https://img.shields.io/badge/AI_Model-Gemini_1.5_Flash-4285f4?style=for-the-badge&logo=google)](https://github.com/AdnanAK8/FrontFix)
[![Backend](https://img.shields.io/badge/Backend-Node.js_&_Express-339933?style=for-the-badge&logo=nodedotjs)](https://github.com/AdnanAK8/FrontFix)
[![Extension](https://img.shields.io/badge/Extension-Manifest_V3-f59e0b?style=for-the-badge&logo=googlechrome)](https://github.com/AdnanAK8/FrontFix)
[![Tests](https://img.shields.io/badge/Tests-93_Passing-success?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)

---

## 📌 1. Project Overview

Developers lose significant time searching the web for frontend errors. **FrontFix AI** functions like an experienced senior technical support engineer: it understands JavaScript exceptions, React lifecycle issues, CSS layout traps, and network failures, retrieves canonical troubleshooting solutions using true **TF-IDF Cosine Similarity Search** across 34 verified frontend issues, and grounds **Google Gemini** to synthesize clear, step-by-step fix instructions.

FrontFix AI provides two integrated interfaces:
1. **Interactive Web Chatbot (`frontend/`)**: Paste console logs, error messages, or upload a log file.
2. **Chrome/Edge Extension (`extension/`)**: Runs alongside any website being debugged in real-time, inspects uncaught errors on the active tab, and offers one-click AI diagnosis with privacy protection.

---

## 🏛️ 2. System Architecture

```text
FrontFix/
├── backend/
│   ├── src/
│   │   ├── server.js                  # HTTP server entrypoint (0.0.0.0:8000)
│   │   ├── app.js                     # Express app setup, CORS & Helmet
│   │   ├── routes/
│   │   │   ├── health.routes.js       # GET /
│   │   │   ├── chat.routes.js         # POST /api/diagnose, presets, knowledge
│   │   │   ├── diagnostics.routes.js  # POST /api/upload-log, /api/extension/diagnose
│   │   │   └── feedback.routes.js     # POST /api/feedback, GET /api/feedback/stats
│   │   ├── controllers/
│   │   │   ├── chat.controller.js
│   │   │   ├── diagnostics.controller.js
│   │   │   └── feedback.controller.js
│   │   ├── services/
│   │   │   ├── diagnostic-engine.js   # Orchestration & low-confidence fallback
│   │   │   ├── knowledge-retriever.js # TF-IDF vector index & cosine similarity
│   │   │   ├── llm.service.js         # Google Gemini & OpenAI grounding client
│   │   │   ├── history.service.js     # Multi-turn memory & context enrichment
│   │   │   └── sanitizer.service.js   # Zero-leak regex redaction & URL scrubber
│   │   ├── middleware/
│   │   │   ├── error-handler.js       # Centralized sanitized error responses
│   │   │   ├── rate-limiter.js        # 60 req/min API rate limiting
│   │   │   └── validate-request.js    # Strict request schema validation
│   │   ├── config/
│   │   │   └── env.js                 # Environment config & placeholder key detector
│   │   └── utils/
│   │       ├── response-formatter.js  # Canonical 4-part JSON formatter
│   │       └── generate-icons.js      # Clean PNG icon generator
│   ├── data/
│   │   └── knowledge.json             # 34 canonical frontend issues catalog
│   ├── tests/
│   │   ├── api-and-security.test.js   # 25 core integration test requirements
│   │   ├── engine.test.js             # Engine baseline unit tests
│   │   ├── initial-checklist.test.js  # 25 checklist scenario tests
│   │   └── twenty-plus-suite.test.js  # 36 real developer questions
│   ├── package.json
│   └── package-lock.json
│
├── frontend/                          # Clean vanilla JS Web Chatbot Studio
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── extension/                         # Chrome/Edge Browser Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── content.js
│   ├── injected.js
│   ├── background.js
│   └── icons/
│
├── docs/
│   ├── ARCHITECTURE.md                # Architecture specification & sequence diagrams
│   └── TEST_REPORT.md                 # 93 passing tests report
│
├── Dockerfile                         # Node.js 20 Alpine production container
├── docker-compose.yml                 # One-click container launcher
├── .env.example                       # Environment configuration template
├── run.bat                            # Windows one-click starter
└── README.md
```

---

## ⚡ 3. Diagnostic Workflow & Response Contract

Every response strictly follows the required 4-part structure:

```json
{
  "problem": "Clear 1-2 sentence description of the problem",
  "likely_cause": "Detailed technical explanation of why this happens",
  "fix_steps": [
    "1. First actionable step...",
    "2. Second actionable step...",
    "3. Third actionable step..."
  ],
  "extra_tips": "Performance, prevention, or framework specific tips",
  "sources": [
    { "title": "MDN Web Docs", "url": "https://developer.mozilla.org/..." }
  ],
  "confidence": "high",
  "follow_up_question": null
}
```

### Flow:
1. **Developer Input**: Pastes an error message, stack trace, or asks a technical question (via Web UI or Browser Extension).
2. **Privacy Shield**: In-flight regex scrubber redacts Bearer tokens, API keys, credentials, and customer emails.
3. **Context Enrichment**: Multi-turn history resolves follow-up signals (e.g. *"What should I check next?"* or *"In TypeScript?"*).
4. **TF-IDF Cosine Search**: Computes token term frequency vectors and matches against 34 canonical issues.
5. **Grounded AI Generation**: When a genuine Gemini API key is configured, Gemini generates an explanation grounded in the canonical knowledge.
6. **Transparent Provenance**: Output is labelled as `✨ AI Explained (Gemini)` or `📚 Verified Knowledge Base` (when offline or fallback).

---

## 🚀 4. Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node.js v24 LTS)
- **npm**: v9 or higher

### Step 1: Install Dependencies
```bash
npm install --prefix backend
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your optional Google Gemini API key in `.env`:
```ini
NODE_ENV=development
PORT=8000
HOST=0.0.0.0
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000,http://localhost:3000,http://localhost:5173,https://adnanak8.github.io
```
> **Note**: Placeholders like `your_gemini_api_key_here` are automatically recognized as unconfigured, safely running FrontFix in verified canonical knowledge mode without error.

### Step 3: Run the Backend
```bash
# Start in production mode
npm start --prefix backend

# Or start in hot-reload development mode
npm run dev --prefix backend
```
The server will start on **`http://127.0.0.1:8000`**.

### Step 4: Open the Web UI
- Open `frontend/index.html` in your browser, or visit `http://127.0.0.1:8000/ui` when the backend is running.
- On Windows, you can double-click **`run.bat`** to start both the backend and frontend with a single click.

---

## 🧩 5. Loading the Chrome/Edge Extension

FrontFix includes a Manifest V3 browser extension for live in-browser debugging:

1. Open your browser and navigate to:
   - **Google Chrome**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the **`extension/`** folder from this repository.
5. Click the FrontFix AI icon in your browser toolbar to open the debugging popup!

### Extension Features:
- **Active Page Diagnostics**: Automatically detects uncaught exceptions (`window.onerror`), unhandled promise rejections, and resource load failures on the active tab.
- **Privacy First**: Explicit user action required (click *"Analyze Current Page"*). Never captures form inputs, passwords, or cookies. Automatically redacts URL query parameters.
- **Configurable API Endpoint**: Click the ⚙️ icon to set your backend URL (defaults to `http://127.0.0.1:8000`).

---

## 🧪 6. Running Automated Tests

Run the full 93-test automated test suite:

```bash
npm test --prefix backend
```

### Test Coverage Highlights:
- **25 Required Integration Tests (`api-and-security.test.js`)**: Server startup, health endpoint, valid/empty/invalid requests, schema validation, LLM fallback, oversized log uploads (413), binary upload guards, rate limiting, and CORS.
- **36 Real-World Frontend Tests (`twenty-plus-suite.test.js`)**: Real developer questions covering `TypeError: .map()`, CORS blocks, div centering, infinite `useEffect` loops, SSR hydration mismatch, z-index stacking, CSS flexbox overflow, missing keys, and localStorage quota errors.
- **25 Canonical Checklist Tests (`initial-checklist.test.js`)**: Comprehensive checklist testing with exact match verification.
- **7 Baseline Engine Tests (`engine.test.js`)**: Knowledge base count (>= 30), privacy scrubbing, and log file analyzer.

**Result: 93 passing tests in ~1.2 seconds (0 failures).**

---

## 🐳 7. Docker Deployment

Deploy the single-container Node.js stack with Docker:

```bash
docker compose up --build
```

Access the application at `http://localhost:8000/ui`.

---

## 🔒 8. Security & Privacy Guarantees

1. **Zero Secret Leaks**: Bearer tokens, GitHub/OpenAI/AWS API keys, credentials, and emails are scrubbed before search and LLM submission.
2. **Log File Security**: 2MB upload hard limit (HTTP 413), binary null-byte rejection, memory storage without disk persistence.
3. **CORS Hardening**: Strict origin whitelisting supporting web origins and `chrome-extension://*` IDs with `credentials=false`.
4. **Rate Limiting**: Protects LLM-consuming endpoints against denial-of-service and quota exhaustion.
5. **Safe Error Handling**: Prevents internal file paths or stack traces from leaking to client responses.
