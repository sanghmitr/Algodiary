from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationType


class NotificationCreate(BaseModel):
    title: str
    body: str
    type: NotificationType = NotificationType.system
    scheduled_at: datetime | None = None


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    body: str
    type: NotificationType
    is_read: bool
    scheduled_at: datetime
    sent_at: datetime | None
    created_at: datetime
