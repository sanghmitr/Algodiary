import uuid
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.redis_client import get_redis
from app.schemas.user import UserCreate


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


class DuplicateEmailError(ValueError):
    pass


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(user_id: uuid.UUID, expires_delta: timedelta, token_type: str) -> tuple[str, str, datetime]:
    expires_at = datetime.now(timezone.utc) + expires_delta
    jti = str(uuid.uuid4())
    payload = {"sub": str(user_id), "jti": jti, "type": token_type, "exp": expires_at}
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token, jti, expires_at


def create_access_token(user_id: uuid.UUID) -> tuple[str, str, datetime]:
    return _create_token(user_id, timedelta(minutes=settings.access_token_expire_minutes), "access")


def create_refresh_token(user_id: uuid.UUID) -> tuple[str, str, datetime]:
    return _create_token(user_id, timedelta(days=settings.refresh_token_expire_days), "refresh")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


async def register_user(db: AsyncSession, payload: UserCreate) -> User:
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise DuplicateEmailError("Email is already registered")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await db.scalar(select(User).where(User.email == email.lower(), User.is_active.is_(True)))
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def store_refresh_token(user_id: uuid.UUID, token: str) -> None:
    redis = get_redis()
    await redis.set(f"refresh:{user_id}", token, ex=settings.refresh_token_expire_days * 86400)


async def refresh_token_is_current(user_id: uuid.UUID, token: str) -> bool:
    return await get_redis().get(f"refresh:{user_id}") == token


async def blacklist_jti(jti: str, expires_at: int | None) -> None:
    ttl = max((expires_at or 0) - int(datetime.now(timezone.utc).timestamp()), 1)
    await get_redis().set(f"token:{jti}", "1", ex=ttl)
