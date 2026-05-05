"""Add soft delete to components

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"


def upgrade():
    op.add_column("components", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("components", "deleted_at")
