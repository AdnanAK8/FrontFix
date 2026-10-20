import json
import os
import re
import math
from typing import Dict, Any, List, Tuple, Optional
from collections import Counter

class DiagnosticEngine:
    """
    Diagnostic & RAG Reasoning Engine for FrontFix AI (Team B - Frontend Support).
    Implements TF-IDF token scoring, privacy scrubbing, log parsing,
    and strict output formatting: Problem -> Likely Cause -> Fix Steps -> Extra Tips.
    """

    # Privacy Shield RegEx patterns (Bearer tokens, API keys, credentials, emails)
    # ponytail: Regex in standard library eliminates need for heavy third-party DLP packages
    JWT_REGEX = re.compile(r'Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*', re.IGNORECASE)
    API_KEY_REGEX = re.compile(r'(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16}|ai_key_[a-zA-Z0-9]{24,})', re.IGNORECASE)
    PASSWORD_REGEX = re.compile(r'(password|secret|token|apiKey|api_key)\s*[:=]\s*["\']?([^"\'\s,;]+)["\']?', re.IGNORECASE)
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

    VAGUE_QUERIES = {
        "help", "error", "broken", "it is broken", "not working", "page is blank", 
        "blank page", "page blank", "white screen", "css broken", "fix this", 
        "why is this failing", "it doesn't work", "something is wrong", 
        "bug in code", "failed", "crash", "stuck", "blank", "site down",
        "please help", "it broke", "code broken"
    }

    def __init__(self):
        json_path = os.path.join(os.path.dirname(__file__), "knowledge.json")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                self.knowledge_base: List[Dict[str, Any]] = json.load(f)
        except Exception as e:
            print(f"[DiagnosticEngine] Error loading knowledge.json: {e}")
            self.knowledge_base = []
        
        self.doc_index = self._build_search_index()

    def _tokenize(self, text: str) -> List[str]:
        # ponytail: stdlib regex tokenizer avoids NLTK/spaCy dependencies
        if not text:
            return []
        cleaned = re.sub(r'[^a-zA-Z0-9_\-\.\:\/]', ' ', text.lower())
        tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
        return tokens

    def _build_search_index(self):
        """Index tokens from trigger patterns, title, problem, and cause for TF-IDF search."""
        index = []
        for item in self.knowledge_base:
            # High-weight tokens from triggers and title
            triggers_text = " ".join(item.get("trigger_patterns", []))
            title_text = item.get("title", "")
            problem_text = item.get("problem", "")
            cause_text = item.get("likely_cause", "")
            category_text = item.get("category", "")
            
            # Repetition gives explicit weight multipliers
            full_weighted_text = (
                f"{triggers_text} " * 5 +
                f"{title_text} " * 3 +
                f"{category_text} " * 2 +
                f"{problem_text} " +
                f"{cause_text}"
            )
            tokens = self._tokenize(full_weighted_text)
            term_freq = Counter(tokens)
            index.append({
                "id": item["id"],
                "item": item,
                "term_freq": term_freq,
                "total_tokens": len(tokens)
            })
        return index

    def sanitize(self, text: str) -> Tuple[str, int]:
        """Scrub tokens, API keys, passwords, and emails before analysis."""
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
        text = self.EMAIL_REGEX.sub(lambda m: count_and_redact(m, "[REDACTED_EMAIL]"), text)
        return text, redactions

    def search_knowledge_base(self, query: str) -> List[Tuple[Dict[str, Any], float]]:
        """
        Rank knowledge base articles using token overlap and TF scoring.
        Returns sorted list of (item, score).
        """
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        lower_query = query.lower()
        scored_results = []

        for entry in self.doc_index:
            item = entry["item"]
            score = 0.0

            # 1. Exact substring bonus on trigger patterns (highest precision)
            for pattern in item.get("trigger_patterns", []):
                p_lower = pattern.lower()
                if p_lower in lower_query:
                    score += 50.0 + (len(p_lower) * 0.5)

            # 2. Token frequency overlap
            tf = entry["term_freq"]
            for q_token in query_tokens:
                if q_token in tf:
                    score += (tf[q_token] / max(entry["total_tokens"], 1)) * 30.0
                    score += 2.0  # Base hit reward

            if score > 0:
                scored_results.append((item, score))

        scored_results.sort(key=lambda x: x[1], reverse=True)
        return scored_results

    def is_insufficient_query(self, query: str) -> bool:
        """Check if user query is too brief or vague to diagnose reliably."""
        trimmed = query.strip().lower()
        cleaned_simple = re.sub(r'[^a-z\s]', '', trimmed).strip()
        if cleaned_simple in self.VAGUE_QUERIES:
            return True
        if len(trimmed) < 12 and not any(kw in trimmed for kw in ["map", "cors", "404", "500", "cls", "nan", "div", "hook", "grid"]):
            return True
        return False

    def diagnose(self, user_input: str, enable_privacy: bool = True, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Diagnose a frontend error according to strict project specifications.
        Outputs in format: Problem, Likely cause, Fix steps, Extra tips.
        Handles follow-up question generation and low confidence indicators.
        """
        clean_text = user_input.strip()
        redactions_count = 0
        if enable_privacy:
            clean_text, redactions_count = self.sanitize(clean_text)

        # 1. Check for insufficient/vague input
        if self.is_insufficient_query(clean_text):
            return {
                "matched": False,
                "is_followup_needed": True,
                "is_uncertain": True,
                "category": "Diagnostic Inquiry",
                "title": "Need More Information to Diagnose",
                "problem": f"The query '{clean_text}' is too brief or ambiguous to identify the exact frontend issue.",
                "likely_cause": "The input doesn't yet contain an error message, stack trace, affected framework, or expected behavior.",
                "fix_steps": [
                    "1. Copy and paste the exact red error message or stack trace from your browser console (Press F12 -> Console).",
                    "2. Mention the framework/library involved (e.g., React 19, Next.js, Vite, Vanilla JS, CSS Flex/Grid).",
                    "3. Paste the relevant snippet of code where the error or layout bug occurs."
                ],
                "extra_tips": "You can also upload a full log or error file directly using the 'Upload Log' button below.",
                "follow_up_prompt": "Could you share the exact error text or console message you are seeing?",
                "confirmation_prompt": "Did this guidance help clarify what to share?",
                "source": {
                    "title": "MDN Web Docs — What Are Browser Developer Tools?",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools"
                },
                "prevention_checklist": [
                    "Always check DevTools Console (F12) for uncaught exceptions.",
                    "Check DevTools Network tab for failed 4xx or 5xx API calls.",
                    "Review component props and initial state definitions."
                ],
                "related_issues": ["typeerror_map", "cors_policy_blocked", "div_not_centered"],
                "redactions_count": redactions_count
            }

        # 2. Search knowledge base with ranking
        ranked_matches = self.search_knowledge_base(clean_text)

        if ranked_matches and ranked_matches[0][1] >= 8.0:
            top_item, score = ranked_matches[0]
            is_uncertain = score < 20.0  # Moderate confidence vs high certainty

            return {
                "matched": True,
                "is_followup_needed": False,
                "is_uncertain": is_uncertain,
                "confidence_score": round(score, 1),
                "category": top_item["category"],
                "title": top_item["title"],
                "problem": top_item["problem"],
                "likely_cause": top_item["likely_cause"],
                "fix_steps": top_item["fix_steps"],
                "file_hint": top_item.get("file_hint", "src/App.tsx"),
                "code_before": top_item["code_before"],
                "code_after": top_item["code_after"],
                "extra_tips": top_item.get("extra_tips", "Verify related dependencies and browser compatibility."),
                "prevention_checklist": top_item.get("prevention_checklist", [
                    "Implement comprehensive unit tests.",
                    "Enable strict linting rules."
                ]),
                "related_issues": top_item.get("related_issues", []),
                "source": {
                    "title": top_item["source_title"],
                    "url": top_item["source_url"]
                },
                "confirmation_prompt": "Did this resolve your issue? Let us know with thumbs up or down below.",
                "redactions_count": redactions_count
            }

        # 3. Low Confidence / Heuristic fallback with clear disclaimer & doc link
        first_line = clean_text.splitlines()[0] if clean_text else "Frontend Exception"
        return {
            "matched": False,
            "is_followup_needed": False,
            "is_uncertain": True,
            "confidence_score": 0.0,
            "category": "Frontend Runtime & Troubleshooting",
            "title": "Uncatalogued Frontend Issue (General Diagnostics)",
            "problem": f"Encountered an uncatalogued issue or custom runtime state: '{first_line[:90]}...'.",
            "likely_cause": "I am not completely certain about this specific error scenario, but based on your description, this typically stems from an unhandled async promise rejection, undefined state access, or missing try/catch error boundary.",
            "fix_steps": [
                "1. Isolate the failing component by wrapping it in a React Error Boundary or wrapping the async call in `try { ... } catch (err) { console.error(err); }`.",
                "2. Open the Browser Developer Tools (F12) -> Network tab to verify all API responses return valid 200 JSON.",
                "3. Check the Console tab for the full call stack trace to identify the exact file and line number.",
                "4. Consult the official documentation linked below for reference specifications."
            ],
            "file_hint": "src/components/ErrorBoundary.tsx",
            "code_before": "// ❌ Unhandled failure:\nconst result = executeOperation();",
            "code_after": "// ✅ Fixed: Wrap with ErrorBoundary or try/catch guard\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error('Safely captured error:', error);\n}",
            "extra_tips": "If this is a framework-specific error, please include the framework name (e.g. Next.js 14, React 19, Vue 3) for pinpoint diagnostics.",
            "prevention_checklist": [
                "Catch all async promises with try/catch.",
                "Add top-level React ErrorBoundaries to prevent white screens.",
                "Verify API payload structures against schemas."
            ],
            "related_issues": ["typeerror_map", "cors_policy_blocked", "infinite_rerender"],
            "source": {
                "title": "React Docs — Catching Rendering Errors with Error Boundaries",
                "url": "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary"
            },
            "confirmation_prompt": "Did this general troubleshooting advice help? Please rate below.",
            "redactions_count": redactions_count
        }

    def analyze_log_file(self, content: str) -> Dict[str, Any]:
        """
        Bonus Feature: Parse an uploaded frontend log file or browser console dump.
        Identifies stack traces, error lines, matches issues in knowledge base,
        and provides an overall health report.
        """
        lines = content.splitlines()
        extracted_errors = []
        
        # Regex patterns to find errors in logs (stack traces, exceptions, network failures)
        error_pattern = re.compile(r'(error|exception|uncaught|failed|typeerror|syntaxerror|warning|fatal|cors|blocked|status of (4\d\d|5\d\d)|rejected)', re.IGNORECASE)
        
        for idx, line in enumerate(lines):
            line_str = line.strip()
            if not line_str:
                continue
            if error_pattern.search(line_str):
                # Grab context lines around the error
                context_start = max(0, idx - 1)
                context_end = min(len(lines), idx + 3)
                snippet = "\n".join(lines[context_start:context_end])
                extracted_errors.append({
                    "line_number": idx + 1,
                    "snippet": line_str,
                    "full_context": snippet
                })

        # Match unique errors against knowledge base
        diagnosed_issues = []
        seen_ids = set()

        for err in extracted_errors:
            res = self.diagnose(err["snippet"], enable_privacy=True)
            if res.get("matched") and res.get("category") not in seen_ids:
                seen_ids.add(res["category"])
                diagnosed_issues.append({
                    "line_number": err["line_number"],
                    "symptom": err["snippet"][:120],
                    "diagnosis": res
                })

        return {
            "total_lines_analyzed": len(lines),
            "total_error_lines_detected": len(extracted_errors),
            "unique_issues_identified": len(diagnosed_issues),
            "top_issues": diagnosed_issues[:5],
            "raw_error_samples": [e["snippet"] for e in extracted_errors[:10]]
        }

    def list_presets(self) -> List[Dict[str, str]]:
        """Return the top curated presets across the core frontend domains."""
        # Top 10 required issue scenarios for Team B
        top_ids = [
            "typeerror_map",
            "cors_policy_blocked",
            "div_not_centered",
            "infinite_rerender",
            "hydration_mismatch",
            "zindex_stacking_trap",
            "flexbox_overflow_ellipsis",
            "react_missing_key",
            "form_button_refresh",
            "api_404_not_found"
        ]
        presets = []
        kb_by_id = {k["id"]: k for k in self.knowledge_base}
        for item_id in top_ids:
            if item_id in kb_by_id:
                k = kb_by_id[item_id]
                presets.append({
                    "id": k["id"],
                    "title": k["title"],
                    "category": k["category"],
                    "sample": k["trigger_patterns"][0] if k.get("trigger_patterns") else k["title"],
                    "code_before": k.get("code_before", "")
                })
        return presets
