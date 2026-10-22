import re
from pathlib import Path
from .retriever import KnowledgeRetriever
from .sanitizer import SanitizerService
from .history import HistoryService
from .llm import LLMService
from .evidence import EvidenceService


class DiagnosticEngine:
    MIN_MATCH_SCORE = 12.0

    VAGUE_QUERIES = {
        "help",
        "error",
        "broken",
        "it is broken",
        "not working",
        "page is blank",
        "blank page",
        "page blank",
        "white screen",
        "css broken",
        "fix this",
        "why is this failing",
        "it doesn't work",
        "something is wrong",
        "bug in code",
        "failed",
        "crash",
        "stuck",
        "blank",
        "site down",
        "please help",
        "it broke",
        "code broken",
        "frontend error",
        "bug",
        "frontend bug",
    }

    def __init__(self, options: dict | None = None):
        opts = options or {}
        knowledge_path = opts.get("knowledgePath")
        llm_config = opts.get("llmConfig")
        self.retriever = KnowledgeRetriever(knowledge_path)
        self.llm_service = LLMService(llm_config)
        self.knowledge_base = self.retriever.get_all()

    @property
    def knowledgeBase(self):
        # Backwards compatibility property
        return self.knowledge_base

    @property
    def llmService(self):
        # Backwards compatibility property
        return self.llm_service

    def is_insufficient_query(self, query: str) -> bool:
        if not query or not isinstance(query, str):
            return True
        trimmed = query.strip().lower()
        cleaned_simple = re.sub(r"[^a-z\s]", "", trimmed).strip()

        if cleaned_simple in self.VAGUE_QUERIES:
            return True

        technical_keywords = ["map", "cors", "404", "500", "cls", "nan", "div", "hook", "grid"]
        if len(trimmed) < 12 and not any(kw in trimmed for kw in technical_keywords):
            return True

        return False

    def generate_context_aware_followup(self, query: str, evidence: dict | None = None) -> dict:
        q = query.lower()
        framework = evidence.get("detectedFramework", "Unknown") if evidence else "Unknown"

        if any(w in q for w in ["css", "style", "align", "layout"]):
            return {
                "category": "CSS & Layout Inquiry",
                "title": "Need More CSS Context to Diagnose",
                "problem": f"Your query '{query}' mentions CSS or layout issues without specific symptoms.",
                "likely_cause": "Different CSS bugs require different solutions (centering, z-index stacking, overflow clipping, or mobile viewport calculation).",
                "fix_steps": [
                    "1. Is the issue about horizontal or vertical centering (e.g. 'div is not centered')?",
                    "2. Is an element rendering behind other content (z-index stacking context)?",
                    "3. Is text refusing to truncate or causing horizontal overflow in flex/grid?",
                    "4. Paste your CSS class rules and the parent container element structure.",
                ],
                "extra_tips": "In Chrome DevTools, inspect the computed properties and the 'Layers' tab to check stacking context.",
                "follow_up_prompt": "You mentioned CSS — is this about element centering, z-index stacking, flexbox overflow, or mobile viewport jumping?",
                "source": {
                    "title": "MDN Web Docs — CSS Layout Overview",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Introduction",
                },
            }
        elif any(w in q for w in ["react", "hook", "render", "state"]) or framework == "React":
            return {
                "category": "React Diagnostic Inquiry",
                "title": "Need More React Specifics to Diagnose",
                "problem": f"Your query '{query}' refers to a React issue without providing the error message or hook name.",
                "likely_cause": "React issues typically stem from hook dependency cycles, undefined state during async fetches, or SSR hydration mismatches.",
                "fix_steps": [
                    "1. Copy the exact red error message and stack trace from the browser console (F12).",
                    "2. Indicate which hook is involved (e.g., useState, useEffect, useMemo, useRef).",
                    "3. Paste the component code snippet where the state update or render occurs.",
                ],
                "extra_tips": "Check whether you are calling setState directly in the component body or inside an unguarded useEffect.",
                "follow_up_prompt": "Which React hook is involved, and what exact error appears in your browser console?",
                "source": {
                    "title": "React.dev — Handling Errors in React",
                    "url": "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
                },
            }
        elif any(w in q for w in ["api", "fetch", "network", "request"]):
            return {
                "category": "Network & API Inquiry",
                "title": "Need More Network Details to Diagnose",
                "problem": f"Your query '{query}' indicates an API problem without the HTTP status or headers.",
                "likely_cause": "API issues range from browser CORS policy blocks to 404 route mismatches and 500 server crashes.",
                "fix_steps": [
                    "1. Open DevTools (F12) -> Network tab, click the failed request, and check the HTTP Status Code (e.g. 404, 500, or (failed) for CORS).",
                    "2. View the 'Response' tab to check if the server returned HTML or JSON.",
                    "3. Mention whether this happens in local development (localhost) or in deployed production.",
                ],
                "extra_tips": "If the error says 'No Access-Control-Allow-Origin', configure a dev proxy in your vite.config.ts or next.config.js.",
                "follow_up_prompt": "What HTTP status code (e.g. 404, 500, or CORS blocked) is shown in your DevTools Network tab?",
                "source": {
                    "title": "MDN Web Docs — Inspecting Network Activity",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools#the_network_monitor",
                },
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
                    "3. Paste the relevant snippet of code where the error or layout bug occurs.",
                ],
                "extra_tips": "You can also upload a full log or error file directly using the 'Upload Log' button.",
                "follow_up_prompt": "Could you share the exact error text or console message you are seeing?",
                "source": {
                    "title": "MDN Web Docs — What Are Browser Developer Tools?",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/What_are_browser_developer_tools",
                },
            }

    async def diagnose(
        self,
        user_input: str,
        enable_privacy: bool = True,
        conversation_history: list | None = None,
        context: dict | None = None,
    ) -> dict:
        """Main diagnostic method using evidence-based deduction without unsupported assumptions."""
        clean_text = (user_input or "").strip()
        redactions_count = 0
        ctx = context or {}

        if enable_privacy:
            sanitized = SanitizerService.sanitize(clean_text)
            clean_text = sanitized["sanitizedText"]
            redactions_count += sanitized["redactionsCount"]

        # Process & sanitize conversation history
        history_res = HistoryService.process_history(conversation_history, enable_privacy)
        sanitized_history = history_res["sanitizedHistory"]
        redactions_count += history_res["redactionsCount"]

        # Extract confirmed evidence without making assumptions
        evidence = EvidenceService.analyze(clean_text, ctx)

        # 1. Check for insufficient/vague input
        if self.is_insufficient_query(clean_text):
            followup_data = self.generate_context_aware_followup(clean_text, evidence)
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
                "follow_up_question": followup_data["follow_up_prompt"],
                "confirmation_prompt": "Did this guidance help clarify what to share?",
                "source": followup_data["source"],
                "sources": [followup_data["source"]],
                "prevention_checklist": [
                    "Always check DevTools Console (F12) for uncaught exceptions.",
                    "Check DevTools Network tab for failed 4xx or 5xx API calls.",
                    "Review component props and initial state definitions.",
                ],
                "related_issues": ["typeerror_map", "cors_policy_blocked", "div_not_centered"],
                "redactions_count": redactions_count,
                "evidence_summary": {
                    "input_source": evidence["inputSource"],
                    "file_location": evidence["fileLocation"],
                    "detected_framework": evidence["detectedFramework"],
                    "confirmed_observations": evidence["observations"],
                },
            }

        # 2. Enrich search query using history if follow-up
        search_query = clean_text
        is_multiturn_followup = False
        if sanitized_history:
            resolved = HistoryService.resolve_context_with_history(clean_text, sanitized_history)
            if resolved["isMultiturnFollowup"]:
                search_query = resolved["enrichedQuery"]
                is_multiturn_followup = True

        # 3. Search knowledge base with TF-IDF cosine ranking
        ranked_matches = self.retriever.search(search_query)

        if ranked_matches and ranked_matches[0]["score"] >= self.MIN_MATCH_SCORE:
            top_match = ranked_matches[0]
            top_item = top_match["item"]
            score = top_match["score"]
            is_uncertain = score < 20.0

            problem = top_item.get("problem", "")
            likely_cause = top_item.get("likely_cause", "")
            fix_steps = list(top_item.get("fix_steps", []))
            code_before = top_item.get("code_before", "")
            code_after = top_item.get("code_after", "")
            extra_tips = top_item.get("extra_tips", "")
            title = top_item.get("title", "")
            category = top_item.get("category", "")
            generated_by = "knowledge_base"
            model_label = "📚 Verified Knowledge Base"
            code_context_note = "General illustrative example — adapt variable and component names to your codebase."

            # Evidence-based adaptation for TypeError: Cannot read properties of undefined (reading 'map')
            if top_item.get("id") == "typeerror_map":
                file_location_file = evidence.get("fileLocation", {}).get("file", "") if evidence.get("fileLocation") else ""
                has_react_evidence = (
                    evidence.get("detectedFramework") in ("React", "Next.js")
                    or bool(re.search(r"\.(jsx|tsx)$", file_location_file, re.IGNORECASE))
                )

                if not has_react_evidence:
                    category = "JavaScript Runtime"
                    problem = "Attempted to call the '.map()' method on a variable that evaluated to 'undefined' at runtime."
                    likely_cause = (
                        "1. (Most common) Asynchronous state or prop populated asynchronously (e.g. from an API call, async function, or promise) that defaults to undefined on initial evaluation.\n"
                        "2. Unexpected data structure: The API, function, or prop returned an object (e.g. '{ data: [...] }'), null, or an error payload instead of a direct array.\n"
                        "3. The variable was conditionally assigned or an optional property chain resolved to undefined."
                    )
                    fix_steps = [
                        "1. Verify the variable exists and is a valid array before calling .map(), using `Array.isArray(variable)` or optional chaining `variable?.map(...)`.",
                        "2. If populated asynchronously (e.g. from an API call), track distinct `loading`, `error`, and `data` states. Initializing with `useState([])` prevents undefined crashes, but the true fix depends on the data source; an empty array does not keep loading active.",
                        "3. If the array is empty (`items.length === 0`), render an empty state message (e.g. 'No items found') rather than getting trapped in a loading indicator.",
                        "4. Log or inspect the value and type of the variable immediately before calling .map().",
                    ]
                    code_before = "// ❌ Broken: Calling .map() on an undefined or uninitialized variable\nconst data = undefined;\ndata.map(item => item.name);"
                    code_after = "// ✅ Fixed (Standard JavaScript): Guard with Array.isArray\nif (Array.isArray(items)) {\n  items.map(item => item.name);\n}\n\n// ✅ In a React component: Separate loading, error, and empty result states\nconst [items, setItems] = useState([]);\nconst [loading, setLoading] = useState(true);\nconst [error, setError] = useState(null);\n\nif (loading) return <p>Loading items...</p>;\nif (error) return <p>Error: {error}</p>;\nif (items.length === 0) return <p>No items found.</p>;\n\nreturn (\n  <ul>\n    {items.map(item => (\n      <li key={item.id}>{item.name}</li>\n    ))}\n  </ul>\n);"
                    code_context_note = "Framework note: No specific framework was identified from the supplied error. The code above shows standard defensive JavaScript as well as the common React component pattern."
                else:
                    ref_file = file_location_file or "input"
                    code_context_note = f"Evidence detected React in {ref_file}. The fix separates loading, error, and empty result states."

            if is_multiturn_followup:
                title = f"{title} (Follow-up Context)"

            # Step 4: Pass to LLM if available, grounding with evidence
            if self.llm_service.is_available():
                try:
                    llm_res = await self.llm_service.generate_grounded_response(
                        clean_text,
                        top_item,
                        sanitized_history,
                        evidence,
                    )
                    llm_output = llm_res.get("output")
                    provider = llm_res.get("provider", "knowledge_base")
                    if llm_output:
                        problem = llm_output.get("problem") or problem
                        likely_cause = llm_output.get("likely_cause") or likely_cause
                        fix_steps = llm_output.get("fix_steps") or fix_steps
                        code_before = llm_output.get("code_before") or code_before
                        code_after = llm_output.get("code_after") or code_after
                        extra_tips = llm_output.get("extra_tips") or extra_tips
                        generated_by = provider
                        model_label = f"✨ AI Explained ({provider.capitalize()})"
                except Exception as err:
                    print(f"[DiagnosticEngine] LLM generation error: {err}")

            file_loc = evidence.get("fileLocation")
            file_hint = None
            if file_loc and file_loc.get("file"):
                file_hint = f"{file_loc['file']}:{file_loc['line']}" if file_loc.get("line") else file_loc["file"]

            follow_up_question = evidence.get("focusedFollowUp")

            return {
                "matched": True,
                "generated_by": generated_by,
                "model_label": model_label,
                "is_followup_needed": False,
                "is_uncertain": is_uncertain,
                "confidence_score": round(score, 1),
                "category": category,
                "title": title,
                "problem": problem,
                "likely_cause": likely_cause,
                "fix_steps": fix_steps,
                "file_hint": file_hint,
                "code_before": code_before,
                "code_after": code_after,
                "corrected_code": code_after,
                "code_context_note": code_context_note,
                "extra_tips": extra_tips,
                "follow_up_question": follow_up_question,
                "prevention_checklist": top_item.get("prevention_checklist", [
                    "Implement comprehensive unit tests.",
                    "Enable strict linting rules.",
                ]),
                "related_issues": top_item.get("related_issues", []),
                "source": {
                    "title": top_item.get("source_title", "Official Documentation"),
                    "url": top_item.get("source_url", ""),
                },
                "sources": [
                    {
                        "title": top_item.get("source_title", "Official Documentation"),
                        "url": top_item.get("source_url", ""),
                    }
                ],
                "confirmation_prompt": "Did this resolve your issue? Let us know with thumbs up or down below.",
                "redactions_count": redactions_count,
                "evidence_summary": {
                    "input_source": evidence.get("inputSource"),
                    "is_browser_captured": evidence.get("isBrowserCaptured"),
                    "file_location": evidence.get("fileLocation"),
                    "detected_framework": evidence.get("detectedFramework"),
                    "confirmed_observations": evidence.get("observations"),
                },
            }

        # 4. Low-confidence fallback (Never invent files or facts)
        first_line = clean_text.split("\n")[0] if clean_text else "Frontend Exception"
        file_loc = evidence.get("fileLocation")
        file_hint = None
        if file_loc and file_loc.get("file"):
            file_hint = f"{file_loc['file']}:{file_loc['line']}" if file_loc.get("line") else file_loc["file"]

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
            "likely_cause": (
                "I am not completely certain about this specific error scenario, but based on your description, "
                "this error does not match our catalogued frontend issues. It typically stems from an unhandled async "
                "promise rejection, undefined state access, or missing try/catch error boundary."
            ),
            "fix_steps": [
                "1. Inspect the browser console (F12) for the full stack trace to identify the file and line number.",
                "2. Wrap the failing asynchronous call or component in a try/catch block or React ErrorBoundary.",
                "3. Check the DevTools Network tab to verify that all API responses return valid 200 JSON with expected headers.",
                "4. Consult the official documentation linked below for reference specifications.",
            ],
            "file_hint": file_hint,
            "code_before": "// ❌ Unhandled failure:\nconst result = executeOperation();",
            "code_after": "// ✅ Fixed: Wrap with ErrorBoundary or try/catch guard\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error('Safely captured error:', error);\n}",
            "corrected_code": "// ✅ Fixed: Wrap with ErrorBoundary or try/catch guard\ntry {\n  const result = executeOperation();\n} catch (error) {\n  console.error('Safely captured error:', error);\n}",
            "code_context_note": "General fallback illustration — adapt to your codebase.",
            "extra_tips": "To get a more specific diagnosis, please provide the complete stack trace and specify the framework (e.g. React 19, Next.js, Vue 3).",
            "follow_up_question": evidence.get("focusedFollowUp") or "Can you share the full stack trace or the code where this error occurs?",
            "prevention_checklist": [
                "Catch all async promises with try/catch.",
                "Add top-level React ErrorBoundaries to prevent white screens.",
                "Verify API payload structures against schemas.",
            ],
            "related_issues": ["typeerror_map", "cors_policy_blocked", "infinite_rerender"],
            "source": {
                "title": "React Docs — Catching Rendering Errors with Error Boundaries",
                "url": "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
            },
            "sources": [
                {
                    "title": "React Docs — Catching Rendering Errors with Error Boundaries",
                    "url": "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
                }
            ],
            "confirmation_prompt": "Did this general troubleshooting advice help? Please rate below.",
            "redactions_count": redactions_count,
            "evidence_summary": {
                "input_source": evidence.get("inputSource"),
                "is_browser_captured": evidence.get("isBrowserCaptured"),
                "file_location": evidence.get("fileLocation"),
                "detected_framework": evidence.get("detectedFramework"),
                "confirmed_observations": evidence.get("observations"),
            },
        }

    async def analyze_log_file(self, content: str) -> dict:
        """Parse uploaded frontend log file or browser console dump.
        Sanitizes 100% of raw content first, then extracts errors and diagnoses top issues.
        """
        sanitized = SanitizerService.sanitize(content or "")
        sanitized_text = sanitized["sanitizedText"]
        redactions_count = sanitized["redactionsCount"]

        lines = re.split(r"\r?\n", sanitized_text)
        extracted_errors = []

        error_pattern = re.compile(
            r"(error|exception|uncaught|failed|typeerror|syntaxerror|warning|fatal|cors|blocked|status of (4\d\d|5\d\d)|rejected)",
            re.IGNORECASE,
        )

        for idx, line in enumerate(lines):
            line_str = line.strip()
            if not line_str:
                continue
            if error_pattern.search(line_str):
                context_start = max(0, idx - 1)
                context_end = min(len(lines), idx + 4)
                snippet = "\n".join(lines[context_start:context_end])
                extracted_errors.append({
                    "line_number": idx + 1,
                    "snippet": line_str,
                    "full_context": snippet,
                })

        # Match unique errors against knowledge base
        diagnosed_issues = []
        seen_categories = set()

        for err in extracted_errors:
            res = await self.diagnose(
                err["snippet"],
                enable_privacy=False,
                conversation_history=None,
                context={
                    "stack": err["full_context"],
                    "errorMessage": err["snippet"],
                    "source": "log_file_upload",
                },
            )
            cat = res.get("category", "")
            if res.get("matched") and cat not in seen_categories:
                seen_categories.add(cat)
                diagnosed_issues.append({
                    "line_number": err["line_number"],
                    "symptom": err["snippet"][:120],
                    "diagnosis": res,
                })

        sanitized_snippets = [e["snippet"] for e in extracted_errors[:10]]

        return {
            "total_lines_analyzed": len(lines),
            "total_error_lines_detected": len(extracted_errors),
            "unique_issues_identified": len(diagnosed_issues),
            "redactions_in_log": redactions_count,
            "top_issues": diagnosed_issues[:5],
            "sanitized_error_samples": sanitized_snippets,
            "raw_error_samples": sanitized_snippets,
        }

    def list_presets(self) -> list[dict]:
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
            "api_404_not_found",
        ]
        presets = []
        for item_id in top_ids:
            k = self.retriever.get_by_id(item_id)
            if k:
                sample = k["trigger_patterns"][0] if k.get("trigger_patterns") else k.get("title", "")
                presets.append({
                    "id": k.get("id"),
                    "title": k.get("title"),
                    "category": k.get("category"),
                    "sample": sample,
                    "code_before": k.get("code_before", ""),
                })
        return presets
