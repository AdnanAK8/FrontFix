from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import config
from .services.engine import DiagnosticEngine
from .routes.health import create_health_router
from .routes.chat import create_chat_router
from .routes.diagnostics import create_diagnostics_router
from .routes.feedback import create_feedback_router, FeedbackStore
from .middleware.cors import DynamicCORSMiddleware
from .middleware.rate_limiter import RateLimiterMiddleware


def create_app(custom_options: dict | None = None) -> FastAPI:
    opts = custom_options or {}
    engine: DiagnosticEngine = opts.get("engine") or DiagnosticEngine(opts)
    feedback_store: FeedbackStore = opts.get("feedbackStore") or FeedbackStore()

    app = FastAPI(
        title="FrontFix AI Backend (Python/FastAPI)",
        description="FrontFix AI — Python/FastAPI Diagnostic Backend (Team B: Frontend Support)",
        version="3.0.0",
        docs_url="/docs",
        redoc_url=None,
    )

    # Attach instances to app state
    app.state.engine = engine
    app.state.feedback_store = feedback_store

    # 1. Custom CORS & Security Headers Middleware
    app.add_middleware(DynamicCORSMiddleware)

    # 2. Rate Limiting Middleware
    app.add_middleware(RateLimiterMiddleware, api_limit=60, upload_limit=20, window_seconds=60)

    # 3. Global Exception Handlers
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=400,
            content={"detail": "Invalid request body."},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        print(f"[ErrorHandler] {request.method} {request.url.path} - {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Please try again later."},
        )

    # 4. Mount Health Route
    app.include_router(create_health_router(engine), prefix="")

    # 5. Mount API Routes
    app.include_router(create_chat_router(engine), prefix="/api")
    app.include_router(create_diagnostics_router(engine), prefix="/api")
    app.include_router(create_feedback_router(feedback_store), prefix="/api/feedback")

    # 6. Static files for frontend UI (/ui)
    current_dir = Path(__file__).resolve().parent
    frontend_dir = current_dir.parent.parent / "frontend"
    if frontend_dir.exists():
        dist_path = frontend_dir / "dist"
        static_dir = dist_path if dist_path.exists() else frontend_dir
        app.mount("/ui", StaticFiles(directory=str(static_dir), html=True), name="ui")

    return app


app = create_app()
