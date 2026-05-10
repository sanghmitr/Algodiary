import re
import uuid
from pathlib import Path
from urllib.parse import unquote, urlparse

import anyio
import boto3
from fastapi import HTTPException, UploadFile

from app.config import settings


ALLOWED_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}


def _safe_name(filename: str) -> str:
    stem = Path(filename).stem or "diagram"
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-")[:80] or "diagram"


def _r2_enabled() -> bool:
    return all([settings.r2_bucket, settings.r2_endpoint, settings.r2_access_key, settings.r2_secret_key, settings.r2_public_url])


def _object_key_from_url(user_id: uuid.UUID, note_id: uuid.UUID, url: str, base_url: str) -> str:
    expected_prefix = f"notes/{user_id}/{note_id}/"
    parsed = urlparse(url)
    path = unquote(parsed.path.lstrip("/"))

    r2_public_url = settings.r2_public_url.rstrip("/")
    if r2_public_url and url.startswith(f"{r2_public_url}/"):
        path = unquote(url.removeprefix(f"{r2_public_url}/"))
    else:
        uploads_prefix = "uploads/"
        if path.startswith(uploads_prefix):
            path = path.removeprefix(uploads_prefix)
        elif url.startswith("/uploads/"):
            path = unquote(url.removeprefix("/uploads/"))
        elif url.startswith(f"{base_url.rstrip('/')}/uploads/"):
            path = unquote(url.removeprefix(f"{base_url.rstrip('/')}/uploads/"))

    if not path.startswith(expected_prefix) or ".." in Path(path).parts:
        raise HTTPException(status_code=400, detail="Image URL does not belong to this note.")
    return path


async def upload_note_image(user_id: uuid.UUID, note_id: uuid.UUID, file: UploadFile, base_url: str) -> dict[str, str]:
    extension = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Only PNG, JPEG, GIF, WebP, and SVG images are supported.")

    content = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Image is too large. Max size is {settings.max_upload_mb} MB.")

    filename = f"{_safe_name(file.filename or 'diagram')}-{uuid.uuid4().hex}{extension}"
    object_key = f"notes/{user_id}/{note_id}/{filename}"

    if _r2_enabled():
        def put_object() -> None:
            client = boto3.client(
                "s3",
                endpoint_url=settings.r2_endpoint,
                aws_access_key_id=settings.r2_access_key,
                aws_secret_access_key=settings.r2_secret_key,
            )
            client.put_object(Bucket=settings.r2_bucket, Key=object_key, Body=content, ContentType=file.content_type)

        await anyio.to_thread.run_sync(put_object)
        url = f"{settings.r2_public_url.rstrip('/')}/{object_key}"
    else:
        path = Path(settings.upload_dir) / object_key
        path.parent.mkdir(parents=True, exist_ok=True)
        await anyio.to_thread.run_sync(path.write_bytes, content)
        url = f"{base_url.rstrip('/')}/uploads/{object_key}"

    return {"url": url, "filename": filename, "content_type": file.content_type or "application/octet-stream"}


async def delete_note_image(user_id: uuid.UUID, note_id: uuid.UUID, url: str, base_url: str) -> None:
    object_key = _object_key_from_url(user_id, note_id, url, base_url)

    if _r2_enabled():
        def delete_object() -> None:
            client = boto3.client(
                "s3",
                endpoint_url=settings.r2_endpoint,
                aws_access_key_id=settings.r2_access_key,
                aws_secret_access_key=settings.r2_secret_key,
            )
            client.delete_object(Bucket=settings.r2_bucket, Key=object_key)

        await anyio.to_thread.run_sync(delete_object)
        return

    path = Path(settings.upload_dir) / object_key
    if path.exists():
        await anyio.to_thread.run_sync(path.unlink)
