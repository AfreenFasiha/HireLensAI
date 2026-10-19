from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class ApplicationStageHistory(TimeStampedModel):
    __tablename__ = "application_stage_history"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    from_stage = Column(String(50), nullable=False)
    to_stage = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="stage_history")
    changed_by = relationship("User")
