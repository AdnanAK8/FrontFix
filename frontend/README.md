# FrontendFix AI — React frontend

Vite + React port of the original vanilla-JS frontend. Same UI, same behaviour, split into components.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Backend: expects `POST /api/diagnose` at `http://127.0.0.1:8000` in dev (see `src/config.js`).
If the backend is unreachable the app falls back to the offline knowledge base in `src/data/knowledgeBase.js`.

## Structure

```
src/
  App.jsx                 composes components only
  hooks/useChat.js        chat state + actions (send, upload, sessions)
  config.js               backend URL resolution
  components/             Sidebar, Header, HeroView, SuggestionCard, ChatStream,
                          UserMessage, BotMessage (+ EvidenceBox, DiffBlock, FeedbackBar),
                          LogSummary, TypingIndicator, StreamLine, InputDock, Toast, Icons
  hooks/                  useBackendStatus, useToast
  data/                   knowledgeBase, presets
  utils/                  sanitize (privacy shield), diagnose (offline matching + log analysis)
  styles/index.css        original stylesheet, unchanged
```
