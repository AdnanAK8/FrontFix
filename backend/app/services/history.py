from .sanitizer import SanitizerService


class HistoryService:
    FOLLOWUP_SIGNALS = [
        "how to",
        "step",
        "typescript",
        "ts",
        "next.js",
        "nextjs",
        "vite",
        "example",
        "why",
        "what if",
        "can you",
        "explain",
        "more detail",
        "mobile",
        "alternative",
        "syntax",
        "code",
        "what should i check next",
        "next step",
        "what next",
    ]

    @classmethod
    def process_history(cls, conversation_history: list | None, enable_privacy: bool = True) -> dict:
        """Bounds message count to 6 and character length to 500 per message.
        Sanitizes message content when privacy is active.
        """
        if not conversation_history or not isinstance(conversation_history, list):
            return {"sanitizedHistory": [], "redactionsCount": 0}

        total_redactions = 0
        bounded = conversation_history[-6:]
        sanitized_history = []

        for msg in bounded:
            if not msg or not isinstance(msg, dict):
                continue
            role = "assistant" if str(msg.get("role", "user")).lower() == "assistant" else "user"
            raw_content = str(msg.get("content", ""))[:500]

            clean_content = raw_content
            if enable_privacy:
                sanitized = SanitizerService.sanitize(raw_content)
                clean_content = sanitized["sanitizedText"]
                total_redactions += sanitized["redactionsCount"]

            sanitized_history.append({"role": role, "content": clean_content})

        return {
            "sanitizedHistory": sanitized_history,
            "redactionsCount": total_redactions,
        }

    @classmethod
    def resolve_context_with_history(cls, current_query: str, history: list | None) -> dict:
        """Resolves contextual follow-ups by enriching the query with prior turn context."""
        if not history or not isinstance(history, list):
            return {"enrichedQuery": current_query, "isMultiturnFollowup": False}

        last_topic = ""
        for i in range(len(history) - 1, -1, -1):
            msg = history[i]
            if not msg or not isinstance(msg, dict):
                continue
            content = msg.get("content", "")
            if msg.get("role") == "assistant":
                last_topic = content
                break
            elif msg.get("role") == "user" and len(content) > 15:
                last_topic = content
                break

        q_lower = current_query.lower()
        is_followup = any(sig in q_lower for sig in cls.FOLLOWUP_SIGNALS)

        if is_followup and last_topic:
            return {
                "enrichedQuery": f"{last_topic} {current_query}",
                "isMultiturnFollowup": True,
            }

        return {
            "enrichedQuery": current_query,
            "isMultiturnFollowup": False,
        }
