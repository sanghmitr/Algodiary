from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.note import KnowledgeCategory


class SnippetCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    code: str
    language: str = Field(min_length=1, max_length=64)
    category: KnowledgeCategory | None = None
    description: str = ""
    task_id: UUID | None = None
    tags: list[str] = Field(default_factory=list)
    is_favorite: bool = False


class SnippetUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    code: str | None = None
    language: str | None = Field(default=None, min_length=1, max_length=64)
    category: KnowledgeCategory | None = None
    description: str | None = None
    task_id: UUID | None = None
    tags: list[str] | None = None
    is_favorite: bool | None = None


class SnippetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    task_id: UUID | None
    title: str
    code: str
    language: str
    category: KnowledgeCategory
    description: str
    tags: list[str]
    is_favorite: bool
    created_at: datetime
    updated_at: datetime

