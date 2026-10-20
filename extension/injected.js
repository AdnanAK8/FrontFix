// FrontFix AI — In-Page Monitor (runs in host page world)
// Collects uncaught JS exceptions, unhandled rejections, and resource failures.
// Privacy guarantee: NEVER reads form values, inputs, passwords, or cookies.

(function() {
  if (window.__FRONTFIX_INJECTED__) return;
  window.__FRONTFIX_INJECTED__ = true;

  function sendError(errorData) {
    try {
      window.postMessage({
        source: 'FRONTFIX_PAGE_MONITOR',
        payload: {
          ...errorData,
          timestamp: new Date().toISOString()
        }
      }, '*');
    } catch {
      // Ignore serialization issues
    }
  }

  // 1. Intercept uncaught window errors
  window.addEventListener('error', function(event) {
    if (event.error) {
      sendError({
        type: 'javascript_error',
        message: event.error.message || String(event.error),
        stack: event.error.stack || '',
        filename: event.filename || '',
        lineno: event.lineno,
        colno: event.colno
      });
    } else if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
      sendError({
        type: 'resource_load_error',
        message: `Failed to load ${event.target.tagName.toLowerCase()} resource`,
        resourceTag: event.target.tagName,
        resourceUrl: event.target.src || event.target.href || ''
      });
    }
  }, true);

  // 2. Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    let message = 'Unhandled Promise Rejection';
    let stack = '';

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack || '';
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (reason && typeof reason === 'object') {
      try {
        message = JSON.stringify(reason);
      } catch {
        message = String(reason);
      }
    }

    sendError({
      type: 'unhandled_promise_rejection',
      message: message,
      stack: stack
    });
  });
})();
