# 📋 FrontFix AI — Step-by-Step Implementation Roadmap
> **Team B (Frontend Support Chatbot) — 6-Week Project Execution Plan & Milestones**

---

## 🎯 Project Overview & Objective

To build, test, and deliver an AI-powered Frontend Support Chatbot capable of diagnosing and resolving HTML, CSS, JavaScript, React, UI errors, API integration failures, and browser console errors with high precision.

---

## 🗓️ 6-Week Phased Development Schedule

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Research, Taxonomy & Architectural Foundation (Week 1)        │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: RAG Pipeline, Vector Store & Agent Orchestration (Week 2)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Core Diagnostic Engine & Error Parsing Mechanics (Week 3)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Modern Web Chat UI, Monaco Diff & Interactive Cards (Week 4)  │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 5: Browser DevTools Extension & Telemetry Ingestion (Week 5)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 6: Benchmarking, Classroom Presentation & Deployment (Week 6)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Detailed Breakdown by Phase

### Phase 1: Research, Taxonomy & Architectural Foundation (Week 1)
- [x] **Task 1.1**: Catalogue the top 100 most common frontend errors across 5 primary domains:
  - React (Hydration, Infinite Loops, Hook Rules, Missing Keys)
  - JavaScript (TypeError null/undefined, Async Unhandled Rejections, Scope Traps)
  - CSS/Layout (Flexbox collapse, Z-index stacking contexts, Overflow clipping)
  - API/Network (CORS policy blocks, 401/403 Auth, Payload JSON Parse Failures)
  - DOM/HTML (Hydration mismatch, Invalid nesting, Unescaped characters)
- [x] **Task 1.2**: Define standard JSON Schema for diagnostic inputs and outputs (`DiagnosticResult`).
- [x] **Task 1.3**: Set up Git repository structure, pre-commit hooks, and development environments.

---

### Phase 2: RAG Pipeline & Knowledge Vector Store (Week 2)
- [ ] **Task 2.1**: Curate canonical documentation datasets:
  - MDN Web Docs (Fetch, Web APIs, CSS Flex/Grid, Events)
  - React 19 official documentation (Server Components, Hooks, Compiler changes)
  - Vite & Next.js documentation (Dev Server Proxy, SSR boundaries)
- [ ] **Task 2.2**: Vectorize documentation chunks using `text-embedding-3-small` or HuggingFace embeddings into **ChromaDB**.
- [ ] **Task 2.3**: Implement metadata filtering so queries tagged as `[REACT]` query React vectors with higher weight, and `[NETWORK]` queries prioritize MDN Fetch/CORS vectors.

---

### Phase 3: Core Diagnostic Engine & Error Parsing Mechanics (Week 3)
- [ ] **Task 3.1**: Build the **Sanitization Middleware** to scrub API tokens, JWTs, and PII from developer input before sending to LLMs.
- [ ] **Task 3.2**: Implement **Deterministic Pre-Classifiers** (fast regex matching) for instant detection of common errors (e.g. `Access-Control-Allow-Origin`, `Cannot read properties of undefined`).
- [ ] **Task 3.3**: Configure **LangGraph / LangChain Multi-Agent Router** to delegate to specialized subagents:
  - React Lifecycle Specialist
  - API & Network Specialist
  - CSS Layout Specialist
  - Console Runtime Specialist
- [ ] **Task 3.4**: Integrate AST syntax verification to ensure all generated code fixes are syntactically valid and compile without errors.

---

### Phase 4: Web Chat UI & Unified Code Diff Viewer (Week 4)
- [ ] **Task 4.1**: Build responsive frontend workspace using React 19 + Tailwind CSS + Lucide Icons.
- [ ] **Task 4.2**: Implement real-time streaming output (Server-Sent Events) so responses appear instantly with zero delay.
- [ ] **Task 4.3**: Integrate **Monaco Editor / Prism.js Code Diff Viewer** displaying visual additions (`+`) and deletions (`-`) side by side.
- [ ] **Task 4.4**: Create quick-action preset buttons (e.g., "Debug Hydration", "Fix CORS", "Resolve TypeError") for instant one-click demonstration.

---

### Phase 5: Browser DevTools Extension & Telemetry (Week 5)
- [ ] **Task 5.1**: Develop a lightweight Manifest V3 Chrome Extension.
- [ ] **Task 5.2**: Capture real-time `console.error` and unhandled rejections automatically with a floating "Fix with FrontFix AI" button.
- [ ] **Task 5.3**: Implement source map resolution to de-minify production minified stack traces back to original TypeScript source lines.

---

### Phase 6: Benchmarking, Presentation & Deployment (Week 6)
- [ ] **Task 6.1**: Run evaluation benchmark against a curated test suite of 100 frontend bugs.
  - Measure: Time to Resolution (TTR), Code Patch Accuracy, and Token Cost.
- [ ] **Task 6.2**: Deploy the Web Application to Vercel/Netlify and the Backend to Render/Railway.
- [ ] **Task 6.3**: Prepare slide deck, live demo script, and deliver classroom presentation.

---

## 👥 Team Work Allocation & Responsibilities (Team B)

| Member | Focus Area | Key Deliverables |
| :--- | :--- | :--- |
| **Adnan Akhtar (Lead)** | System Architecture, RAG Pipeline & UI Engine | Vector DB setup, LangGraph Agent routing, React Prototype & GitHub Repo |
| **Team Member 2** | Diagnostics & Error Parser | Regex pre-classifiers, Stack trace un-minifier, AST validator |
| **Team Member 3** | Knowledge Base & Documentation Scraper | MDN & React Docs vectorization, prompt engineering, few-shot tuning |
| **Team Member 4** | Browser Extension & Integration | Chrome DevTools Manifest V3 extension, Vite plugin hooks, End-to-end testing |

---

## 📊 Key Performance Indicators (KPIs) for Class Evaluation

1. **Diagnostic Precision**: > 95% root cause accuracy on standardized frontend error test cases.
2. **Actionability**: 100% of responses must include a copyable, syntactically valid code diff.
3. **Speed**: Sub-second initial response time via streaming and deterministic shortcuts.
4. **Safety**: Zero token leakage (PII/Secret redactor working on 100% of test inputs).
