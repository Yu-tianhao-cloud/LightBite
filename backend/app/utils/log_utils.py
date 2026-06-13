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
