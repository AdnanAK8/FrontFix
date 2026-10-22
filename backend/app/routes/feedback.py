from datetime import datetime, timezone
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse


class FeedbackStore:
    def __init__(self):
        self.feedback_log = []

    def submit_feedback(self, data: dict) -> dict:
        record = {
            "issue_title": data.get("issue_title", "General"),
            "is_helpful": data.get("is_helpful"),
            "query_text": data.get("query_text", ""),
            "comment": data.get("comment", ""),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.feedback_log.append(record)
        return {
            "success": True,
            "message": "Thank you for your feedback! It helps improve FrontFix AI.",
            "total_feedback_count": len(self.feedback_log),
        }

    def get_stats(self) -> dict:
        total = len(self.feedback_log)
        positive = sum(1 for f in self.feedback_log if f.get("is_helpful") is True)
        negative = total - positive
        ratio = round((positive / total) * 100, 1) if total > 0 else 0.0

        return {
            "total_feedback": total,
            "helpful_count": positive,
            "unhelpful_count": negative,
            "satisfaction_rate_percent": ratio,
            "recent_feedback": self.feedback_log[-10:],
        }


def create_feedback_router(feedback_store: FeedbackStore) -> APIRouter:
    feedback_router = APIRouter()

    @feedback_router.post("")
    @feedback_router.post("/")
    async def submit_feedback(request: Request):
        try:
            body = await request.json()
        except Exception:
            return JSONResponse(status_code=400, content={"detail": "Invalid request body."})

        if not isinstance(body, dict):
            return JSONResponse(status_code=400, content={"detail": "Invalid request body."})

        if not isinstance(body.get("is_helpful"), bool):
            return JSONResponse(status_code=400, content={"detail": 'Field "is_helpful" must be a boolean.'})

        res = feedback_store.submit_feedback(body)
        return res

    @feedback_router.get("/stats")
    async def get_feedback_stats():
        return feedback_store.get_stats()

    return feedback_router
