from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=160)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=160)
    avatar_url: str | None = None
    target_companies: list[str] | None = None
    target_date: date | None = None
    daily_goal_hours: float | None = Field(default=None, gt=0, le=24)


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict[str, str]
    expirationTime: int | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    avatar_url: str | None
    target_companies: list[str]
    target_date: date | None
    daily_goal_hours: float
    push_subscription: dict | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DashboardStats(BaseModel):
    total_tasks_done: int
    current_streak: int
    avg_daily_score: float
    days_remaining: int | None
    problems_solved_this_week: int
    total_notes: int
    total_snippets: int
    revision_ready_count: int

