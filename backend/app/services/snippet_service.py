from datetime import datetime, timezone
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import KnowledgeCategory
from app.models.snippet import Snippet
from app.schemas.snippet import SnippetCreate, SnippetUpdate
from app.services.note_service import invalidate_kb_cache, normalize_tags, suggest_category
from app.services.notification_service import publish_user_event


async def create_snippet(db: AsyncSession, user_id: UUID, payload: SnippetCreate) -> Snippet:
    category = await suggest_category(db, user_id, payload.task_id, payload.category)
    snippet = Snippet(
        user_id=user_id,
        **payload.model_dump(exclude={"category", "tags"}),
        category=category,
        tags=normalize_tags(payload.tags),
    )
    db.add(snippet)
    await db.commit()
    await db.refresh(snippet)
    await invalidate_kb_cache(user_id)
    await publish_user_event(user_id, "kb_updated", {"resource": "snippet", "id": str(snippet.id), "action": "created"})
    return snippet


async def list_snippets(db: AsyncSession, user_id: UUID, language: str | None, task_id: UUID | None, category: KnowledgeCategory | None, tags: list[str] | None, search: str | None, page: int, limit: int) -> tuple[list[Snippet], int]:
    stmt = select(Snippet).where(Snippet.user_id == user_id, Snippet.deleted_at.is_(None))
    count_stmt = select(func.count()).select_from(Snippet).where(Snippet.user_id == user_id, Snippet.deleted_at.is_(None))
    filters = []
    if language:
        filters.append(Snippet.language == language)
    if task_id:
        filters.append(Snippet.task_id == task_id)
    if category:
        filters.append(Snippet.category == category)
    if search:
        filters.append(Snippet.title.ilike(f"%{search}%") | Snippet.description.ilike(f"%{search}%") | Snippet.code.ilike(f"%{search}%"))
    for tag in normalize_tags(tags):
        filters.append(Snippet.tags.contains([tag]))
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))
    total = await db.scalar(count_stmt) or 0
    snippets = (await db.scalars(stmt.order_by(Snippet.is_favorite.desc(), Snippet.updated_at.desc()).offset((page - 1) * limit).limit(limit))).all()
    return snippets, total


async def get_snippet(db: AsyncSession, user_id: UUID, snippet_id: UUID) -> Snippet:
    snippet = await db.scalar(select(Snippet).where(Snippet.id == snippet_id, Snippet.user_id == user_id, Snippet.deleted_at.is_(None)))
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snippet


async def update_snippet(db: AsyncSession, user_id: UUID, snippet_id: UUID, payload: SnippetUpdate) -> Snippet:
    snippet = await get_snippet(db, user_id, snippet_id)
    data = payload.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = normalize_tags(data["tags"])
    if data.get("category") is None and "task_id" in data:
        data["category"] = await suggest_category(db, user_id, data["task_id"], None)
    for key, value in data.items():
        setattr(snippet, key, value)
    await db.commit()
    await db.refresh(snippet)
    await invalidate_kb_cache(user_id)
    await publish_user_event(user_id, "kb_updated", {"resource": "snippet", "id": str(snippet.id), "action": "updated"})
    return snippet


async def delete_snippet(db: AsyncSession, user_id: UUID, snippet_id: UUID) -> None:
    snippet = await get_snippet(db, user_id, snippet_id)
    snippet.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await invalidate_kb_cache(user_id)
    await publish_user_event(user_id, "kb_updated", {"resource": "snippet", "id": str(snippet.id), "action": "deleted"})


async def all_snippet_tags(db: AsyncSession, user_id: UUID) -> list[str]:
    rows = await db.execute(
        select(func.distinct(func.jsonb_array_elements_text(Snippet.tags))).where(Snippet.user_id == user_id, Snippet.deleted_at.is_(None))
    )
    return sorted([row[0] for row in rows if row[0]])

