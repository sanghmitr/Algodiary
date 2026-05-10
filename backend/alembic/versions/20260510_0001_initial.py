"""initial Algodiary schema

Revision ID: 20260510_0001
Revises:
Create Date: 2026-05-10
"""
from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260510_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


task_phase = postgresql.ENUM("foundation", "advanced", "simulation", name="task_phase", create_type=False)
task_status = postgresql.ENUM("todo", "in_progress", "done", name="task_status", create_type=False)
knowledge_category = postgresql.ENUM("DSA", "HLD", "LLD", "General", name="knowledge_category", create_type=False)
weak_area_severity = postgresql.ENUM("weak", "improving", "fixed", name="weak_area_severity", create_type=False)
notification_type = postgresql.ENUM("reminder", "achievement", "system", name="notification_type", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("foundation", "advanced", "simulation", name="task_phase").create(bind, checkfirst=True)
    postgresql.ENUM("todo", "in_progress", "done", name="task_status").create(bind, checkfirst=True)
    postgresql.ENUM("DSA", "HLD", "LLD", "General", name="knowledge_category").create(bind, checkfirst=True)
    postgresql.ENUM("weak", "improving", "fixed", name="weak_area_severity").create(bind, checkfirst=True)
    postgresql.ENUM("reminder", "achievement", "system", name="notification_type").create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("avatar_url", sa.String(length=1024)),
        sa.Column("target_companies", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("target_date", sa.Date()),
        sa.Column("daily_goal_hours", sa.Float(), nullable=False, server_default="3.0"),
        sa.Column("push_subscription", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.Column("phase", task_phase, nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("dsa_topic", sa.Text()),
        sa.Column("lc_problems", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("hld_topic", sa.Text()),
        sa.Column("hld_resource_url", sa.Text()),
        sa.Column("lld_topic", sa.Text()),
        sa.Column("status", task_status, nullable=False, server_default="todo"),
        sa.Column("kanban_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("time_allocation", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"])

    op.create_table(
        "notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", knowledge_category, nullable=False),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_revision_ready", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notes_user_id", "notes", ["user_id"])
    op.create_index("ix_notes_task_id", "notes", ["task_id"])
    op.create_index("idx_notes_category", "notes", ["user_id", "category"])
    op.create_index("idx_notes_tags", "notes", ["tags"], postgresql_using="gin")
    op.execute("CREATE INDEX notes_fts_idx ON notes USING gin(to_tsvector('english', title || ' ' || content));")

    op.create_table(
        "snippets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("language", sa.String(length=64), nullable=False),
        sa.Column("category", knowledge_category, nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_snippets_user_id", "snippets", ["user_id"])
    op.create_index("ix_snippets_task_id", "snippets", ["task_id"])
    op.create_index("idx_snippets_category", "snippets", ["user_id", "category"])
    op.create_index("idx_snippets_tags", "snippets", ["tags"], postgresql_using="gin")
    op.execute("CREATE INDEX snippets_fts_idx ON snippets USING gin(to_tsvector('english', title || ' ' || description));")

    op.create_table(
        "progress_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="SET NULL")),
        sa.Column("logged_date", sa.Date(), nullable=False),
        sa.Column("dsa_score", sa.Integer(), nullable=False),
        sa.Column("hld_score", sa.Integer(), nullable=False),
        sa.Column("lld_score", sa.Integer(), nullable=False),
        sa.Column("behavioral_score", sa.Integer(), nullable=False),
        sa.Column("time_spent_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("problems_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("mock_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_progress_logs_user_id", "progress_logs", ["user_id"])
    op.create_index("ix_progress_logs_task_id", "progress_logs", ["task_id"])
    op.create_index("ix_progress_logs_logged_date", "progress_logs", ["logged_date"])

    op.create_table(
        "weak_areas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", knowledge_category, nullable=False),
        sa.Column("topic", sa.String(length=240), nullable=False),
        sa.Column("severity", weak_area_severity, nullable=False, server_default="weak"),
        sa.Column("identified_date", sa.Date(), nullable=False),
        sa.Column("action_plan", sa.Text()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_weak_areas_user_id", "weak_areas", ["user_id"])

    op.create_table(
        "mock_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mock_number", sa.Integer(), nullable=False),
        sa.Column("mock_date", sa.Date(), nullable=False),
        sa.Column("company_target", sa.String(length=120), nullable=False),
        sa.Column("dsa_score", sa.Integer(), nullable=False),
        sa.Column("hld_score", sa.Integer(), nullable=False),
        sa.Column("lld_score", sa.Integer(), nullable=False),
        sa.Column("behavioral_score", sa.Integer(), nullable=False),
        sa.Column("went_well", sa.Text()),
        sa.Column("improvements", sa.Text()),
        sa.Column("action_items", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_mock_feedback_user_id", "mock_feedback", ["user_id"])

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("mock_feedback")
    op.drop_table("weak_areas")
    op.drop_table("progress_logs")
    op.execute("DROP INDEX IF EXISTS snippets_fts_idx")
    op.drop_table("snippets")
    op.execute("DROP INDEX IF EXISTS notes_fts_idx")
    op.drop_table("notes")
    op.drop_table("tasks")
    op.drop_table("users")
    notification_type.drop(op.get_bind(), checkfirst=True)
    weak_area_severity.drop(op.get_bind(), checkfirst=True)
    knowledge_category.drop(op.get_bind(), checkfirst=True)
    task_status.drop(op.get_bind(), checkfirst=True)
    task_phase.drop(op.get_bind(), checkfirst=True)
