from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from .engine import DiagnosticEngine

app = FastAPI(
    title="FrontFix AI Backend",
    description="Minimal, high-performance API for frontend error resolution & diagnostics (Team B)",
    version="2.0.0"
)

# Enable CORS for frontend web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = DiagnosticEngine()

class DiagnoseRequest(BaseModel):
    query: str
    enable_privacy: Optional[bool] = True

@app.get("/")
def health_check():
    return {
        "app": "FrontFix AI Backend",
        "team": "Team B",
        "status": "online",
        "version": "2.0.0"
    }

@app.post("/api/diagnose")
def diagnose_error(req: DiagnoseRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    result = engine.diagnose(req.query, enable_privacy=req.enable_privacy)
    return {
        "success": True,
        "data": result
    }

@app.get("/api/presets")
def get_presets():
    return {
        "presets": engine.list_presets()
    }
