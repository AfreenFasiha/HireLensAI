from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class CandidateSkillSchema(BaseModel):
    id: Optional[str] = None
    skill_name: str
    category: Optional[str] = "General"
    years_of_experience: Optional[float] = None
    is_verified: bool = True

    class Config:
        from_attributes = True

class RecruiterNoteSchema(BaseModel):
    id: str
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    content: str
    is_private: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RecruiterNoteCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_private: bool = False

class CandidateBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: float = Field(default=0.0, ge=0.0)
    education_level: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    summary: Optional[str] = None

class CandidateCreate(CandidateBase):
    skills: Optional[List[str]] = None

class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: Optional[float] = None
    education_level: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    summary: Optional[str] = None
    is_verified_by_recruiter: Optional[bool] = None

class CandidateResponse(CandidateBase):
    id: str
    organization_id: str
    is_verified_by_recruiter: bool
    skills: List[CandidateSkillSchema] = []
    latest_resume_id: Optional[str] = None
    latest_resume_file_name: Optional[str] = None
    active_applications_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CandidateDetailResponse(CandidateResponse):
    notes: List[RecruiterNoteSchema] = []
    raw_text: Optional[str] = None

class CandidateListResponse(BaseModel):
    items: List[CandidateResponse]
    total: int
    page: int
    page_size: int
