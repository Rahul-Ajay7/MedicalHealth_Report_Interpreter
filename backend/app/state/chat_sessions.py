# Option A: Redis (production-grade)
# pip install redis
# Set REDIS_URL in .env

import os
import json
from typing import Any, Dict, Optional

REDIS_URL = os.getenv("REDIS_URL")

if REDIS_URL:
    import redis
    _redis = redis.from_url(REDIS_URL, decode_responses=True)

    def get_session(file_id: str) -> Optional[Dict]:
        data = _redis.get(f"chat:{file_id}")
        return json.loads(data) if data else None

    def set_session(file_id: str, data: Dict, ttl: int = 3600):
        _redis.setex(f"chat:{file_id}", ttl, json.dumps(data))

else:
    # Fallback: in-memory (dev only)
    _store: Dict[str, Any] = {}

    def get_session(file_id: str) -> Optional[Dict]:
        return _store.get(file_id)

    def set_session(file_id: str, data: Dict, ttl: int = 3600):
        _store[file_id] = data

# Keep CHAT_SESSIONS dict for backward compat
CHAT_SESSIONS: Dict[str, Any] = {}