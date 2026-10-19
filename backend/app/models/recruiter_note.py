from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class RecruiterNote(TimeStampedModel):
    __tablename__ = "recruiter_notes"

    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    content = Column(Text, nullable=False)
    is_private = Column(Boolean, default=False, nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="notes")
    author = relationship("User", back_populates="notes_written")
