# 🏛️ FrontFix AI — System Architecture Specification
> **Team B (Frontend Support) — Node.js & Express Architectural Blueprint**

---

## 1. End-to-End System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients ["Client Layer"]
        WebUI["Web Interface\n(frontend/index.html, app.js)"]
        BrowserExt["Chrome/Edge Extension (MV3)\n(Active Tab Diagnostics, popup.js)"]
    end

    subgraph Gateway ["Node.js & Express Server (Port 8000)"]
        Server["Express App (src/app.js)"]
        HelmetMW["Helmet Security Headers"]
        CorsMW["Configured CORS & Extension Origin Filter"]
        RateLimiter["Rate Limiter (express-rate-limit)"]
        MulterGuard["Multer File Guard (Max 2MB, Memory Storage)"]
        StaticServer["Static Files (/ui)"]
    end

    subgraph Controllers ["Controllers Layer"]
        ChatCtrl["ChatController (chat.controller.js)"]
        DiagCtrl["DiagnosticsController (diagnostics.controller.js)"]
        FeedCtrl["FeedbackController (feedback.controller.js)"]
    end

    subgraph Services ["Core Services Layer"]
        Sanitizer["SanitizerService\n(JWT, API Key, Password, Email, URL Scrubbing)"]
        DiagEngine["DiagnosticEngine\n(Reasoning, Fallbacks & Log Analyzer)"]
        HistorySvc["HistoryService\n(Context Resolution & Memory Bounding)"]
        Retriever["KnowledgeRetriever\n(TF-IDF Index & Cosine Ranking)"]
        LLMSvc["LLMService\n(Google Gemini & OpenAI Grounding)"]
    end

    subgraph KnowledgeData ["Canonical Frontend Knowledge Base"]
        KBData[("knowledge.json\n34 Curated Frontend Issues\nReact, CSS, JS, HTML, API, Console")]
        DocsLinks["Authoritative Links\n(MDN Web Docs, React.dev, web.dev)"]
    end

    subgraph AIProviders ["AI Providers Layer"]
        GeminiAPI["Google Gemini SDK / REST\n(gemini-1.5-flash / gemini-2.0)"]
        OpenAIAPI["OpenAI API / Local Compatible"]
        CanonicalFallback["Verified Knowledge Fallback\n(Transparent Deterministic Output)"]
    end

    subgraph Telemetry ["Session Analytics & Telemetry"]
        FeedbackStore[("In-Memory Feedback Store\n(/api/feedback/stats)")]
    end

    %% Client Connections
    WebUI --> CorsMW
    BrowserExt --> CorsMW
    CorsMW --> HelmetMW --> RateLimiter --> Server

    %% Server Routing
    Server --> MulterGuard --> DiagCtrl
    Server --> ChatCtrl
    Server --> FeedCtrl

    %% Controller to Services
    ChatCtrl --> DiagEngine
    DiagCtrl --> DiagEngine
    FeedCtrl --> FeedbackStore

    DiagEngine --> Sanitizer
    DiagEngine --> HistorySvc
    DiagEngine --> Retriever
    Retriever --> KBData
    DiagEngine --> LLMSvc

    %% LLM Grounding
    LLMSvc --> GeminiAPI
    LLMSvc --> OpenAIAPI
    LLMSvc -- No key or timeout --> CanonicalFallback
```

---

## 2. Diagnostic Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / User
    participant Ext as Chrome Extension / Web UI
    participant API as Express Backend (Port 8000)
    participant Engine as Diagnostic Engine
    participant Retriever as TF-IDF Cosine Retriever
    participant KB as Canonical Knowledge Base
    participant LLM as Grounded LLM Service

    Dev->>Ext: Clicks "Analyze Current Page" or Pastes Error
    Ext->>Ext: Client-side privacy preview & URL parameter scrubbing
    Ext->>API: POST /api/extension/diagnose or /api/diagnose
    
    API->>API: CORS & Rate limit verification
    API->>Engine: diagnose(query, enablePrivacy, history)
    Engine->>Engine: SanitizerService scrubs Bearer tokens, secrets, emails
    
    alt Vague or Insufficient Query
        Engine-->>API: Returns domain-tailored follow-up questions
        API-->>Ext: Displays follow-up guidance to user
    else Technical Error Provided
        Engine->>Retriever: search(enrichedQuery)
        Retriever->>KB: Vector Cosine dot-product + Trigger boost
        KB-->>Retriever: Top ranked issue (score >= 12.0)
        Retriever-->>Engine: Canonical issue details
        
        alt Real Gemini/OpenAI API Key Configured
            Engine->>LLM: generateGroundedResponse(query, canonicalIssue, history)
            LLM->>LLM: Strict JSON schema validation
            LLM-->>Engine: Synthesized 4-part diagnosis (Problem, Cause, Steps, Tips)
        else Offline / Key Not Configured / API Failure
            Engine->>Engine: Transparently fallback to canonical issue data
        end
        
        Engine-->>API: Structured diagnosis payload
        API-->>Ext: JSON response (Problem, Cause, Steps, Tips, Code Diff, Docs Link)
        Ext-->>Dev: Displays 4-part diagnosis card with Copy buttons
    end

    Dev->>Ext: Clicks 👍 or 👎 Feedback
    Ext->>API: POST /api/feedback { is_helpful, issue_title }
    API->>API: In-memory feedback store updated
```

---

## 3. Component Breakdown

### A. Web Presentation (`frontend/`)
- Pure vanilla ES6 JavaScript with native Web APIs (`fetch`, `FileReader`, `Clipboard`).
- Dual online/offline mode: when the Node.js API is reachable, queries are routed through the backend engine; when offline, a local browser cache handles baseline queries.
- Zero bulky external frameworks (React/Vue/Angular omitted from UI bundle following the ponytail philosophy).

### B. Chrome/Edge Extension (`extension/`)
- Manifest V3 architecture (`activeTab`, `scripting`, `storage` permissions).
- **In-Page Monitor (`injected.js`)**: Runs in the host page context to intercept uncaught errors (`window.addEventListener('error')`), unhandled promise rejections (`unhandledrejection`), and failed resource fetches (`<script>`, `<link>`, `<img>`).
- **Content Script (`content.js`)**: Bridges messages between page monitor and extension popup, captures user-selected text on demand, and maintains an in-memory ring buffer (max 20 errors).
- **Popup Interface (`popup.html`, `popup.js`, `popup.css`)**: Shows active tab URL, preview of detected errors, privacy toggles, "Analyze Current Page" trigger, manual error paste input, 4-part diagnosis cards, code diffs, and thumbs up/down feedback.
- **Privacy First**: Never captures form inputs, passwords, or cookies. Automatically redacts query parameters and tokens from URLs.

### C. Node.js & Express Backend (`backend/`)
- **Runtime**: Node.js LTS (ES Modules).
- **Security**: Helmet HTTP headers, strict CORS configuration supporting both web origins and `chrome-extension://*` IDs, rate limiting (60 req/min for diagnostics, 20 req/min for uploads).
- **Log File Ingestion**: Multer memory storage with 2MB hard limit (HTTP 413) and binary null-byte detection.
- **Knowledge Retrieval Engine**: True TF-IDF vector space model with smoothed inverse document frequency:
  $$\text{IDF}(t) = \ln\left(\frac{N + 1}{\text{DF}(t) + 1}\right) + 1.0$$
  $$\text{TF}(t, d) = \frac{\text{count}(t, d)}{\sum_{t'} \text{count}(t', d)}$$
  $$\text{CosineSim}(Q, D) = \frac{\vec{Q} \cdot \vec{D}}{\|\vec{Q}\| \|\vec{D}\|}$$
- **LLM Grounding Service**: Google Gemini 1.5 Flash SDK (`@google/generative-ai`) and OpenAI compatibility, with placeholder key detection, strict JSON schema validation, timeout protection, and automatic fallback.
- **In-Memory Telemetry**: Non-blocking feedback storage accessible via `GET /api/feedback/stats`.
