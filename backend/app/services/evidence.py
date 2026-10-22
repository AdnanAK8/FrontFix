import re
from urllib.parse import urlparse


class EvidenceService:
    TRUSTED_DOC_DOMAINS = [
        "developer.mozilla.org",
        "react.dev",
        "web.dev",
        "css-tricks.com",
        "w3.org",
        "developer.chrome.com",
        "nodejs.org",
        "vite.dev",
        "nextjs.org",
        "angular.dev",
        "vuejs.org",
        "svelte.dev",
    ]

    @classmethod
    def analyze(cls, raw_input: str, context: dict | None = None) -> dict:
        """Analyzes error text, stack traces, and context to extract confirmed evidence."""
        if context is None:
            context = {}

        error_message = context.get("errorMessage", "")
        stack = context.get("stack", "")
        selected_text = context.get("selectedText", "")
        text = f"{raw_input or ''}\n{error_message or ''}\n{stack or ''}\n{selected_text or ''}"
        clean_stack = (stack or raw_input or "").strip()

        # 1. Stack trace / file & line number detection
        file_location = cls.extract_file_location(clean_stack)

        # 2. Framework detection from evidence
        detected_framework = cls.detect_framework(text, context.get("detectedFramework"))

        # 3. Error classification
        error_classification = cls.classify_error(text)

        # 4. Input source determination
        is_browser_captured = context.get("source") == "extension_capture" or bool(context.get("isBrowserCaptured"))
        input_source = (
            "Captured by Browser Extension on Active Tab"
            if is_browser_captured
            else "User-provided error description or pasted code"
        )

        # 5. Confirmed factual observations
        observations = []
        if error_message:
            observations.append(f'Captured Error Message: "{error_message.strip()}"')
        elif raw_input:
            first_line = raw_input.strip().split("\n")[0]
            observations.append(f'User Query: "{first_line[:100]}"')

        if file_location:
            line_str = f" line {file_location['line']}" if file_location.get("line") else ""
            col_str = f":{file_location['column']}" if file_location.get("column") else ""
            observations.append(f"Verified Stack Origin: {file_location['file']}{line_str}{col_str}")
        else:
            observations.append("No stack trace provided; file and line number are unspecified")

        if detected_framework and detected_framework != "Unknown / Generic JavaScript":
            observations.append(f"Framework Identified from Evidence: {detected_framework}")
        else:
            observations.append("Framework not specified in input (diagnosing as standard JavaScript / Web platform)")

        if context.get("promiseRejection"):
            observations.append(f"Unhandled Rejection Reason: {context['promiseRejection']}")
        if context.get("failedResourceUrl"):
            observations.append(f"Resource Failed to Load: {context['failedResourceUrl']}")
        if context.get("selectedText"):
            observations.append("Diagnostic includes user-selected code from active webpage")

        # 6. Focused follow-up question generation when evidence is incomplete
        focused_follow_up = cls.generate_focused_question(
            file_location=file_location,
            detected_framework=detected_framework,
            error_classification=error_classification,
            text=text,
        )

        return {
            "fileLocation": file_location,
            "detectedFramework": detected_framework or "Unknown / Generic JavaScript",
            "errorClassification": error_classification,
            "inputSource": input_source,
            "isBrowserCaptured": is_browser_captured,
            "observations": observations,
            "focusedFollowUp": focused_follow_up,
        }

    @classmethod
    def extract_file_location(cls, stack_text: str) -> dict | None:
        """Extracts file, line, and column ONLY when legitimately present in stack trace."""
        if not stack_text:
            return None

        patterns = [
            re.compile(
                r"(?:at\s+(?:[^\s(]+\s+\()?)?([a-zA-Z0-9_\-\.\/\\:]+\.(?:jsx?|tsx?|vue|svelte|html|mjs|cjs))(?::(\d+))(?::(\d+))?\)?",
                re.IGNORECASE,
            ),
            re.compile(
                r"([a-zA-Z0-9_\-\.\/\\:]+\.(?:jsx?|tsx?|vue|svelte|html|mjs|cjs))\s+line\s+(\d+)",
                re.IGNORECASE,
            ),
        ]

        for pat in patterns:
            m = pat.search(stack_text)
            if m and m.group(1):
                raw_file = m.group(1).replace("\\", "/")
                if raw_file.startswith("http://") or raw_file.startswith("https://"):
                    try:
                        u = urlparse(raw_file)
                        raw_file = u.path.split("/")[-1] if u.path.split("/")[-1] else u.path
                    except Exception:
                        pass

                if raw_file.startswith("node:"):
                    continue

                line = int(m.group(2)) if len(m.groups()) >= 2 and m.group(2) else None
                column = int(m.group(3)) if len(m.groups()) >= 3 and m.group(3) else None

                return {
                    "file": raw_file,
                    "line": line,
                    "column": column,
                }

        return None

    @classmethod
    def detect_framework(cls, text: str, explicit_hint: str | None = None) -> str:
        """Detects framework only if concrete evidence exists in text or context."""
        if explicit_hint and explicit_hint not in ("Unknown", "Unknown / Generic JavaScript"):
            return explicit_hint

        t = text.lower()
        if (
            "react" in t
            or "usestate" in t
            or "useeffect" in t
            or "usememo" in t
            or "useref" in t
            or "dispatchsetstate" in t
            or "hydration failed" in t
            or "minified react error" in t
            or re.search(r"\.(jsx|tsx)\b", text, re.IGNORECASE)
        ):
            return "React"

        if "next.js" in t or "nextjs" in t or "__next_data__" in t:
            return "Next.js"

        if "vue" in t or "v-model" in t or "v-for" in t or re.search(r"\.(vue)\b", text, re.IGNORECASE):
            return "Vue.js"

        if "angular" in t or "ngfor" in t or "ngmodule" in t:
            return "Angular"

        if "svelte" in t or re.search(r"\.(svelte)\b", text, re.IGNORECASE):
            return "Svelte"

        return "Unknown / Generic JavaScript"

    @classmethod
    def classify_error(cls, text: str) -> str:
        """Classifies error category based on JavaScript runtime signatures."""
        t = text.lower()
        if "cannot read properties of undefined" in t or "reading 'map'" in t or ".map is not a function" in t:
            return "TypeError: Undefined Method / Property"
        if "cannot read properties of null" in t:
            return "TypeError: Null Property Access"
        if "cors policy" in t or "access-control-allow-origin" in t:
            return "Network: CORS Policy Block"
        if "too many re-renders" in t or "infinite loop" in t:
            return "Lifecycle: Infinite Re-render"
        if "hydration failed" in t or "did not match" in t:
            return "SSR: Hydration Mismatch"
        if "syntaxerror" in t or "unexpected token '<'" in t:
            return "SyntaxError: JSON Parsing Failure"
        if "assignment to constant" in t:
            return "TypeError: Const Reassignment"
        if "quotaexceedederror" in t:
            return "Storage: Quota Exceeded"
        return "General Frontend Runtime Exception"

    @classmethod
    def generate_focused_question(
        cls,
        file_location: dict | None,
        detected_framework: str,
        error_classification: str,
        text: str,
    ) -> str:
        """Generates a focused, actionable single question when evidence is insufficient."""
        if file_location and file_location.get("file") and file_location.get("line"):
            return f"Can you share the code around line {file_location['line']} of {file_location['file']}?"

        if "Undefined Method / Property" in error_classification:
            if detected_framework == "Unknown / Generic JavaScript":
                return "What framework is this running in (React, Vue, Node.js, or vanilla JS), and how is the mapped variable initialized?"
            return "Can you share the component code where this variable is declared and populated?"

        if "CORS" in error_classification:
            return "Are you requesting a local backend (e.g. localhost:8000) or an external third-party API?"

        if detected_framework == "Unknown / Generic JavaScript":
            return "Can you share the relevant code snippet and specify whether this is in React, Vue, or plain JavaScript?"

        return "Can you share the code snippet where this error occurs?"

    @classmethod
    def validate_source_url(cls, url: str) -> bool:
        """Validates that documentation URLs are legitimate, real links from trusted documentation sources."""
        if not url or not isinstance(url, str):
            return False
        try:
            parsed = urlparse(url)
            if parsed.scheme not in ("https", "http"):
                return False
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False
            return any(hostname == domain or hostname.endswith(f".{domain}") for domain in cls.TRUSTED_DOC_DOMAINS)
        except Exception:
            return False
