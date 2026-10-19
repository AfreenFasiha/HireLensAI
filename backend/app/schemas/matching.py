from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class MatchWeightsSchema(BaseModel):
    required_skills: float = 0.40
    semantic_similarity: float = 0.30
    preferred_skills: float = 0.15
    experience_alignment: float = 0.15

class MatchCandidateRequest(BaseModel):
    job_id: str
    candidate_id: str
    custom_weights: Optional[MatchWeightsSchema] = None

class MatchScoreResponse(BaseModel):
    id: Optional[str] = None
    application_id: Optional[str] = None
    overall_score: float = Field(..., ge=0.0, le=100.0)
    required_skills_score: float = Field(..., ge=0.0, le=100.0)
    preferred_skills_score: float = Field(..., ge=0.0, le=100.0)
    semantic_similarity_score: float = Field(..., ge=0.0, le=100.0)
    experience_alignment_score: float = Field(..., ge=0.0, le=100.0)
    matched_required_skills: List[str] = []
    missing_required_skills: List[str] = []
    matched_preferred_skills: List[str] = []
    score_explanation: str
    weights_used: Dict[str, float]
    calculated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CandidateRankItem(BaseModel):
    application_id: str
    candidate_id: str
    candidate_name: str
    candidate_title: Optional[str] = None
    candidate_email: str
    candidate_experience: float
    stage: str
    overall_score: float
    required_skills_score: float
    preferred_skills_score: float
    semantic_similarity_score: float
    experience_alignment_score: float
    matched_required_skills: List[str]
    missing_required_skills: List[str]
    matched_preferred_skills: List[str]
    score_explanation: str
    applied_at: datetime

class JobRankingResponse(BaseModel):
    job_id: str
    job_title: str
    total_candidates: int
    ranked_candidates: List[CandidateRankItem]
    advisory_notice: str = (
        "AI match scores are intended solely for human-in-the-loop decision support. "
        "They do not constitute automated hiring decisions, candidate quality judgments, or rejections."
    )
