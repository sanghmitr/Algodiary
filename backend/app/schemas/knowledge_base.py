from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from app.models.note import KnowledgeCategory


class LinkedTask(BaseModel):
    id: UUID
    day_number: int
    dsa_topic: str | None
    hld_topic: str | None
    lld_topic: str | None


class KBItem(BaseModel):
    id: UUID
    type: str
    title: str
    category: KnowledgeCategory
    tags: list[str]
    preview: str
    code_preview: str | None = None
    language: str | None
    is_pinned: bool | None
    is_revision_ready: bool | None
    is_favorite: bool | None
    linked_task: LinkedTask | None
    created_at: datetime
    updated_at: datetime


class KBFacetTag(BaseModel):
    tag: str
    count: int


class KBFacets(BaseModel):
    categories: dict[str, int]
    types: dict[str, int]
    top_tags: list[KBFacetTag]


class KBSearchResponse(BaseModel):
    results: list[KBItem]
    total: int
    page: int
    facets: KBFacets


class KBStats(BaseModel):
    total_notes: int
    total_snippets: int
    by_category: dict[str, int]
    revision_ready_count: int
    most_used_tags: list[KBFacetTag]
    recently_updated: list[KBItem]

