import enum
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaskPhase(str, enum.Enum):
    foundation = "foundation"
    advanced = "advanced"
    simulation = "simulation"


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    phase: Mapped[TaskPhase] = mapped_column(Enum(TaskPhase, name="task_phase"), nullable=False)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    dsa_topic: Mapped[str | None] = mapped_column(Text)
    lc_problems: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)
    hld_topic: Mapped[str | None] = mapped_column(Text)
    hld_resource_url: Mapped[str | None] = mapped_column(Text)
    lld_topic: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus, name="task_status"), default=TaskStatus.todo, nullable=False)
    kanban_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    time_allocation: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="tasks")
    notes = relationship("Note", back_populates="task")
    snippets = relationship("Snippet", back_populates="task")
    progress_logs = relationship("ProgressLog", back_populates="task")

