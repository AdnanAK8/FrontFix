import json
import os
import re
from typing import Dict, Any, List, Tuple

class DiagnosticEngine:
    """
    Core diagnostic reasoning engine for FrontFix AI.
    Handles privacy redaction, pattern classification, RAG retrieval, and code diff generation.
    """

    JWT_REGEX = re.compile(r'Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*', re.IGNORECASE)
    API_KEY_REGEX = re.compile(r'(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16})', re.IGNORECASE)
    PASSWORD_REGEX = re.compile(r'(password|secret|token)\s*[:=]\s*["\']?([^"\'\s]+)["\']?', re.IGNORECASE)

    def __init__(self):
        json_path = os.path.join(os.path.dirname(__file__), "knowledge.json")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                self.knowledge_base: List[Dict[str, Any]] = json.load(f)
        except Exception:
            self.knowledge_base = []

    def sanitize(self, text: str) -> Tuple[str, int]:
        """Scrub tokens, API keys, and sensitive credentials from input text."""
        redactions = 0
        if not text:
            return "", 0

        def count_and_redact(m, replacement):
            nonlocal redactions
            redactions += 1
            return replacement

        text = self.JWT_REGEX.sub(lambda m: count_and_redact(m, "Bearer [REDACTED_JWT]"), text)
        text = self.API_KEY_REGEX.sub(lambda m: count_and_redact(m, "[REDACTED_API_KEY]"), text)
        text = self.PASSWORD_REGEX.sub(lambda m: count_and_redact(m, f"{m.group(1)}: [REDACTED_SECRET]"), text)
        return text, redactions

    def diagnose(self, user_input: str, enable_privacy: bool = True) -> Dict[str, Any]:
        """
        Diagnose a frontend error or question, returning clean root-cause analysis,
        before/after code diffs, and authoritative documentation references.
        """
        clean_text = user_input.strip()
        redactions_count = 0
        if enable_privacy:
            clean_text, redactions_count = self.sanitize(clean_text)

        lower_input = clean_text.lower()

        # 1. Match against known frontend error patterns in Knowledge Base
        matched_item = None
        for item in self.knowledge_base:
            for pattern in item.get("trigger_patterns", []):
                if pattern.lower() in lower_input:
                    matched_item = item
                    break
            if matched_item:
                break

        if matched_item:
            return {
                "matched": True,
                "category": matched_item["category"],
                "title": matched_item["title"],
                "summary": matched_item["summary"],
                "file_hint": matched_item.get("file_hint", "src/App.tsx"),
                "code_before": matched_item["code_before"],
                "code_after": matched_item["code_after"],
                "explanation": matched_item["explanation"],
                "source": {
                    "title": matched_item["source_title"],
                    "url": matched_item["source_url"]
                },
                "redactions_count": redactions_count
            }

        # 2. Heuristic fallback for general frontend questions or uncatalogued errors
        first_line = clean_text.splitlines()[0] if clean_text else "Frontend Exception"
        return {
            "matched": False,
            "category": "Frontend Runtime",
            "title": "Uncaught Exception or Syntax Issue",
            "summary": f"Detected frontend execution error: '{first_line[:90]}...'. This typically indicates an unguarded null reference, an unhandled async promise, or a missing error boundary.",
            "file_hint": "src/App.tsx",
            "code_before": "// ❌ Failing execution:\n// Unhandled error in execution thread\nconst result = executeOperation();",
            "code_after": "// ✅ Fixed: Wrap in try/catch or React ErrorBoundary\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error('Safely caught in FrontFix ErrorBoundary:', error);\n}",
            "explanation": "Guarding unpredictable operations with try/catch and implementing top-level React ErrorBoundaries prevents runtime crashes from unmounting the entire application.",
            "source": {
                "title": "React Docs — Error Boundaries",
                "url": "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary"
            },
            "redactions_count": redactions_count
        }

    def list_presets(self) -> List[Dict[str, str]]:
        """Return preset list for frontend quick testing."""
        return [
            {
                "id": k["id"],
                "title": k["title"],
                "category": k["category"],
                "sample": k["code_before"]
            }
            for k in self.knowledge_base
        ]
