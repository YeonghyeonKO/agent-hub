import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


# ─── User ───────────────────────────────────────────────────────────────
class UserResponse(BaseModel):
    employee_id: str
    name: str
    email: str | None = None
    team: str | None = None
    org: str | None = None
    role: str
    profile_image_url: str | None = None

    model_config = {"from_attributes": True}


# ─── Component ──────────────────────────────────────────────────────────
class ComponentCreate(BaseModel):
    title: str = Field(max_length=200)
    type: str = Field(pattern=r"^(py|json)$")
    description: str | None = None
    category: str | None = None
    version: str
    min_langflow_ver: str | None = None
    max_langflow_ver: str | None = None
    tested_versions: list[str] = []
    tags: list[str] = []
    readme: str | None = None
    icon: str | None = None


class ComponentResponse(BaseModel):
    id: uuid.UUID
    title: str
    type: str
    description: str | None
    category: str | None
    version: str
    min_langflow_ver: str | None
    max_langflow_ver: str | None
    tested_versions: list[str] | None
    tags: list[str] | None = []
    icon: str | None
    is_standard: bool
    status: str
    readme: str | None = None
    author: UserResponse
    stars_count: int = 0
    downloads_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComponentListItem(BaseModel):
    id: uuid.UUID
    title: str
    type: str
    description: str | None
    category: str | None
    version: str
    min_langflow_ver: str | None
    max_langflow_ver: str | None
    tags: list[str] | None = []
    icon: str | None
    is_standard: bool
    status: str
    author: UserResponse
    stars_count: int = 0
    downloads_count: int = 0
    created_at: datetime
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}


class ComponentListResponse(BaseModel):
    items: list[ComponentListItem]
    total: int
    limit: int
    offset: int


# ─── Review ─────────────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    scores: dict = Field(description="e.g. {functionality: 9, originality: 8, utility: 10, documentation: 8}")
    comment: str | None = None
    decision: str = Field(pattern=r"^(approve|reject|revision)$")


class ReviewResponse(BaseModel):
    id: uuid.UUID
    component_id: uuid.UUID
    reviewer: UserResponse
    scores: dict | None
    comment: str | None
    decision: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Ranking ────────────────────────────────────────────────────────────
class RankingEntry(BaseModel):
    rank: int
    component_id: uuid.UUID
    title: str
    type: str
    category: str | None
    author: UserResponse
    stars: int
    downloads: int
    score: float
    trend: str = "—"


class RankingResponse(BaseModel):
    items: list[RankingEntry]
    formula: dict


# ─── Season ─────────────────────────────────────────────────────────────
class SeasonSettings(BaseModel):
    id: uuid.UUID | None = None
    name: str
    submit_start: date
    submit_end: date
    review_end: date
    award_day: date
    criteria_weights: dict | None = None
    score_formula: dict | None = None
    contact_channel: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class SeasonUpdate(BaseModel):
    name: str | None = None
    submit_start: date | None = None
    submit_end: date | None = None
    review_end: date | None = None
    award_day: date | None = None
    criteria_weights: dict | None = None
    score_formula: dict | None = None
    contact_channel: str | None = None


# ─── Code Improvement ───────────────────────────────────────────────────
class CodeImprovementListItem(BaseModel):
    id: uuid.UUID
    component_id: uuid.UUID
    contributor: UserResponse
    title: str
    description: str
    base_version: str | None
    status: str
    review_comment: str | None = None
    applied_version: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CodeImprovementDetail(CodeImprovementListItem):
    base_content: str | None = None
    file_content: str


class CodeImprovementReview(BaseModel):
    decision: str = Field(pattern=r"^(approve|reject)$")
    review_comment: str | None = None


class ContributorEntry(BaseModel):
    user: UserResponse
    contributions: int
    first_contribution_at: datetime
    last_contribution_at: datetime


# ─── Notification ───────────────────────────────────────────────────────
class NotificationItem(BaseModel):
    id: uuid.UUID
    kind: str
    message: str
    link: str | None
    component_id: uuid.UUID | None
    improvement_id: uuid.UUID | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    unread_count: int


# ─── Version ────────────────────────────────────────────────────────────
class VersionEntry(BaseModel):
    id: uuid.UUID
    version: str
    changelog: str | None
    has_content: bool
    contributor: UserResponse | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VersionFileResponse(BaseModel):
    version: str
    filename: str
    content: str
    type: str


# ─── Issue ──────────────────────────────────────────────────────────────
class IssueResponse(BaseModel):
    id: uuid.UUID
    component_id: uuid.UUID
    reporter: UserResponse
    kind: str
    severity: str
    summary: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
