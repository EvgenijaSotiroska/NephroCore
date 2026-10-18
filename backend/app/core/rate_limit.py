import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, status


class RateLimiter:

    def __init__(self, limit: int, window_seconds: int, detail: str):
        self.limit = limit
        self.window = window_seconds
        self.detail = detail
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check_and_hit(self, key: str) -> None:
        """Count one call for this key, or raise 429 if its limit is used up."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()

            if len(hits) >= self.limit:
                retry_after = int(self.window - (now - hits[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=self.detail,
                    headers={"Retry-After": str(retry_after)},
                )

            hits.append(now)


ai_limiter = RateLimiter(
    limit=6,
    window_seconds=60 * 60,
    detail="You have reached the AI analysis limit. Try again later.",
)