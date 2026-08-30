import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# ---------- Passwords ----------
# Using `bcrypt` directly rather than passlib's CryptContext: passlib 1.7.4's
# bcrypt backend detection breaks on bcrypt>=4.1 (raises on the 72-byte-limit
# self-test). bcrypt itself already enforces the 72-byte input limit.

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ---------- JWT ----------

def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Raises jose.JWTError if invalid/expired."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ---------- Invite codes ----------

def generate_invite_code() -> str:
    # Short, human-typeable code e.g. for reading aloud / SMS. 10 chars, URL-safe.
    return secrets.token_urlsafe(8)[:10]
