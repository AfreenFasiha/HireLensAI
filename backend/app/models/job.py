import enum
from sqlalchemy import Column, String, Text, Float, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class EmploymentType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERNSHIP = "INTERNSHIP"
    REMOTE = "REMOTE"

class JobStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"

class Job(TimeStampedModel):
    __tablename__ = "jobs"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    required_skills = Column(JSON, default=list, nullable=False)
    preferred_skills = Column(JSON, default=list, nullable=False)
    min_experience_years = Column(Float, default=0.0, nullable=False)
    location = Column(String(255), nullable=False)
    employment_type = Column(Enum(EmploymentType), default=EmploymentType.FULL_TIME, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE, nullable=False, index=True)
    
    matching_weights = Column(JSON, default=dict, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="jobs")
    created_by = relationship("User", back_populates="jobs_created")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
