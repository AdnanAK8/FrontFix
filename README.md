# ⚡ FrontFix AI — Technical Issue Resolution Chatbot
> **Team B: Frontend Support Chatbot & Browser Debugger**  
> *AI-Powered Diagnostics, Root-Cause Analysis & Step-by-Step Fixes for Web Developers*

[![Team](https://img.shields.io/badge/Team-Team_B_(Frontend)-0284c7?style=for-the-badge&logo=react)](https://github.com/AdnanAK8/FrontFix)
[![Knowledge Base](https://img.shields.io/badge/Knowledge_Base-34_Canonical_Issues-10b981?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)
[![AI Grounding](https://img.shields.io/badge/AI_Model-Gemini_1.5_Flash-4285f4?style=for-the-badge&logo=google)](https://github.com/AdnanAK8/FrontFix)
[![Backend](https://img.shields.io/badge/Backend-Python_&_FastAPI-3776ab?style=for-the-badge&logo=python)](https://github.com/AdnanAK8/FrontFix)
[![Extension](https://img.shields.io/badge/Extension-Manifest_V3-f59e0b?style=for-the-badge&logo=googlechrome)](https://github.com/AdnanAK8/FrontFix)
[![Tests](https://img.shields.io/badge/Tests-105_Passing-success?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)

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
│   ├── main.py                    # Server startup script (Uvicorn launcher)
│   ├── requirements.txt           # Python dependencies (FastAPI, Uvicorn, etc.)
│   ├── app/
│   │   ├── main.py                # FastAPI app setup, routes, static /ui & exception handlers
│   │   ├── config.py              # Environment configuration & placeholder key detector
│   │   ├── routes/
│   │   │   ├── health.py          # GET /
│   │   │   ├── chat.py            # POST /api/diagnose, GET /api/presets, GET /api/knowledge
│   │   │   ├── diagnostics.py     # POST /api/upload-log, POST /api/extension/diagnose
│   │   │   └── feedback.py        # POST /api/feedback, GET /api/feedback/stats
│   │   ├── services/
│   │   │   ├── engine.py          # Orchestration, vague queries & fallback logic
│   │   │   ├── evidence.py        # Stack parsing, framework detection & trusted URL whitelist
│   │   │   ├── retriever.py       # TF-IDF vector index & cosine similarity engine
│   │   │   ├── llm.py             # Google Gemini & OpenAI grounding client
│   │   │   ├── history.py         # Multi-turn memory & context enrichment
│   │   │   └── sanitizer.py       # Zero-leak regex redaction & URL scrubber
│   │   ├── middleware/
│   │   │   ├── cors.py            # CORS middleware supporting Web & Browser Extensions
│   │   │   └── rate_limiter.py    # Sliding window rate limiting with headers
│   │   └── utils/
│   │       └── formatter.py       # Canonical 4-part JSON formatter
│   ├── data/
│   │   └── knowledge.json         # 34 canonical frontend issues catalog
│   └── tests/
│       ├── test_api_and_security.py      # 25 core integration test requirements
│       ├── test_engine.py                # Engine baseline unit tests
│       ├── test_evidence_and_accuracy.py # 12 evidence-based diagnostics & accuracy tests
│       ├── test_initial_checklist.py     # 25 checklist scenario tests
│       └── test_twenty_plus_suite.py     # 36 real developer questions
│
├── frontend/                      # Modern React + Vite Web Chatbot Studio
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│
├── extension/                     # Chrome/Edge Browser Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── content.js
│   ├── injected.js
│   ├── background.js
│   └── icons/
│
├── Dockerfile                     # Multi-stage build (Vite UI + Python FastAPI container)
├── docker-compose.yml             # One-click container launcher
├── .env.example                   # Environment configuration template
├── run.bat                        # Windows one-click starter
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
- **Python**: v3.10 or higher (Tested on Python 3.13)
- **Node.js**: v18.0.0 or higher (for building the React/Vite UI)

### Step 1: Install Dependencies
```bash
# Install Python backend dependencies
pip install -r backend/requirements.txt

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your optional Google Gemini API key in `.env`:
```ini
ENV=development
PORT=8000
HOST=0.0.0.0
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000,http://localhost:3000,http://localhost:5173,https://adnanak8.github.io
```
> **Note**: Placeholders like `your_gemini_api_key_here` are automatically recognized as unconfigured, safely running FrontFix in verified canonical knowledge mode without error.

### Step 3: Run the Backend
```bash
cd backend
python main.py
```
The server will start on **`http://127.0.0.1:8000`** with OpenAPI interactive docs at **`http://127.0.0.1:8000/docs`**.

### Step 4: Run the Frontend UI
```bash
cd frontend
npm run dev
```
- The interactive frontend will start on **`http://localhost:5173`** (or embedded at **`http://127.0.0.1:8000/ui`**).
- On Windows, you can simply double-click **`run.bat`** to start both backend and frontend automatically.

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

Run the full 105-test automated test suite using `pytest`:

```bash
cd backend
pytest tests -v
```

### Test Coverage Highlights:
- **25 Required Integration Tests (`test_api_and_security.py`)**: Server startup, health endpoint, valid/empty/invalid requests, schema validation, LLM fallback, oversized log uploads (413), binary upload guards, rate limiting, and CORS.
- **12 Evidence & Accuracy Tests (`test_evidence_and_accuracy.py`)**: Evidence extraction, avoiding unsupported assumptions (generic vs React `.map()`), distinguishing `null` vs `undefined`, empty array vs loading states, strict stack frame validation without invented lines, trusted source domain whitelisting, and literal unescaped JSX diff formatting.
- **36 Real-World Frontend Tests (`test_twenty_plus_suite.py`)**: Real developer questions covering `TypeError: .map()`, CORS blocks, div centering, infinite `useEffect` loops, SSR hydration mismatch, z-index stacking, CSS flexbox overflow, missing keys, and localStorage quota errors.
- **25 Canonical Checklist Tests (`test_initial_checklist.py`)**: Comprehensive checklist testing with exact match verification.
- **7 Baseline Engine Tests (`test_engine.py`)**: Knowledge base count (>= 30), privacy scrubbing, and log file analyzer.

**Result: 105 passing tests in ~3.3s (0 failures).**

---

## 🐳 7. Docker Deployment

Deploy the single-container stack with Docker:

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
