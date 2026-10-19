# ⚡ FrontFix AI — Frontend Support Chatbot (Team B)
> **AI-Powered Diagnostics & Issue Resolution Assistant for Web Developers**

[![Team](https://img.shields.io/badge/Team-Team_B_(Frontend)-blue?style=for-the-badge&logo=react)](https://github.com/AdnanAK8/FrontFix)
[![Status](https://img.shields.io/badge/Status-Minimal_UI_%26_FastAPI_Backend-success?style=for-the-badge&logo=fastapi)](https://github.com/AdnanAK8/FrontFix)
[![Repository](https://img.shields.io/badge/GitHub-AdnanAK8%2FFrontFix-181717?style=for-the-badge&logo=github)](https://github.com/AdnanAK8/FrontFix)

---

## 📌 Project Overview

**FrontFix AI** is an AI-powered conversational support engineer built for **Team B**. It is designed to diagnose, explain, and resolve frontend engineering issues with zero cognitive overload and minimal distraction.

### Key Capabilities:
- **Clean, Minimal Interface**: Focused single-column conversational studio without visual clutter.
- **Privacy Shield**: Client-side regex masks strip Bearer JWT tokens, API keys, and sensitive credentials before dispatch.
- **RAG-Grounded Solutions**: Direct technical guidance anchored in canonical documentation from **React.dev** and **MDN Web Docs**.
- **Actionable Code Diffs**: Provides visual Before (`-`) vs After (`+`) code blocks with one-click copy.
- **Offline & Standalone Resilient**: The frontend UI functions both with the live FastAPI backend connected and standalone offline.

---

## 📂 Repository Structure

The project is structured into two clean, independent directories:

```
FrontFix/
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py                # REST API (GET /, POST /api/diagnose, GET /api/presets)
│   │   ├── engine.py              # Diagnostic engine, privacy sanitizer & diff generator
│   │   └── knowledge.json         # Canonical frontend error solutions & doc references
│   ├── requirements.txt           # Python dependencies (fastapi, uvicorn, pydantic)
│   └── run.py                     # Backend server runner (http://127.0.0.1:8000)
│
├── frontend/                      # Minimalist Web Studio
│   ├── index.html                 # Clean, clutter-free single-column interface
│   ├── style.css                  # Modern minimalist theme (dark mode, calm typography)
│   ├── app.js                     # Resilient frontend logic (dual online/offline mode)
│   └── package.json               # Frontend metadata
│
├── docs/                          # Detailed Technical Specifications
│   ├── ARCHITECTURE.md            # Multi-agent system architecture
│   ├── IMPLEMENTATION_PLAN.md     # 6-week phased roadmap
│   ├── RESEARCH_REPORT.md         # In-depth research on frontend error taxonomy
│   └── PRESENTATION_SLIDES_OUTLINE.md # Classroom pitch and talking points
│
├── README.md                      # Project documentation
└── run.bat                        # One-click Windows runner
```

---

## 🎯 Target Problem Scope (Team B)

| Category | Typical Issues Resolved | Resolution Mechanics |
| :--- | :--- | :--- |
| **React 19 / SSR** | `Hydration failed` (server vs client HTML mismatch) | Defers browser-only state (`localStorage`, `window`) until post-mount via `useEffect`. |
| **Network & APIs** | `Access to fetch blocked by CORS policy` | Configures local reverse proxies (`vite.config.ts`) and specifies backend CORS headers. |
| **JavaScript / React** | `TypeError: Cannot read properties of undefined (reading 'map')` | Initializes state safely (`useState([])`) and uses optional chaining (`?.`). |
| **CSS & Layout** | `z-index` stacking context traps and layout collisions | Detects `opacity < 1` / `transform` traps and uses `ReactDOM.createPortal`. |
| **React Hooks** | `Too many re-renders` (infinite loop) | Replaces synchronous `setState` in render bodies with derived state or guarded `useEffect`. |

---

## 🚀 Quick Start Guide

### Option 1: One-Click Runner (Windows)
Double-click `run.bat` in the root folder. It starts the backend API and launches the minimal frontend in your browser.

### Option 2: Running Separately

#### 1. Backend (FastAPI):
```bash
cd backend
python run.py
```
*API runs at `http://127.0.0.1:8000` (Interactive Swagger Docs at `http://127.0.0.1:8000/docs`)*

#### 2. Frontend:
Simply double-click `frontend/index.html` in your file explorer, or serve it:
```bash
cd frontend
npx serve .
```

---

## 👥 Team B Contributors
- **Lead / Developer**: Adnan Akhtar ([@AdnanAK8](https://github.com/AdnanAK8/FrontFix))
- **Role**: System Architecture, RAG Knowledge Pipeline, Minimal UI & Backend Engine
- **Repository**: [https://github.com/AdnanAK8/FrontFix](https://github.com/AdnanAK8/FrontFix)
