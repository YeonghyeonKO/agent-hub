"""Add contact_channel to seasons

Revision ID: 006
Revises: 005
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"


def upgrade():
    op.add_column("seasons", sa.Column("contact_channel", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("seasons", "contact_channel")
