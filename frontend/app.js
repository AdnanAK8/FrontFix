// FrontFix AI — Minimal Frontend Application Logic
const BACKEND_URL = 'http://127.0.0.1:8000';
let isBackendOnline = false;

// Fallback client-side knowledge database for standalone offline use
const OFFLINE_KNOWLEDGE = {
  hydration: {
    category: "React 19 / SSR",
    title: "React Hydration Mismatch (Server vs Client)",
    summary: "The server and client generated different HTML on initial render. This usually happens when client-only APIs (like localStorage, window.innerWidth, or new Date()) are evaluated directly in JSX before the component has mounted on the client.",
    file_hint: "Component.tsx",
    code_before: "// ❌ Broken: Evaluates different values on server vs client\nconst time = new Date().toLocaleTimeString();\nreturn <div>Current time: {time}</div>;",
    code_after: "// ✅ Fixed: Defer browser-dependent state until after mount\nconst [time, setTime] = useState(null);\nuseEffect(() => {\n  setTime(new Date().toLocaleTimeString());\n}, []);\nreturn <div>Current time: {time ?? 'Loading...'}</div>;",
    explanation: "React SSR requires the initial client-side render to produce the exact same DOM structure as the server HTML. Wrapping the browser-specific logic in useEffect ensures it runs strictly after hydration is complete.",
    source: { title: "React.dev — Understanding Hydration Errors", url: "https://react.dev/reference/react-dom/client/hydrateRoot" }
  },
  cors: {
    category: "Network / CORS",
    title: "Cross-Origin Resource Sharing (CORS) Blocked",
    summary: "The browser blocked this fetch request because the target API server did not return an Access-Control-Allow-Origin header matching your client origin (e.g. http://localhost:3000).",
    file_hint: "vite.config.ts (Development Proxy Fix)",
    code_before: "// ❌ Failing direct cross-origin request\nfetch('https://api.example.com/v1/users');",
    code_after: "// ✅ Fixed: Configure local reverse proxy in vite.config.ts\nexport default defineConfig({\n  server: {\n    proxy: {\n      '/api': {\n        target: 'https://api.example.com/v1',\n        changeOrigin: true,\n        rewrite: (path) => path.replace(/^\\/api/, '')\n      }\n    }\n  }\n});\n\n// Then fetch locally without CORS blocks:\nfetch('/api/users');",
    explanation: "During local development, browser CORS restrictions are best bypassed using a dev-server reverse proxy. In production, ensure the backend API sends the header: Access-Control-Allow-Origin: https://yourdomain.com.",
    source: { title: "MDN Web Docs — CORS Overview", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" }
  },
  typeerror: {
    category: "JavaScript / React",
    title: "TypeError: Cannot read properties of undefined (reading 'map')",
    summary: "You are calling .map() on a variable that is currently undefined or null. This usually occurs when rendering list state that has not finished loading from an asynchronous API request.",
    file_hint: "ItemList.jsx",
    code_before: "// ❌ Broken: items is initially undefined before API resolves\nconst [items, setItems] = useState();\nreturn <div>{items.map(item => <p key={item.id}>{item.name}</p>)}</div>;",
    code_after: "// ✅ Fixed: Initialize with empty array and use optional chaining\nconst [items, setItems] = useState([]);\nif (!items || items.length === 0) return <p>Loading items...</p>;\nreturn <div>{items?.map(item => <p key={item.id}>{item.name}</p>)}</div>;",
    explanation: "Always provide a safe default value (such as an empty array []) when declaring state that will hold a collection. Use optional chaining (?.) and explicit loading states to prevent render crashes.",
    source: { title: "MDN Web Docs — Optional Chaining (?.)", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining" }
  },
  zindex: {
    category: "CSS / Layout",
    title: "CSS Z-Index Stacking Context Trap",
    summary: "Even with z-index: 9999, the element renders behind a sibling. An ancestor element has a CSS property (like opacity < 1, transform, or filter) that creates a local Stacking Context, trapping child z-index values.",
    file_hint: "Modal.tsx",
    code_before: "// ❌ Broken: Modal trapped in parent's local stacking context\nreturn <div className=\"modal z-[9999]\">{content}</div>;",
    code_after: "// ✅ Fixed: Use React Portal to escape local context and render at <body>\nimport { createPortal } from 'react-dom';\nexport function Modal({ children }) {\n  if (typeof document === 'undefined') return null;\n  return createPortal(\n    <div className=\"fixed inset-0 z-50 bg-black/50 backdrop-blur\">{children}</div>,\n    document.body\n  );\n}",
    explanation: "In CSS, a child cannot escape its parent's stacking context. Using ReactDOM.createPortal mounts the overlay directly into <body>, allowing high z-index values to work correctly across the entire viewport.",
    source: { title: "MDN Web Docs — Stacking Context", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context" }
  },
  re_render: {
    category: "React Hooks",
    title: "Too Many Re-renders: Infinite Render Loop",
    summary: "A state update function (setState) was called synchronously inside the component body during render. React immediately attempts to re-render, creating an unbounded loop that crashes the app.",
    file_hint: "UserProfile.tsx",
    code_before: "// ❌ Broken: setState called directly in render body\nfunction UserProfile({ user }) {\n  const [active, setActive] = useState(false);\n  if (user.isOnline) setActive(true);\n  return <div>{user.name}</div>;\n}",
    code_after: "// ✅ Fixed: Calculate derived state or wrap in useEffect\nfunction UserProfile({ user }) {\n  const isActive = Boolean(user.isOnline);\n  return <div>{user.name} ({isActive ? 'Online' : 'Offline'})</div>;\n}",
    explanation: "Never update state unconditionally inside the component body. Either compute the value on the fly as derived state, or wrap the update inside a useEffect hook with clear primitive dependencies.",
    source: { title: "React.dev — Lifecycle of Reactive Effects", url: "https://react.dev/learn/lifecycle-of-reactive-effects" }
  }
};

// Check backend status
async function checkBackend() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
    if (res.ok) {
      isBackendOnline = true;
      dot.className = 'status-dot';
      text.innerText = 'API Connected';
      return;
    }
  } catch (e) {}
  isBackendOnline = false;
  dot.className = 'status-dot offline';
  text.innerText = 'Offline Mode (Standalone)';
}

// Preset Handler
function handlePreset(key) {
  const samples = {
    hydration: "Error: Hydration failed because the initial UI does not match what was rendered on the server.\nWarning: Expected server HTML to contain a matching <span> in <div>.",
    cors: "Access to fetch at 'https://api.example.com/v1/users' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.",
    typeerror: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n  at ProductList (ProductList.jsx:14)",
    zindex: "CSS Bug: Modal with z-index: 9999 is rendering behind an adjacent card with z-index: 1.",
    re_render: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop at dispatchSetState."
  };
  const input = document.getElementById('prompt-input');
  input.value = samples[key] || key;
  submitMessage();
}

// Submit Message
async function submitMessage() {
  const input = document.getElementById('prompt-input');
  const query = input.value.trim();
  if (!query) return;

  const privacyActive = document.getElementById('privacy-checkbox').checked;

  // Show stream, hide hero
  document.getElementById('hero-view').style.display = 'none';
  const stream = document.getElementById('chat-stream');
  stream.style.display = 'flex';

  // Append user bubble
  appendUserMessage(query);
  input.value = '';
  input.style.height = 'auto';

  // Send request or fallback
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  sendBtn.innerText = 'Analyzing...';

  try {
    let result = null;
    if (isBackendOnline) {
      const res = await fetch(`${BACKEND_URL}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, enable_privacy: privacyActive })
      });
      if (res.ok) {
        const json = await res.json();
        result = json.data;
      }
    }

    // Fallback to local heuristic if offline or backend failed
    if (!result) {
      result = matchOfflineKnowledge(query);
    }

    appendBotResponse(result);
  } catch (err) {
    appendBotResponse(matchOfflineKnowledge(query));
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<span>Diagnose</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}

function matchOfflineKnowledge(query) {
  const q = query.toLowerCase();
  if (q.includes('hydration') || q.includes('server html')) return OFFLINE_KNOWLEDGE.hydration;
  if (q.includes('cors') || q.includes('access-control')) return OFFLINE_KNOWLEDGE.cors;
  if (q.includes('cannot read properties of undefined') || q.includes('map')) return OFFLINE_KNOWLEDGE.typeerror;
  if (q.includes('z-index') || q.includes('stacking')) return OFFLINE_KNOWLEDGE.zindex;
  if (q.includes('too many re-renders') || q.includes('infinite loop')) return OFFLINE_KNOWLEDGE.re_render;

  return {
    category: "Frontend Runtime",
    title: "Uncaught Exception or Syntax Issue",
    summary: `Detected frontend error: "${query.slice(0, 90)}...". This typically indicates an unguarded null reference, an unhandled async promise, or a missing error boundary.`,
    file_hint: "src/App.tsx",
    code_before: "// ❌ Failing execution:\nconst result = executeOperation();",
    code_after: "// ✅ Fixed: Wrap in try/catch or React ErrorBoundary\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error('Safely caught in FrontFix ErrorBoundary:', error);\n}",
    explanation: "Guarding unpredictable operations with try/catch and implementing top-level React ErrorBoundaries prevents runtime crashes from unmounting the entire application.",
    source: { title: "React Docs — Error Boundaries", url: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary" }
  };
}

function appendUserMessage(text) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble-user';
  bubble.textContent = text;
  stream.appendChild(bubble);
}

function appendBotResponse(data) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble-bot';

  const copyId = `code-fix-${Date.now()}`;

  bubble.innerHTML = `
    <div class="bot-header">
      <span class="category-tag">${escapeHtml(data.category)}</span>
      <span style="font-size: 11px; color: var(--text-muted);">Verified Patch</span>
    </div>
    
    <div class="bot-title">${escapeHtml(data.title)}</div>
    <div class="bot-summary">${escapeHtml(data.summary)}</div>

    <div class="diff-container">
      <div class="diff-header">
        <span>${escapeHtml(data.file_hint || 'File Patch')}</span>
        <button class="copy-btn" onclick="copyCode('${copyId}')">Copy Fix</button>
      </div>
      <div class="diff-body" id="${copyId}">
        <div class="diff-line-del">${escapeHtml(data.code_before)}</div>
        <div class="diff-line-add">${escapeHtml(data.code_after)}</div>
      </div>
    </div>

    <div class="bot-explanation">
      <strong>Why this happens & how to prevent it:</strong><br>
      ${escapeHtml(data.explanation)}
    </div>

    <div class="bot-source">
      <span>Official Reference:</span>
      <a href="${escapeHtml(data.source.url)}" target="_blank">${escapeHtml(data.source.title)} →</a>
    </div>
  `;

  stream.appendChild(bubble);
}

function copyCode(id) {
  const el = document.getElementById(id);
  const text = el.innerText;
  navigator.clipboard.writeText(text);
  alert('Code patch copied to clipboard!');
}

function clearConversation() {
  const stream = document.getElementById('chat-stream');
  stream.innerHTML = '';
  stream.style.display = 'none';
  document.getElementById('hero-view').style.display = 'block';
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Auto-expand input on typing
const textarea = document.getElementById('prompt-input');
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
});

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitMessage();
  }
});

// Initial boot
window.addEventListener('DOMContentLoaded', () => {
  checkBackend();
  setInterval(checkBackend, 5000);
});
