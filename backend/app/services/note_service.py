from datetime import datetime, timezone
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import KnowledgeCategory, Note
from app.models.task import Task
from app.redis_client import get_redis
from app.schemas.note import NoteCreate, NoteUpdate
from app.services.notification_service import publish_user_event


def normalize_tags(tags: list[str] | None) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for raw in tags or []:
        tag = raw.strip()
        key = tag.lower()
        if tag and key not in seen:
            seen.add(key)
            normalized.append(tag)
    return normalized


async def suggest_category(db: AsyncSession, user_id: UUID, task_id: UUID | None, explicit: KnowledgeCategory | None) -> KnowledgeCategory:
    if explicit:
        return explicit
    if task_id:
        task = await db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
        if task:
            if task.dsa_topic:
                return KnowledgeCategory.DSA
            if task.hld_topic:
                return KnowledgeCategory.HLD
            if task.lld_topic:
                return KnowledgeCategory.LLD
    return KnowledgeCategory.General


async def invalidate_kb_cache(user_id: UUID) -> None:
    redis = get_redis()
    async for key in redis.scan_iter(f"kb:{user_id}:*"):
        await redis.delete(key)


async def create_note(db: AsyncSession, user_id: UUID, payload: NoteCreate) -> Note:
    category = await suggest_category(db, user_id, payload.task_id, payload.category)
    note = Note(user_id=user_id, **payload.model_dump(exclude={"category", "tags"}), category=category, tags=normalize_tags(payload.tags))
    db.add(note)
    await db.commit()
    await db.refresh(note)
    await invalidate_kb_cache(user_id)
    await publish_user_event(user_id, "kb_updated", {"resource": "note", "id": str(note.id), "action": "created"})
    return note


async def list_notes(db: AsyncSession, user_id: UUID, task_id: UUID | None, category: KnowledgeCategory | None, tags: list[str] | None, pinned: bool | None, revision_ready: bool | None, search: str | None, page: int, limit: int) -> tuple[list[Note], int]:
    stmt = select(Note).where(Note.user_id == user_id, Note.deleted_at.is_(None))
    count_stmt = select(func.count()).select_from(Note).where(Note.user_id == user_id, Note.deleted_at.is_(None))
    filters = []
    if task_id:
        filters.append(Note.task_id == task_id)
    if category:
        filters.append(Note.category == category)
    if pinned is not None:
        filters.append(Note.is_pinned.is_(pinned))
    if revision_ready is not None:
        filters.append(Note.is_revision_ready.is_(revision_ready))
    if search:
        filters.append(Note.title.ilike(f"%{search}%") | Note.content.ilike(f"%{search}%"))
    for tag in normalize_tags(tags):
        filters.append(Note.tags.contains([tag]))
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))
    total = await db.scalar(count_stmt) or 0
    notes = (await db.scalars(stmt.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).offset((page - 1) * limit).limit(limit))).all()
    return notes, total


async def get_note(db: AsyncSession, user_id: UUID, note_id: UUID) -> Note:
    note = await db.scalar(select(Note).where(Note.id == note_id, Note.user_id == user_id, Note.deleted_at.is_(None)))
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


async def update_note(db: AsyncSession, user_id: UUID, note_id: UUID, payload: NoteUpdate) -> Note:
    note = await get_note(db, user_id, note_id)
    data = payload.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = normalize_tags(data["tags"])
    if data.get("category") is None and "task_id" in data:
        data["category"] = await suggest_category(db, user_id, data["task_id"], None)
    for key, value in data.items():
        setattr(note, key, value)
    await db.commit()
    await db.refresh(note)
    await invalidate_kb_cache(user_id)
    await publish_user_event(user_id, "kb_updated", {"resource": "note", "id": str(note.id), "action": "updated"})
    return note


async def delete_note(db: AsyncSession, user_id: UUID, note_id: UUID) -> None:
    note = await get_note(db, user_id, note_id)
    note.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await invalidate_kb_cache(user_id)
    await publish_user_event(user_id, "kb_updated", {"resource": "note", "id": str(note.id), "action": "deleted"})


async def all_note_tags(db: AsyncSession, user_id: UUID) -> list[str]:
    rows = await db.execute(
        select(func.distinct(func.jsonb_array_elements_text(Note.tags))).where(Note.user_id == user_id, Note.deleted_at.is_(None))
    )
    return sorted([row[0] for row in rows if row[0]])

