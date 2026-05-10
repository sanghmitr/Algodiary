from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import KnowledgeCategory, Note
from app.models.progress import ProgressLog
from app.models.snippet import Snippet
from app.models.task import Task, TaskPhase, TaskStatus
from app.redis_client import get_redis
from app.schemas.task import TaskCreate, TaskReorderRequest, TaskUpdate
from app.services.prep_plan_loader import load_default_tasks
from app.services.text_cleanup_service import ensure_user_text_clean
from app.utils.text import clean_seed_label


async def _invalidate_task_dependents(user_id: UUID) -> None:
    await get_redis().delete(f"stats:{user_id}")


async def _can_replace_legacy_seed(db: AsyncSession, user_id: UUID, existing_count: int, target_count: int | None = None) -> bool:
    if target_count is not None and existing_count == target_count:
        return False
    if existing_count not in {90, 272}:
        return False
    snippet_count = await db.scalar(select(func.count()).select_from(Snippet).where(Snippet.user_id == user_id)) or 0
    progress_count = await db.scalar(select(func.count()).select_from(ProgressLog).where(ProgressLog.user_id == user_id)) or 0
    if snippet_count or progress_count:
        return False
    return True


async def seed_tasks(db: AsyncSession, user_id: UUID) -> list[Task]:
    existing_count = await db.scalar(select(func.count()).select_from(Task).where(Task.user_id == user_id))
    default_tasks = load_default_tasks()
    if existing_count:
        if await _can_replace_legacy_seed(db, user_id, existing_count, len(default_tasks)):
            existing_notes = (await db.scalars(select(Note).where(Note.user_id == user_id, Note.title.like("Day %.% - %")))).all()
            for note in existing_notes:
                await db.delete(note)
            existing_tasks = (await db.scalars(select(Task).where(Task.user_id == user_id))).all()
            for task in existing_tasks:
                await db.delete(task)
            await db.flush()
        else:
            return (await db.scalars(select(Task).where(Task.user_id == user_id).order_by(Task.kanban_order, Task.day_number))).all()
    for task_data in default_tasks:
        starter_note = task_data.pop("starter_note")
        task = Task(user_id=user_id, status=TaskStatus.todo, **task_data)
        db.add(task)
        await db.flush()
        db.add(
            Note(
                user_id=user_id,
                task_id=task.id,
                title=starter_note["title"],
                content=starter_note["content"],
                category=KnowledgeCategory(starter_note["category"]),
                tags=starter_note["tags"],
                is_revision_ready=False,
            )
        )
    await db.commit()
    await _invalidate_task_dependents(user_id)
    return (await db.scalars(select(Task).where(Task.user_id == user_id).order_by(Task.kanban_order, Task.day_number))).all()


async def ensure_default_tasks(db: AsyncSession, user_id: UUID) -> None:
    existing_count = await db.scalar(select(func.count()).select_from(Task).where(Task.user_id == user_id))
    if not existing_count or await _can_replace_legacy_seed(db, user_id, existing_count, len(load_default_tasks())):
        await seed_tasks(db, user_id)
    else:
        await ensure_user_text_clean(db, user_id)


async def list_tasks(db: AsyncSession, user_id: UUID, phase: TaskPhase | None, week: int | None, status_filter: TaskStatus | None, day: int | None) -> list[dict]:
    await ensure_default_tasks(db, user_id)
    note_counts = select(Note.task_id, func.count(Note.id).label("notes_count")).where(Note.deleted_at.is_(None)).group_by(Note.task_id).subquery()
    snippet_counts = select(Snippet.task_id, func.count(Snippet.id).label("snippets_count")).where(Snippet.deleted_at.is_(None)).group_by(Snippet.task_id).subquery()
    stmt = (
        select(Task, func.coalesce(note_counts.c.notes_count, 0), func.coalesce(snippet_counts.c.snippets_count, 0))
        .outerjoin(note_counts, note_counts.c.task_id == Task.id)
        .outerjoin(snippet_counts, snippet_counts.c.task_id == Task.id)
        .where(Task.user_id == user_id)
        .order_by(Task.kanban_order)
    )
    if phase:
        stmt = stmt.where(Task.phase == phase)
    if week:
        stmt = stmt.where(Task.week_number == week)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    if day:
        stmt = stmt.where(Task.day_number == day)
    rows = (await db.execute(stmt)).all()
    return [{**task.__dict__, "notes_count": notes_count, "snippets_count": snippets_count} for task, notes_count, snippets_count in rows]


async def get_task(db: AsyncSession, user_id: UUID, task_id: UUID) -> dict:
    tasks = await list_tasks(db, user_id, None, None, None, None)
    for task in tasks:
        if task["id"] == task_id:
            return task
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


async def create_task(db: AsyncSession, user_id: UUID, payload: TaskCreate) -> dict:
    await ensure_default_tasks(db, user_id)
    max_order = await db.scalar(select(func.max(Task.kanban_order)).where(Task.user_id == user_id, Task.status == TaskStatus.todo)) or 0
    title = clean_seed_label(payload.title)
    time_allocation = {"dsa": 0, "hld": 0, "lld": 0}
    values = {
        "user_id": user_id,
        "day_number": payload.day_number,
        "week_number": payload.week_number,
        "phase": payload.phase,
        "status": TaskStatus.todo,
        "kanban_order": max_order + 1,
        "lc_problems": [],
        "time_allocation": time_allocation,
    }
    if payload.category == "DSA":
        time_allocation["dsa"] = payload.time_minutes
        values["dsa_topic"] = title
        values["lc_problems"] = [{"title": title, "url": payload.resource_url or "", "difficulty": payload.difficulty or "Medium"}]
    elif payload.category == "HLD":
        time_allocation["hld"] = payload.time_minutes
        values["hld_topic"] = title
        values["hld_resource_url"] = payload.resource_url
    else:
        time_allocation["lld"] = payload.time_minutes
        values["lld_topic"] = title
    task = Task(**values)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    await _invalidate_task_dependents(user_id)
    return await get_task(db, user_id, task.id)


async def update_task(db: AsyncSession, user_id: UUID, task_id: UUID, payload: TaskUpdate) -> Task:
    task = await db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    await db.commit()
    await _invalidate_task_dependents(user_id)
    await db.refresh(task)
    return task


async def reorder_tasks(db: AsyncSession, user_id: UUID, payload: TaskReorderRequest) -> None:
    ids = [item.id for item in payload.items]
    owned = set(await db.scalars(select(Task.id).where(Task.user_id == user_id, Task.id.in_(ids))))
    if len(owned) != len(ids):
        raise HTTPException(status_code=404, detail="One or more tasks were not found")
    for item in payload.items:
        await db.execute(update(Task).where(Task.id == item.id).values(status=item.status, kanban_order=item.kanban_order))
    await db.commit()
    await _invalidate_task_dependents(user_id)
