"""Add Notice and VoC boards

Revision ID: 002
Revises: 001
Create Date: 2026-05-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("author_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("is_pinned", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "voc_posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("author_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("status", sa.String(20), server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_voc_posts_category", "voc_posts", ["category"])
    op.create_index("ix_voc_posts_status", "voc_posts", ["status"])

    op.create_table(
        "voc_comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("voc_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.String(7), sa.ForeignKey("users.employee_id"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "voc_upvotes",
        sa.Column("user_id", sa.String(7), sa.ForeignKey("users.employee_id"), primary_key=True),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("voc_posts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("voc_upvotes")
    op.drop_table("voc_comments")
    op.drop_index("ix_voc_posts_status", "voc_posts")
    op.drop_index("ix_voc_posts_category", "voc_posts")
    op.drop_table("voc_posts")
    op.drop_table("notices")
