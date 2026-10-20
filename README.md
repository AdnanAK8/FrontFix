# ⚡ FrontFix AI — Technical Issue Resolution Chatbot
> **Team B: Frontend Support Chatbot**  
> *AI-Powered Diagnostics, Root-Cause Analysis & Step-by-Step Fixes for Web Developers*

[![Team](https://img.shields.io/badge/Team-Team_B_(Frontend)-0284c7?style=for-the-badge&logo=react)](https://github.com/AdnanAK8/FrontFix)
[![Knowledge Base](https://img.shields.io/badge/Knowledge_Base-32_Canonical_Issues-10b981?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)
[![AI Grounding](https://img.shields.io/badge/AI_Model-Gemini_1.5_Flash-4285f4?style=for-the-badge&logo=google)](https://github.com/AdnanAK8/FrontFix)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.135-009688?style=for-the-badge&logo=fastapi)](https://github.com/AdnanAK8/FrontFix)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ed?style=for-the-badge&logo=docker)](https://github.com/AdnanAK8/FrontFix)
[![Tests](https://img.shields.io/badge/Tests-40_Passing-success?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)

---

## 📌 1. Project Overview

Developers lose significant time searching the web for frontend errors. **FrontFix AI** functions as an automated senior technical support engineer: it understands frontend errors, performs genuine **TF-IDF Cosine Similarity Search** across a verified 32-issue canonical knowledge base, and utilizes **Google Gemini** to synthesize clear, step-by-step fix instructions.

### Intended Diagnostic Flow:
1. **Developer enters error or code**: Pastes a stack trace, console error, or asks a technical question.
2. **FastAPI receives & sanitizes**: Real-time regex masks strip Bearer JWT tokens, API keys, passwords, and emails.
3. **True TF-IDF Cosine Search**: Computes token term frequency & inverse document frequency vectors, retrieving canonical fixes.
4. **Gemini Explains Retrieved Information**: Gemini receives the user's error and retrieved canonical issue details to generate the explanation.
5. **Structured Answer + Source Links + Feedback**: Produces the required 4-part response (Problem, Likely cause, Fix steps, Extra tips) with official documentation links and thumbs up/down rating.
6. **Transparent Provenance**: Responses are clearly labelled as `✨ AI Explained (Gemini)` or `📚 Verified Knowledge Base` (when offline or fallback).

---

## 🎯 2. Five Critical Fixes & Improvements

| Area | Implementation & Resolution Detail |
| :--- | :--- |
| **1. Real AI Model Grounding** | Integrated Google Gemini 1.5 Flash in `backend/app/llm.py`. Injects retrieved canonical knowledge into the prompt so Gemini explains the exact problem and fix steps. If the API is unreachable, it returns a transparently labelled knowledge-base answer (`generated_by: "knowledge_base"`). |
| **2. Deployed Frontend API URL** | Added `resolveBackendUrl()` in `frontend/app.js` using `FRONTFIX_CONFIG`. Supports local development on `127.0.0.1:8000`, single-container Docker mounts via `window.location.origin`, and deployed HTTPS API endpoints (Render/Vercel) without hardcoding localhost for external classmates. |
| **3. Production-Safe CORS** | Replaced wildcard credentials with an explicit origin whitelist (`http://127.0.0.1:8000`, `http://localhost:8000`, `http://localhost:5173`, etc.) and `allow_credentials=False` in `backend/app/main.py`. Configurable via `ALLOWED_ORIGINS` in `.env`. |
| **4. Log Upload Privacy & Hardening** | In `backend/app/engine.py`, the entire log file is sanitized with regex masks **before** error extraction. Analyzes only sanitized lines, enforces a strict **2MB upload limit** (HTTP 413), blocks binary executables, and returns sanitized snippets with zero token leakage. |
| **5. Corrected React `.map()` Fix** | Updated `typeerror_map` in both `backend/app/knowledge.json` and `frontend/app.js` to properly decouple `loading`, `error`, and empty array (`items.length === 0`) states instead of trapping the UI in permanent loading. |
| **A. True TF-IDF Cosine Search** | Built mathematical TF-IDF vectorization with inverse document frequency $IDF = \ln((N+1)/(DF+1)) + 1$ and cosine similarity $\cos(\vec{Q}, \vec{D})$ across all 32 knowledge base articles. |
| **B. Real Multi-Turn Memory** | The engine inspects `conversation_history`. When a user asks follow-up questions (e.g. *"What should I check next?"* or *"How do I fix this in TypeScript?"*), the prior diagnosed context is passed into the prompt to generate tailored advice. |

---

## 📂 3. Repository Structure

```
front-fix/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI REST endpoints & production CORS
│   │   ├── engine.py          # TF-IDF cosine search, privacy scrubber & log parser
│   │   ├── llm.py             # Grounded Google Gemini / OpenAI client
│   │   └── knowledge.json     # 32 curated frontend error resolutions
│   ├── tests/
│   │   ├── test_engine.py             # Baseline engine tests (7 tests)
│   │   └── test_twenty_plus_suite.py  # 33 comprehensive real-world tests
│   ├── requirements.txt       # Dependencies (fastapi, uvicorn, pydantic, dotenv)
│   └── run.py                 # Backend launcher (http://127.0.0.1:8000)
│
├── frontend/
│   ├── index.html             # Conversational interface with presets & upload
│   ├── style.css              # Minimalist theme (dark mode, calm typography)
│   ├── app.js                 # Frontend application logic & offline fallback
│   └── package.json           # Frontend metadata
│
├── docs/
│   ├── ARCHITECTURE.md        # Technical architecture specification & diagrams
│   ├── IMPLEMENTATION_PLAN.md # 6-phase engineering roadmap
│   ├── RESEARCH_REPORT.md     # Frontend error taxonomy research
│   ├── TEST_REPORT.md         # Verification report with 40 passing tests
│   └── PRESENTATION_SLIDES_OUTLINE.md
│
├── Dockerfile                 # Container image specification
├── docker-compose.yml         # Container deployment configuration
├── .dockerignore              # Container exclusions
├── .env.example               # Environment variables template (placeholders only)
├── run.bat                    # One-click Windows starter
└── README.md                  # Complete documentation
```

---

## 🚀 4. Quick Start Guide

### Step 1: Clone & Configure `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Google Gemini API key if you want live AI explanations (otherwise it runs using the verified knowledge base):
```ini
GEMINI_API_KEY=AIzaSyYourActualKeyHere
PORT=8000
HOST=127.0.0.1
```
*(Note: `.env` is excluded from git via `.gitignore` and is never uploaded).*

---

### Step 2: Running via Python

```bash
cd backend
pip install -r requirements.txt
python run.py
```
- **Backend API**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Mounted Web UI**: `http://127.0.0.1:8000/ui`

---

### Step 3: One-Click Windows Launcher
Double-click `run.bat` in the root folder. It starts the backend API and opens the frontend UI in your browser.

---

### Step 4: Docker Deployment
Run the full-stack app with a single command:
```bash
docker compose up --build
```
Access the application at `http://localhost:8000/ui`.

---

## 🧪 5. Running Automated Unit Tests

Run the full 40-test automated suite verifying the 20+ real developer questions, multi-turn memory, log file size limits, privacy scrubbing, and true TF-IDF ranking:

```bash
python -m unittest discover -s backend/tests
```

**Test Output:**
```text
Ran 40 tests in 40.064s

OK
```

---

## 📚 6. Curated Knowledge Base (32 Issues Catalog)

| # | Category | Issue Title | Canonical Source |
|---|:---|:---|:---|
| 1 | JavaScript & React | TypeError: Cannot read properties of undefined (reading 'map') | MDN Array.map |
| 2 | API & Network | CORS Policy Blocked: No 'Access-Control-Allow-Origin' Header | MDN CORS |
| 3 | CSS & Layout | CSS Centering: Div or Modal Not Centered on Screen | MDN Centering |
| 4 | React & Hooks | Too Many Re-renders: useEffect Runs in an Infinite Loop | React.dev Effects |
| 5 | React & SSR | React Hydration Mismatch (Server vs Client HTML Mismatch) | React.dev Hydration |
| 6 | CSS & Layout | CSS Z-Index Stacking Context Trap (Element Renders Behind) | MDN Stacking Context |
| 7 | CSS & Layout | Flexbox Child Overflowing Container (text-overflow: ellipsis broken) | CSS-Tricks Flexbox |
| 8 | React & Hooks | Warning: Each child in a list should have a unique 'key' prop | React.dev Lists |
| 9 | React & Forms | Warning: Component changing uncontrolled input to be controlled | React.dev Inputs |
| 10 | HTML & Forms | Form Button Reloads Page / Submits on Click | MDN Button |
| 11 | HTML Structure | HTML Nesting Violation: `<p>` cannot contain `<div>` | MDN Paragraphs |
| 12 | API & Network | HTTP 404 Not Found on API Fetch or SPA Route Refresh | MDN HTTP 404 |
| 13 | API & Network | HTTP 500 Internal Server Error & Handling Unhandled Rejections | MDN HTTP 500 |
| 14 | JavaScript | SyntaxError: Unexpected token '<', '<!DOCTYPE '... is not valid JSON | MDN Response.json |
| 15 | JavaScript | UnhandledPromiseRejection: Uncaught (in promise) Error | MDN Promises |
| 16 | React & Hooks | React Hooks Violation: Rendered fewer hooks than expected | React.dev Hooks Rules |
| 17 | React & Hooks | Stale Closure in useEffect or Event Listener | React.dev Effects |
| 18 | API & React | Race Condition in Fetch Requests: Out-of-Order API Responses | MDN AbortController |
| 19 | CSS & Layout | CSS position: sticky Not Working (Element Scrolls Away) | MDN Sticky |
| 20 | CSS & Layout | Mobile 100vh Layout Jump / Content Cut Off by Browser Address Bar | web.dev Viewport Units |
| 21 | JavaScript | TypeError: Cannot read properties of null (reading 'property') | MDN Optional Chaining |
| 22 | JavaScript | TypeError: Assignment to constant variable | MDN const |
| 23 | JavaScript | NaN (Not-a-Number) in Calculations or UI Displays | MDN Number.isNaN |
| 24 | React & Memory | Warning: Can't perform a React state update on unmounted component | React.dev Cleanup |
| 25 | CSS & Layout | CSS Margin Collapse: Unexpected Vertical Gaps | MDN Margin Collapsing |
| 26 | CSS & Layout | CSS Grid Items Overflowing Container / Not Responsive | MDN Grid Layout |
| 27 | HTML & a11y | Accessibility Violation: Form Input Missing Associated Label or ARIA | MDN Web Forms |
| 28 | Core Web Vitals | Cumulative Layout Shift (CLS): Image Jumps on Load | web.dev CLS |
| 29 | Browser Security | Content Security Policy (CSP) Violation: Blocked Inline Script | MDN CSP |
| 30 | Browser Security | Mixed Content: Insecure HTTP Request on Secure HTTPS Page | MDN Mixed Content |
| 31 | Browser Storage | DOMException: QuotaExceededError in localStorage.setItem() | MDN Storage Quota |
| 32 | API & Network | CORS Error: Access-Control-Allow-Origin Wildcard with Credentials | MDN Credentials |

---

## 🔒 7. Safety & Privacy Compliance

- **DLP Privacy Scrubbing**: Client and server side regex masks strip:
  - Bearer JWT tokens (`Bearer [REDACTED_JWT]`)
  - API Keys (`[REDACTED_API_KEY]`) including OpenAI `sk-` and Google `AIza...`
  - Passwords and secrets (`[REDACTED_SECRET]`)
  - Sensitive emails (`[REDACTED_EMAIL]`)
- **No Risky Execution**: The chatbot suggests commands and configuration files but never executes destructive shell operations (e.g. `rm -rf`, `DROP TABLE`).
- **Key Hygiene**: `.env` is strictly excluded from Git; `.env.example` contains placeholders only.

---

## 👥 8. Team B Contributors
- **Project**: AI-Powered Chatbots for Technical Issue Resolution
- **Track**: Team B (Frontend Support Chatbot)
- **Author**: Adnan Akhtar ([@AdnanAK8](https://github.com/AdnanAK8/FrontFix))
