from sqlalchemy import Column, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class CandidateSkill(TimeStampedModel):
    __tablename__ = "candidate_skills"

    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), default="General", nullable=False)
    years_of_experience = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="skills")
