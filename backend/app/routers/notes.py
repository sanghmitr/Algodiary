from uuid import UUID
from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.note import KnowledgeCategory
from app.models.user import User
from app.schemas.note import NoteCreate, NoteImageDelete, NoteRead, NoteUpdate
from app.services.file_storage_service import upload_note_image
from app.services import note_service


router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/", response_model=list[NoteRead])
async def list_notes(task_id: UUID | None = None, category: KnowledgeCategory | None = None, tags: list[str] | None = Query(None), pinned: bool | None = None, revision_ready: bool | None = None, search: str | None = None, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes, _ = await note_service.list_notes(db, current_user.id, task_id, category, tags, pinned, revision_ready, search, page, limit)
    return notes


@router.post("/", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create(payload: NoteCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await note_service.create_note(db, current_user.id, payload)


@router.get("/tags/all", response_model=list[str])
async def tags(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[str]:
    return await note_service.all_note_tags(db, current_user.id)


@router.get("/{note_id}", response_model=NoteRead)
async def get(note_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await note_service.get_note(db, current_user.id, note_id)


@router.post("/{note_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_image(note_id: UUID, request: Request, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, str]:
    await note_service.get_note(db, current_user.id, note_id)
    return await upload_note_image(current_user.id, note_id, file, str(request.base_url))


@router.delete("/{note_id}/images", response_model=NoteRead)
async def delete_image(note_id: UUID, payload: NoteImageDelete, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await note_service.delete_note_image(db, current_user.id, note_id, payload.url, str(request.base_url))


@router.patch("/{note_id}", response_model=NoteRead)
async def update(note_id: UUID, payload: NoteUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await note_service.update_note(db, current_user.id, note_id, payload)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(note_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    await note_service.delete_note(db, current_user.id, note_id)
