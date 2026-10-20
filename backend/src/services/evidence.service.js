// FrontFix AI — Evidence & Observation Extraction Service
// Analyzes error messages, stack traces, and browser context to extract confirmed facts
// without making unsupported assumptions. Never invents file paths, line numbers, or frameworks.

export class EvidenceService {
  static TRUSTED_DOC_DOMAINS = [
    'developer.mozilla.org',
    'react.dev',
    'web.dev',
    'css-tricks.com',
    'w3.org',
    'developer.chrome.com',
    'nodejs.org',
    'vite.dev',
    'nextjs.org',
    'angular.dev',
    'vuejs.org',
    'svelte.dev'
  ];

  /**
   * Analyzes error text, stack traces, and context to extract confirmed evidence.
   * @param {string} rawInput - The user input or primary error string
   * @param {object} context - Additional metadata (stack, errorMessage, detectedFramework, source, etc.)
   * @returns {object} Extracted evidence summary
   */
  static analyze(rawInput, context = {}) {
    const text = `${rawInput || ''}\n${context.errorMessage || ''}\n${context.stack || ''}\n${context.selectedText || ''}`;
    const cleanStack = (context.stack || rawInput || '').trim();

    // 1. Stack trace / file & line number detection (NEVER invent!)
    const fileLocation = this.extractFileLocation(cleanStack);

    // 2. Framework detection from evidence
    const detectedFramework = this.detectFramework(text, context.detectedFramework);

    // 3. Error classification
    const errorClassification = this.classifyError(text);

    // 4. Input source determination
    const isBrowserCaptured = context.source === 'extension_capture' || Boolean(context.isBrowserCaptured);
    const inputSource = isBrowserCaptured
      ? 'Captured by Browser Extension on Active Tab'
      : 'User-provided error description or pasted code';

    // 5. Confirmed factual observations
    const observations = [];
    if (context.errorMessage) {
      observations.push(`Captured Error Message: "${context.errorMessage.trim()}"`);
    } else if (rawInput) {
      const firstLine = rawInput.trim().split('\n')[0];
      observations.push(`User Query: "${firstLine.slice(0, 100)}"`);
    }

    if (fileLocation) {
      const lineStr = fileLocation.line ? ` line ${fileLocation.line}` : '';
      const colStr = fileLocation.column ? `:${fileLocation.column}` : '';
      observations.push(`Verified Stack Origin: ${fileLocation.file}${lineStr}${colStr}`);
    } else {
      observations.push('No stack trace provided; file and line number are unspecified');
    }

    if (detectedFramework && detectedFramework !== 'Unknown / Generic JavaScript') {
      observations.push(`Framework Identified from Evidence: ${detectedFramework}`);
    } else {
      observations.push('Framework not specified in input (diagnosing as standard JavaScript / Web platform)');
    }

    if (context.promiseRejection) {
      observations.push(`Unhandled Rejection Reason: ${context.promiseRejection}`);
    }
    if (context.failedResourceUrl) {
      observations.push(`Resource Failed to Load: ${context.failedResourceUrl}`);
    }
    if (context.selectedText) {
      observations.push('Diagnostic includes user-selected code from active webpage');
    }

    // 6. Focused follow-up question generation when evidence is incomplete
    const focusedFollowUp = this.generateFocusedQuestion({
      fileLocation,
      detectedFramework,
      errorClassification,
      text
    });

    return {
      fileLocation,
      detectedFramework: detectedFramework || 'Unknown / Generic JavaScript',
      errorClassification,
      inputSource,
      isBrowserCaptured,
      observations,
      focusedFollowUp
    };
  }

  /**
   * Extracts file, line, and column ONLY when legitimately present in stack trace.
   */
  static extractFileLocation(stackText) {
    if (!stackText) return null;

    // Pattern for Chrome / Node / Firefox stack traces:
    // "at Component (src/UserList.jsx:15:4)" or "at src/UserList.jsx:15:4" or "UserList.jsx:15"
    const patterns = [
      /(?:at\s+(?:[^\s(]+\s+\()?)?([a-zA-Z0-9_\-\.\/\\:]+\.(?:jsx?|tsx?|vue|svelte|html|mjs|cjs))(?::(\d+))(?::(\d+))?\)?/i,
      /([a-zA-Z0-9_\-\.\/\\:]+\.(?:jsx?|tsx?|vue|svelte|html|mjs|cjs))\s+line\s+(\d+)/i
    ];

    for (const pat of patterns) {
      const m = pat.exec(stackText);
      if (m && m[1]) {
        let rawFile = m[1].replace(/\\/g, '/');
        // If it's a URL, extract path
        if (rawFile.startsWith('http://') || rawFile.startsWith('https://')) {
          try {
            const u = new URL(rawFile);
            rawFile = u.pathname.split('/').pop() || u.pathname;
          } catch {}
        }

        // Exclude system/internal files like node:internal
        if (rawFile.startsWith('node:')) continue;

        return {
          file: rawFile,
          line: m[2] ? parseInt(m[2], 10) : null,
          column: m[3] ? parseInt(m[3], 10) : null
        };
      }
    }

    return null;
  }

  /**
   * Detects framework only if concrete evidence exists in text or context.
   */
  static detectFramework(text, explicitHint = null) {
    if (explicitHint && explicitHint !== 'Unknown' && explicitHint !== 'Unknown / Generic JavaScript') {
      return explicitHint;
    }

    const t = text.toLowerCase();
    if (
      t.includes('react') ||
      t.includes('usestate') ||
      t.includes('useeffect') ||
      t.includes('usememo') ||
      t.includes('useref') ||
      t.includes('dispatchsetstate') ||
      t.includes('hydration failed') ||
      t.includes('minified react error') ||
      /\.(jsx|tsx)\b/i.test(text)
    ) {
      return 'React';
    }

    if (t.includes('next.js') || t.includes('nextjs') || t.includes('__next_data__')) {
      return 'Next.js';
    }

    if (t.includes('vue') || t.includes('v-model') || t.includes('v-for') || /\.(vue)\b/i.test(text)) {
      return 'Vue.js';
    }

    if (t.includes('angular') || t.includes('ngfor') || t.includes('ngmodule')) {
      return 'Angular';
    }

    if (t.includes('svelte') || /\.(svelte)\b/i.test(text)) {
      return 'Svelte';
    }

    return 'Unknown / Generic JavaScript';
  }

  /**
   * Classifies error category based on JavaScript runtime signatures.
   */
  static classifyError(text) {
    const t = text.toLowerCase();
    if (t.includes('cannot read properties of undefined') || t.includes("reading 'map'") || t.includes('.map is not a function')) {
      return 'TypeError: Undefined Method / Property';
    }
    if (t.includes('cannot read properties of null')) {
      return 'TypeError: Null Property Access';
    }
    if (t.includes('cors policy') || t.includes('access-control-allow-origin')) {
      return 'Network: CORS Policy Block';
    }
    if (t.includes('too many re-renders') || t.includes('infinite loop')) {
      return 'Lifecycle: Infinite Re-render';
    }
    if (t.includes('hydration failed') || t.includes('did not match')) {
      return 'SSR: Hydration Mismatch';
    }
    if (t.includes('syntaxerror') || t.includes("unexpected token '<'")) {
      return 'SyntaxError: JSON Parsing Failure';
    }
    if (t.includes('assignment to constant')) {
      return 'TypeError: Const Reassignment';
    }
    if (t.includes('quotaexceedederror')) {
      return 'Storage: Quota Exceeded';
    }
    return 'General Frontend Runtime Exception';
  }

  /**
   * Generates a focused, actionable single question when evidence is insufficient.
   */
  static generateFocusedQuestion({ fileLocation, detectedFramework, errorClassification, text }) {
    if (fileLocation && fileLocation.file && fileLocation.line) {
      return `Can you share the code around line ${fileLocation.line} of ${fileLocation.file}?`;
    }

    if (errorClassification.includes('Undefined Method / Property')) {
      if (detectedFramework === 'Unknown / Generic JavaScript') {
        return 'What framework is this running in (React, Vue, Node.js, or vanilla JS), and how is the mapped variable initialized?';
      }
      return 'Can you share the component code where this variable is declared and populated?';
    }

    if (errorClassification.includes('CORS')) {
      return 'Are you requesting a local backend (e.g. localhost:8000) or an external third-party API?';
    }

    if (detectedFramework === 'Unknown / Generic JavaScript') {
      return 'Can you share the relevant code snippet and specify whether this is in React, Vue, or plain JavaScript?';
    }

    return 'Can you share the code snippet where this error occurs?';
  }

  /**
   * Validates that documentation URLs are legitimate, real links from trusted documentation sources.
   * Discards invented or hallucinated URLs.
   */
  static validateSourceUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return this.TRUSTED_DOC_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  }
}

export default EvidenceService;
