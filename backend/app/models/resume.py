import enum
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class ExtractionStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARSED = "PARSED"
    FAILED = "FAILED"
    REVIEWED = "REVIEWED"

class Resume(TimeStampedModel):
    __tablename__ = "resumes"

    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    parsed_data = Column(JSON, default=dict, nullable=False)
    extraction_status = Column(Enum(ExtractionStatus), default=ExtractionStatus.PENDING, nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="resumes")
