"""Add file_content column to components for serverless deployments

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"


def upgrade():
    op.add_column("components", sa.Column("file_content", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("components", "file_content")
