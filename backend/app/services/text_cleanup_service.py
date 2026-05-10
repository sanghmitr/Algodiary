from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.models.snippet import Snippet
from app.models.task import Task
from app.redis_client import get_redis
from app.utils.text import clean_seed_content, clean_seed_label


TEXT_CLEANUP_KEY_VERSION = "emoji-clean-v1"


def _clean_tags(tags: list[str] | None) -> list[str]:
    seen: set[str] = set()
    cleaned: list[str] = []
    for raw in tags or []:
        tag = clean_seed_label(raw)
        key = tag.lower()
        if tag and key not in seen:
            seen.add(key)
            cleaned.append(tag)
    return cleaned


def _clean_lc_problems(problems: list[dict] | None) -> tuple[list[dict], bool]:
    changed = False
    cleaned: list[dict] = []
    for problem in problems or []:
        next_problem = dict(problem)
        if "title" in next_problem:
            title = clean_seed_label(str(next_problem.get("title") or ""))
            if title != next_problem.get("title"):
                next_problem["title"] = title
                changed = True
        cleaned.append(next_problem)
    return cleaned, changed


async def _invalidate_user_caches(user_id: UUID) -> None:
    redis = get_redis()
    await redis.delete(f"stats:{user_id}")
    async for key in redis.scan_iter(f"kb:{user_id}:*"):
        await redis.delete(key)


async def ensure_user_text_clean(db: AsyncSession, user_id: UUID) -> None:
    redis = get_redis()
    marker_key = f"{TEXT_CLEANUP_KEY_VERSION}:{user_id}"
    if await redis.get(marker_key):
        return

    changed = False
    tasks = (await db.scalars(select(Task).where(Task.user_id == user_id))).all()
    for task in tasks:
        for field in ("dsa_topic", "hld_topic", "lld_topic"):
            value = getattr(task, field)
            if value:
                cleaned = clean_seed_label(value)
                if cleaned != value:
                    setattr(task, field, cleaned)
                    changed = True
        cleaned_problems, problems_changed = _clean_lc_problems(task.lc_problems)
        if problems_changed:
            task.lc_problems = cleaned_problems
            changed = True

    notes = (await db.scalars(select(Note).where(Note.user_id == user_id, Note.deleted_at.is_(None)))).all()
    for note in notes:
        title = clean_seed_label(note.title)
        content = clean_seed_content(note.content)
        tags = _clean_tags(note.tags)
        if title != note.title:
            note.title = title
            changed = True
        if content != note.content:
            note.content = content
            changed = True
        if tags != note.tags:
            note.tags = tags
            changed = True

    snippets = (await db.scalars(select(Snippet).where(Snippet.user_id == user_id, Snippet.deleted_at.is_(None)))).all()
    for snippet in snippets:
        title = clean_seed_label(snippet.title)
        description = clean_seed_content(snippet.description)
        tags = _clean_tags(snippet.tags)
        if title != snippet.title:
            snippet.title = title
            changed = True
        if description != snippet.description:
            snippet.description = description
            changed = True
        if tags != snippet.tags:
            snippet.tags = tags
            changed = True

    if changed:
        await db.commit()
        await _invalidate_user_caches(user_id)
    await redis.set(marker_key, "1")
