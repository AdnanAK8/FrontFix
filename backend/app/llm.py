import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import requests

logger = logging.getLogger("frontfix.llm")

class LLMGroundingClient:
    """
    Client for grounding LLM generation in retrieved canonical frontend knowledge.
    Uses Google Gemini (gemini-1.5-flash) to explain errors and synthesize fixes.
    Falls back gracefully and transparently to verified canonical knowledge base.
    """

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.preferred_model = os.getenv("LLM_MODEL", "gemini-1.5-flash")

    def is_available(self) -> bool:
        """Check if any LLM provider has an API key configured."""
        return bool(self.gemini_api_key or self.openai_api_key)

    def generate_grounded_response(
        self,
        user_query: str,
        retrieved_item: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """
        Query LLM with grounded RAG context from the knowledge base.
        Returns: (parsed_json_dict, provider_label)
        If generation fails, returns (None, "knowledge_base").
        """
        if not self.is_available():
            return None, "knowledge_base"

        # Format retrieved canonical context
        canonical_context = (
            f"Title: {retrieved_item.get('title')}\n"
            f"Category: {retrieved_item.get('category')}\n"
            f"Canonical Problem: {retrieved_item.get('problem')}\n"
            f"Canonical Cause: {retrieved_item.get('likely_cause')}\n"
            f"Canonical Fix Steps:\n" + "\n".join(f"- {s}" for s in retrieved_item.get('fix_steps', [])) + "\n"
            f"Code Before:\n{retrieved_item.get('code_before', '')}\n"
            f"Code After:\n{retrieved_item.get('code_after', '')}\n"
            f"Extra Tips: {retrieved_item.get('extra_tips', '')}\n"
        )

        history_context = ""
        if conversation_history:
            history_context = "Prior Conversation Turns:\n" + "\n".join(
                f"- {m.get('role', 'user').capitalize()}: {m.get('content', '')}"
                for m in conversation_history[-4:]
            ) + "\n\n"

        prompt = (
            "You are FrontFix AI, an expert technical support engineer (Team B: Frontend Support). "
            "A web developer pasted an error or asked for technical help. "
            "Explain the issue clearly and provide step-by-step fix instructions. "
            "You MUST ground your answer in the CANONICAL KNOWLEDGE BASE ARTICLE below. "
            "Interpret the user's latest query in the context of any prior conversation turns. "
            "Never suggest destructive shell commands (like rm -rf, drop table, del /f). "
            "You must respond with ONLY a valid raw JSON object (no markdown backticks, no markdown wrapper) "
            "containing these exact keys:\n"
            "{\n"
            '  "problem": "Clear 1-2 sentence description of the problem",\n'
            '  "likely_cause": "Detailed technical explanation of why this happens",\n'
            '  "fix_steps": ["1. First actionable step...", "2. Second actionable step...", "3. Third step..."],\n'
            '  "code_before": "// Snippet demonstrating the bug",\n'
            '  "code_after": "// Snippet demonstrating the corrected code",\n'
            '  "extra_tips": "Performance, prevention, or framework specific tips"\n'
            "}\n\n"
            f"CANONICAL KNOWLEDGE BASE ARTICLE:\n{canonical_context}\n\n"
            f"{history_context}"
            f"LATEST DEVELOPER QUERY:\n{user_query}\n\n"
            "JSON Response:"
        )

        # 1. Try Gemini REST API
        if self.gemini_api_key:
            try:
                res = self._call_gemini(prompt)
                if res:
                    return res, "gemini"
            except Exception as e:
                logger.warning(f"Gemini API request failed: {e}")

        # 2. Try OpenAI-compatible API if configured
        if self.openai_api_key:
            try:
                res = self._call_openai(prompt)
                if res:
                    return res, "openai"
            except Exception as e:
                logger.warning(f"OpenAI API request failed: {e}")

        # Fallback to canonical knowledge base
        return None, "knowledge_base"

    def _call_gemini(self, prompt: str) -> Optional[Dict[str, Any]]:
        # ponytail: direct REST call avoids heavy grpc / version churn
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.preferred_model}:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return self._parse_json_response(text)
        return None

    def _call_openai(self, prompt: str) -> Optional[Dict[str, Any]]:
        url = f"{self.openai_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": [
                {"role": "system", "content": "You are a frontend engineering assistant returning valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        res = requests.post(url, json=payload, headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            text = data["choices"][0]["message"]["content"]
            return self._parse_json_response(text)
        return None

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        """Clean and extract json object from model text."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and "problem" in parsed and "likely_cause" in parsed:
                return parsed
        except Exception:
            pass
        return None
