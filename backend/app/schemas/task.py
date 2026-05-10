from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskPhase, TaskStatus


class LCProblem(BaseModel):
    title: str
    url: str
    difficulty: str


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    day_number: int
    phase: TaskPhase
    week_number: int
    dsa_topic: str | None
    lc_problems: list[dict]
    hld_topic: str | None
    hld_resource_url: str | None
    lld_topic: str | None
    status: TaskStatus
    kanban_order: int
    time_allocation: dict
    notes_count: int = 0
    snippets_count: int = 0
    created_at: datetime
    updated_at: datetime


class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    kanban_order: int | None = Field(default=None, ge=0)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    category: Literal["DSA", "HLD", "LLD"]
    day_number: int = Field(ge=1)
    week_number: int = Field(ge=1)
    phase: TaskPhase = TaskPhase.foundation
    time_minutes: int = Field(default=60, ge=0)
    difficulty: str | None = Field(default=None, max_length=40)
    resource_url: str | None = None


class TaskReorderItem(BaseModel):
    id: UUID
    status: TaskStatus
    kanban_order: int = Field(ge=0)


class TaskReorderRequest(BaseModel):
    items: list[TaskReorderItem]
