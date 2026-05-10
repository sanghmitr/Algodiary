import enum
import uuid
from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.note import KnowledgeCategory


class WeakAreaSeverity(str, enum.Enum):
    weak = "weak"
    improving = "improving"
    fixed = "fixed"


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), index=True)
    logged_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    dsa_score: Mapped[int] = mapped_column(Integer, nullable=False)
    hld_score: Mapped[int] = mapped_column(Integer, nullable=False)
    lld_score: Mapped[int] = mapped_column(Integer, nullable=False)
    behavioral_score: Mapped[int] = mapped_column(Integer, nullable=False)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    problems_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mock_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="progress_logs")
    task = relationship("Task", back_populates="progress_logs")


class WeakArea(Base):
    __tablename__ = "weak_areas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    category: Mapped[KnowledgeCategory] = mapped_column(Enum(KnowledgeCategory, name="knowledge_category"), nullable=False)
    topic: Mapped[str] = mapped_column(String(240), nullable=False)
    severity: Mapped[WeakAreaSeverity] = mapped_column(Enum(WeakAreaSeverity, name="weak_area_severity"), default=WeakAreaSeverity.weak, nullable=False)
    identified_date: Mapped[date] = mapped_column(Date, nullable=False)
    action_plan: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="weak_areas")


class MockFeedback(Base):
    __tablename__ = "mock_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    mock_number: Mapped[int] = mapped_column(Integer, nullable=False)
    mock_date: Mapped[date] = mapped_column(Date, nullable=False)
    company_target: Mapped[str] = mapped_column(String(120), nullable=False)
    dsa_score: Mapped[int] = mapped_column(Integer, nullable=False)
    hld_score: Mapped[int] = mapped_column(Integer, nullable=False)
    lld_score: Mapped[int] = mapped_column(Integer, nullable=False)
    behavioral_score: Mapped[int] = mapped_column(Integer, nullable=False)
    went_well: Mapped[str | None] = mapped_column(Text)
    improvements: Mapped[str | None] = mapped_column(Text)
    action_items: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="mock_feedback")

