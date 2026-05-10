from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.task import TaskPhase, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskReorderRequest, TaskUpdate
from app.services import task_service
from app.services.notification_service import publish_user_event


router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskRead])
async def list_tasks(
    phase: TaskPhase | None = None,
    week: int | None = Query(default=None, ge=1),
    status: TaskStatus | None = None,
    day: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    return await task_service.list_tasks(db, current_user.id, phase, week, status, day)


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create(payload: TaskCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    task = await task_service.create_task(db, current_user.id, payload)
    await publish_user_event(current_user.id, "task_updated", {"id": str(task["id"]), "action": "created"})
    return task


@router.patch("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder(payload: TaskReorderRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    await task_service.reorder_tasks(db, current_user.id, payload)
    await publish_user_event(current_user.id, "task_updated", {"bulk": True})


@router.post("/seed", response_model=list[TaskRead], status_code=status.HTTP_201_CREATED)
async def seed(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict]:
    await task_service.seed_tasks(db, current_user.id)
    return await task_service.list_tasks(db, current_user.id, None, None, None, None)


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    return await task_service.get_task(db, current_user.id, task_id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: UUID, payload: TaskUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = await task_service.update_task(db, current_user.id, task_id, payload)
    await publish_user_event(current_user.id, "task_updated", {"id": str(task.id), "status": task.status.value})
    return await task_service.get_task(db, current_user.id, task_id)
