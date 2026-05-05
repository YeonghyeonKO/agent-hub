"""Vercel Serverless Function — wraps the FastAPI app."""
import sys
import os

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Force DEV_MODE and set upload dir to /tmp for Vercel
os.environ.setdefault("DEV_MODE", "true")
os.environ.setdefault("UPLOAD_DIR", "/tmp/uploads")

# Convert Neon DATABASE_URL to asyncpg format
# Prefer unpooled endpoint (asyncpg manages its own connections)
import re
db_url = os.environ.get("DATABASE_URL_UNPOOLED") or os.environ.get("DATABASE_URL", "")
if db_url and "postgresql://" in db_url and "+asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
db_url = re.sub(r'[&?]channel_binding=[^&]*', '', db_url)
db_url = db_url.replace("sslmode=require", "ssl=require")
os.environ["DATABASE_URL"] = db_url

from app.main import app  # noqa: E402
