import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class ApplicationStage(str, enum.Enum):
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    HIRED = "HIRED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

class Application(TimeStampedModel):
    __tablename__ = "applications"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    
    stage = Column(Enum(ApplicationStage), default=ApplicationStage.APPLIED, nullable=False, index=True)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('job_id', 'candidate_id', name='uq_job_candidate_application'),
    )

    # Relationships
    organization = relationship("Organization", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    stage_history = relationship("ApplicationStageHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStageHistory.created_at.desc()")
    match_score = relationship("MatchScore", back_populates="application", uselist=False, cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
