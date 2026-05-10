from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.note import KnowledgeCategory
from app.models.user import User
from app.schemas.snippet import SnippetCreate, SnippetRead, SnippetUpdate
from app.services import snippet_service


router = APIRouter(prefix="/snippets", tags=["snippets"])


@router.get("/", response_model=list[SnippetRead])
async def list_snippets(language: str | None = None, task_id: UUID | None = None, category: KnowledgeCategory | None = None, tags: list[str] | None = Query(None), search: str | None = None, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    snippets, _ = await snippet_service.list_snippets(db, current_user.id, language, task_id, category, tags, search, page, limit)
    return snippets


@router.post("/", response_model=SnippetRead, status_code=status.HTTP_201_CREATED)
async def create(payload: SnippetCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await snippet_service.create_snippet(db, current_user.id, payload)


@router.get("/tags/all", response_model=list[str])
async def tags(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[str]:
    return await snippet_service.all_snippet_tags(db, current_user.id)


@router.get("/{snippet_id}", response_model=SnippetRead)
async def get(snippet_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await snippet_service.get_snippet(db, current_user.id, snippet_id)


@router.patch("/{snippet_id}", response_model=SnippetRead)
async def update(snippet_id: UUID, payload: SnippetUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await snippet_service.update_snippet(db, current_user.id, snippet_id, payload)


@router.delete("/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(snippet_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    await snippet_service.delete_snippet(db, current_user.id, snippet_id)

