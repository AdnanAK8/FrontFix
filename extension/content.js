// FrontFix AI Content Script: Intercepts console errors and unhandled rejections
(function() {
  const capturedErrors = [];

  // 1. Intercept window.onerror
  window.addEventListener('error', function(event) {
    const errorPayload = {
      type: 'WINDOW_ERROR',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error ? event.error.stack : null,
      timestamp: new Date().toISOString()
    };
    capturedErrors.push(errorPayload);
    // Send telemetry to local FrontFix backend if available
    try {
      fetch('http://127.0.0.1:8000/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'chrome-extension',
          error_message: event.message + (event.error ? '\n' + event.error.stack : ''),
          url: event.filename,
          line_number: event.lineno,
          column_number: event.colno
        })
      }).catch(() => {});
    } catch (e) {}
  });

  // 2. Intercept unhandledrejection
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    const msg = reason ? (reason.stack || reason.message || String(reason)) : 'Unhandled Promise Rejection';
    try {
      fetch('http://127.0.0.1:8000/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'chrome-extension-promise',
          error_message: msg
        })
      }).catch(() => {});
    } catch (e) {}
  });

  console.log("%c[FrontFix AI]%c Error Telemetry Listener Active (Team B)", "color:#0ea5e9;font-weight:bold;", "color:gray;");
})();
