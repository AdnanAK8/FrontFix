// FrontFix AI — Sanitizer Service
// ponytail: Native RegExp scrubbing avoids heavy DLP or tokenization packages. Zero leaks guarantee.

export const JWT_REGEX = /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi;
export const API_KEY_REGEX = /(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16}|ai_key_[a-zA-Z0-9]{24,}|AIza[0-9A-Za-z\-_]{35})/gi;
export const PASSWORD_REGEX = /(password|secret|token|apiKey|api_key|auth|pass)\s*[:=]\s*["']?([^"'\s,;]+)["']?/gi;
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export class SanitizerService {
  /**
   * Scrubs Bearer tokens, API keys, credentials, and emails from raw input text.
   * @param {string} text - Raw input text
   * @returns {{ sanitizedText: string, redactionsCount: number }}
   */
  static sanitize(text) {
    if (!text || typeof text !== 'string') {
      return { sanitizedText: '', redactionsCount: 0 };
    }

    let redactionsCount = 0;

    let result = text.replace(JWT_REGEX, () => {
      redactionsCount++;
      return 'Bearer [REDACTED_JWT]';
    });

    result = result.replace(API_KEY_REGEX, () => {
      redactionsCount++;
      return '[REDACTED_API_KEY]';
    });

    result = result.replace(PASSWORD_REGEX, (match, key) => {
      redactionsCount++;
      return `${key}: [REDACTED_SECRET]`;
    });

    result = result.replace(EMAIL_REGEX, () => {
      redactionsCount++;
      return '[REDACTED_EMAIL]';
    });

    return {
      sanitizedText: result,
      redactionsCount
    };
  }

  /**
   * Strips or redacts query parameters from URLs to prevent credentials from leaking through URLs.
   * @param {string} urlString
   * @returns {string} Clean URL without sensitive query parameters
   */
  static sanitizeUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return '';
    try {
      const parsed = new URL(urlString);
      if (parsed.search) {
        // Redact any query param keys or values that look like tokens, secrets, or keys
        const sensitiveKeys = ['token', 'key', 'apikey', 'api_key', 'auth', 'secret', 'password', 'code', 'session'];
        for (const [key] of parsed.searchParams.entries()) {
          if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
            parsed.searchParams.set(key, '[REDACTED]');
          }
        }
      }
      return parsed.toString().replace(/%5BREDACTED%5D/gi, '[REDACTED]');
    } catch {
      // If it's a relative URL or fragment, scrub parameter-like segments
      return urlString.replace(/([?&](?:token|key|api_key|auth|secret)=)[^&#\s]*/gi, '$1[REDACTED]');
    }
  }
}

export default SanitizerService;
