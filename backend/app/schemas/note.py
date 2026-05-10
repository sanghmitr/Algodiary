from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.note import KnowledgeCategory


class NoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    content: str = ""
    task_id: UUID | None = None
    category: KnowledgeCategory | None = None
    tags: list[str] = Field(default_factory=list)
    is_revision_ready: bool = False


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    content: str | None = None
    task_id: UUID | None = None
    category: KnowledgeCategory | None = None
    tags: list[str] | None = None
    is_pinned: bool | None = None
    is_revision_ready: bool | None = None


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    task_id: UUID | None
    title: str
    content: str
    category: KnowledgeCategory
    tags: list[str]
    is_pinned: bool
    is_revision_ready: bool
    created_at: datetime
    updated_at: datetime

