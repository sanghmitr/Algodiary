from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services.notification_service import list_notifications


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationRead])
async def list_user_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await list_notifications(db, current_user.id)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(notification_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = await db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.execute(update(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id).values(is_read=True))
    await db.commit()
    await db.refresh(notification)
    return notification


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    await db.execute(update(Notification).where(Notification.user_id == current_user.id).values(is_read=True))
    await db.commit()


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(notification_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    await db.execute(delete(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    await db.commit()
