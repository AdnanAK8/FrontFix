import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_limit: int = 60, upload_limit: int = 20, window_seconds: int = 60):
        super().__init__(app)
        self.api_limit = api_limit
        self.upload_limit = upload_limit
        self.window_seconds = window_seconds
        # client_ip -> list of timestamps
        self.api_requests = defaultdict(list)
        self.upload_requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith("/api"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        is_upload = path == "/api/upload-log"

        store = self.upload_requests if is_upload else self.api_requests
        max_limit = self.upload_limit if is_upload else self.api_limit

        # Clean old timestamps outside current window
        cutoff = now - self.window_seconds
        store[client_ip] = [t for t in store[client_ip] if t > cutoff]

        current_count = len(store[client_ip])
        remaining = max(0, max_limit - current_count)
        reset_time = int(self.window_seconds - (now - store[client_ip][0])) if store[client_ip] else self.window_seconds

        if current_count >= max_limit:
            msg = (
                "Too many file uploads, please try again shortly."
                if is_upload
                else "Too many requests, please slow down and try again in a minute."
            )
            response = JSONResponse(
                status_code=429,
                content={"success": False, "detail": msg},
            )
            response.headers["ratelimit-limit"] = str(max_limit)
            response.headers["ratelimit-remaining"] = "0"
            response.headers["ratelimit-reset"] = str(reset_time)
            response.headers["x-ratelimit-limit"] = str(max_limit)
            return response

        store[client_ip].append(now)
        response = await call_next(request)

        # Set rate limit headers on response
        response.headers["ratelimit-limit"] = str(max_limit)
        response.headers["ratelimit-remaining"] = str(remaining - 1)
        response.headers["ratelimit-reset"] = str(reset_time)
        response.headers["x-ratelimit-limit"] = str(max_limit)

        return response
