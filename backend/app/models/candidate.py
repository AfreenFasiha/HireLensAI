from sqlalchemy import Column, String, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class Candidate(TimeStampedModel):
    __tablename__ = "candidates"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    current_title = Column(String(255), nullable=True)
    experience_years = Column(Float, default=0.0, nullable=False)
    education_level = Column(String(255), nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    summary = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    is_verified_by_recruiter = Column(Boolean, default=False, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="candidates")
    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    notes = relationship("RecruiterNote", back_populates="candidate", cascade="all, delete-orphan")
