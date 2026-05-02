"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("employee_id", sa.String(7), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("email", sa.String(120)),
        sa.Column("team", sa.String(100)),
        sa.Column("org", sa.String(100)),
        sa.Column("role", sa.String(20), server_default="user"),
        sa.Column("profile_image_url", sa.Text),
        sa.Column("keycloak_sub", sa.String(255), unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "components",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("category", sa.String(50)),
        sa.Column("version", sa.String(30), nullable=False),
        sa.Column("min_langflow_ver", sa.String(20)),
        sa.Column("max_langflow_ver", sa.String(20)),
        sa.Column("tested_versions", JSON, server_default="[]"),
        sa.Column("file_path", sa.Text),
        sa.Column("readme", sa.Text),
        sa.Column("icon", sa.String(50)),
        sa.Column("is_standard", sa.Boolean, server_default="false"),
        sa.Column("status", sa.String(20), server_default="draft"),
        sa.Column("author_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_components_status", "components", ["status"])
    op.create_index("ix_components_category", "components", ["category"])
    op.create_index("ix_components_author_id", "components", ["author_id"])

    op.create_table(
        "component_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("component_id", UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.String(30), nullable=False),
        sa.Column("changelog", sa.Text),
        sa.Column("file_path", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "reviews",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("component_id", UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reviewer_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("scores", JSON),
        sa.Column("comment", sa.Text),
        sa.Column("decision", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "stars",
        sa.Column("user_id", sa.String(7), sa.ForeignKey("users.employee_id"), primary_key=True),
        sa.Column("component_id", UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "downloads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("component_id", UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "issues",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("component_id", UUID(as_uuid=True), sa.ForeignKey("components.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reporter_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("severity", sa.String(10), nullable=False),
        sa.Column("summary", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "seasons",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("submit_start", sa.Date, nullable=False),
        sa.Column("submit_end", sa.Date, nullable=False),
        sa.Column("review_end", sa.Date, nullable=False),
        sa.Column("award_day", sa.Date, nullable=False),
        sa.Column("criteria_weights", JSON),
        sa.Column("score_formula", JSON),
        sa.Column("is_active", sa.Boolean, server_default="false"),
    )


def downgrade() -> None:
    op.drop_table("seasons")
    op.drop_table("issues")
    op.drop_table("downloads")
    op.drop_table("stars")
    op.drop_table("reviews")
    op.drop_table("component_versions")
    op.drop_index("ix_components_author_id", "components")
    op.drop_index("ix_components_category", "components")
    op.drop_index("ix_components_status", "components")
    op.drop_table("components")
    op.drop_table("users")
