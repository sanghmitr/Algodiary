from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.note import KnowledgeCategory
from app.models.progress import WeakAreaSeverity


class ProgressLogCreate(BaseModel):
    task_id: UUID | None = None
    logged_date: date | None = None
    dsa_score: int = Field(ge=1, le=5)
    hld_score: int = Field(ge=1, le=5)
    lld_score: int = Field(ge=1, le=5)
    behavioral_score: int = Field(ge=1, le=5)
    time_spent_minutes: int = Field(default=0, ge=0)
    problems_solved: int = Field(default=0, ge=0)
    mock_completed: bool = False
    notes: str | None = None


class ProgressLogRead(ProgressLogCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    logged_date: date
    created_at: datetime


class WeakAreaCreate(BaseModel):
    category: KnowledgeCategory
    topic: str
    severity: WeakAreaSeverity = WeakAreaSeverity.weak
    identified_date: date | None = None
    action_plan: str | None = None


class WeakAreaUpdate(BaseModel):
    severity: WeakAreaSeverity | None = None
    action_plan: str | None = None


class WeakAreaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    category: KnowledgeCategory
    topic: str
    severity: WeakAreaSeverity
    identified_date: date
    action_plan: str | None
    updated_at: datetime


class MockFeedbackCreate(BaseModel):
    mock_number: int = Field(ge=1)
    mock_date: date | None = None
    company_target: str
    dsa_score: int = Field(ge=1, le=5)
    hld_score: int = Field(ge=1, le=5)
    lld_score: int = Field(ge=1, le=5)
    behavioral_score: int = Field(ge=1, le=5)
    went_well: str | None = None
    improvements: str | None = None
    action_items: str | None = None


class MockFeedbackUpdate(BaseModel):
    company_target: str | None = None
    dsa_score: int | None = Field(default=None, ge=1, le=5)
    hld_score: int | None = Field(default=None, ge=1, le=5)
    lld_score: int | None = Field(default=None, ge=1, le=5)
    behavioral_score: int | None = Field(default=None, ge=1, le=5)
    went_well: str | None = None
    improvements: str | None = None
    action_items: str | None = None


class MockFeedbackRead(MockFeedbackCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    mock_date: date
    created_at: datetime

