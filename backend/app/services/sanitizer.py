import re
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

JWT_REGEX = re.compile(
    r"Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*",
    re.IGNORECASE,
)
API_KEY_REGEX = re.compile(
    r"(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16}|ai_key_[a-zA-Z0-9]{24,}|AIza[0-9A-Za-z\-_]{35})",
    re.IGNORECASE,
)
PASSWORD_REGEX = re.compile(
    r"(password|secret|token|apiKey|api_key|auth|pass)\s*[:=]\s*[\"']?([^\"'\s,;]+)[\"']?",
    re.IGNORECASE,
)
EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)


class SanitizerService:
    @staticmethod
    def sanitize(text: str) -> dict:
        """Scrubs Bearer tokens, API keys, credentials, and emails from raw input text."""
        if not text or not isinstance(text, str):
            return {"sanitizedText": "", "redactionsCount": 0}

        redactions_count = 0

        def jwt_repl(match):
            nonlocal redactions_count
            redactions_count += 1
            return "Bearer [REDACTED_JWT]"

        result = JWT_REGEX.sub(jwt_repl, text)

        def api_key_repl(match):
            nonlocal redactions_count
            redactions_count += 1
            return "[REDACTED_API_KEY]"

        result = API_KEY_REGEX.sub(api_key_repl, result)

        def pwd_repl(match):
            nonlocal redactions_count
            redactions_count += 1
            key = match.group(1)
            return f"{key}: [REDACTED_SECRET]"

        result = PASSWORD_REGEX.sub(pwd_repl, result)

        def email_repl(match):
            nonlocal redactions_count
            redactions_count += 1
            return "[REDACTED_EMAIL]"

        result = EMAIL_REGEX.sub(email_repl, result)

        return {
            "sanitizedText": result,
            "redactionsCount": redactions_count,
        }

    @staticmethod
    def sanitize_url(url_string: str) -> str:
        """Strips or redacts query parameters from URLs to prevent credentials from leaking through URLs."""
        if not url_string or not isinstance(url_string, str):
            return ""

        try:
            parsed = urlparse(url_string)
            if parsed.query:
                sensitive_keys = [
                    "token",
                    "key",
                    "apikey",
                    "api_key",
                    "auth",
                    "secret",
                    "password",
                    "code",
                    "session",
                ]
                query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
                new_pairs = []
                for k, v in query_pairs:
                    k_lower = k.lower()
                    if any(s in k_lower for s in sensitive_keys):
                        new_pairs.append((k, "[REDACTED]"))
                    else:
                        new_pairs.append((k, v))
                new_query = urlencode(new_pairs)
                reconstructed = urlunparse((
                    parsed.scheme,
                    parsed.netloc,
                    parsed.path,
                    parsed.params,
                    new_query,
                    parsed.fragment,
                ))
                return reconstructed.replace("%5BREDACTED%5D", "[REDACTED]")
            else:
                return url_string
        except Exception:
            return re.sub(
                r"([?&](?:token|key|api_key|auth|secret)=)[^&#\s]*",
                r"\1[REDACTED]",
                url_string,
                flags=re.IGNORECASE,
            )
