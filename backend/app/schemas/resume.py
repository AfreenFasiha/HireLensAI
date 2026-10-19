from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from app.models.resume import ExtractionStatus

class ParsedEducation(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None

class ParsedExperience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None

class ParsedResumeData(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: Optional[float] = 0.0
    education_level: Optional[str] = None
    skills: List[str] = []
    education: List[ParsedEducation] = []
    experience: List[ParsedExperience] = []
    certifications: List[str] = []
    projects: List[str] = []
    uncertain_fields: List[str] = []
    raw_text_snippet: Optional[str] = None

class ResumeResponse(BaseModel):
    id: str
    candidate_id: str
    file_name: str
    file_size: int
    mime_type: str
    extraction_status: ExtractionStatus
    parsed_data: ParsedResumeData
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeReviewCorrection(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: Optional[float] = None
    education_level: Optional[str] = None
    skills: Optional[List[str]] = None
