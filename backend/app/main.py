import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

from .engine import DiagnosticEngine

app = FastAPI(
    title="FrontFix AI — Frontend Support Engine (Team B)",
    description="High-performance, privacy-first diagnostic chatbot for Frontend Web Issues",
    version="2.6.0"
)

# ponytail: Production-safe CORS configuration with explicit origins and allow_credentials=False
DEFAULT_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://adnanak8.github.io"
]
env_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()] if env_origins else DEFAULT_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

engine = DiagnosticEngine()

# In-memory store for session feedback and analytics (ponytail: native dict avoids DB setup for simple telemetry)
feedback_log: List[Dict[str, Any]] = []

# Maximum upload limit: 2MB for log files
MAX_LOG_FILE_SIZE = 2 * 1024 * 1024

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
        "version": "2.6.0",
        "knowledge_base_size": len(engine.knowledge_base),
        "llm_grounding_available": engine.llm_client.is_available(),
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
    Validates file size (max 2MB), file type, sanitizes secrets, and extracts errors.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content_bytes = await file.read()

    # 1. Check empty file
    if len(content_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 2. Check maximum size limit (2MB)
    if len(content_bytes) > MAX_LOG_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {MAX_LOG_FILE_SIZE // (1024*1024)}MB."
        )

    # 3. Reject binary files (check for null bytes)
    if b'\x00' in content_bytes[:1024]:
        raise HTTPException(
            status_code=400,
            detail="Binary or executable file detected. Please upload a plain text (.log, .txt, .json) file."
        )

    try:
        content_text = content_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode text file: {str(e)}")

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

@app.get("/api/feedback/stats")
def get_feedback_stats():
    """Return aggregated metrics on recorded thumbs up/down user feedback."""
    total = len(feedback_log)
    positive = sum(1 for f in feedback_log if f.get("is_helpful"))
    negative = total - positive
    ratio = round((positive / total * 100), 1) if total > 0 else 0.0
    return {
        "total_feedback": total,
        "helpful_count": positive,
        "unhelpful_count": negative,
        "satisfaction_rate_percent": ratio,
        "recent_feedback": feedback_log[-10:]
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
