import os
from pathlib import Path
from dotenv import load_dotenv

# App directories
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from project root or backend root
if (PROJECT_ROOT / ".env").exists():
    load_dotenv(PROJECT_ROOT / ".env")
elif (BACKEND_DIR / ".env").exists():
    load_dotenv(BACKEND_DIR / ".env")
else:
    load_dotenv()


def is_real_key(value: str | None) -> bool:
    if not value or not isinstance(value, str):
        return False
    val = value.strip().lower()
    placeholders = {
        "changeme",
        "placeholder",
        "your_gemini_api_key_here",
        "your_openai_api_key_here",
        "none",
        "null",
        "test",
        "undefined",
    }
    if val in placeholders:
        return False
    if val.startswith("your_") or val.startswith("paste_") or val.startswith("<"):
        return False
    return len(val) >= 12


raw_allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
default_allowed_origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://adnanak8.github.io",
]

if raw_allowed_origins:
    parsed_allowed_origins = [s.strip() for s in raw_allowed_origins.split(",") if s.strip()]
else:
    parsed_allowed_origins = default_allowed_origins


class Config:
    env: str = os.getenv("NODE_ENV", os.getenv("ENV", "development"))
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    gemini_api_key: str = (os.getenv("GEMINI_API_KEY", "")).strip()
    gemini_model: str = (os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-1.5-flash"))).strip()
    openai_api_key: str = (os.getenv("OPENAI_API_KEY", "")).strip()
    openai_base_url: str = (os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")).rstrip("/")
    openai_model: str = (os.getenv("OPENAI_MODEL", "gpt-4o-mini")).strip()
    allowed_origins: list[str] = parsed_allowed_origins
    max_log_file_size: int = 2 * 1024 * 1024  # 2MB
    is_gemini_configured: bool = is_real_key(os.getenv("GEMINI_API_KEY"))
    is_openai_configured: bool = is_real_key(os.getenv("OPENAI_API_KEY"))
    knowledge_path: Path = BACKEND_DIR / "data" / "knowledge.json"


config = Config()
