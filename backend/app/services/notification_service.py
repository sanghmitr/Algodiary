import json
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType
from app.redis_client import get_redis


async def publish_user_event(user_id: UUID, event_type: str, data: dict) -> None:
    await get_redis().publish(f"ws:{user_id}", json.dumps({"type": event_type, "data": data}, default=str))


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    title: str,
    body: str,
    type_: NotificationType = NotificationType.system,
    scheduled_at: datetime | None = None,
    sent_at: datetime | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=type_,
        scheduled_at=scheduled_at or datetime.now(timezone.utc),
        sent_at=sent_at,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    await publish_user_event(user_id, "notification", {"id": str(notification.id), "title": title, "body": body})
    return notification


async def list_notifications(db: AsyncSession, user_id: UUID) -> list[Notification]:
    return (await db.scalars(select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc()))).all()

