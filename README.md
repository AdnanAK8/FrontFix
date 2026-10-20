# ⚡ FrontFix AI — Technical Issue Resolution Chatbot
> **Team B: Frontend Support Chatbot**  
> *AI-Powered Diagnostics, Root-Cause Analysis & Step-by-Step Fixes for Web Developers*

[![Team](https://img.shields.io/badge/Team-Team_B_(Frontend)-0284c7?style=for-the-badge&logo=react)](https://github.com/AdnanAK8/FrontFix)
[![Knowledge Base](https://img.shields.io/badge/Knowledge_Base-32_Canonical_Issues-10b981?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.135-009688?style=for-the-badge&logo=fastapi)](https://github.com/AdnanAK8/FrontFix)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ed?style=for-the-badge&logo=docker)](https://github.com/AdnanAK8/FrontFix)
[![Tests](https://img.shields.io/badge/Tests-7_Passing-success?style=for-the-badge)](https://github.com/AdnanAK8/FrontFix)

---

## 📌 1. Project Overview

Developers lose significant time searching the web for frontend errors. **FrontFix AI** functions as an automated senior technical support engineer: it understands frontend errors, performs fast token-scored search across a verified canonical knowledge base, and outputs clean, structured solutions with zero cognitive overload.

### Built for Team B Problem Scope:
- **JavaScript & TypeScript Errors**: Undefined/null property access, unhandled promise rejections, type coercion issues, NaN calculations.
- **React & Hooks Lifecycle**: Infinite render loops (`useEffect`), hydration mismatches (SSR), rules of hooks violations, missing keys, uncontrolled/controlled input shifts.
- **CSS & Layout Engineering**: Centering bugs (`place-items: center`), `z-index` stacking context traps, flexbox overflow & ellipsis truncation, grid responsiveness, margin collapse, dynamic viewport height (`100dvh`).
- **HTML & Accessibility**: Button form reload defaults, invalid element nesting (`<p>` inside `<div>`), missing form labels, Cumulative Layout Shift (CLS).
- **API Integration & Network**: CORS policy blocking, HTTP 404/500 diagnostics, JSON parse errors (`Unexpected token '<'`), fetch race conditions (`AbortController`).
- **Browser Console & Web APIs**: Content Security Policy (CSP) violations, Mixed Content HTTPS warnings, `localStorage` quota exceptions.

---

## 🎯 2. Key Requirements & Implementation

| Requirement | Implementation Detail | Status |
| :--- | :--- | :--- |
| **Chat Interface** | Clean, distraction-free conversational studio with code formatting | ✅ Complete |
| **Knowledge Base** | **32 fully indexed frontend issues** with root causes, fixes, and docs | ✅ Complete |
| **Grounded Search** | High-precision TF-IDF token scoring over triggers, titles, and causes | ✅ Complete |
| **4-Part Output Format** | **Problem**, **Likely Cause**, **Fix Steps** (numbered), **Extra Tips** | ✅ Complete |
| **Feedback Option** | Interactive **Thumbs Up (👍)** / **Thumbs Down (👎)** with API feedback logging | ✅ Complete |
| **Vague Input Handling** | Prompts follow-up question when user query lacks context or stack trace | ✅ Complete |
| **Uncertainty Handling** | Explicitly declares low confidence and links directly to official docs | ✅ Complete |
| **Log File Upload (Bonus)**| Parses `.log`, `.txt`, `.json` files, extracts stack traces, summarizes fixes | ✅ Complete |
| **Conversation Memory** | Remembers earlier messages in the active session | ✅ Complete |
| **Docker Packaging** | Includes production-ready `Dockerfile` and `docker-compose.yml` | ✅ Complete |
| **Safety & Privacy** | Real-time regex sanitization of Bearer tokens, API keys, passwords | ✅ Complete |

---

## 🏗️ 3. How It Works (5-Stage Pipeline)

```
1. Receive   --> User inputs error message, stack trace, or uploads log file
                    │
2. Sanitize  --> Privacy Shield masks JWTs, API keys (sk-, ghp_), passwords
                    │
3. Understand--> Evaluates query specifics (asks follow-up if input is vague)
                    │
4. Search    --> RAG TF-IDF ranking over 32 verified canonical frontend issues
                    │
5. Guide     --> Outputs 4-part structured response + Before/After code diff + Thumbs rating
```

### Response Format Standard:
Every diagnostic response follows the mandated 4-part structure:
1. **🔍 Problem**: Clear synopsis of what failed.
2. **⚡ Likely Cause**: Technical root-cause explanation.
3. **🛠️ Fix Steps**: Actionable numbered steps with before/after code diffs.
4. **💡 Extra Tips**: Best practices, performance notes, and prevention checklist.
5. **❓ Resolution Confirmation**: *"Did this resolve your issue?"* with 👍 / 👎 buttons.

---

## 📂 4. Repository Structure

```
front-fix/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI REST endpoints & static mount
│   │   ├── engine.py          # TF-IDF search, privacy scrubber & log parser
│   │   └── knowledge.json     # 32 curated frontend error resolutions
│   ├── tests/
│   │   └── test_engine.py     # Automated unit test suite (7 tests)
│   ├── requirements.txt       # Dependencies (fastapi, uvicorn, pydantic)
│   └── run.py                 # Backend launcher (http://127.0.0.1:8000)
│
├── frontend/
│   ├── index.html             # Conversational interface with presets & upload
│   ├── style.css              # Minimalist theme (dark mode, calm typography)
│   ├── app.js                 # Frontend application logic & offline RAG fallback
│   └── package.json           # Frontend metadata
│
├── docs/
│   ├── ARCHITECTURE.md        # Technical architecture specification
│   ├── IMPLEMENTATION_PLAN.md # 6-phase engineering roadmap
│   ├── RESEARCH_REPORT.md     # Frontend error taxonomy research
│   ├── TEST_REPORT.md         # Phase 6 verification report
│   └── PRESENTATION_SLIDES_OUTLINE.md
│
├── Dockerfile                 # Container image specification
├── docker-compose.yml         # Container deployment configuration
├── .dockerignore              # Container exclusions
├── .env.example               # Environment variables template
├── run.bat                    # One-click Windows starter
└── README.md                  # Complete documentation
```

---

## 🚀 5. Quick Start Guide

### Option 1: One-Click Windows Launcher
Double-click `run.bat` in the root folder. It starts the backend API and opens the frontend UI in your browser.

---

### Option 2: Running via Python

#### 1. Install Dependencies:
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Start Backend Server:
```bash
python run.py
```
- API Server: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Mounted Web UI: `http://127.0.0.1:8000/ui`

#### 3. Open Frontend:
Open `frontend/index.html` directly in any browser (or access `http://127.0.0.1:8000/ui`).

---

### Option 3: Docker Deployment
Run with a single command:
```bash
docker compose up --build
```
Access the application at `http://localhost:8000/ui`.

---

## 🧪 6. Running Unit Tests

Run the full automated test suite verifying knowledge base integrity, the 4 prompt cases, privacy scrubbing, log parsing, and search scoring:

```bash
python -m unittest backend.tests.test_engine
```

**Test Output:**
```
Ran 7 tests in 0.024s
OK
```

---

## 📚 7. Curated Knowledge Base (32 Issues Catalog)

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

## 🔒 8. Safety & Privacy Compliance

- **No Risky Execution**: The chatbot suggests commands and configuration files but never executes destructive shell operations (e.g. `rm -rf`, `DROP TABLE`).
- **DLP Privacy Scrubbing**: Client and server side regex masks strip:
  - Bearer JWT tokens (`Bearer [REDACTED_JWT]`)
  - API Keys (`[REDACTED_API_KEY]`)
  - Passwords and secrets (`[REDACTED_SECRET]`)
  - Sensitive emails (`[REDACTED_EMAIL]`)
- **Key Hygiene**: All secrets and optional LLM keys are configured in `.env` (included in `.gitignore` and never committed to source control).

---

## 👥 9. Team B Contributors
- **Project**: AI-Powered Chatbots for Technical Issue Resolution
- **Track**: Team B (Frontend Support Chatbot)
- **Author**: Adnan Akhtar ([@AdnanAK8](https://github.com/AdnanAK8/FrontFix))
