from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, auth_callback, components, images, notices, rankings, seed, users, voc


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="AgentHub API",
    description="Internal Langflow Component & Flow Registry",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(components.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(rankings.router)
app.include_router(notices.router)
app.include_router(voc.router)
app.include_router(images.router)
app.include_router(auth_callback.router)
app.include_router(seed.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
