// FrontFix AI — Content Script (Isolated Extension World)
// Bridges between host page events and the extension popup.

const detectedErrors = [];
const MAX_BUFFERED_ERRORS = 20;

// Inject in-page monitor
try {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
} catch (e) {
  // Silent fallback if CSP disallows script injection
}

function detectPageFramework() {
  if (document.querySelector('#__next') || window.__NEXT_DATA__) return 'Next.js';
  if (document.querySelector('[data-reactroot]')) return 'React';

  const rootEl = document.querySelector('#root') || document.querySelector('#app') || document.body;
  if (rootEl) {
    for (const key of Object.keys(rootEl)) {
      if (key.startsWith('__reactFiber') || key.startsWith('__reactContainer')) return 'React';
      if (key.startsWith('__vue')) return 'Vue.js';
    }
  }

  if (document.querySelector('[ng-version], [data-ng-app]')) return 'Angular';
  if (document.querySelector('[class*="svelte-"]')) return 'Svelte';

  return 'Unknown / Generic JavaScript';
}

// Listen for messages from injected.js
window.addEventListener('message', function(event) {
  if (event.source !== window || !event.data || event.data.source !== 'FRONTFIX_PAGE_MONITOR') {
    return;
  }

  const payload = event.data.payload;
  if (payload) {
    // Avoid exact duplicate messages within a 1-second window
    const isDuplicate = detectedErrors.some(
      err => err.message === payload.message && Math.abs(new Date(err.timestamp) - new Date(payload.timestamp)) < 1000
    );

    if (!isDuplicate) {
      if (detectedErrors.length >= MAX_BUFFERED_ERRORS) {
        detectedErrors.shift();
      }
      detectedErrors.push(payload);

      // Notify background service worker to update badge
      chrome.runtime.sendMessage({
        type: 'ERROR_DETECTED',
        count: detectedErrors.length
      }).catch(() => {});
    }
  }
});

// Listen for queries from the extension popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'GET_PAGE_DIAGNOSTICS') {
    let selectedText = '';
    try {
      selectedText = window.getSelection() ? window.getSelection().toString().trim() : '';
    } catch {
      // Ignore selection errors
    }

    sendResponse({
      url: window.location.href,
      title: document.title,
      errors: detectedErrors,
      selectedText,
      userAgent: navigator.userAgent,
      detectedFramework: detectPageFramework()
    });
    return true;
  }

  if (request.type === 'CLEAR_ERRORS') {
    detectedErrors.length = 0;
    chrome.runtime.sendMessage({ type: 'ERROR_DETECTED', count: 0 }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }
});
