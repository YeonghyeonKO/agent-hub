"""Add langflow_endpoints table (개인 Langflow 배포 대상)

Revision ID: 010
Revises: 009
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "010"
down_revision = "009"


def upgrade():
    op.create_table(
        "langflow_endpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(20), sa.ForeignKey("users.employee_id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("base_url", sa.Text(), nullable=False),
        sa.Column("api_key", sa.Text(), nullable=True),
        sa.Column("last_status", sa.String(10), nullable=False, server_default="unknown"),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_langflow_endpoints_user_id", "langflow_endpoints", ["user_id"])


def downgrade():
    op.drop_index("ix_langflow_endpoints_user_id", table_name="langflow_endpoints")
    op.drop_table("langflow_endpoints")
