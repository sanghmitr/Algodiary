import asyncio
from datetime import date, datetime, timedelta, timezone
from uuid import UUID
from pywebpush import WebPushException, webpush
from sqlalchemy import func, select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.note import Note
from app.models.notification import NotificationType
from app.models.progress import ProgressLog
from app.models.snippet import Snippet
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.redis_client import get_redis
from app.services.notification_service import create_notification, publish_user_event
from app.workers.celery_app import celery_app


async def _send_push(user: User, title: str, body: str) -> None:
    if not user.push_subscription or not settings.vapid_private_key:
        return
    try:
        webpush(
            subscription_info=user.push_subscription,
            data=f"{title}\n{body}",
            vapid_private_key=settings.vapid_private_key,
            vapid_claims=settings.vapid_claims,
        )
    except WebPushException:
        return


@celery_app.task(name="app.workers.notification_tasks.daily_study_reminder")
def daily_study_reminder() -> None:
    asyncio.run(_daily_study_reminder())


async def _daily_study_reminder() -> None:
    async with AsyncSessionLocal() as db:
        users = (await db.scalars(select(User).where(User.is_active.is_(True), User.push_subscription.is_not(None)))).all()
        for user in users:
            task = await db.scalar(
                select(Task).where(Task.user_id == user.id, Task.status.in_([TaskStatus.todo, TaskStatus.in_progress])).order_by(Task.day_number)
            )
            if task:
                title = "Daily prep reminder"
                body = f"Day {task.day_number}: keep your FAANG prep streak alive."
                await _send_push(user, title, body)
                await create_notification(db, user.id, title, body, NotificationType.reminder, sent_at=datetime.now(timezone.utc))


@celery_app.task(name="app.workers.notification_tasks.streak_check")
def streak_check() -> None:
    asyncio.run(_streak_check())


async def _streak_check() -> None:
    async with AsyncSessionLocal() as db:
        redis = get_redis()
        users = (await db.scalars(select(User).where(User.is_active.is_(True)))).all()
        yesterday = date.today() - timedelta(days=1)
        today = date.today()
        for user in users:
            logged_yesterday = await db.scalar(select(func.count()).select_from(ProgressLog).where(ProgressLog.user_id == user.id, ProgressLog.logged_date == yesterday))
            logged_today = await db.scalar(select(func.count()).select_from(ProgressLog).where(ProgressLog.user_id == user.id, ProgressLog.logged_date == today))
            if not logged_yesterday:
                await redis.set(f"streak:{user.id}", 0)
            if not logged_today:
                await _send_push(user, "Do not break your streak", "Log today's progress before the day ends.")


@celery_app.task(name="app.workers.notification_tasks.achievement_check")
def achievement_check(user_id: str) -> None:
    asyncio.run(_achievement_check(UUID(user_id)))


async def _achievement_check(user_id: UUID) -> None:
    async with AsyncSessionLocal() as db:
        redis = get_redis()
        achievements: list[tuple[str, str]] = []
        done_days = await db.scalar(select(func.count()).select_from(Task).where(Task.user_id == user_id, Task.status == TaskStatus.done)) or 0
        for milestone in [7, 14, 30, 45, 60, 75, 90]:
            if done_days >= milestone:
                achievements.append((f"days-{milestone}", f"{milestone} prep days completed"))
        mocks = await db.scalar(select(func.count()).select_from(ProgressLog).where(ProgressLog.user_id == user_id, ProgressLog.mock_completed.is_(True))) or 0
        if mocks:
            achievements.append(("first-mock", "First mock interview completed"))
        streak = int(await redis.get(f"streak:{user_id}") or 0)
        if streak >= 7:
            achievements.append(("streak-7", "7-day streak unlocked"))
        problems = await db.scalar(select(func.sum(ProgressLog.problems_solved)).where(ProgressLog.user_id == user_id)) or 0
        if problems >= 50:
            achievements.append(("problems-50", "50 problems solved"))
        revision = await db.scalar(select(func.count()).select_from(Note).where(Note.user_id == user_id, Note.is_revision_ready.is_(True), Note.deleted_at.is_(None))) or 0
        if revision:
            achievements.append(("first-revision-note", "First revision-ready note"))
        kb_items = (await db.scalar(select(func.count()).select_from(Note).where(Note.user_id == user_id, Note.deleted_at.is_(None))) or 0) + (
            await db.scalar(select(func.count()).select_from(Snippet).where(Snippet.user_id == user_id, Snippet.deleted_at.is_(None))) or 0
        )
        if kb_items >= 10:
            achievements.append(("kb-10", "10 Knowledge Base items"))
        user = await db.get(User, user_id)
        for key, title in achievements:
            redis_key = f"achievement:{user_id}:{key}"
            if await redis.set(redis_key, "1", ex=365 * 86400, nx=True):
                await publish_user_event(user_id, "achievement", {"key": key, "title": title})
                if user:
                    await _send_push(user, "Achievement unlocked", title)
                    await create_notification(db, user_id, "Achievement unlocked", title, NotificationType.achievement, sent_at=datetime.now(timezone.utc))
