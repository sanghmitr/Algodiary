from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import Select, and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.models.snippet import Snippet
from app.models.task import Task, TaskPhase, TaskStatus
from app.schemas.task import TaskReorderRequest, TaskUpdate
from app.services.prep_plan_loader import load_default_tasks


DSA_TOPICS = [
    "Arrays and Strings", "Hash Maps", "Two Pointers", "Sliding Window", "Stacks and Queues",
    "Binary Search", "Linked Lists", "Trees", "Binary Search Trees", "Heaps",
    "Graphs", "DFS and BFS", "Dynamic Programming", "Greedy", "Backtracking",
]
HLD_TOPICS = ["Scalability Basics", "Caching", "Load Balancing", "Databases", "Message Queues", "Rate Limiting"]
LLD_TOPICS = ["OOP Design", "SOLID", "Design Patterns", "Parking Lot", "Library System", "Splitwise"]


def _phase_for_day(day: int) -> TaskPhase:
    if day <= 30:
        return TaskPhase.foundation
    if day <= 70:
        return TaskPhase.advanced
    return TaskPhase.simulation


def _task_for_day(user_id: UUID, day: int) -> Task:
    dsa = DSA_TOPICS[(day - 1) % len(DSA_TOPICS)]
    hld = HLD_TOPICS[(day - 1) % len(HLD_TOPICS)]
    lld = LLD_TOPICS[(day - 1) % len(LLD_TOPICS)]
    return Task(
        user_id=user_id,
        day_number=day,
        phase=_phase_for_day(day),
        week_number=((day - 1) // 7) + 1,
        dsa_topic=dsa,
        lc_problems=[
            {"title": f"{dsa} Practice {i}", "url": "https://leetcode.com/problemset/", "difficulty": ["Easy", "Medium", "Hard"][i % 3]}
            for i in range(1, 4)
        ],
        hld_topic=hld,
        hld_resource_url="https://github.com/donnemartin/system-design-primer",
        lld_topic=lld,
        status=TaskStatus.todo,
        kanban_order=day,
        time_allocation={"dsa": 90, "hld": 45, "lld": 45},
    )


async def seed_tasks(db: AsyncSession, user_id: UUID) -> list[Task]:
    existing_count = await db.scalar(select(func.count()).select_from(Task).where(Task.user_id == user_id))
    if existing_count:
        return (await db.scalars(select(Task).where(Task.user_id == user_id).order_by(Task.day_number))).all()
    tasks = [Task(user_id=user_id, status=TaskStatus.todo, **task_data) for task_data in load_default_tasks()]
    db.add_all(tasks)
    await db.commit()
    return tasks


async def list_tasks(db: AsyncSession, user_id: UUID, phase: TaskPhase | None, week: int | None, status_filter: TaskStatus | None, day: int | None) -> list[dict]:
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


async def update_task(db: AsyncSession, user_id: UUID, task_id: UUID, payload: TaskUpdate) -> Task:
    task = await db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    await db.commit()
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
