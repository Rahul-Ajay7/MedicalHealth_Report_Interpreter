import os
import time
import logging
from collections import defaultdict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.upload import router as upload_router
from app.routes.analyze import router as analyze_router
from app.routes.history import router as history_router
from app.routes.chat import router as chat_router
from app.routes.report import router as report_router

# ── Logging — level from env; PII is only ever logged at DEBUG ───────────────
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Medical Report Interpreter")


CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Basic in-memory rate limiting (per client IP, fixed window) ──────────────
# Baseline DoS / brute-force protection. NOTE: per-process + resets on restart;
# for multi-worker / multi-instance prod, move this to Redis.
_RATE_LIMIT  = int(os.getenv("RATE_LIMIT", 120))   # max requests
_RATE_WINDOW = int(os.getenv("RATE_WINDOW", 60))   # per N seconds
_hits: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    # Don't throttle CORS preflight or the health check
    if request.method == "OPTIONS" or request.url.path == "/":
        return await call_next(request)

    ip = _client_ip(request)
    now = time.monotonic()
    window_start = now - _RATE_WINDOW
    recent = [t for t in _hits[ip] if t > window_start]

    if len(recent) >= _RATE_LIMIT:
        logger.warning("Rate limit exceeded | ip=%s", ip)
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down."},
        )

    recent.append(now)
    _hits[ip] = recent
    return await call_next(request)


# ── Security headers on every response ───────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store"
    return response


# ── Generic error handler — never leak stack traces / internals to clients ───
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )


app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(history_router)
app.include_router(chat_router)
app.include_router(report_router)


@app.get("/")
def root():
    return {"status": "API is running!"}


@app.get("/languages")
def languages():
    """Supported output languages for the report explanation + chat."""
    from app.services.languages import supported_languages
    return {"languages": supported_languages()}