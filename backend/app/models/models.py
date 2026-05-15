import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    employee_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(120))
    team: Mapped[str | None] = mapped_column(String(100))
    org: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="user")  # user / admin / reviewer
    profile_image_url: Mapped[str | None] = mapped_column(Text)
    keycloak_sub: Mapped[str | None] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    components: Mapped[list["Component"]] = relationship(back_populates="author")


class Component(Base):
    __tablename__ = "components"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(10))  # py / json
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(50))
    version: Mapped[str] = mapped_column(String(30))
    min_langflow_ver: Mapped[str | None] = mapped_column(String(20))
    max_langflow_ver: Mapped[str | None] = mapped_column(String(20))
    tested_versions: Mapped[list | None] = mapped_column(JSON, default=list)
    tags: Mapped[list | None] = mapped_column(JSON, default=list)
    file_path: Mapped[str | None] = mapped_column(Text)
    file_content: Mapped[str | None] = mapped_column(Text)
    readme: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(50))
    is_standard: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft/pending/approved/rejected

    author_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    author: Mapped["User"] = relationship(back_populates="components")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    versions: Mapped[list["ComponentVersion"]] = relationship(back_populates="component", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="component", cascade="all, delete-orphan")
    stars: Mapped[list["Star"]] = relationship(back_populates="component", cascade="all, delete-orphan")
    downloads: Mapped[list["Download"]] = relationship(back_populates="component", cascade="all, delete-orphan")


class ComponentVersion(Base):
    __tablename__ = "component_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"))
    version: Mapped[str] = mapped_column(String(30))
    changelog: Mapped[str | None] = mapped_column(Text)
    file_path: Mapped[str | None] = mapped_column(Text)
    file_content: Mapped[str | None] = mapped_column(Text)
    contributor_id: Mapped[str | None] = mapped_column(ForeignKey("users.employee_id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    component: Mapped["Component"] = relationship(back_populates="versions")
    contributor: Mapped["User | None"] = relationship()


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"))
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    scores: Mapped[dict | None] = mapped_column(JSON)  # {functionality, originality, utility, documentation}
    comment: Mapped[str | None] = mapped_column(Text)
    decision: Mapped[str] = mapped_column(String(20))  # approve / reject / revision
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    component: Mapped["Component"] = relationship(back_populates="reviews")
    reviewer: Mapped["User"] = relationship()


class Star(Base):
    __tablename__ = "stars"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"), primary_key=True)
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    component: Mapped["Component"] = relationship(back_populates="stars")
    user: Mapped["User"] = relationship()


class Download(Base):
    __tablename__ = "downloads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    component: Mapped["Component"] = relationship(back_populates="downloads")
    user: Mapped["User"] = relationship()


class Image(Base):
    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(50))
    data: Mapped[str] = mapped_column(Text)  # base64 encoded
    uploader_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    uploader: Mapped["User"] = relationship()


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"))
    reporter_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    kind: Mapped[str] = mapped_column(String(20))  # security / bug / report
    severity: Mapped[str] = mapped_column(String(10))  # high / medium / low
    summary: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open / investigating / resolved
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    component: Mapped["Component"] = relationship()
    reporter: Mapped["User"] = relationship()


class Notice(Base):
    __tablename__ = "notices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(300))
    content: Mapped[str] = mapped_column(Text)
    author_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author: Mapped["User"] = relationship()


class VocPost(Base):
    __tablename__ = "voc_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(300))
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(30))  # suggestion / bug / question / etc
    author_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    status: Mapped[str] = mapped_column(String(20), default="open")  # open / in-progress / resolved / closed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author: Mapped["User"] = relationship()
    comments: Mapped[list["VocComment"]] = relationship(back_populates="post", cascade="all, delete-orphan")
    upvotes: Mapped[list["VocUpvote"]] = relationship(back_populates="post", cascade="all, delete-orphan")


class VocComment(Base):
    __tablename__ = "voc_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("voc_posts.id", ondelete="CASCADE"))
    author_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    post: Mapped["VocPost"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship()


class VocUpvote(Base):
    __tablename__ = "voc_upvotes"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"), primary_key=True)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("voc_posts.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    post: Mapped["VocPost"] = relationship(back_populates="upvotes")


class CodeImprovement(Base):
    __tablename__ = "code_improvements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"))
    contributor_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text)  # what was improved + why
    base_version: Mapped[str | None] = mapped_column(String(30))  # component version at submission
    base_content: Mapped[str | None] = mapped_column(Text)  # snapshot of original code for diff stability
    file_content: Mapped[str] = mapped_column(Text)  # the improved code
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / approved / rejected
    review_comment: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    applied_version: Mapped[str | None] = mapped_column(String(30), nullable=True)  # version when approved
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    component: Mapped["Component"] = relationship()
    contributor: Mapped["User"] = relationship()


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.employee_id"))  # recipient
    kind: Mapped[str] = mapped_column(String(40))  # improvement_request / improvement_approved / improvement_rejected
    message: Mapped[str] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(Text)  # hash route, e.g. #/component/{id}?tab=improvements
    component_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"), nullable=True)
    improvement_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("code_improvements.id", ondelete="CASCADE"), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Season(Base):
    __tablename__ = "seasons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    submit_start: Mapped[date] = mapped_column(Date)
    submit_end: Mapped[date] = mapped_column(Date)
    review_end: Mapped[date] = mapped_column(Date)
    award_day: Mapped[date] = mapped_column(Date)
    criteria_weights: Mapped[dict | None] = mapped_column(JSON, default=dict)
    score_formula: Mapped[dict | None] = mapped_column(JSON, default=lambda: {"star_weight": 2, "download_weight": 1})
    contact_channel: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
