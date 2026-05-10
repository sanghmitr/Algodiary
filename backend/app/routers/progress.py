from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.progress import MockFeedback, WeakArea
from app.models.user import User
from app.schemas.progress import (
    MockFeedbackCreate,
    MockFeedbackRead,
    MockFeedbackUpdate,
    ProgressLogCreate,
    ProgressLogRead,
    WeakAreaCreate,
    WeakAreaRead,
    WeakAreaUpdate,
)
from app.services import progress_service
from app.workers.notification_tasks import achievement_check


router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/", response_model=list[ProgressLogRead])
async def logs(start: date | None = None, end: date | None = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.list_logs(db, current_user.id, start, end)


@router.post("/", response_model=ProgressLogRead, status_code=201)
async def create_log(payload: ProgressLogCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = await progress_service.create_progress_log(db, current_user.id, payload)
    achievement_check.delay(str(current_user.id))
    return log


@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.summary(db, current_user.id)


@router.get("/heatmap")
async def heatmap(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.heatmap(db, current_user.id)


@router.get("/weak-areas", response_model=list[WeakAreaRead])
async def weak_areas(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (await db.scalars(select(WeakArea).where(WeakArea.user_id == current_user.id).order_by(WeakArea.updated_at.desc()))).all()


@router.post("/weak-areas", response_model=WeakAreaRead, status_code=201)
async def add_weak_area(payload: WeakAreaCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.create_weak_area(db, current_user.id, payload)


@router.patch("/weak-areas/{area_id}", response_model=WeakAreaRead)
async def update_weak_area(area_id: UUID, payload: WeakAreaUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.update_weak_area(db, current_user.id, area_id, payload)


@router.get("/mocks", response_model=list[MockFeedbackRead])
async def mocks(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (await db.scalars(select(MockFeedback).where(MockFeedback.user_id == current_user.id).order_by(MockFeedback.mock_date.desc()))).all()


@router.post("/mocks", response_model=MockFeedbackRead, status_code=201)
async def add_mock(payload: MockFeedbackCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.create_mock(db, current_user.id, payload)


@router.patch("/mocks/{mock_id}", response_model=MockFeedbackRead)
async def update_mock(mock_id: UUID, payload: MockFeedbackUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await progress_service.update_mock(db, current_user.id, mock_id, payload)

