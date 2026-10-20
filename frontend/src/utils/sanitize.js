const JWT_REGEX = /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi;
const API_KEY_REGEX = /(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16})/gi;
const PASSWORD_REGEX = /(password|secret|token)\s*[:=]\s*["']?([^"'\s]+)["']?/gi;

export function sanitizeClientSide(text) {
  return text
    .replace(JWT_REGEX, 'Bearer [REDACTED_JWT]')
    .replace(API_KEY_REGEX, '[REDACTED_API_KEY]')
    .replace(PASSWORD_REGEX, '$1: [REDACTED_SECRET]');
}
