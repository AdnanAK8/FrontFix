import json
import requests
from ..config import config, is_real_key
from .evidence import EvidenceService


class LLMService:
    def __init__(self, custom_config: dict | None = None):
        cfg = custom_config or {}
        self.gemini_api_key = cfg.get("geminiApiKey", config.gemini_api_key)
        self.gemini_model = cfg.get("geminiModel", config.gemini_model)
        self.openai_api_key = cfg.get("openaiApiKey", config.openai_api_key)
        self.openai_base_url = (cfg.get("openaiBaseUrl", config.openai_base_url)).rstrip("/")
        self.openai_model = cfg.get("openaiModel", config.openai_model)

        self._genai_model = None

    def _get_genai_model(self):
        if self._genai_model is None and is_real_key(self.gemini_api_key):
            try:
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    import google.generativeai as genai

                genai.configure(api_key=self.gemini_api_key)
                self._genai_model = genai.GenerativeModel(
                    model_name=self.gemini_model,
                    generation_config={
                        "temperature": 0.2,
                        "response_mime_type": "application/json",
                    },
                )
            except Exception:
                self._genai_model = None
        return self._genai_model

    def is_available(self) -> bool:
        return is_real_key(self.gemini_api_key) or is_real_key(self.openai_api_key)

    async def generate_grounded_response(
        self,
        user_query: str,
        retrieved_item: dict,
        conversation_history: list | None = None,
        evidence: dict | None = None,
    ) -> dict:
        """Generates a grounded RAG response based on canonical knowledge item and evidence."""
        if not self.is_available():
            return {"output": None, "provider": "knowledge_base"}

        canonical_context = "\n".join([
            f"Title: {retrieved_item.get('title', '')}",
            f"Category: {retrieved_item.get('category', '')}",
            f"Canonical Problem: {retrieved_item.get('problem', '')}",
            f"Canonical Cause: {retrieved_item.get('likely_cause', '')}",
            "Canonical Fix Steps:\n" + "\n".join(f"- {s}" for s in retrieved_item.get("fix_steps", [])),
            f"Code Before:\n{retrieved_item.get('code_before', '')}",
            f"Code After:\n{retrieved_item.get('code_after', '')}",
            f"Extra Tips: {retrieved_item.get('extra_tips', '')}",
            f"Canonical Source: {retrieved_item.get('source_url', '')}",
        ])

        history_context = ""
        if conversation_history:
            history_context = (
                "Prior Conversation Turns (Sanitized):\n"
                + "\n".join(
                    f"- {'Assistant' if m.get('role') == 'assistant' else 'User'}: {m.get('content', '')}"
                    for m in conversation_history[-4:]
                )
                + "\n\n"
            )

        evidence_context = ""
        if evidence:
            file_loc_str = "None provided in input"
            if evidence.get("fileLocation"):
                f = evidence["fileLocation"].get("file", "")
                ln = evidence["fileLocation"].get("line", "")
                file_loc_str = f"{f}:{ln}" if ln else f

            evidence_context = (
                "CONFIRMED EVIDENCE & CONTEXT:\n"
                f"- Input Source: {evidence.get('inputSource', 'User query')}\n"
                f"- File Location: {file_loc_str}\n"
                f"- Detected Framework: {evidence.get('detectedFramework', 'Unknown / Generic JavaScript')}\n"
                f"- Observations: {'; '.join(evidence.get('observations', []))}\n\n"
            )

        prompt = (
            "You are FrontFix AI, an expert technical support engineer (Team B: Frontend Support). "
            "A web developer pasted an error or asked for technical help. "
            "Explain the issue clearly and provide step-by-step fix instructions. "
            "IMPORTANT GUIDELINES:\n"
            "1. NEVER make unsupported assumptions. If no framework was detected, do NOT assume React. Treat as standard JavaScript / Web platform unless evidence indicates otherwise.\n"
            "2. NEVER invent file names, line numbers, or API responses. Only reference files and lines if present in the confirmed evidence.\n"
            "3. Separate confirmed observations from likely causes. Rank likely causes instead of stating guesses as fact.\n"
            "4. If a proposed fix is a general pattern, explicitly explain that it is an illustrative example.\n"
            "5. Output clean, unescaped literal code (no HTML entities like &lt; or &gt;).\n"
            "6. Ground your answer in the CANONICAL KNOWLEDGE BASE ARTICLE below.\n"
            "7. Return ONLY a valid raw JSON object (no markdown backticks, no wrapper):\n"
            "{\n"
            '  "problem": "Clear 1-2 sentence description of confirmed problem",\n'
            '  "likely_cause": "Ranked explanation of most likely causes based on evidence",\n'
            '  "fix_steps": ["1. First actionable step...", "2. Second actionable step..."],\n'
            '  "code_before": "// Illustrative snippet of the broken code",\n'
            '  "code_after": "// Corrected code example",\n'
            '  "extra_tips": "Performance, prevention, or framework specific tips",\n'
            '  "follow_up_question": "One focused question if code/context is missing, or null if complete"\n'
            "}\n\n"
            f"CANONICAL KNOWLEDGE BASE ARTICLE:\n{canonical_context}\n\n"
            f"{evidence_context}"
            f"{history_context}"
            f"LATEST DEVELOPER QUERY:\n{user_query}\n\n"
            "JSON Response:"
        )

        # 1. Try Gemini if configured
        if is_real_key(self.gemini_api_key):
            try:
                text = self._call_gemini(prompt)
                if text:
                    parsed = self._parse_json_response(text)
                    validated = self._validate_schema(parsed, retrieved_item)
                    if validated:
                        return {"output": validated, "provider": "gemini"}
            except Exception as err:
                print(f"[LLMService] Gemini generation failed, falling back to canonical knowledge: {err}")

        # 2. Try OpenAI if configured
        if is_real_key(self.openai_api_key):
            try:
                text = self._call_openai(prompt)
                if text:
                    parsed = self._parse_json_response(text)
                    validated = self._validate_schema(parsed, retrieved_item)
                    if validated:
                        return {"output": validated, "provider": "openai"}
            except Exception as err:
                print(f"[LLMService] OpenAI generation failed, falling back to canonical knowledge: {err}")

        return {"output": None, "provider": "knowledge_base"}

    def _call_gemini(self, prompt: str) -> str | None:
        model = self._get_genai_model()
        if model:
            try:
                resp = model.generate_content(prompt)
                return resp.text or ""
            except Exception:
                pass

        # Native REST fallback
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        res = requests.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json",
                },
            },
            timeout=8.0,
        )
        if res.status_code == 200:
            data = res.json()
            return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return None

    def _call_openai(self, prompt: str) -> str | None:
        url = f"{self.openai_base_url}/chat/completions"
        res = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.openai_model,
                "messages": [
                    {"role": "system", "content": "You are a frontend engineering assistant returning valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            },
            timeout=8.0,
        )
        if res.status_code == 200:
            data = res.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return None

    def _parse_json_response(self, text: str) -> dict | None:
        if not text or not isinstance(text, str):
            return None
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        return None

    def _validate_schema(self, data: dict | None, fallback_item: dict | None = None) -> dict | None:
        if not data or not isinstance(data, dict):
            return None

        problem = str(data.get("problem", "")).strip()
        likely_cause = str(data.get("likely_cause", "")).strip()
        if not problem or not likely_cause:
            return None

        raw_steps = data.get("fix_steps")
        if isinstance(raw_steps, str):
            raw_steps = [s.strip() for s in raw_steps.split("\n") if s.strip()]
        if not isinstance(raw_steps, list) or len(raw_steps) == 0:
            return None

        fix_steps = [step.strip() for step in raw_steps if isinstance(step, str) and step.strip()]
        if len(fix_steps) == 0:
            return None

        sources = []
        if isinstance(data.get("sources"), list):
            for s in data["sources"]:
                if isinstance(s, dict) and s.get("url") and EvidenceService.validate_source_url(s["url"]):
                    sources.append({
                        "title": s.get("title", "Official Documentation"),
                        "url": s["url"],
                    })

        if len(sources) == 0 and fallback_item and fallback_item.get("source_url"):
            sources.append({
                "title": fallback_item.get("source_title", "Official Reference"),
                "url": fallback_item["source_url"],
            })

        corrected_code = str(data.get("code_after") or data.get("corrected_code") or "")

        return {
            "problem": problem,
            "likely_cause": likely_cause,
            "fix_steps": fix_steps,
            "code_before": str(data.get("code_before", "")),
            "code_after": corrected_code,
            "corrected_code": corrected_code,
            "extra_tips": str(data.get("extra_tips", "")),
            "sources": sources,
            "follow_up_question": str(data["follow_up_question"]).strip() if data.get("follow_up_question") else None,
        }
