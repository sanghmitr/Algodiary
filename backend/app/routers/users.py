import json
from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.note import Note
from app.models.snippet import Snippet
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.redis_client import get_redis
from app.schemas.user import DashboardStats, PushSubscription, UserRead, UserUpdate


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_profile(payload: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> User:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    await db.commit()
    await db.refresh(current_user)
    await get_redis().delete(f"stats:{current_user.id}")
    return current_user


@router.post("/me/push-sub", response_model=UserRead)
async def save_push_subscription(payload: PushSubscription, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> User:
    current_user.push_subscription = payload.model_dump()
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me/push-sub", status_code=status.HTTP_204_NO_CONTENT)
async def remove_push_subscription(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    current_user.push_subscription = None
    await db.commit()


@router.get("/me/stats", response_model=DashboardStats)
async def stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    redis = get_redis()
    cache_key = f"stats:{current_user.id}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    total_done = await db.scalar(select(func.count()).select_from(Task).where(Task.user_id == current_user.id, Task.status == TaskStatus.done)) or 0
    week_start = date.today().toordinal() - 6
    problems = await db.scalar(
        select(func.count()).select_from(Task).where(
            Task.user_id == current_user.id,
            Task.status == TaskStatus.done,
            Task.dsa_topic.is_not(None),
            func.date(Task.updated_at) >= date.fromordinal(week_start),
        )
    ) or 0
    notes = await db.scalar(select(func.count()).select_from(Note).where(Note.user_id == current_user.id, Note.deleted_at.is_(None))) or 0
    snippets = await db.scalar(select(func.count()).select_from(Snippet).where(Snippet.user_id == current_user.id, Snippet.deleted_at.is_(None))) or 0
    revision = await db.scalar(select(func.count()).select_from(Note).where(Note.user_id == current_user.id, Note.deleted_at.is_(None), Note.is_revision_ready.is_(True))) or 0
    payload = {
        "total_tasks_done": total_done,
        "current_streak": int(await redis.get(f"streak:{current_user.id}") or 0),
        "avg_daily_score": 0,
        "days_remaining": (current_user.target_date - date.today()).days if current_user.target_date else None,
        "problems_solved_this_week": problems,
        "total_notes": notes,
        "total_snippets": snippets,
        "revision_ready_count": revision,
    }
    await redis.set(cache_key, json.dumps(payload, default=str), ex=300)
    return payload
