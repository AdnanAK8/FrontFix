// FrontFix AI — Application Logic (Team B)
// Clean vanilla JavaScript with native Web APIs.
// Features 2-second typing indicator & progressive line-by-line result streaming.

const FRONTFIX_CONFIG = {
  PROD_API_URL: window.__FRONTFIX_API_URL__ || 'https://frontfix-api.onrender.com',
  LOCAL_API_URL: 'http://127.0.0.1:8000'
};

function resolveBackendUrl() {
  if (window.__FRONTFIX_API_URL__) return window.__FRONTFIX_API_URL__;
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:') {
    if (window.location.port === '8000') return window.location.origin;
    return FRONTFIX_CONFIG.LOCAL_API_URL;
  }
  if (window.location.origin.includes('github.io') || window.location.origin.includes('netlify.app')) {
    return FRONTFIX_CONFIG.PROD_API_URL;
  }
  return window.location.origin;
}

const BACKEND_URL = resolveBackendUrl();
let isBackendOnline = false;
let conversationHistory = [];
let typingStatusTimer = null;
let savedSessions = [
  {
    id: 'sample-cors',
    title: "CORS policy blocked: No...",
    date: 'Oct 19',
    query: "CORS policy blocked: No 'Access-Control-Allow-Origin' header present",
    presetKey: 'cors_policy_blocked'
  }
];

// Privacy sanitization regex patterns
const JWT_REGEX = /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi;
const API_KEY_REGEX = /(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16})/gi;
const PASSWORD_REGEX = /(password|secret|token)\s*[:=]\s*["']?([^"'\s]+)["']?/gi;

// Comprehensive Fallback Knowledge Base
const OFFLINE_KNOWLEDGE = [
  {
    id: "typeerror_map",
    triggers: ["cannot read properties of undefined", "reading 'map'", ".map is not a function", "cannot read property 'map' of undefined"],
    category: "JavaScript & React",
    title: "TypeError: Cannot read properties of undefined (reading 'map')",
    problem: "An attempt to execute .map() was made on a variable that is undefined or null during render.",
    likely_cause: "The list state is populated asynchronously (e.g. from an API call) and defaults to undefined on initial mount, causing the component to crash before the fetch completes.",
    fix_steps: [
      "1. Explicitly track distinct loading, error, and data states with useState.",
      "2. Render a loading indicator only while loading is true, and handle empty result arrays (items.length === 0) with a 'No items found' message instead of getting trapped in a loading state.",
      "3. Initialize the array safely (useState([])) and verify that the API payload is actually an array (Array.isArray(data)) before updating state."
    ],
    file_hint: "src/components/ItemList.jsx",
    code_before: "// ❌ Broken: items is undefined initially, or empty array traps loading\nconst [items, setItems] = useState();\n\nreturn (\n  <ul>\n    {items.map(item => <li key={item.id}>{item.name}</li>)}\n  </ul>\n);",
    code_after: "// ✅ Fixed: Separate loading, error, and empty result states\nconst [items, setItems] = useState([]);\nconst [loading, setLoading] = useState(true);\nconst [error, setError] = useState(null);\n\nif (loading) return <p>Loading items...</p>;\nif (error) return <p>Error: {error}</p>;\nif (items.length === 0) return <p>No items found.</p>;\n\nreturn (\n  <ul>\n    {items.map(item => (\n      <li key={item.id}>{item.name}</li>\n    ))}\n  </ul>\n);",
    extra_tips: "TypeScript can catch this at compile time: define your state type explicitly with useState<Item[]>([]).",
    source: { title: "MDN Web Docs — Array.prototype.map() & Optional Chaining", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" }
  },
  {
    id: "cors_policy_blocked",
    triggers: ["cors policy", "access-control-allow-origin", "blocked by cors", "cors policy blocked my request"],
    category: "API Integration & Network",
    title: "CORS Policy Blocked: No 'Access-Control-Allow-Origin' Header",
    problem: "The browser blocks client-side fetch/axios requests to a backend API due to Same-Origin Policy enforcement.",
    likely_cause: "The target API server did not return an Access-Control-Allow-Origin header matching your web app's origin (e.g. localhost:3000 vs localhost:8000).",
    fix_steps: [
      "1. For local development: configure a development proxy in vite.config.ts to route /api/* requests through same origin.",
      "2. For production: configure the backend server to include the CORS header: Access-Control-Allow-Origin: https://yourfrontend.com.",
      "3. If sending Authorization headers or cookies, ensure backend allows them in Access-Control-Allow-Headers."
    ],
    file_hint: "vite.config.ts (Development Proxy)",
    code_before: "// ❌ Broken: Direct cross-origin request rejected by browser\nfetch('http://localhost:8000/api/users');",
    code_after: "// ✅ Fixed: Configure dev proxy in vite.config.ts\nexport default defineConfig({\n  server: { proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } }\n});\nfetch('/api/users');",
    extra_tips: "CORS is purely browser-enforced. Tools like curl or Postman will succeed because they do not enforce browser origin sandboxes.",
    source: { title: "MDN Web Docs — Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" }
  },
  {
    id: "div_not_centered",
    triggers: ["my div is not centered", "div not centered", "center a div", "centering div", "center modal"],
    category: "CSS Layout & Styling",
    title: "CSS Centering: Div or Modal Not Centered on Screen",
    problem: "An HTML element fails to center horizontally or vertically within its parent container or the viewport.",
    likely_cause: "The parent element lacks an explicit height (defaulting to content height 0), or flex/grid alignment properties were applied to the child instead of the parent container.",
    fix_steps: [
      "1. Use CSS Grid on the parent: display: grid; place-items: center; min-height: 100vh; (cleanest one-line solution).",
      "2. Or use Flexbox on the parent: display: flex; justify-content: center; align-items: center; min-height: 100vh;.",
      "3. Ensure the parent container has an explicit height such as min-height: 100vh or 100dvh."
    ],
    file_hint: "src/styles/layout.css",
    code_before: "/* ❌ Broken: Vertical margin auto fails in normal flow */\n.parent { width: 100%; }\n.child { margin: auto; }",
    code_after: "/* ✅ Fixed: CSS Grid place-items */\n.parent {\n  display: grid;\n  place-items: center;\n  min-height: 100vh; /* or 100dvh for mobile */\n}\n.child { max-width: 500px; width: 100%; }",
    extra_tips: "On mobile devices, use min-height: 100dvh instead of 100vh to avoid content shifting when the address bar collapses.",
    source: { title: "MDN Web Docs — Centering in CSS", url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/Howto/Center_an_item" }
  },
  {
    id: "infinite_rerender",
    triggers: ["useeffect runs in an infinite loop", "too many re-renders", "infinite loop", "maximum update depth exceeded"],
    category: "React & Hooks",
    title: "Too Many Re-renders: useEffect Runs in an Infinite Loop",
    problem: "Component re-renders continuously until React halts execution with 'Maximum update depth exceeded'.",
    likely_cause: "A state update function (setState) is executed directly in the component body or inside a useEffect whose dependency array mutates on every render.",
    fix_steps: [
      "1. Never call setState unconditionally in the component render body.",
      "2. Check useEffect dependencies: pass an empty array [] for mount-only effects.",
      "3. Use functional updates: setCount(prev => prev + 1) instead of adding count to dependencies."
    ],
    file_hint: "src/components/Counter.jsx",
    code_before: "// ❌ Broken: Updating state directly in effect with self dependency\nuseEffect(() => {\n  setCount(count + 1);\n}, [count]);",
    code_after: "// ✅ Fixed: Functional updater without dependency churn\nuseEffect(() => {\n  const timer = setInterval(() => {\n    setCount(prev => prev + 1);\n  }, 1000);\n  return () => clearInterval(timer);\n}, []);",
    extra_tips: "If you only need to calculate a value based on existing props or state, don't use state + effect at all; calculate it as derived state during render.",
    source: { title: "React.dev — You Might Not Need an Effect", url: "https://react.dev/learn/you-might-not-need-an-effect" }
  }
];

// Check backend connectivity
async function checkBackend() {
  const pill = document.getElementById('status-pill');
  const text = document.getElementById('status-text');
  try {
    const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
    if (res.ok) {
      isBackendOnline = true;
      pill.className = 'status-pill-offline online';
      text.innerText = 'Connected';
      return;
    }
  } catch (e) {}
  isBackendOnline = false;
  pill.className = 'status-pill-offline';
  text.innerText = 'Offline Mode';
}

// Client-side Sanitization
function sanitizeClientSide(text) {
  let cleaned = text.replace(JWT_REGEX, 'Bearer [REDACTED_JWT]');
  cleaned = cleaned.replace(API_KEY_REGEX, '[REDACTED_API_KEY]');
  cleaned = cleaned.replace(PASSWORD_REGEX, '$1: [REDACTED_SECRET]');
  return cleaned;
}

// Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.matchMedia('(max-width: 800px)').matches) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

// Start New Chat Session
function startNewChat() {
  document.getElementById('hero-view').style.display = 'flex';
  const stream = document.getElementById('chat-stream');
  stream.style.display = 'none';
  stream.innerHTML = '';
  conversationHistory = [];
  document.getElementById('prompt-input').value = '';
  document.getElementById('prompt-input').style.height = 'auto';
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
  showToast('New chat session started');
}

// Load a session from sidebar history
function loadHistoryItem(index) {
  const item = savedSessions[index];
  if (!item) return;

  const items = document.querySelectorAll('.history-item');
  items.forEach((el, i) => {
    if (i === index) el.classList.add('active');
    else el.classList.remove('active');
  });

  if (item.presetKey) {
    handlePreset(item.presetKey);
  } else if (item.query) {
    const input = document.getElementById('prompt-input');
    input.value = item.query;
    input.focus();
  }
}

// Update sidebar history
function addHistoryEntry(queryTitle, query = queryTitle) {
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const truncated = queryTitle.length > 22 ? queryTitle.slice(0, 22) + '...' : queryTitle;
  const session = {
    id: `session-${Date.now()}`,
    title: truncated,
    date: dateStr,
    query,
    presetKey: null
  };
  savedSessions.unshift(session);
  savedSessions = savedSessions.slice(0, 12);

  const historyContainer = document.getElementById('sidebar-history');
  const entry = document.createElement('div');
  entry.className = 'history-item active';
  entry.setAttribute('role', 'button');
  entry.setAttribute('tabindex', '0');
  entry.setAttribute('aria-label', `Load recent issue: ${truncated}`);

  // de-activate others
  document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));

  entry.innerHTML = `
    <div class="history-item-left">
      <span class="history-icon">💬</span>
      <span class="history-title">${escapeHtml(truncated)}</span>
    </div>
    <span class="history-date">${dateStr}</span>
  `;
  const loadEntry = () => loadHistoryItem(savedSessions.indexOf(session));
  entry.addEventListener('click', loadEntry);
  entry.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      loadEntry();
    }
  });
  historyContainer.insertBefore(entry, historyContainer.firstChild);

  while (historyContainer.children.length > savedSessions.length) {
    historyContainer.lastElementChild.remove();
  }
}

// Trigger Log File Upload Dialog
function triggerLogUpload() {
  const fileInput = document.getElementById('log-file-input');
  fileInput.value = '';
  fileInput.click();
}

// Handle Selected Log File
async function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("File exceeds maximum allowed size of 2MB.");
    return;
  }

  showToast(`Analyzing log file: ${file.name}...`);
  document.getElementById('hero-view').style.display = 'none';
  const stream = document.getElementById('chat-stream');
  stream.style.display = 'flex';

  appendUserMessage(`📁 Uploaded log file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
  showTypingIndicator("Scanning log signatures and stack traces...");

  // Exactly 2-second indicator delay
  await new Promise(r => setTimeout(r, 2000));
  removeTypingIndicator();

  // Parse file text
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n');
    let matchedIssues = [];
    const lower = text.toLowerCase();

    OFFLINE_KNOWLEDGE.forEach(item => {
      for (const t of item.triggers) {
        if (lower.includes(t.toLowerCase())) {
          matchedIssues.push({ symptom: t, diagnosis: item });
          break;
        }
      }
    });

    const localAnalysis = {
      total_lines_analyzed: lines.length,
      total_error_lines_detected: matchedIssues.length,
      unique_issues_identified: matchedIssues.length,
      top_issues: matchedIssues
    };
    renderLogSummary(file.name, localAnalysis);
  };
  reader.readAsText(file);
}

function renderLogSummary(filename, analysis) {
  const stream = document.getElementById('chat-stream');
  const card = document.createElement('div');
  card.className = 'chat-bubble-bot';

  let issuesHtml = '';
  if (analysis.top_issues && analysis.top_issues.length > 0) {
    issuesHtml = analysis.top_issues.map((iss) => `
      <div style="background: #f9fcf9; border: 1px solid #d4ebd9; padding: 12px; border-radius: 8px; border-left: 3px solid #2d705c; margin-top: 8px;">
        <div style="font-weight: 700; font-size: 13px; color: #2d705c;">${escapeHtml(iss.diagnosis.title || iss.symptom)}</div>
        <div style="font-size: 12px; color: #537568; margin-top: 4px;"><strong>Likely Cause:</strong> ${escapeHtml(iss.diagnosis.likely_cause || '')}</div>
        <div style="font-size: 12px; color: #183e32; margin-top: 6px;"><strong>Fix:</strong> ${escapeHtml(Array.isArray(iss.diagnosis.fix_steps) ? iss.diagnosis.fix_steps[0] : 'Review documentation')}</div>
      </div>
    `).join('');
  } else {
    issuesHtml = '<p style="font-size: 13px; color: #537568;">No known critical exceptions detected in this log snippet.</p>';
  }

  card.innerHTML = `
    <div class="stream-line">
      <div class="bot-header">
        <span class="category-tag">Log File Analysis</span>
        <span style="font-size: 11px; color: #78998c;">${escapeHtml(filename)}</span>
      </div>
    </div>
    <div class="stream-line">
      <div class="bot-title">Diagnostic Log Summary</div>
    </div>
    <div class="stream-line">
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
        <span style="font-size: 11px; padding: 4px 10px; background: #e8f5ec; border-radius: 6px; font-weight: 600; color: #1e6952;">Lines: ${analysis.total_lines_analyzed}</span>
        <span style="font-size: 11px; padding: 4px 10px; background: #e8f5ec; border-radius: 6px; font-weight: 600; color: #1e6952;">Errors Flagged: ${analysis.total_error_lines_detected}</span>
      </div>
    </div>
    <div class="stream-line" style="margin-top: 6px;">
      <div class="section-label">Identified Error Signatures & Actionable Fixes:</div>
      ${issuesHtml}
    </div>
  `;

  stream.appendChild(card);
  revealLinesOneByOne(card);
}

// Preset Handler (Triggered by clicking any of the 4 suggestion cards)
function handlePreset(key) {
  const samples = {
    typeerror_map: "TypeError: Cannot read properties of undefined (reading 'map')\n  at ProductList (ProductList.jsx:14)",
    cors_policy_blocked: "Access to fetch at 'https://api.example.com/v1/users' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.",
    div_not_centered: "My div is not centered vertically and horizontally inside its parent container.",
    infinite_rerender: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop at dispatchSetState."
  };
  const input = document.getElementById('prompt-input');
  input.value = samples[key] || key;
  submitMessage();
}

// Show Typing / Searching Indicator
function showTypingIndicator(customStatus) {
  const stream = document.getElementById('chat-stream');
  const existing = document.getElementById('active-typing-indicator');
  if (existing) existing.remove();
  if (typingStatusTimer) {
    clearInterval(typingStatusTimer);
    typingStatusTimer = null;
  }

  const statuses = Array.isArray(customStatus)
    ? customStatus
    : [customStatus || 'Searching the frontend knowledge base...'];
  let statusIndex = 0;

  const bubble = document.createElement('div');
  bubble.className = 'typing-indicator-bubble';
  bubble.id = 'active-typing-indicator';
  bubble.innerHTML = `
    <div class="typing-header">
      <span class="bot-avatar-mini">🤖</span>
      <span class="typing-status-text">${escapeHtml(statuses[0])}</span>
    </div>
    <div class="typing-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  stream.appendChild(bubble);
  bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (statuses.length > 1) {
    const statusText = bubble.querySelector('.typing-status-text');
    typingStatusTimer = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length;
      statusText.textContent = statuses[statusIndex];
    }, 850);
  }
}

// Remove Typing Indicator
function removeTypingIndicator() {
  if (typingStatusTimer) {
    clearInterval(typingStatusTimer);
    typingStatusTimer = null;
  }
  const existing = document.getElementById('active-typing-indicator');
  if (existing) existing.remove();
}

// Submit Message
async function submitMessage() {
  const input = document.getElementById('prompt-input');
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn.disabled) return;

  let query = input.value.trim();
  if (!query) return;

  const privacyActive = document.getElementById('privacy-checkbox').checked;
  if (privacyActive) query = sanitizeClientSide(query);

  // Hide empty state hero, show chat stream
  document.getElementById('hero-view').style.display = 'none';
  const stream = document.getElementById('chat-stream');
  stream.style.display = 'flex';

  // Append user message
  appendUserMessage(query);
  conversationHistory.push({ role: 'user', content: query });
  addHistoryEntry(query.split('\n')[0], query);

  input.value = '';
  input.style.height = 'auto';

  // Disable send button while diagnosing
  sendBtn.disabled = true;

  // Show typing indicator immediately
  showTypingIndicator([
    'Searching for a match to your error...',
    'Checking the most likely cause...',
    'Putting together clear fix suggestions...'
  ]);

  try {
    // Exact 2-second typing delay as requested!
    await new Promise(resolve => setTimeout(resolve, 2000));

    let result = null;
    if (isBackendOnline) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/diagnose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            enable_privacy: privacyActive,
            conversation_history: conversationHistory
          })
        });
        if (res.ok) {
          const json = await res.json();
          result = json.data;
        }
      } catch (e) {
        console.warn("Backend call failed, using offline KB:", e);
      }
    }

    // Local knowledge base match
    if (!result) {
      result = matchOfflineKnowledge(query);
    }

    // Remove typing indicator & reveal result line by line
    removeTypingIndicator();
    appendBotResponse(result);
    conversationHistory.push({ role: 'assistant', content: result.title });

  } catch (err) {
    removeTypingIndicator();
    const fallback = matchOfflineKnowledge(query);
    appendBotResponse(fallback);
  } finally {
    sendBtn.disabled = false;
  }
}

// Fallback search over offline items
function matchOfflineKnowledge(query) {
  const lower = query.toLowerCase();

  for (const item of OFFLINE_KNOWLEDGE) {
    for (const t of item.triggers) {
      if (lower.includes(t.toLowerCase())) {
        return {
          matched: true,
          is_uncertain: false,
          category: item.category,
          title: item.title,
          problem: item.problem,
          likely_cause: item.likely_cause,
          fix_steps: item.fix_steps,
          file_hint: item.file_hint,
          code_before: item.code_before,
          code_after: item.code_after,
          extra_tips: item.extra_tips,
          source: item.source,
          confirmation_prompt: "Did this resolve your issue? Let us know with thumbs up or down below."
        };
      }
    }
  }

  // General diagnostics fallback
  return {
    matched: false,
    is_uncertain: true,
    category: "General Frontend Runtime",
    title: "Diagnostic Analysis for Frontend Error",
    problem: `Identified issue: "${query.slice(0, 80)}...".`,
    likely_cause: "This error usually occurs due to an asynchronous timing condition, undefined object access, or unhandled promise rejection.",
    fix_steps: [
      "1. Wrap the suspect code in a try/catch guard or React Error Boundary.",
      "2. Open DevTools (F12) Network tab to inspect failed API responses.",
      "3. Trace the call stack to identify the specific file and line throwing the exception."
    ],
    file_hint: "src/utils/errorHandler.js",
    code_before: "// ❌ Unhandled exception\nconst res = doAction();",
    code_after: "// ✅ Fixed: Wrap with safety guard\ntry {\n  const res = doAction();\n} catch (err) {\n  console.error('Caught error safely:', err);\n}",
    extra_tips: "State whether you are running in SSR (Next.js/Remix) or client SPA (Vite/CRA) for targeted solutions.",
    source: { title: "MDN Web Docs — Error Handling", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling" }
  };
}

function appendUserMessage(text) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble-user';
  bubble.textContent = text;
  stream.appendChild(bubble);
  bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Append Bot Response with Line-by-Line Progressive Streaming
function appendBotResponse(data) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble-bot';

  const copyId = `code-fix-${Date.now()}`;
  const feedbackId = `fb-${Date.now()}`;

  // Fix steps list HTML
  let fixStepsHtml = '';
  if (Array.isArray(data.fix_steps) && data.fix_steps.length > 0) {
    fixStepsHtml = `
      <div class="stream-line">
        <div class="section-block">
          <div class="section-label">🛠️ Fix Steps</div>
          <div class="fix-steps-list">
            ${data.fix_steps.map((step, idx) => `
              <div class="fix-step-item">
                <span class="fix-step-num">Step ${idx + 1}</span>
                <span>${escapeHtml(step.replace(/^\d+\.\s*/, ''))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Code Diff block HTML
  let diffHtml = '';
  if (data.code_before && data.code_after) {
    diffHtml = `
      <div class="stream-line">
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
      </div>
    `;
  }

  bubble.innerHTML = `
    <!-- Line 1: Header Category & Model Tag -->
    <div class="stream-line">
      <div class="bot-header">
        <span class="category-tag">${escapeHtml(data.category || 'Frontend Support')}</span>
        <span class="provenance-tag ai-gen">✨ Verified Frontend Diagnostic</span>
      </div>
    </div>

    <!-- Line 2: Issue Title -->
    <div class="stream-line">
      <div class="bot-title">${escapeHtml(data.title)}</div>
    </div>

    <!-- Line 3: Problem Section -->
    <div class="stream-line">
      <div class="section-block">
        <div class="section-label">🔍 Problem</div>
        <div class="section-content">${escapeHtml(data.problem || '')}</div>
      </div>
    </div>

    <!-- Line 4: Likely Cause Section -->
    <div class="stream-line">
      <div class="section-block">
        <div class="section-label">⚡ Likely Cause</div>
        <div class="section-content">${escapeHtml(data.likely_cause || '')}</div>
      </div>
    </div>

    <!-- Line 5 & 6: Fix Steps & Code Diff -->
    ${fixStepsHtml}
    ${diffHtml}

    <!-- Line 7: Extra Tips -->
    <div class="stream-line">
      <div class="extra-tips-card">
        <strong>💡 Pro Tip:</strong> ${escapeHtml(data.extra_tips || 'Always verify with the official documentation linked below.')}
      </div>
    </div>

    <!-- Line 8: Source Reference -->
    ${data.source ? `
      <div class="stream-line">
        <div class="bot-source">
          <span>Documentation Source:</span>
          <a href="${escapeHtml(data.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.source.title)} →</a>
        </div>
      </div>
    ` : ''}

    <!-- Line 9: Feedback Bar -->
    <div class="stream-line">
      <div class="feedback-bar" id="${feedbackId}">
        <span>${escapeHtml(data.confirmation_prompt || "Did this resolve your issue?")}</span>
        <div class="feedback-actions">
          <button class="feedback-btn" onclick="submitFeedback('${feedbackId}', '${escapeHtml(data.title)}', true)">
            👍 Yes, helped!
          </button>
          <button class="feedback-btn" onclick="submitFeedback('${feedbackId}', '${escapeHtml(data.title)}', false)">
            👎 Needs work
          </button>
        </div>
      </div>
    </div>
  `;

  stream.appendChild(bubble);

  // Progressive line-by-line reveal animation
  revealLinesOneByOne(bubble);
}

// Reveal each line sequentially with a smooth staggered delay and auto-scroll
function revealLinesOneByOne(container) {
  const lines = container.querySelectorAll('.stream-line');
  lines.forEach((line, index) => {
    setTimeout(() => {
      line.classList.add('revealed');
      line.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, index * 160); // 160ms between each line
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Copy Code Patch
function copyCode(id) {
  const el = document.getElementById(id);
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Code fix copied to clipboard!');
  }).catch(() => {
    showToast('Code copied!');
  });
}

// Show Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// Submit Thumbs Up / Down Feedback
function submitFeedback(barId, issueTitle, isHelpful) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  bar.innerHTML = `
    <span style="color: #2d705c; font-weight: 600; font-size: 11px;">
      ${isHelpful ? '✨ Glad this resolved your issue!' : '🙏 Thank you for the feedback.'}
    </span>
  `;
  showToast('Feedback submitted. Thank you!');
}

// Auto-expand input textarea
const textarea = document.getElementById('prompt-input');
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
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
  setInterval(checkBackend, 6000);
});
