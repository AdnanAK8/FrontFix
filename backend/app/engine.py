import json
import os
import re
import math
from typing import Dict, Any, List, Tuple, Optional
from collections import Counter
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

from .llm import LLMGroundingClient

class DiagnosticEngine:
    """
    Diagnostic & RAG Reasoning Engine for FrontFix AI (Team B - Frontend Support).
    Implements true TF-IDF cosine similarity search, multi-pattern privacy scrubbing,
    safe log parsing, context-aware inquiry resolution, and grounded Gemini AI generation.
    """

    # Privacy Shield RegEx patterns (Bearer tokens, API keys, credentials, emails)
    # ponytail: Regex in standard library eliminates need for heavy third-party DLP packages
    JWT_REGEX = re.compile(r'Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*', re.IGNORECASE)
    API_KEY_REGEX = re.compile(r'(sk-[A-Za-z0-9]{20,}|gh[pousr]-[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16}|ai_key_[a-zA-Z0-9]{24,}|AIza[0-9A-Za-z-_]{35})', re.IGNORECASE)
    PASSWORD_REGEX = re.compile(r'(password|secret|token|apiKey|api_key|auth|pass)\s*[:=]\s*["\']?([^"\'\s,;]+)["\']?', re.IGNORECASE)
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

    MIN_MATCH_SCORE = 12.0

    VAGUE_QUERIES = {
        "help", "error", "broken", "it is broken", "not working", "page is blank", 
        "blank page", "page blank", "white screen", "css broken", "fix this", 
        "why is this failing", "it doesn't work", "something is wrong", 
        "bug in code", "failed", "crash", "stuck", "blank", "site down",
        "please help", "it broke", "code broken", "frontend error", "bug", "frontend bug"
    }

    def __init__(self):
        json_path = os.path.join(os.path.dirname(__file__), "knowledge.json")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                self.knowledge_base: List[Dict[str, Any]] = json.load(f)
        except Exception as e:
            print(f"[DiagnosticEngine] Error loading knowledge.json: {e}")
            self.knowledge_base = []
        
        self.doc_index, self.idf_table = self._build_tfidf_index()
        self.llm_client = LLMGroundingClient()

    def _tokenize(self, text: str) -> List[str]:
        # ponytail: stdlib regex tokenizer avoids heavy NLTK/spaCy dependencies
        if not text:
            return []
        cleaned = re.sub(r'[^a-zA-Z0-9_\-\.\:\/]', ' ', text.lower())
        tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
        return tokens

    def _build_tfidf_index(self):
        """
        Build true TF-IDF index with inverse document frequency across the knowledge base.
        Calculates:
          IDF(t) = ln((N + 1) / (DF(t) + 1)) + 1.0
          TF(t, d) = count(t, d) / total_tokens(d)
        """
        n_docs = len(self.knowledge_base)
        doc_tokens_list = []
        doc_freq = Counter()

        for item in self.knowledge_base:
            triggers_text = " ".join(item.get("trigger_patterns", []))
            title_text = item.get("title", "")
            problem_text = item.get("problem", "")
            cause_text = item.get("likely_cause", "")
            category_text = item.get("category", "")
            
            # Weighted field representation
            doc_text = (
                f"{triggers_text} " * 4 +
                f"{title_text} " * 3 +
                f"{category_text} " * 2 +
                f"{problem_text} " +
                f"{cause_text}"
            )
            tokens = self._tokenize(doc_text)
            doc_tokens_list.append(tokens)
            unique_terms = set(tokens)
            for term in unique_terms:
                doc_freq[term] += 1

        # Calculate smooth IDF table
        idf_table = {}
        for term, df in doc_freq.items():
            idf_table[term] = math.log((n_docs + 1) / (df + 1)) + 1.0

        # Build document TF-IDF vectors & vector magnitudes
        index = []
        for idx, item in enumerate(self.knowledge_base):
            tokens = doc_tokens_list[idx]
            tf_counts = Counter(tokens)
            total_tokens = max(len(tokens), 1)

            tfidf_vector = {}
            squared_sum = 0.0
            for term, count in tf_counts.items():
                tf = count / total_tokens
                idf = idf_table.get(term, 1.0)
                tfidf_val = tf * idf
                tfidf_vector[term] = tfidf_val
                squared_sum += tfidf_val * tfidf_val

            magnitude = math.sqrt(squared_sum) if squared_sum > 0 else 1.0
            index.append({
                "id": item["id"],
                "item": item,
                "tfidf_vector": tfidf_vector,
                "magnitude": magnitude
            })

        return index, idf_table

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
        Rank knowledge base articles using true TF-IDF cosine similarity
        plus exact substring pattern boosts.
        Returns sorted list of (item, score).
        """
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        # Build query TF-IDF vector
        q_counts = Counter(query_tokens)
        q_total = len(query_tokens)
        q_vector = {}
        q_sq_sum = 0.0

        for term, count in q_counts.items():
            tf = count / q_total
            idf = self.idf_table.get(term, 1.0)
            val = tf * idf
            q_vector[term] = val
            q_sq_sum += val * val

        q_magnitude = math.sqrt(q_sq_sum) if q_sq_sum > 0 else 1.0
        lower_query = query.lower()
        scored_results = []

        for entry in self.doc_index:
            item = entry["item"]
            doc_vec = entry["tfidf_vector"]
            doc_magnitude = entry["magnitude"]

            # 1. Cosine similarity calculation: (Q . D) / (|Q| * |D|)
            dot_product = sum(q_vector[t] * doc_vec.get(t, 0.0) for t in q_vector if t in doc_vec)
            cosine_sim = dot_product / (q_magnitude * doc_magnitude) if (q_magnitude * doc_magnitude) > 0 else 0.0

            # Scale cosine similarity into standard score space
            score = cosine_sim * 40.0

            # 2. Exact trigger pattern match boost (highest precision for exact errors)
            for pattern in item.get("trigger_patterns", []):
                p_lower = pattern.lower()
                if p_lower in lower_query:
                    score += 50.0 + (len(p_lower) * 0.5)

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

    def generate_context_aware_followup(self, query: str) -> Dict[str, Any]:
        """
        Generates domain-tailored follow-up questions for vague user inputs.
        """
        q = query.lower()
        if "css" in q or "style" in q or "align" in q or "layout" in q:
            return {
                "category": "CSS & Layout Inquiry",
                "title": "Need More CSS Context to Diagnose",
                "problem": f"Your query '{query}' mentions CSS or layout issues without specific symptoms.",
                "likely_cause": "Different CSS bugs require different solutions (centering, z-index stacking, overflow clipping, or mobile viewport calculation).",
                "fix_steps": [
                    "1. Is the issue about horizontal or vertical centering (e.g. 'div is not centered')?",
                    "2. Is an element rendering behind other content (z-index stacking context)?",
                    "3. Is text refusing to truncate or causing horizontal overflow in flex/grid?",
                    "4. Paste your CSS class rules and the parent container element structure."
                ],
                "extra_tips": "In Chrome DevTools, inspect the computed properties and the 'Layers' tab to check stacking context.",
                "follow_up_prompt": "You mentioned CSS — is this about element centering, z-index stacking, flexbox overflow, or mobile viewport jumping?",
                "source": {
                    "title": "MDN Web Docs — CSS Layout Overview",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Introduction"
                }
            }
        elif "react" in q or "hook" in q or "render" in q or "state" in q:
            return {
                "category": "React Diagnostic Inquiry",
                "title": "Need More React Specifics to Diagnose",
                "problem": f"Your query '{query}' refers to a React issue without providing the error message or hook name.",
                "likely_cause": "React issues typically stem from hook dependency cycles, undefined state during async fetches, or SSR hydration mismatches.",
                "fix_steps": [
                    "1. Copy the exact red error message and stack trace from the browser console (F12).",
                    "2. Indicate which hook is involved (e.g., useState, useEffect, useMemo, useRef).",
                    "3. Paste the component code snippet where the state update or render occurs."
                ],
                "extra_tips": "Check whether you are calling setState directly in the component body or inside an unguarded useEffect.",
                "follow_up_prompt": "Which React hook is involved, and what exact error appears in your browser console?",
                "source": {
                    "title": "React.dev — Handling Errors in React",
                    "url": "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary"
                }
            }
        elif "api" in q or "fetch" in q or "network" in q or "request" in q:
            return {
                "category": "Network & API Inquiry",
                "title": "Need More Network Details to Diagnose",
                "problem": f"Your query '{query}' indicates an API problem without the HTTP status or headers.",
                "likely_cause": "API issues range from browser CORS policy blocks to 404 route mismatches and 500 server crashes.",
                "fix_steps": [
                    "1. Open DevTools (F12) -> Network tab, click the failed request, and check the HTTP Status Code (e.g. 404, 500, or (failed) for CORS).",
                    "2. View the 'Response' tab to check if the server returned HTML or JSON.",
                    "3. Mention whether this happens in local development (localhost) or in deployed production."
                ],
                "extra_tips": "If the error says 'No Access-Control-Allow-Origin', configure a dev proxy in your vite.config.ts or next.config.js.",
                "follow_up_prompt": "What HTTP status code (e.g. 404, 500, or CORS blocked) is shown in your DevTools Network tab?",
                "source": {
                    "title": "MDN Web Docs — Inspecting Network Activity",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools#the_network_monitor"
                }
            }
        else:
            return {
                "category": "Diagnostic Inquiry",
                "title": "Need More Information to Diagnose",
                "problem": f"The query '{query}' is too brief or ambiguous to identify the exact frontend issue.",
                "likely_cause": "The input doesn't yet contain an error message, stack trace, affected framework, or expected behavior.",
                "fix_steps": [
                    "1. Copy and paste the exact red error message or stack trace from your browser console (Press F12 -> Console).",
                    "2. Mention the framework/library involved (e.g., React 19, Next.js, Vite, Vanilla JS, CSS Flex/Grid).",
                    "3. Paste the relevant snippet of code where the error or layout bug occurs."
                ],
                "extra_tips": "You can also upload a full log or error file directly using the 'Upload Log' button.",
                "follow_up_prompt": "Could you share the exact error text or console message you are seeing?",
                "source": {
                    "title": "MDN Web Docs — What Are Browser Developer Tools?",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools"
                }
            }

    def _resolve_context_with_history(self, current_query: str, history: List[Dict[str, str]]) -> str:
        """
        Enhances multi-turn conversation memory:
        If user asks a follow-up (e.g. 'how to do step 2?', 'in typescript?', 'what should I check next?'),
        extract context from previous turns so search finds the relevant domain.
        """
        if not history:
            return current_query

        last_topic = ""
        for msg in reversed(history):
            content = msg.get("content", "")
            if msg.get("role") == "assistant":
                last_topic = content
                break
            elif msg.get("role") == "user" and len(content) > 15:
                last_topic = content
                break

        followup_signals = [
            "how to", "step", "typescript", "ts", "next.js", "nextjs", "vite",
            "example", "why", "what if", "can you", "explain", "more detail",
            "mobile", "alternative", "syntax", "code", "what should i check next",
            "next step", "what next"
        ]
        q_lower = current_query.lower()
        if any(sig in q_lower for sig in followup_signals) and last_topic:
            return f"{last_topic} {current_query}"
        return current_query

    def diagnose(
        self,
        user_input: str,
        enable_privacy: bool = True,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Diagnose a frontend error according to strict project specifications.
        Outputs in format: Problem, Likely cause, Fix steps, Extra tips.
        Connects Gemini AI model with canonical knowledge base grounding,
        with transparent labelling and fallback.
        """
        clean_text = user_input.strip()
        redactions_count = 0
        if enable_privacy:
            clean_text, redactions_count = self.sanitize(clean_text)

        # 1. Check for insufficient/vague input
        if self.is_insufficient_query(clean_text):
            followup_data = self.generate_context_aware_followup(clean_text)
            return {
                "matched": False,
                "generated_by": "knowledge_base",
                "model_label": "🔍 Clarification Inquiry",
                "is_followup_needed": True,
                "is_uncertain": True,
                "category": followup_data["category"],
                "title": followup_data["title"],
                "problem": followup_data["problem"],
                "likely_cause": followup_data["likely_cause"],
                "fix_steps": followup_data["fix_steps"],
                "extra_tips": followup_data["extra_tips"],
                "follow_up_prompt": followup_data["follow_up_prompt"],
                "confirmation_prompt": "Did this guidance help clarify what to share?",
                "source": followup_data["source"],
                "prevention_checklist": [
                    "Always check DevTools Console (F12) for uncaught exceptions.",
                    "Check DevTools Network tab for failed 4xx or 5xx API calls.",
                    "Review component props and initial state definitions."
                ],
                "related_issues": ["typeerror_map", "cors_policy_blocked", "div_not_centered"],
                "redactions_count": redactions_count
            }

        # 2. Enrich search query using conversation history if this is a follow-up
        search_query = clean_text
        is_multiturn_followup = False
        if conversation_history:
            enriched = self._resolve_context_with_history(clean_text, conversation_history)
            if enriched != clean_text:
                search_query = enriched
                is_multiturn_followup = True

        # 3. Search knowledge base with true TF-IDF cosine ranking
        ranked_matches = self.search_knowledge_base(search_query)

        if ranked_matches and ranked_matches[0][1] >= self.MIN_MATCH_SCORE:
            top_item, score = ranked_matches[0]
            is_uncertain = score < 20.0

            # Default canonical resolution
            problem = top_item["problem"]
            likely_cause = top_item["likely_cause"]
            fix_steps = top_item["fix_steps"]
            code_before = top_item.get("code_before", "")
            code_after = top_item.get("code_after", "")
            extra_tips = top_item.get("extra_tips", "")
            title = top_item["title"]
            generated_by = "knowledge_base"
            model_label = "📚 Verified Knowledge Base"

            if is_multiturn_followup:
                title = f"{title} (Follow-up Context)"

            # Step 4: Pass user's error and retrieved canonical issue details to Gemini AI
            if self.llm_client.is_available():
                llm_output, provider = self.llm_client.generate_grounded_response(
                    user_query=clean_text,
                    retrieved_item=top_item,
                    conversation_history=conversation_history
                )
                if llm_output:
                    problem = llm_output.get("problem", problem)
                    likely_cause = llm_output.get("likely_cause", likely_cause)
                    fix_steps = llm_output.get("fix_steps", fix_steps)
                    code_before = llm_output.get("code_before", code_before)
                    code_after = llm_output.get("code_after", code_after)
                    extra_tips = llm_output.get("extra_tips", extra_tips)
                    generated_by = provider
                    model_label = f"✨ AI Explained ({provider.capitalize()})"

            return {
                "matched": True,
                "generated_by": generated_by,
                "model_label": model_label,
                "is_followup_needed": False,
                "is_uncertain": is_uncertain,
                "confidence_score": round(score, 1),
                "category": top_item["category"],
                "title": title,
                "problem": problem,
                "likely_cause": likely_cause,
                "fix_steps": fix_steps,
                "file_hint": top_item.get("file_hint", "src/App.tsx"),
                "code_before": code_before,
                "code_after": code_after,
                "extra_tips": extra_tips,
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

        # 4. Low Confidence / Heuristic fallback with clear disclaimer & doc link
        first_line = clean_text.splitlines()[0] if clean_text else "Frontend Exception"
        return {
            "matched": False,
            "generated_by": "knowledge_base",
            "model_label": "📚 General Diagnostics",
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
        Guarantees 100% privacy: Sanitizes the entire content BEFORE any error extraction.
        Analyzes only sanitized lines and returns only sanitized snippets.
        """
        # 1. Sanitize the entire raw log content first
        sanitized_content, redactions = self.sanitize(content)

        lines = sanitized_content.splitlines()
        extracted_errors = []
        
        # Regex patterns to find errors in logs (stack traces, exceptions, network failures)
        error_pattern = re.compile(
            r'(error|exception|uncaught|failed|typeerror|syntaxerror|warning|fatal|cors|blocked|status of (4\d\d|5\d\d)|rejected)',
            re.IGNORECASE
        )
        
        for idx, line in enumerate(lines):
            line_str = line.strip()
            if not line_str:
                continue
            if error_pattern.search(line_str):
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
            res = self.diagnose(err["snippet"], enable_privacy=False)
            if res.get("matched") and res.get("category") not in seen_ids:
                seen_ids.add(res["category"])
                diagnosed_issues.append({
                    "line_number": err["line_number"],
                    "symptom": err["snippet"][:120],
                    "diagnosis": res
                })

        # Return only sanitized error snippets
        sanitized_snippets = [e["snippet"] for e in extracted_errors[:10]]

        return {
            "total_lines_analyzed": len(lines),
            "total_error_lines_detected": len(extracted_errors),
            "unique_issues_identified": len(diagnosed_issues),
            "redactions_in_log": redactions,
            "top_issues": diagnosed_issues[:5],
            "sanitized_error_samples": sanitized_snippets,
            # Backward-compatibility alias pointing to sanitized snippets
            "raw_error_samples": sanitized_snippets
        }

    def list_presets(self) -> List[Dict[str, str]]:
        """Return the top curated presets across the core frontend domains."""
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
