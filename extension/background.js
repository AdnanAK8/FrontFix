// FrontFix AI — Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FrontFix AI] Extension installed successfully.');
  // Set default settings if not already present
  chrome.storage.sync.get(['backendUrl'], (result) => {
    if (!result.backendUrl) {
      chrome.storage.sync.set({ backendUrl: 'http://127.0.0.1:8000' });
    }
  });
});

// Update badge with detected error count
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'ERROR_DETECTED' && sender.tab && sender.tab.id) {
    const tabId = sender.tab.id;
    const count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ tabId, text: String(count) });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});
