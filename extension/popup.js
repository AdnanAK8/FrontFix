// FrontFix AI — Extension Popup Controller

let currentBackendUrl = 'http://127.0.0.1:8000';
let activePageData = null;
let lastDiagnosis = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupTabs();
  setupSettingsToggle();
  setupActionButtons();
  checkBackendHealth();
  fetchActivePageDiagnostics();
});

// Load configuration from chrome.storage
async function loadSettings() {
  return new Promise((resolve) => {
    if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['backendUrl'], (result) => {
        if (result.backendUrl) {
          currentBackendUrl = result.backendUrl;
        }
        const input = document.getElementById('backend-url-input');
        if (input) input.value = currentBackendUrl;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

function setupSettingsToggle() {
  const toggleBtn = document.getElementById('toggle-settings-btn');
  const panel = document.getElementById('settings-panel');
  const saveBtn = document.getElementById('save-settings-btn');
  const testBtn = document.getElementById('test-connection-btn');
  const input = document.getElementById('backend-url-input');
  const msg = document.getElementById('settings-msg');

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });
  }

  if (saveBtn && input) {
    saveBtn.addEventListener('click', () => {
      let url = input.value.trim().replace(/\/+$/, '');
      if (!url) url = 'http://127.0.0.1:8000';
      currentBackendUrl = url;
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ backendUrl: url }, () => {
          if (msg) {
            msg.textContent = 'Saved!';
            setTimeout(() => { msg.textContent = ''; }, 2000);
          }
          checkBackendHealth();
        });
      }
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      if (msg) msg.textContent = 'Testing...';
      const online = await checkBackendHealth();
      if (msg) {
        msg.textContent = online ? '✅ Connected!' : '❌ Connection failed';
        setTimeout(() => { msg.textContent = ''; }, 3000);
      }
    });
  }
}

async function checkBackendHealth() {
  const statusPill = document.getElementById('backend-status');
  try {
    const res = await fetch(`${currentBackendUrl}/`, { method: 'GET' });
    if (res.ok) {
      if (statusPill) {
        statusPill.textContent = 'API ONLINE';
        statusPill.className = 'status-pill status-online';
      }
      return true;
    }
  } catch (err) {
    // Backend offline or unreachable
  }

  if (statusPill) {
    statusPill.textContent = 'API OFFLINE';
    statusPill.className = 'status-pill status-offline';
  }
  return false;
}

// Request diagnostics from active tab content script
async function fetchActivePageDiagnostics() {
  const urlEl = document.getElementById('current-page-url');
  const countBadge = document.getElementById('error-count-badge');
  const listEl = document.getElementById('detected-errors-list');
  const selectionBanner = document.getElementById('selection-banner');

  if (!chrome.tabs || !chrome.tabs.query) {
    if (urlEl) urlEl.textContent = 'Browser tabs API unavailable in this environment.';
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) return;
    const tab = tabs[0];

    // Sanitize URL preview
    let displayUrl = tab.url || 'Unknown URL';
    try {
      const u = new URL(displayUrl);
      displayUrl = `${u.origin}${u.pathname}`;
    } catch {}

    if (urlEl) {
      urlEl.textContent = displayUrl;
      urlEl.title = tab.url || '';
    }

    // Message content script
    chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DIAGNOSTICS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        if (listEl) {
          listEl.innerHTML = '<div class="empty-state">No errors reported on page, or page is a restricted browser tab.</div>';
        }
        return;
      }

      activePageData = response;

      if (response.selectedText && selectionBanner) {
        selectionBanner.classList.remove('hidden');
      }

      const errors = response.errors || [];
      if (countBadge) countBadge.textContent = String(errors.length);

      if (listEl) {
        if (errors.length === 0) {
          listEl.innerHTML = '<div class="empty-state">No runtime errors detected on this tab. Click Analyze to inspect page context.</div>';
        } else {
          listEl.innerHTML = '';
          errors.forEach((err, idx) => {
            const div = document.createElement('div');
            div.className = 'error-item';
            div.innerHTML = `
              <div class="error-item-msg">${escapeHtml(err.message)}</div>
              <div class="error-item-meta">${err.type} &bull; ${new Date(err.timestamp).toLocaleTimeString()}</div>
            `;
            listEl.appendChild(div);
          });
        }
      }
    });
  });
}

function setupActionButtons() {
  const analyzePageBtn = document.getElementById('analyze-page-btn');
  const clearErrorsBtn = document.getElementById('clear-errors-btn');
  const diagnoseManualBtn = document.getElementById('diagnose-manual-btn');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const thumbsUpBtn = document.getElementById('fb-thumbs-up');
  const thumbsDownBtn = document.getElementById('fb-thumbs-down');

  if (clearErrorsBtn) {
    clearErrorsBtn.addEventListener('click', () => {
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_ERRORS' }, () => {
              fetchActivePageDiagnostics();
            });
          }
        });
      }
    });
  }

  if (analyzePageBtn) {
    analyzePageBtn.addEventListener('click', async () => {
      await handleAnalyzePage();
    });
  }

  if (diagnoseManualBtn) {
    diagnoseManualBtn.addEventListener('click', async () => {
      const input = document.getElementById('manual-error-input');
      const query = input ? input.value.trim() : '';
      if (!query) {
        alert('Please paste an error message or describe the issue.');
        return;
      }
      await sendDiagnoseQuery(query);
    });
  }

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('diag-code-after');
      if (codeEl && codeEl.textContent) {
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          copyCodeBtn.textContent = 'Copied!';
          setTimeout(() => { copyCodeBtn.textContent = 'Copy Fix'; }, 2000);
        });
      }
    });
  }

  if (thumbsUpBtn) {
    thumbsUpBtn.addEventListener('click', () => sendFeedback(true));
  }
  if (thumbsDownBtn) {
    thumbsDownBtn.addEventListener('click', () => sendFeedback(false));
  }
}

async function handleAnalyzePage() {
  const privacyChecked = document.getElementById('privacy-checkbox')?.checked ?? true;
  const errors = activePageData?.errors || [];
  const selectedText = activePageData?.selectedText || '';
  const pageUrl = activePageData?.url || '';

  let topError = errors.length > 0 ? errors[errors.length - 1] : null;

  // Build diagnostic payload
  const payload = {
    url: pageUrl,
    errorMessage: topError ? topError.message : '',
    stack: topError ? (topError.stack || '') : '',
    promiseRejection: topError && topError.type === 'unhandled_promise_rejection' ? topError.message : '',
    failedResourceUrl: topError && topError.resourceUrl ? topError.resourceUrl : '',
    browserInfo: navigator.userAgent,
    selectedText: selectedText,
    userDescription: errors.length === 0 ? `Diagnose page context for ${pageUrl}` : ''
  };

  showLoader(true, 'Consulting FrontFix AI...');

  try {
    const res = await fetch(`${currentBackendUrl}/api/extension/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    renderDiagnosis(data.data);
  } catch (error) {
    alert(`Diagnosis failed: ${error.message}`);
  } finally {
    showLoader(false);
  }
}

async function sendDiagnoseQuery(query) {
  showLoader(true, 'Diagnosing frontend issue...');
  try {
    const res = await fetch(`${currentBackendUrl}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        enable_privacy: true
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    renderDiagnosis(data.data);
  } catch (error) {
    alert(`Diagnosis failed: ${error.message}`);
  } finally {
    showLoader(false);
  }
}

function renderDiagnosis(diag) {
  if (!diag) return;
  lastDiagnosis = diag;

  const resultContainer = document.getElementById('diagnosis-result');
  const titleEl = document.getElementById('diag-title');
  const modelLabelEl = document.getElementById('diag-model-label');
  const confidenceEl = document.getElementById('diag-confidence');
  const problemEl = document.getElementById('diag-problem');
  const likelyCauseEl = document.getElementById('diag-likely-cause');
  const stepsList = document.getElementById('diag-fix-steps');
  const codeContainer = document.getElementById('diag-code-container');
  const codeAfter = document.getElementById('diag-code-after');
  const extraTipsEl = document.getElementById('diag-extra-tips');
  const sourceLink = document.getElementById('diag-source-link');
  const feedbackMsg = document.getElementById('feedback-msg');

  if (feedbackMsg) feedbackMsg.textContent = '';

  if (titleEl) titleEl.textContent = diag.title || 'Diagnostic Assessment';
  if (modelLabelEl) modelLabelEl.textContent = diag.model_label || '📚 Knowledge Base';

  if (confidenceEl) {
    const score = diag.confidence_score !== undefined ? diag.confidence_score : 100;
    confidenceEl.textContent = `Confidence: ${diag.confidence || (score > 20 ? 'High' : 'Medium')}`;
  }

  if (problemEl) problemEl.textContent = diag.problem || '';
  if (likelyCauseEl) likelyCauseEl.textContent = diag.likely_cause || '';

  if (stepsList) {
    stepsList.innerHTML = '';
    const steps = Array.isArray(diag.fix_steps) ? diag.fix_steps : [diag.fix_steps];
    steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step.replace(/^\d+\.\s*/, '');
      stepsList.appendChild(li);
    });
  }

  if (codeContainer && codeAfter) {
    if (diag.code_after) {
      codeAfter.textContent = diag.code_after;
      codeContainer.classList.remove('hidden');
    } else {
      codeContainer.classList.add('hidden');
    }
  }

  if (extraTipsEl) {
    extraTipsEl.textContent = Array.isArray(diag.extra_tips) ? diag.extra_tips.join(' ') : (diag.extra_tips || '');
  }

  if (sourceLink) {
    if (diag.source && diag.source.url) {
      sourceLink.href = diag.source.url;
      sourceLink.textContent = diag.source.title || 'Official Documentation';
    } else {
      sourceLink.href = 'https://developer.mozilla.org';
      sourceLink.textContent = 'MDN Web Docs';
    }
  }

  if (resultContainer) {
    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

async function sendFeedback(isHelpful) {
  const feedbackMsg = document.getElementById('feedback-msg');
  if (!lastDiagnosis) return;

  try {
    const res = await fetch(`${currentBackendUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue_title: lastDiagnosis.title || 'General Diagnosis',
        is_helpful: isHelpful,
        query_text: lastDiagnosis.problem || ''
      })
    });

    if (res.ok && feedbackMsg) {
      feedbackMsg.textContent = 'Thanks for your feedback!';
      setTimeout(() => { feedbackMsg.textContent = ''; }, 3000);
    }
  } catch {
    // Ignore feedback error
  }
}

function showLoader(show, text = 'Loading...') {
  const loader = document.getElementById('loading-indicator');
  const loaderText = document.getElementById('loading-text');
  if (loader) {
    if (show) {
      if (loaderText) loaderText.textContent = text;
      loader.classList.remove('hidden');
    } else {
      loader.classList.add('hidden');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
