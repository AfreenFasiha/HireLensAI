from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.interview import InterviewType, InterviewStatus
from app.models.interview_feedback import RecommendationType

class InterviewBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    interview_type: InterviewType = InterviewType.ONLINE
    scheduled_start: datetime
    scheduled_end: datetime
    timezone: str = "UTC"
    meeting_link: Optional[str] = None
    location: Optional[str] = None

class InterviewCreate(InterviewBase):
    application_id: str
    interviewer_id: Optional[str] = None

class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    interview_type: Optional[InterviewType] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    timezone: Optional[str] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    status: Optional[InterviewStatus] = None
    interviewer_id: Optional[str] = None
    cancellation_reason: Optional[str] = None

class InterviewFeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    recommendation: RecommendationType
    technical_skills_feedback: Optional[str] = None
    communication_feedback: Optional[str] = None
    general_notes: Optional[str] = None

class InterviewFeedbackResponse(BaseModel):
    id: str
    interview_id: str
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    rating: int
    recommendation: RecommendationType
    technical_skills_feedback: Optional[str] = None
    communication_feedback: Optional[str] = None
    general_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewResponse(InterviewBase):
    id: str
    application_id: str
    interviewer_id: Optional[str] = None
    interviewer_name: Optional[str] = None
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    status: InterviewStatus
    cancellation_reason: Optional[str] = None
    created_at: datetime
    feedbacks: List[InterviewFeedbackResponse] = []

    class Config:
        from_attributes = True
