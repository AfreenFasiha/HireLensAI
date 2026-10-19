import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class InterviewType(str, enum.Enum):
    ONLINE = "ONLINE"
    PHONE = "PHONE"
    IN_PERSON = "IN_PERSON"

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED = "CANCELLED"

class Interview(TimeStampedModel):
    __tablename__ = "interviews"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    interview_type = Column(Enum(InterviewType), default=InterviewType.ONLINE, nullable=False)
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    
    meeting_link = Column(String(512), nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED, nullable=False, index=True)
    cancellation_reason = Column(Text, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="interviews")
    interviewer = relationship("User", back_populates="interviews_conducted")
    feedback = relationship("InterviewFeedback", back_populates="interview", cascade="all, delete-orphan")
