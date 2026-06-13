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
