import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from ..config import config


def is_allowed_origin(origin: str) -> bool:
    if not origin:
        return True

    allowed_set = set(config.allowed_origins)
    if origin in allowed_set:
        return True

    if re.match(r"^chrome-extension://[a-z0-9]+$", origin, re.IGNORECASE) or re.match(
        r"^moz-extension://[a-z0-9\-]+$", origin, re.IGNORECASE
    ):
        return True

    if config.env == "development" and re.match(r"^http://(localhost|127\.0\.0\.1)(:\d+)?$", origin):
        return True

    return False


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")

        # Handle Preflight OPTIONS
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            if origin and is_allowed_origin(origin):
                response.headers["access-control-allow-origin"] = origin
                response.headers["access-control-allow-methods"] = "GET, POST, OPTIONS"
                response.headers["access-control-allow-headers"] = "Content-Type, Authorization"
                response.headers["access-control-expose-headers"] = (
                    "ratelimit-limit, ratelimit-remaining, ratelimit-reset, x-ratelimit-limit"
                )
            return response

        response = await call_next(request)

        if origin and is_allowed_origin(origin):
            response.headers["access-control-allow-origin"] = origin
            response.headers["access-control-allow-methods"] = "GET, POST, OPTIONS"
            response.headers["access-control-allow-headers"] = "Content-Type, Authorization"
            response.headers["access-control-expose-headers"] = (
                "ratelimit-limit, ratelimit-remaining, ratelimit-reset, x-ratelimit-limit"
            )

        return response
