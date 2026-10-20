import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from .engine import DiagnosticEngine

app = FastAPI(
    title="FrontFix AI — Frontend Support Engine (Team B)",
    description="High-performance, privacy-first diagnostic chatbot for Frontend Web Issues",
    version="2.5.0"
)

# Enable CORS for local web clients and remote deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = DiagnosticEngine()

# In-memory store for session feedback and analytics (ponytail: native dict avoids DB setup for simple telemetry)
feedback_log: List[Dict[str, Any]] = []

# Optional static file mount so full-stack app can be served from a single port in Docker or production
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/ui", StaticFiles(directory=frontend_dir, html=True), name="frontend")

class DiagnoseRequest(BaseModel):
    query: str
    enable_privacy: Optional[bool] = True
    session_id: Optional[str] = "default-session"
    conversation_history: Optional[List[Dict[str, str]]] = None

class FeedbackRequest(BaseModel):
    issue_title: Optional[str] = "General"
    is_helpful: bool
    query_text: Optional[str] = ""
    comment: Optional[str] = ""

@app.get("/")
def health_check():
    return {
        "app": "FrontFix AI Backend",
        "team": "Team B (Frontend Support)",
        "status": "online",
        "version": "2.5.0",
        "knowledge_base_size": len(engine.knowledge_base),
        "supported_domains": [
            "JavaScript & TypeScript Errors",
            "React & Hooks Lifecycle",
            "CSS Layout & Centering",
            "HTML & Form Accessibility",
            "API Integration & CORS",
            "Browser Console & Web Security"
        ]
    }

@app.post("/api/diagnose")
def diagnose_error(req: DiagnoseRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    result = engine.diagnose(
        user_input=req.query,
        enable_privacy=req.enable_privacy,
        conversation_history=req.conversation_history
    )
    return {
        "success": True,
        "data": result
    }

@app.post("/api/upload-log")
async def upload_log_file(file: UploadFile = File(...)):
    """
    Bonus: Upload a frontend log file or browser console dump.
    Returns error extraction, summary, and RAG-grounded fixes.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    
    try:
        content_bytes = await file.read()
        content_text = content_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    analysis = engine.analyze_log_file(content_text)
    return {
        "success": True,
        "filename": file.filename,
        "analysis": analysis
    }

@app.post("/api/feedback")
def submit_feedback(fb: FeedbackRequest):
    """
    Record user thumbs up / thumbs down feedback on answers.
    """
    record = {
        "issue_title": fb.issue_title,
        "is_helpful": fb.is_helpful,
        "query_text": fb.query_text,
        "comment": fb.comment
    }
    feedback_log.append(record)
    return {
        "success": True,
        "message": "Thank you for your feedback! It helps improve FrontFix AI.",
        "total_feedback_count": len(feedback_log)
    }

@app.get("/api/presets")
def get_presets():
    """Return top 10 preset issues for one-click testing."""
    return {
        "presets": engine.list_presets()
    }

@app.get("/api/knowledge")
def get_knowledge_summary():
    """Return catalog of all 32 curated issues for documentation and browsing."""
    return {
        "total_issues": len(engine.knowledge_base),
        "issues": [
            {
                "id": k["id"],
                "category": k["category"],
                "title": k["title"],
                "problem": k["problem"]
            }
            for k in engine.knowledge_base
        ]
    }
