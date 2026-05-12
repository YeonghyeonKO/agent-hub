"""Widen employee_id from String(7) to String(20) for non-numeric IDs

Revision ID: 008
Revises: 007
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"

# All columns referencing employee_id
TABLES_COLS = [
    ("users", "employee_id"),
    ("components", "author_id"),
    ("reviews", "reviewer_id"),
    ("stars", "user_id"),
    ("downloads", "user_id"),
    ("issues", "reporter_id"),
    ("notices", "author_id"),
    ("voc_posts", "author_id"),
    ("voc_comments", "author_id"),
    ("voc_upvotes", "user_id"),
    ("images", "uploader_id"),
]


def upgrade():
    for table, col in TABLES_COLS:
        op.alter_column(table, col, type_=sa.String(20), existing_type=sa.String(7))


def downgrade():
    for table, col in TABLES_COLS:
        op.alter_column(table, col, type_=sa.String(7), existing_type=sa.String(20))
