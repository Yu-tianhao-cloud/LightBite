# Backend Logging System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an adapted version of the tmagents3.0 logging system to the recipe-app FastAPI backend.

**Architecture:** Introduce focused logging utilities under `app/utils/`: a context module for request IDs, formatters/handlers, and centralized `dictConfig` setup. Wire logging into FastAPI via middleware that assigns a request ID and logs request start/end/error. Keep application code usage simple through `get_logger(__name__)`.

**Tech Stack:** FastAPI, Python `logging.config.dictConfig`, `contextvars`, `concurrent-log-handler`, existing uvicorn/FastAPI runtime.

---

## File Structure

- Create `app/utils/__init__.py`: makes `app.utils` a package.
- Create `app/utils/request_context.py`: stores per-request `request_id` using `ContextVar`.
- Create `app/utils/log_utils.py`: adapted `ColorFormatter` and `DailyConcurrentRotatingFileHandler` from `tmagents3.0`.
- Create `app/utils/logging_config.py`: central logging setup, request ID filter, file/console handlers, `get_logger()`.
- Modify `app/main.py`: initialize logging before app creation, add request logging middleware.
- Modify `app/auth.py`: replace JWT debug `print()` calls with logger warnings.
- Modify `requirements.txt`: add `concurrent-log-handler`.
- Modify `.gitignore`: ignore `logs/` while keeping source files tracked.

---

### Task 1: Add logging utility package

**Files:**
- Create: `app/utils/__init__.py`
- Create: `app/utils/request_context.py`
- Create: `app/utils/log_utils.py`

- [ ] **Step 1: Create `app/utils/__init__.py`**

```python
"""Utility modules for the backend application."""
```

- [ ] **Step 2: Create `app/utils/request_context.py`**

```python
from contextvars import ContextVar

request_id_var = ContextVar("request_id", default="-")
```

- [ ] **Step 3: Create `app/utils/log_utils.py`**

```python
import datetime
import logging
import os

from concurrent_log_handler import ConcurrentRotatingFileHandler


class ColorFormatter(logging.Formatter):
    COLORS = {
        "DEBUG": "\033[0;37m",
        "INFO": "\033[0;36m",
        "WARNING": "\033[0;33m",
        "ERROR": "\033[0;31m",
        "CRITICAL": "\033[1;41m",
    }
    RESET = "\033[0m"

    def format(self, record):
        original_levelname = record.levelname
        original_msg = record.msg
        color = self.COLORS.get(original_levelname, self.RESET)
        record.levelname = f"{color}{original_levelname}{self.RESET}"
        record.msg = f"{color}{original_msg}{self.RESET}"
        try:
            return super().format(record)
        finally:
            record.levelname = original_levelname
            record.msg = original_msg


class DailyConcurrentRotatingFileHandler(ConcurrentRotatingFileHandler):
    """Concurrent-safe rotating file handler that switches files daily."""

    def __init__(self, log_dir, base_filename="lightbite", *args, **kwargs):
        self.log_dir = log_dir
        self.base_filename_prefix = os.path.join(log_dir, base_filename)
        self.current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        filename = f"{self.base_filename_prefix}_{self.current_date}.log"
        super().__init__(filename, *args, **kwargs)

    def emit(self, record):
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        if today != self.current_date:
            self.acquire()
            try:
                self.current_date = today
                new_filename = f"{self.base_filename_prefix}_{today}.log"
                if self.stream:
                    self.stream.close()
                self.baseFilename = new_filename
                self.stream = self._open()
            finally:
                self.release()
        super().emit(record)
```

- [ ] **Step 4: Syntax check**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && python -m py_compile app/utils/request_context.py app/utils/log_utils.py
```

Expected: no output and exit code 0.

---

### Task 2: Add centralized logging configuration

**Files:**
- Create: `app/utils/logging_config.py`
- Modify: `requirements.txt`
- Modify: `.gitignore`

- [ ] **Step 1: Create `app/utils/logging_config.py`**

```python
import logging
import logging.config
import os

from app.utils.log_utils import ColorFormatter, DailyConcurrentRotatingFileHandler
from app.utils.request_context import request_id_var

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

STANDARD_FORMAT = "[%(asctime)s][%(levelname)s][request_id:%(request_id)s][%(name)s][%(filename)s:%(lineno)d] %(message)s"
CONSOLE_FORMAT = "[%(asctime)s][%(levelname)s][request_id:%(request_id)s][%(filename)s:%(lineno)d] %(message)s"


class RequestIDFilter(logging.Filter):
    def filter(self, record):
        try:
            record.request_id = request_id_var.get()
        except Exception:
            record.request_id = "-"
        return True


class NoisyDependencyFilter(logging.Filter):
    """Suppress repeated low-value dependency noise while keeping real errors."""

    NOISY_PATTERNS = (
        "BrokenResourceError",
        "anyio.ClosedResourceError",
        "Error parsing SSE message",
    )

    def filter(self, record):
        message = record.getMessage()
        return not any(pattern in message for pattern in self.NOISY_PATTERNS)


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {"format": STANDARD_FORMAT},
        "color": {"()": ColorFormatter, "format": CONSOLE_FORMAT},
    },
    "filters": {
        "request_id": {"()": RequestIDFilter},
        "noisy_dependency": {"()": NoisyDependencyFilter},
    },
    "handlers": {
        "console": {
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "class": "logging.StreamHandler",
            "formatter": "color",
            "filters": ["request_id", "noisy_dependency"],
        },
        "file": {
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "class": "app.utils.log_utils.DailyConcurrentRotatingFileHandler",
            "formatter": "standard",
            "log_dir": LOG_DIR,
            "base_filename": "lightbite",
            "maxBytes": 40 * 1024 * 1024,
            "backupCount": 10,
            "encoding": "utf-8",
            "filters": ["request_id", "noisy_dependency"],
        },
    },
    "loggers": {
        "": {
            "handlers": ["file", "console"],
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "uvicorn": {
            "handlers": ["file", "console"],
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "uvicorn.error": {
            "handlers": ["file", "console"],
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["file", "console"],
            "level": os.getenv("LOG_LEVEL", "WARNING"),
            "propagate": False,
        },
    },
}


def setup_logging() -> None:
    logging.config.dictConfig(LOGGING_CONFIG)


def get_logger(name: str | None = None) -> logging.Logger:
    return logging.getLogger(name if name else __name__)
```

- [ ] **Step 2: Add dependency to `requirements.txt`**

Append:

```text
concurrent-log-handler>=0.9.25
```

- [ ] **Step 3: Ignore generated log files in `.gitignore`**

Append:

```gitignore
logs/
*.log
*.log.*
```

- [ ] **Step 4: Install dependency if missing**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && pip install concurrent-log-handler
```

Expected: package installs or reports already satisfied.

- [ ] **Step 5: Import check**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && python -c "from app.utils.logging_config import setup_logging, get_logger; setup_logging(); get_logger(__name__).info('logging import ok')"
```

Expected: colored console log containing `logging import ok`; `logs/lightbite_YYYY-MM-DD.log` created.

---

### Task 3: Wire request logging into FastAPI

**Files:**
- Modify: `app/main.py`

- [ ] **Step 1: Replace `app/main.py` with request logging setup**

```python
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
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
```

- [ ] **Step 2: Syntax check**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && python -m py_compile app/main.py
```

Expected: no output and exit code 0.

---

### Task 4: Replace auth debug prints with logger

**Files:**
- Modify: `app/auth.py`

- [ ] **Step 1: Add logger import and instance**

At the imports section, add:

```python
from app.utils.logging_config import get_logger
```

After constants/imports, add:

```python
logger = get_logger(__name__)
```

- [ ] **Step 2: Replace JWT debug prints**

Replace:

```python
print(f"[AUTH DEBUG] JWT decode failed: {e}")
print(f"[AUTH DEBUG] Token (first 50 chars): {token[:50]}...")
```

With:

```python
logger.warning("JWT decode failed: %s", e)
logger.debug("Token prefix: %s...", token[:50])
```

- [ ] **Step 3: Syntax check**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && python -m py_compile app/auth.py
```

Expected: no output and exit code 0.

---

### Task 5: Verify end-to-end logging behavior

**Files:**
- No source edits expected.

- [ ] **Step 1: Run compile check for all touched files**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && python -m py_compile app/main.py app/auth.py app/utils/request_context.py app/utils/log_utils.py app/utils/logging_config.py
```

Expected: no output and exit code 0.

- [ ] **Step 2: Start API server**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Expected: server starts without import errors.

- [ ] **Step 3: Send a health-like request to an existing endpoint**

Run in another shell:

```bash
curl -i http://127.0.0.1:8000/api/v1/recipes?size=1
```

Expected: response includes `X-Request-ID` header. Console shows request start/end logs.

- [ ] **Step 4: Confirm file log exists**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && ls logs
```

Expected: `lightbite_YYYY-MM-DD.log` exists.

- [ ] **Step 5: Inspect log content**

Run:

```bash
cd "c:/Users/余天皓/Desktop/recipe-app/backend" && tail -20 logs/lightbite_$(date +%Y-%m-%d).log
```

Expected: entries include `[request_id:<id>]`, `→ GET /api/v1/recipes`, and `← GET /api/v1/recipes`.

---

## Self-Review

- Spec coverage: A adapted version is covered: colored console logs, daily concurrent file logs, `request_id`, middleware request logging, auth print replacement, dependency, gitignore.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `request_id_var`, `setup_logging`, `get_logger`, `ColorFormatter`, and `DailyConcurrentRotatingFileHandler` names are consistent across tasks.
