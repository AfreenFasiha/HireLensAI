from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.application import ApplicationStage
from app.schemas.matching import MatchScoreResponse

class ApplicationCreate(BaseModel):
    job_id: str
    candidate_id: str

class ApplicationStageUpdate(BaseModel):
    stage: ApplicationStage
    reason: Optional[str] = None

class StageHistoryResponse(BaseModel):
    id: str
    from_stage: str
    to_stage: str
    reason: Optional[str] = None
    changed_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: str
    organization_id: str
    job_id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_title: Optional[str] = None
    job_title: Optional[str] = None
    job_department: Optional[str] = None
    stage: ApplicationStage
    applied_at: datetime
    updated_at: datetime
    match_score: Optional[MatchScoreResponse] = None

    class Config:
        from_attributes = True

class ApplicationDetailResponse(ApplicationResponse):
    stage_history: List[StageHistoryResponse] = []
