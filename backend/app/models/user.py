import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    RECRUITER = "RECRUITER"
    HIRING_MANAGER = "HIRING_MANAGER"

class User(TimeStampedModel):
    __tablename__ = "users"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RECRUITER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(512), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    refresh_sessions = relationship("RefreshSession", back_populates="user", cascade="all, delete-orphan")
    jobs_created = relationship("Job", back_populates="created_by")
    interviews_conducted = relationship("Interview", back_populates="interviewer")
    feedback_given = relationship("InterviewFeedback", back_populates="reviewer")
    notes_written = relationship("RecruiterNote", back_populates="author")
    audit_logs = relationship("AuditLog", back_populates="user")
