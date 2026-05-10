from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.dependencies import get_current_user, oauth2_scheme
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserRead
from app.services.auth_service import (
    DuplicateEmailError,
    authenticate_user,
    blacklist_jti,
    create_access_token,
    create_refresh_token,
    decode_token,
    refresh_token_is_current,
    register_user,
    store_refresh_token,
)
from app.services.task_service import ensure_default_tasks


router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_tokens(response: Response, user: User) -> TokenResponse:
    access_token, _, _ = create_access_token(user.id)
    refresh_token, _, refresh_exp = create_refresh_token(user.id)
    await store_refresh_token(user.id, refresh_token)
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        expires=refresh_exp,
        path="/api/v1/auth",
    )
    return TokenResponse(access_token=access_token, user=UserRead.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, response: Response, db: AsyncSession = Depends(get_session)) -> TokenResponse:
    try:
        user = await register_user(db, payload)
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    await ensure_default_tasks(db, user.id)
    return await _issue_tokens(response, user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_session)) -> TokenResponse:
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    await ensure_default_tasks(db, user.id)
    return await _issue_tokens(response, user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_session)) -> TokenResponse:
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise ValueError("Wrong token type")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    from sqlalchemy import select

    user = await db.scalar(select(User).where(User.id == UUID(payload["sub"]), User.is_active.is_(True)))
    if not user or not await refresh_token_is_current(user.id, token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")
    await blacklist_jti(payload["jti"], payload.get("exp"))
    return await _issue_tokens(response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, token: str = Depends(oauth2_scheme), current_user: User = Depends(get_current_user)) -> None:
    payload = decode_token(token)
    await blacklist_jti(payload["jti"], payload.get("exp"))
    response.delete_cookie("refresh_token", path="/api/v1/auth")


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
