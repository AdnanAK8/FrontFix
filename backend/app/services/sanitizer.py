import re
from typing import Dict, Any, Tuple

class PrivacySanitizer:
    """
    Client-side and Gateway middleware for redacting sensitive developer credentials,
    JWT tokens, API keys, and PII before forwarding payloads to AI models.
    """
    
    JWT_PATTERN = re.compile(r'Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*', re.IGNORECASE)
    OPENAI_KEY_PATTERN = re.compile(r'sk-[A-Za-z0-9]{20,}', re.IGNORECASE)
    GITHUB_PAT_PATTERN = re.compile(r'gh[pousr]-[A-Za-z0-9]{36,}', re.IGNORECASE)
    AWS_KEY_PATTERN = re.compile(r'AKIA[0-9A-Z]{16}', re.IGNORECASE)
    EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
    PASSWORD_KV_PATTERN = re.compile(r'(password|passwd|secret|apikey|token)\s*[:=]\s*["\']?([^"\'\s]+)["\']?', re.IGNORECASE)

    @classmethod
    def sanitize(cls, text: str) -> Tuple[str, Dict[str, int]]:
        """
        Sanitizes input text and returns a tuple of (clean_text, redactions_count).
        """
        redactions = {
            "jwt_tokens": 0,
            "api_keys": 0,
            "emails": 0,
            "credentials": 0
        }
        
        if not text:
            return "", redactions

        # 1. Redact JWT Bearer tokens
        def redact_jwt(m):
            redactions["jwt_tokens"] += 1
            return "Bearer [REDACTED_JWT_TOKEN]"
        text = cls.JWT_PATTERN.sub(redact_jwt, text)

        # 2. Redact API Keys
        def redact_apikey(m):
            redactions["api_keys"] += 1
            return "[REDACTED_API_KEY]"
        text = cls.OPENAI_KEY_PATTERN.sub(redact_apikey, text)
        text = cls.GITHUB_PAT_PATTERN.sub(redact_apikey, text)
        text = cls.AWS_KEY_PATTERN.sub(redact_apikey, text)

        # 3. Redact Password fields in JSON / configs
        def redact_credential(m):
            redactions["credentials"] += 1
            return f"{m.group(1)}: [REDACTED_SECRET]"
        text = cls.PASSWORD_KV_PATTERN.sub(redact_credential, text)

        # 4. Redact Email Addresses
        def redact_email(m):
            redactions["emails"] += 1
            return "[REDACTED_EMAIL]"
        text = cls.EMAIL_PATTERN.sub(redact_email, text)

        return text, redactions
