import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from ..services.engine import DiagnosticEngine
from ..utils.formatter import format_diagnostic_response


def create_chat_router(engine: DiagnosticEngine) -> APIRouter:
    chat_router = APIRouter()

    @chat_router.post("/diagnose")
    async def diagnose_issue(request: Request):
        try:
            body = await request.json()
        except Exception:
            return JSONResponse(status_code=400, content={"detail": "Invalid request body."})

        if not isinstance(body, dict):
            return JSONResponse(status_code=400, content={"detail": "Invalid request body."})

        query = body.get("query")
        if not query or not isinstance(query, str) or not query.strip():
            return JSONResponse(status_code=400, content={"detail": "Query cannot be empty."})

        conversation_history = body.get("conversation_history")
        if conversation_history is not None and not isinstance(conversation_history, list):
            return JSONResponse(
                status_code=400,
                content={"detail": "conversation_history must be an array of messages."},
            )

        enable_privacy = body.get("enable_privacy", True)
        stack = body.get("stack", "")
        framework = body.get("framework")
        source = body.get("source", "user_pasted")

        context = {
            "stack": stack,
            "detectedFramework": framework,
            "source": source,
        }

        diagnosis = await engine.diagnose(query, enable_privacy, conversation_history, context)
        formatted = format_diagnostic_response(diagnosis)

        return {
            "success": True,
            "data": formatted,
        }

    @chat_router.get("/presets")
    async def get_presets():
        presets = engine.list_presets()
        return {"presets": presets}

    @chat_router.get("/knowledge")
    async def get_knowledge():
        issues = [
            {
                "id": k.get("id"),
                "category": k.get("category"),
                "title": k.get("title"),
                "problem": k.get("problem"),
            }
            for k in engine.knowledge_base
        ]
        return {
            "total_issues": len(issues),
            "issues": issues,
        }

    return chat_router
