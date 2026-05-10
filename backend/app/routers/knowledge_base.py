from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.knowledge_base import KBSearchResponse, KBStats
from app.services import knowledge_base_service


router = APIRouter(prefix="/kb", tags=["knowledge-base"])


@router.get("/search", response_model=KBSearchResponse)
async def search(
    q: str | None = None,
    category: str = "all",
    type: str = "all",
    tags: str | None = None,
    revision_ready: bool | None = None,
    sort: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
    return await knowledge_base_service.search(db, current_user.id, q, category, type, tag_list, revision_ready, sort, page, limit)


@router.get("/tags")
async def tags(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await knowledge_base_service.get_all_tags(db, current_user.id)


@router.get("/stats", response_model=KBStats)
async def stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await knowledge_base_service.stats(db, current_user.id)

