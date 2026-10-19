from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class MatchScore(TimeStampedModel):
    __tablename__ = "match_scores"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    overall_score = Column(Float, nullable=False, index=True)
    required_skills_score = Column(Float, default=0.0, nullable=False)
    preferred_skills_score = Column(Float, default=0.0, nullable=False)
    semantic_similarity_score = Column(Float, default=0.0, nullable=False)
    experience_alignment_score = Column(Float, default=0.0, nullable=False)
    
    matched_required_skills = Column(JSON, default=list, nullable=False)
    missing_required_skills = Column(JSON, default=list, nullable=False)
    matched_preferred_skills = Column(JSON, default=list, nullable=False)
    
    score_explanation = Column(Text, nullable=False)
    weights_used = Column(JSON, default=dict, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="match_score")
