import uvicorn
from app.main import app
from app.config import config

if __name__ == "__main__":
    engine = app.state.engine
    print("========================================================")
    print("  ⚡ FrontFix AI — Python/FastAPI Diagnostic Engine")
    print("  Team B: Frontend Support")
    print("========================================================")
    print(f"- Status: Online & listening on http://{config.host}:{config.port}")
    print(f"- Knowledge Base Issues: {len(engine.knowledge_base)}")
    llm_status = "Active" if engine.llm_service.is_available() else "Canonical Knowledge Mode (No genuine API key detected)"
    print(f"- LLM Grounding: {llm_status}")
    print(f"- Environment: {config.env}")
    print(f"- Allowed Origins: {', '.join(config.allowed_origins)}")
    print("========================================================")

    uvicorn.run(
        app,
        host=config.host,
        port=config.port,
        log_level="info",
    )
