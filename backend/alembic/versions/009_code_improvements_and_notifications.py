"""Add code_improvements + notifications tables, and component_versions.file_content/contributor_id

Revision ID: 009
Revises: 008
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "009"
down_revision = "008"


def upgrade():
    # 1) component_versions: store the actual code so past versions are viewable
    op.add_column("component_versions", sa.Column("file_content", sa.Text(), nullable=True))
    op.add_column("component_versions", sa.Column("contributor_id", sa.String(20), nullable=True))
    op.create_foreign_key(
        "fk_component_versions_contributor_id_users",
        "component_versions", "users",
        ["contributor_id"], ["employee_id"],
    )

    # 2) code_improvements
    op.create_table(
        "code_improvements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("component_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contributor_id", sa.String(20), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("base_version", sa.String(30), nullable=True),
        sa.Column("base_content", sa.Text(), nullable=True),
        sa.Column("file_content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_version", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_code_improvements_component_id", "code_improvements", ["component_id"])
    op.create_index("ix_code_improvements_contributor_id", "code_improvements", ["contributor_id"])
    op.create_index("ix_code_improvements_status", "code_improvements", ["status"])

    # 3) notifications
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(20), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("link", sa.Text(), nullable=True),
        sa.Column("component_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), nullable=True),
        sa.Column("improvement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("code_improvements.id", ondelete="CASCADE"), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_user_unread", "notifications", ["user_id", "is_read"])


def downgrade():
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_code_improvements_status", table_name="code_improvements")
    op.drop_index("ix_code_improvements_contributor_id", table_name="code_improvements")
    op.drop_index("ix_code_improvements_component_id", table_name="code_improvements")
    op.drop_table("code_improvements")

    op.drop_constraint("fk_component_versions_contributor_id_users", "component_versions", type_="foreignkey")
    op.drop_column("component_versions", "contributor_id")
    op.drop_column("component_versions", "file_content")
