import enum
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class RecommendationType(str, enum.Enum):
    STRONG_YES = "STRONG_YES"
    YES = "YES"
    NEUTRAL = "NEUTRAL"
    NO = "NO"
    STRONG_NO = "STRONG_NO"

class InterviewFeedback(TimeStampedModel):
    __tablename__ = "interview_feedback"

    interview_id = Column(String(36), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    rating = Column(Integer, nullable=False)  # 1 to 5
    recommendation = Column(Enum(RecommendationType), nullable=False)
    technical_skills_feedback = Column(Text, nullable=True)
    communication_feedback = Column(Text, nullable=True)
    general_notes = Column(Text, nullable=True)

    # Relationships
    interview = relationship("Interview", back_populates="feedback")
    reviewer = relationship("User", back_populates="feedback_given")
