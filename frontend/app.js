// FrontFix AI — Frontend Application Logic (Team B)
// ponytail: Clean vanilla JavaScript with native Web APIs (Fetch, FileReader, Clipboard). Zero bulky runtime frameworks.

// ponytail: Auto-detect origin when served via FastAPI /ui, fallback to local backend port 8000
const BACKEND_URL = (window.location.origin && window.location.origin.startsWith('http')) 
  ? (window.location.port === '8000' ? window.location.origin : 'http://127.0.0.1:8000') 
  : 'http://127.0.0.1:8000';
let isBackendOnline = false;
let conversationHistory = [];

// Privacy sanitization regex patterns for client-side protection
const JWT_REGEX = /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi;
const API_KEY_REGEX = /(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16})/gi;
const PASSWORD_REGEX = /(password|secret|token)\s*[:=]\s*["']?([^"'\s]+)["']?/gi;

// Comprehensive Fallback Knowledge Base for Offline/Standalone Use
const OFFLINE_KNOWLEDGE = [
  {
    id: "typeerror_map",
    triggers: ["cannot read properties of undefined", "reading 'map'", ".map is not a function", "cannot read property 'map' of undefined"],
    category: "JavaScript & React",
    title: "TypeError: Cannot read properties of undefined (reading 'map')",
    problem: "An attempt to execute .map() was made on a variable that is undefined or null during render.",
    likely_cause: "The list state is populated asynchronously (e.g. from an API call) and defaults to undefined on initial mount, causing the component to crash before the fetch completes.",
    fix_steps: [
      "1. Provide a safe initial state of an empty array: useState([]) instead of useState().",
      "2. Add optional chaining (items?.map(...)) or an explicit guard clause (if (!items) return <Spinner />;).",
      "3. Verify that the API response actually returns an array rather than an object containing the array."
    ],
    file_hint: "src/components/ItemList.jsx",
    code_before: "// ❌ Broken: state starts as undefined\nconst [items, setItems] = useState();\nreturn <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;",
    code_after: "// ✅ Fixed: default to empty array and guard render\nconst [items, setItems] = useState([]);\nif (!items || items.length === 0) return <p>Loading items...</p>;\nreturn <ul>{items?.map(i => <li key={i.id}>{i.name}</li>)}</ul>;",
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
  },
  {
    id: "hydration_mismatch",
    triggers: ["hydration failed", "server html", "did not match what was rendered on the server", "hydration error"],
    category: "React 19 / SSR",
    title: "React Hydration Mismatch (Server vs Client HTML Mismatch)",
    problem: "Next.js or React 18/19 throws an error warning that server-rendered HTML differed from initial client render.",
    likely_cause: "Client-only dynamic values (like localStorage, window.innerWidth, or new Date()) were rendered directly in JSX before component mount.",
    fix_steps: [
      "1. Defer reading browser-only values inside a useEffect hook after initial mount.",
      "2. For static timestamps, render a placeholder or add suppressHydrationWarning={true} to the tag.",
      "3. Verify that your HTML structure is valid (e.g. no <p> wrapping <div>)."
    ],
    file_hint: "src/components/Greeting.tsx",
    code_before: "// ❌ Broken: localStorage differs on server vs client\nconst user = localStorage.getItem('user');\nreturn <div>Welcome {user || 'Guest'}</div>;",
    code_after: "// ✅ Fixed: Wait until mounted\nconst [user, setUser] = useState(null);\nuseEffect(() => {\n  setUser(localStorage.getItem('user'));\n}, []);\nreturn <div>Welcome {user ?? 'Guest'}</div>;",
    extra_tips: "Invalid HTML tags are the second most common hydration trigger. In HTML specs, <p> cannot contain <div>.",
    source: { title: "React.dev — hydrateRoot Reference", url: "https://react.dev/reference/react-dom/client/hydrateRoot" }
  },
  {
    id: "zindex_stacking_trap",
    triggers: ["z-index", "stacking context", "modal behind", "z-index not working"],
    category: "CSS Layout & Styling",
    title: "CSS Z-Index Stacking Context Trap (Element Renders Behind)",
    problem: "An element with high z-index (e.g. 9999) renders behind another element with a lower z-index.",
    likely_cause: "An ancestor element creates an isolated Stacking Context (via opacity < 1, transform, filter, or will-change), trapping child z-index values.",
    fix_steps: [
      "1. Mount modals and overlays directly into document.body using ReactDOM.createPortal.",
      "2. Inspect parent CSS for transform, filter, or opacity < 1.",
      "3. Ensure the element or positioned ancestor has position: relative, absolute, or fixed."
    ],
    file_hint: "src/components/Modal.tsx",
    code_before: "// ❌ Broken: Trapped in parent card's CSS transform\nreturn <div className=\"modal z-[9999]\">{children}</div>;",
    code_after: "// ✅ Fixed: Use React Portal to escape local context\nimport { createPortal } from 'react-dom';\nreturn createPortal(\n  <div className=\"fixed inset-0 z-50 bg-black/50\">{children}</div>,\n  document.body\n);",
    extra_tips: "Use Chrome DevTools 'Layers' panel to visually see 3D stacking contexts.",
    source: { title: "MDN Web Docs — Understanding CSS Stacking Context", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context" }
  },
  {
    id: "flexbox_overflow_ellipsis",
    triggers: ["flexbox overflow", "text-overflow ellipsis not working", "flex child expanding"],
    category: "CSS Layout & Styling",
    title: "Flexbox Child Overflowing Container (text-overflow: ellipsis broken)",
    problem: "A text element inside a flex container refuses to truncate with ellipsis and instead forces the parent to overflow.",
    likely_cause: "By default, flex items have min-width: auto, which prevents them from shrinking below their intrinsic content size.",
    fix_steps: [
      "1. Add min-width: 0; to the flex child element.",
      "2. Ensure the text element has white-space: nowrap; overflow: hidden; text-overflow: ellipsis;.",
      "3. In CSS Grid, use minmax(0, 1fr) instead of 1fr."
    ],
    file_hint: "src/styles/card.css",
    code_before: "/* ❌ Broken: flex item refuses to shrink */\n.flex-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    code_after: "/* ✅ Fixed: Add min-width: 0 */\n.flex-child {\n  min-width: 0; /* Essential fix! */\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}",
    extra_tips: "Apply min-width: 0 down the tree if you have deeply nested flex containers.",
    source: { title: "CSS-Tricks — Flexbox and Truncated Text", url: "https://css-tricks.com/flexbox-truncated-text/" }
  },
  {
    id: "react_missing_key",
    triggers: ["each child in a list should have a unique key prop", "missing key prop", "unique key"],
    category: "React & Hooks",
    title: "Warning: Each child in a list should have a unique 'key' prop",
    problem: "React console displays a warning about missing keys when rendering an array of elements.",
    likely_cause: "Elements rendered inside a .map() loop lack a unique and stable key prop on their outermost JSX element.",
    fix_steps: [
      "1. Add a unique, stable ID from your data (key={item.id}).",
      "2. Avoid using the array index (key={index}) if list items can be reordered, filtered, or deleted.",
      "3. Place the key on the top-most JSX node inside the map callback."
    ],
    file_hint: "src/components/TodoList.jsx",
    code_before: "// ❌ Broken: missing key prop\n{todos.map(todo => <div>{todo.text}</div>)}",
    code_after: "// ✅ Fixed: use stable unique database id\n{todos.map(todo => <div key={todo.id}>{todo.text}</div>)}",
    extra_tips: "Using array index as key causes subtle bugs with input state preservation and animations when items are sorted.",
    source: { title: "React.dev — Rendering Lists", url: "https://react.dev/learn/rendering-lists" }
  },
  {
    id: "form_button_refresh",
    triggers: ["button reloads the page", "form reloads", "prevent default form submit", "preventdefault"],
    category: "HTML & Forms",
    title: "Form Button Reloads Page / Submits on Click",
    problem: "Clicking a button inside a <form> unexpectedly refreshes the page and clears the state.",
    likely_cause: "The HTML standard defines the default type of a <button> inside a <form> as type='submit'.",
    fix_steps: [
      "1. If the button is not meant to submit, add type='button' explicitly.",
      "2. If it is the submit button, attach onSubmit={e => { e.preventDefault(); handleSubmit(); }} to the form.",
      "3. Never rely on button onClick for form submission."
    ],
    file_hint: "src/components/Form.jsx",
    code_before: "// ❌ Broken: Default type is submit, reloads page\n<form><button onClick={handleAction}>Cancel</button></form>",
    code_after: "// ✅ Fixed: Explicitly declare type='button'\n<form onSubmit={e => { e.preventDefault(); onSubmit(); }}>\n  <button type=\"button\" onClick={handleAction}>Cancel</button>\n  <button type=\"submit\">Submit</button>\n</form>",
    extra_tips: "Adding type='button' to secondary buttons prevents accidental form submissions when users hit Enter inside text inputs.",
    source: { title: "MDN Web Docs — The HTML <button> Element", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type" }
  },
  {
    id: "api_404_not_found",
    triggers: ["404 not found", "api 404", "cannot get /api", "status of 404"],
    category: "API Integration & Network",
    title: "HTTP 404 Not Found on API Fetch or SPA Route Refresh",
    problem: "API fetch requests return 404 Not Found, or refreshing the page on SPA routes like /dashboard returns 404.",
    likely_cause: "Either the API endpoint URL has a typo, or the production web server lacks fallback routing to index.html for client-side routing.",
    fix_steps: [
      "1. Inspect the Network tab in DevTools to check the exact requested URL, method, and base path.",
      "2. For API calls: verify trailing slash consistency (/api/users/ vs /api/users).",
      "3. For SPA page refreshes: configure your web server (Nginx or Netlify _redirects) to rewrite all non-file routes to index.html."
    ],
    file_hint: "nginx.conf / _redirects",
    code_before: "// ❌ Nginx without fallback: Direct route returns 404\nlocation / { try_files $uri =404; }",
    code_after: "// ✅ Fixed Nginx configuration for SPAs:\nlocation / { try_files $uri $uri/ /index.html; }\n\n// For Netlify (_redirects in public/):\n/* /index.html 200",
    extra_tips: "Always check whether environment variables like VITE_API_URL are actually defined in your production build.",
    source: { title: "MDN Web Docs — 404 Not Found", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404" }
  }
];

// Check backend connectivity
async function checkBackend() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
    if (res.ok) {
      isBackendOnline = true;
      dot.className = 'status-dot';
      text.innerText = 'API Connected (FastAPI)';
      return;
    }
  } catch (e) {}
  isBackendOnline = false;
  dot.className = 'status-dot offline';
  text.innerText = 'Offline Mode (Standalone)';
}

// Client-side Sanitization
function sanitizeClientSide(text) {
  let cleaned = text.replace(JWT_REGEX, 'Bearer [REDACTED_JWT]');
  cleaned = cleaned.replace(API_KEY_REGEX, '[REDACTED_API_KEY]');
  cleaned = cleaned.replace(PASSWORD_REGEX, '$1: [REDACTED_SECRET]');
  return cleaned;
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

  showToast(`Analyzing log file: ${file.name}...`);
  document.getElementById('hero-view').style.display = 'none';
  const stream = document.getElementById('chat-stream');
  stream.style.display = 'flex';

  appendUserMessage(`📁 Uploaded log file: ${file.name} (${Math.round(file.size / 1024)} KB)`);

  if (isBackendOnline) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BACKEND_URL}/api/upload-log`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const json = await res.json();
        renderLogSummary(json.filename, json.analysis);
        return;
      }
    } catch (err) {
      console.warn("Backend log upload failed, falling back to local reader:", err);
    }
  }

  // Local fallback log parser
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
    issuesHtml = analysis.top_issues.map((iss, i) => `
      <div style="background: rgba(30, 41, 59, 0.4); padding: 12px; border-radius: 8px; border-left: 3px solid var(--accent); margin-top: 8px;">
        <div style="font-weight: 600; font-size: 13px; color: var(--accent);">${escapeHtml(iss.diagnosis.title || iss.symptom)}</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;"><strong>Likely Cause:</strong> ${escapeHtml(iss.diagnosis.likely_cause || iss.diagnosis.summary || '')}</div>
        <div style="font-size: 12px; color: var(--text-primary); margin-top: 6px;"><strong>Fix:</strong> ${escapeHtml(Array.isArray(iss.diagnosis.fix_steps) ? iss.diagnosis.fix_steps[0] : 'Review documentation')}</div>
      </div>
    `).join('');
  } else {
    issuesHtml = '<p style="font-size: 13px; color: var(--text-secondary);">No known critical exceptions detected in this log snippet.</p>';
  }

  card.innerHTML = `
    <div class="bot-header">
      <span class="category-tag">Log File Analysis</span>
      <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(filename)}</span>
    </div>
    <div class="bot-title">Diagnostic Log Summary</div>
    <div class="log-metrics">
      <div class="metric-pill">Lines Analyzed: <strong>${analysis.total_lines_analyzed}</strong></div>
      <div class="metric-pill">Errors Flagged: <strong>${analysis.total_error_lines_detected}</strong></div>
      <div class="metric-pill">Unique Fixes Found: <strong>${analysis.unique_issues_identified}</strong></div>
    </div>
    <div style="margin-top: 8px;">
      <div class="section-label">Identified Error Signatures & Actionable Fixes:</div>
      ${issuesHtml}
    </div>
  `;

  stream.appendChild(card);
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// Preset Handler
function handlePreset(key) {
  const samples = {
    typeerror_map: "TypeError: Cannot read properties of undefined (reading 'map')\n  at ProductList (ProductList.jsx:14)",
    cors_policy_blocked: "Access to fetch at 'https://api.example.com/v1/users' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.",
    div_not_centered: "My div is not centered horizontally or vertically inside its parent container.",
    infinite_rerender: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop at dispatchSetState.",
    hydration_mismatch: "Error: Hydration failed because the initial UI does not match what was rendered on the server.\nWarning: Expected server HTML to contain a matching <span> in <div>.",
    zindex_stacking_trap: "CSS Bug: Modal with z-index: 9999 is rendering behind an adjacent card with z-index: 1.",
    flexbox_overflow_ellipsis: "Flexbox child text is overflowing container and text-overflow: ellipsis is not working.",
    react_missing_key: "Warning: Each child in a list should have a unique 'key' prop. Check the render method of TodoList.",
    api_404_not_found: "Failed to load resource: the server responded with a status of 404 (Not Found) on /api/users",
    form_button_refresh: "Form button reloads the page on click instead of executing my custom JavaScript action."
  };
  const input = document.getElementById('prompt-input');
  input.value = samples[key] || key;
  submitMessage();
}

// Submit Message
async function submitMessage() {
  const input = document.getElementById('prompt-input');
  let query = input.value.trim();
  if (!query) return;

  const privacyActive = document.getElementById('privacy-checkbox').checked;
  if (privacyActive) {
    query = sanitizeClientSide(query);
  }

  // Hide empty state hero, show chat stream
  document.getElementById('hero-view').style.display = 'none';
  const stream = document.getElementById('chat-stream');
  stream.style.display = 'flex';

  // Append user bubble & record history
  appendUserMessage(query);
  conversationHistory.push({ role: 'user', content: query });

  input.value = '';
  input.style.height = 'auto';

  // Loading state
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  sendBtn.innerText = 'Diagnosing...';

  try {
    let result = null;
    if (isBackendOnline) {
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
    }

    // Local heuristic fallback if backend offline or request failed
    if (!result) {
      result = matchOfflineKnowledge(query);
    }

    appendBotResponse(result, query);
    conversationHistory.push({ role: 'assistant', content: result.title });
  } catch (err) {
    const fallback = matchOfflineKnowledge(query);
    appendBotResponse(fallback, query);
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<span>Diagnose</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}

// Fallback search over offline items
function matchOfflineKnowledge(query) {
  const lower = query.toLowerCase();

  // Check vague query
  if (lower.length < 10 && !["map", "cors", "404", "500", "cls", "nan", "div"].some(k => lower.includes(k))) {
    return {
      matched: false,
      is_followup_needed: true,
      is_uncertain: true,
      category: "Diagnostic Inquiry",
      title: "Need More Details to Diagnose",
      problem: `The query '${query}' needs additional details to identify the root cause.`,
      likely_cause: "No stack trace, console error message, or code context was provided.",
      fix_steps: [
        "1. Open DevTools (F12) -> Console and paste the exact red error message.",
        "2. Include which framework you are using (React, Next.js, Vite, Vanilla JS).",
        "3. Provide the code block where the failure happens."
      ],
      extra_tips: "You can also upload a full log or error file directly with the 'Upload Log' button.",
      follow_up_prompt: "Could you paste the exact error message or console stack trace you are seeing?",
      source: { title: "MDN Web Docs — Developer Tools", url: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools" }
    };
  }

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

  // Low confidence heuristic
  return {
    matched: false,
    is_uncertain: true,
    category: "General Frontend Runtime",
    title: "Uncatalogued Frontend Issue (General Diagnostics)",
    problem: `Encountered an uncatalogued issue: "${query.slice(0, 80)}...".`,
    likely_cause: "I am not completely certain about this specific error scenario, but based on your description, this typically stems from an unhandled async promise rejection, undefined state access, or missing try/catch error boundary.",
    fix_steps: [
      "1. Wrap the suspect code in a try/catch block or React ErrorBoundary.",
      "2. Open DevTools Network tab to check if any API requests returned 4xx or 5xx.",
      "3. Inspect the Console tab for the full call stack trace to find the failing file and line number."
    ],
    file_hint: "src/components/ErrorBoundary.tsx",
    code_before: "// ❌ Unhandled execution failure\nconst result = executeOperation();",
    code_after: "// ✅ Fixed: Wrap in try/catch guard\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error('Safely caught error:', error);\n}",
    extra_tips: "State whether you are running in SSR (Next.js/Remix) or client SPA (Vite/CRA) for targeted solutions.",
    source: { title: "React Docs — Error Boundaries", url: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary" },
    confirmation_prompt: "Did this general troubleshooting advice help? Please rate below."
  };
}

function appendUserMessage(text) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble-user';
  bubble.textContent = text;
  stream.appendChild(bubble);
}

function appendBotResponse(data, originalQuery) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble-bot';

  const copyId = `code-fix-${Date.now()}`;
  const feedbackId = `fb-${Date.now()}`;

  // Fix steps list HTML
  let fixStepsHtml = '';
  if (Array.isArray(data.fix_steps) && data.fix_steps.length > 0) {
    fixStepsHtml = `
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
    `;
  }

  // Code Diff block HTML (if code diff provided)
  let diffHtml = '';
  if (data.code_before && data.code_after) {
    diffHtml = `
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
    `;
  }

  // Follow-up question banner (if user info not enough)
  let followUpHtml = '';
  if (data.is_followup_needed && data.follow_up_prompt) {
    followUpHtml = `
      <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--warning-border); padding: 12px; border-radius: 8px;">
        <strong style="color: var(--warning-text); font-size: 13px;">💬 Follow-up question:</strong>
        <p style="font-size: 13px; color: var(--text-primary); margin-top: 4px;">${escapeHtml(data.follow_up_prompt)}</p>
      </div>
    `;
  }

  // Uncertainty disclaimer badge
  const uncertaintyBadge = data.is_uncertain 
    ? `<span class="uncertain-badge">⚠️ Low Confidence — Review Docs</span>`
    : `<span style="font-size: 11px; color: var(--text-muted);">Verified Canonical Fix</span>`;

  // Prevention checklist (bonus)
  let preventionHtml = '';
  if (data.prevention_checklist && data.prevention_checklist.length > 0) {
    preventionHtml = `
      <div class="prevention-box">
        <div class="prevention-title">🛡️ Prevention & Best Practices</div>
        <ul>
          ${data.prevention_checklist.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  bubble.innerHTML = `
    <div class="bot-header">
      <div class="bot-header-left">
        <span class="category-tag">${escapeHtml(data.category || 'Frontend Support')}</span>
        ${uncertaintyBadge}
      </div>
    </div>
    
    <div class="bot-title">${escapeHtml(data.title)}</div>

    ${followUpHtml}

    <!-- 1. Problem Section -->
    <div class="section-block">
      <div class="section-label">🔍 Problem</div>
      <div class="section-content">${escapeHtml(data.problem || data.summary || '')}</div>
    </div>

    <!-- 2. Likely Cause Section -->
    <div class="section-block">
      <div class="section-label">⚡ Likely Cause</div>
      <div class="section-content">${escapeHtml(data.likely_cause || data.explanation || '')}</div>
    </div>

    <!-- 3. Fix Steps Section & Code Diff -->
    ${fixStepsHtml}
    ${diffHtml}

    <!-- 4. Extra Tips Section -->
    <div class="extra-tips-card">
      <strong>💡 Extra Tips:</strong> ${escapeHtml(data.extra_tips || 'Always verify with the official documentation linked below.')}
    </div>

    <!-- Prevention Checklist (Bonus) -->
    ${preventionHtml}

    <!-- Official Source Reference -->
    ${data.source ? `
      <div class="bot-source">
        <span>Official Source:</span>
        <a href="${escapeHtml(data.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.source.title)} →</a>
      </div>
    ` : ''}

    <!-- Thumbs Up / Down Feedback Bar -->
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
  `;

  stream.appendChild(bubble);
}

// Submit Thumbs Up / Down Feedback
async function submitFeedback(barId, issueTitle, isHelpful) {
  const bar = document.getElementById(barId);
  if (!bar) return;

  bar.innerHTML = `
    <span class="feedback-thanks">
      ${isHelpful ? '✨ Glad this resolved your issue!' : '🙏 Thank you for the feedback. We will refine this fix.'}
    </span>
  `;

  showToast('Feedback submitted. Thank you!');

  if (isBackendOnline) {
    try {
      await fetch(`${BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_title: issueTitle,
          is_helpful: isHelpful
        })
      });
    } catch (e) {
      console.warn("Could not record feedback on backend:", e);
    }
  }
}

// Copy Code Patch
function copyCode(id) {
  const el = document.getElementById(id);
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Code fix copied to clipboard!');
  }).catch(() => {
    alert('Code copied!');
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

// Clear Conversation
function clearConversation() {
  const stream = document.getElementById('chat-stream');
  stream.innerHTML = '';
  stream.style.display = 'none';
  document.getElementById('hero-view').style.display = 'block';
  conversationHistory = [];
  showToast('Chat cleared');
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Auto-expand input textarea
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
