from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse
from starlette.staticfiles import StaticFiles

from app.config import settings
from app.database import get_session
from app.redis_client import close_redis
from app.routers import auth, knowledge_base, notes, notifications, progress, snippets, tasks, users, websocket


limiter = Limiter(key_func=get_remote_address, storage_uri=settings.redis_url)


def create_app() -> FastAPI:
    app = FastAPI(title="Algodiary API", version="1.0.0")
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(_, exc: RateLimitExceeded):
        return JSONResponse(status_code=429, content={"detail": f"Rate limit exceeded: {exc.detail}"})

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/db")
    async def health_db(db: AsyncSession = Depends(get_session)) -> dict[str, str]:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(tasks.router, prefix="/api/v1")
    app.include_router(notes.router, prefix="/api/v1")
    app.include_router(snippets.router, prefix="/api/v1")
    app.include_router(knowledge_base.router, prefix="/api/v1")
    app.include_router(progress.router, prefix="/api/v1")
    app.include_router(notifications.router, prefix="/api/v1")
    app.include_router(websocket.router)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    @app.on_event("shutdown")
    async def shutdown() -> None:
        await close_redis()

    return app


app = create_app()
