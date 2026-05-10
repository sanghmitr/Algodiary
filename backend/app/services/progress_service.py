from datetime import date, timedelta
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import MockFeedback, ProgressLog, WeakArea
from app.redis_client import get_redis
from app.schemas.progress import (
    MockFeedbackCreate,
    MockFeedbackUpdate,
    ProgressLogCreate,
    WeakAreaCreate,
    WeakAreaUpdate,
)
from app.services.notification_service import publish_user_event


async def create_progress_log(db: AsyncSession, user_id: UUID, payload: ProgressLogCreate) -> ProgressLog:
    log = ProgressLog(user_id=user_id, **payload.model_dump(exclude={"logged_date"}), logged_date=payload.logged_date or date.today())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    await get_redis().incr(f"streak:{user_id}")
    await get_redis().delete(f"stats:{user_id}")
    await publish_user_event(user_id, "progress_logged", {"id": str(log.id), "problems_solved": log.problems_solved})
    return log


async def list_logs(db: AsyncSession, user_id: UUID, start: date | None, end: date | None) -> list[ProgressLog]:
    stmt = select(ProgressLog).where(ProgressLog.user_id == user_id)
    if start:
        stmt = stmt.where(ProgressLog.logged_date >= start)
    if end:
        stmt = stmt.where(ProgressLog.logged_date <= end)
    return (await db.scalars(stmt.order_by(ProgressLog.logged_date.desc()))).all()


async def summary(db: AsyncSession, user_id: UUID) -> list[dict]:
    rows = await db.execute(
        select(
            func.date_trunc("week", ProgressLog.logged_date).label("week"),
            func.avg(ProgressLog.dsa_score).label("dsa_score"),
            func.avg(ProgressLog.hld_score).label("hld_score"),
            func.avg(ProgressLog.lld_score).label("lld_score"),
            func.sum(ProgressLog.problems_solved).label("problems_solved"),
        )
        .where(ProgressLog.user_id == user_id)
        .group_by("week")
        .order_by("week")
    )
    return [dict(row._mapping) for row in rows]


async def heatmap(db: AsyncSession, user_id: UUID) -> list[dict]:
    rows = await db.execute(
        select(ProgressLog.logged_date, func.sum(ProgressLog.time_spent_minutes), func.sum(ProgressLog.problems_solved))
        .where(ProgressLog.user_id == user_id)
        .group_by(ProgressLog.logged_date)
        .order_by(ProgressLog.logged_date)
    )
    return [{"date": row[0], "minutes": row[1] or 0, "problems_solved": row[2] or 0} for row in rows]


async def create_weak_area(db: AsyncSession, user_id: UUID, payload: WeakAreaCreate) -> WeakArea:
    area = WeakArea(user_id=user_id, **payload.model_dump(exclude={"identified_date"}), identified_date=payload.identified_date or date.today())
    db.add(area)
    await db.commit()
    await db.refresh(area)
    return area


async def update_weak_area(db: AsyncSession, user_id: UUID, area_id: UUID, payload: WeakAreaUpdate) -> WeakArea:
    area = await db.scalar(select(WeakArea).where(WeakArea.id == area_id, WeakArea.user_id == user_id))
    if not area:
        raise HTTPException(status_code=404, detail="Weak area not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(area, key, value)
    await db.commit()
    await db.refresh(area)
    return area


async def create_mock(db: AsyncSession, user_id: UUID, payload: MockFeedbackCreate) -> MockFeedback:
    mock = MockFeedback(user_id=user_id, **payload.model_dump(exclude={"mock_date"}), mock_date=payload.mock_date or date.today())
    db.add(mock)
    await db.commit()
    await db.refresh(mock)
    return mock


async def update_mock(db: AsyncSession, user_id: UUID, mock_id: UUID, payload: MockFeedbackUpdate) -> MockFeedback:
    mock = await db.scalar(select(MockFeedback).where(MockFeedback.id == mock_id, MockFeedback.user_id == user_id))
    if not mock:
        raise HTTPException(status_code=404, detail="Mock feedback not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(mock, key, value)
    await db.commit()
    await db.refresh(mock)
    return mock

