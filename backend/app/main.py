# backend/app/main.py
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, recipes, logs, plans, shopping, goals, chat
from app.utils.logging_config import get_logger, setup_logging
from app.utils.request_context import request_id_var

setup_logging()
logger = get_logger(__name__)

app = FastAPI(title="LightBite API", version="1.0.0")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
    token = request_id_var.set(request_id)
    start = time.perf_counter()
    logger.info("→ %s %s", request.method, request.url.path)
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("← %s %s %s %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception("✗ %s %s failed after %.1fms", request.method, request.url.path, elapsed_ms)
        raise
    finally:
        request_id_var.reset(token)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(recipes.router)
app.include_router(logs.router)
app.include_router(plans.router)
app.include_router(shopping.router)
app.include_router(goals.router)
app.include_router(chat.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, reload_delay=0.5)
