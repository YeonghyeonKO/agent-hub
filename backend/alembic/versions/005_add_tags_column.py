"""Add tags JSON column to components

Revision ID: 005
Revises: 004
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = "005"
down_revision = "004"


def upgrade():
    op.add_column("components", sa.Column("tags", JSON(), nullable=True, server_default="[]"))


def downgrade():
    op.drop_column("components", "tags")
