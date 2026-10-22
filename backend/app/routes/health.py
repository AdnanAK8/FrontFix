import platform
from fastapi import APIRouter
from ..services.engine import DiagnosticEngine

router = APIRouter()


def create_health_router(engine: DiagnosticEngine) -> APIRouter:
    health_router = APIRouter()

    @health_router.get("/")
    async def get_health():
        return {
            "app": "FrontFix AI Backend (Python/FastAPI)",
            "team": "Team B (Frontend Support)",
            "status": "online",
            "version": "3.0.0",
            "runtime": f"Python {platform.python_version()}",
            "knowledge_base_size": len(engine.knowledge_base),
            "llm_grounding_available": engine.llm_service.is_available(),
            "supported_domains": [
                "JavaScript & TypeScript Errors",
                "React & Hooks Lifecycle",
                "CSS Layout & Centering",
                "HTML & Form Accessibility",
                "API Integration & CORS",
                "Browser Console & Web Security",
            ],
        }

    return health_router
