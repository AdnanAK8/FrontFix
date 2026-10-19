# 🎤 FrontFix AI — Classroom Presentation & Discussion Script
> **Team B (Frontend Support Chatbot) — Presentation Outline & Speaking Notes**

Use this guide during today's class when presenting Team B's proposed chatbot project to the instructor and peers.

---

## ⏱️ Presentation Timing (5–7 Minutes Total)

```
[0:00 - 1:00]  Slide 1: Title, Team B Scope & The Core Problem
[1:00 - 2:30]  Slide 2: Why Generic AI Fails & How FrontFix AI is Different
[2:30 - 4:00]  Slide 3: Proposed Architecture & Multi-Agent Triage
[4:00 - 5:15]  Slide 4: Technology Stack & Step-by-Step Roadmap
[5:15 - 6:30]  Slide 5: Live Interactive Demo (Walkthrough of index.html)
[6:30 - 7:00]  Slide 6: Q&A & Teacher Discussion Points
```

---

## 📽️ Slide-by-Slide Speaking Script

### Slide 1: Introduction & The Problem
- **Headline**: "FrontFix AI: AI-Powered Autonomous Frontend Support & Diagnostics"
- **Speaker Notes**:
  > *"Hello everyone and Professor! Our team is Team B, and our focus is on building an AI-Powered Frontend Support Chatbot.*
  >
  > *Every developer in this room knows the feeling: you spend 10 minutes writing a feature, and then 45 minutes banging your head against a wall because of a `Hydration failed` error, a mysterious CORS policy block, or a `TypeError: Cannot read properties of undefined`.*
  >
  > *Our goal with FrontFix AI is to turn those frustrating moments into instant, actionable learning with automated diagnostics, code diffs, and zero hallucinations."*

---

### Slide 2: Why Frontend Debugging Needs a Dedicated AI
- **Headline**: "The Generic Chatbot Gap: Why ChatGPT Isn't Enough"
- **Speaker Notes**:
  > *"When you paste a browser stack trace into a standard chatbot, you usually get generic advice. It doesn't know if you're using React 19 Server Components or a client-side Vite bundle.*
  >
  > *FrontFix AI bridges this gap with three specialized pillars:*
  > *1. **Privacy Shield**: Automatically redacts environment secrets, JWTs, and user tokens before sending data.*
  > *2. **RAG Grounded in Real Docs**: Queries official MDN Web Docs, React 19 RFCs, and CanIUse tables directly.*
  > *3. **Visual Code Diffs**: Gives you an immediate `Before vs After` unified diff you can review and apply."*

---

### Slide 3: Proposed Architecture
- **Headline**: "Multi-Agent Triage Pipeline"
- **Speaker Notes**:
  > *"Our architecture isn't just a simple prompt wrapper. It's a modular multi-agent pipeline:*
  >
  > *When an error is submitted, a fast deterministic parser classifies the domain into React, JavaScript, CSS, or Network API.*
  >
  > *We then dispatch the problem to specialized subagents: for example, the React Specialist understands hook dependencies and SSR hydration, while our API Specialist knows how to handle CORS preflights and proxy configs.*
  >
  > *Finally, our AST-guided diff generator synthesizes the final patch with verified syntax."*

---

### Slide 4: Technology Stack & Implementation Roadmap
- **Headline**: "Modern, Production-Ready Stack"
- **Speaker Notes**:
  > *"For our tech stack:*
  > *- **Frontend**: React 19, TypeScript, and Tailwind CSS with Monaco Editor for code diffs.*
  > *- **Backend**: FastAPI with Python and LangGraph for agent orchestration.*
  > *- **Knowledge Base**: ChromaDB storing embedded vector chunks of MDN and React documentation.*
  > *- **Developer Tools**: A Manifest V3 Chrome Extension that catches `console.error` right from DevTools with one click.*
  >
  > *We've structured our implementation into 6 clear weekly sprints, moving from RAG indexing to full browser extension integration."*

---

### Slide 5: Live Prototype Demonstration
- **Headline**: "Interactive Working Prototype"
- **Speaker Notes**:
  > *(Switch to the browser showing `index.html`)*
  >
  > *"To show that we came prepared with working ideas today, we've already built a working browser-based prototype!*
  >
  > *Let me demonstrate with one of the most frustrating errors in web development: React Hydration Failure.*
  > *(Click the 'React Hydration Mismatch' preset button).*
  >
  > *Notice how instantly FrontFix AI:*
  > *1. Identifies the exact root cause: rendering a window-dependent value on the server.*
  > *2. Shows the exact red and green code diff fixing the issue using a two-pass `useEffect` pattern.*
  > *3. Links directly to the official React documentation.*
  >
  > *We can do the same for CORS errors, CSS Z-index stacking collisions, and unhandled promise rejections."*

---

### Slide 6: Expected Discussion Questions & Answers

**Q1: How do you prevent the AI from generating code that breaks other parts of the application?**
> *Answer: "Great question! We use a two-step validation: first, an AST (Abstract Syntax Tree) validator checks that the generated patch is syntactically sound. Second, our RAG prompt enforces minimal delta edits—fixing only the failing line rather than regenerating the entire file."*

**Q2: What if the developer has sensitive API keys in their console error?**
> *Answer: "Security is built-in by design. Our client-side privacy shield uses regular expression masking to scrub Bearer tokens, JWT headers, and cloud keys before any text ever leaves the user's machine."*

**Q3: How will you test that the chatbot actually works?**
> *Answer: "We're curating a benchmark suite of 100 real-world frontend bugs from open-source repositories (React, Next.js, and Vanilla JS). We will score the bot on resolution accuracy, time to fix, and code validity."*
