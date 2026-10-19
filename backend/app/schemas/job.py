from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from app.models.job import JobStatus, EmploymentType

class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    department: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10)
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    min_experience_years: float = Field(default=0.0, ge=0.0)
    location: str = Field(..., min_length=2, max_length=255)
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    status: JobStatus = JobStatus.ACTIVE
    matching_weights: Optional[Dict[str, float]] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience_years: Optional[float] = None
    location: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[JobStatus] = None
    matching_weights: Optional[Dict[str, float]] = None

class JobResponse(JobBase):
    id: str
    organization_id: str
    created_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    candidates_count: Optional[int] = 0

    class Config:
        from_attributes = True

class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int
