from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class AnalyticsOverview(BaseModel):
    total_candidates: int
    active_job_openings: int
    interviews_scheduled: int
    candidates_shortlisted: int
    applications_this_month: int
    average_match_score: float

class StageDistributionItem(BaseModel):
    stage: str
    count: int
    color: Optional[str] = None

class ApplicationsTrendItem(BaseModel):
    date: str
    applications: int

class JobApplicationMetric(BaseModel):
    job_id: str
    job_title: str
    department: str
    applications_count: int
    avg_match_score: float

class SkillMatchBucket(BaseModel):
    range: str
    count: int

class ConversionMetrics(BaseModel):
    shortlist_rate: float
    interview_conversion_rate: float
    hire_conversion_rate: float
    average_time_to_hire_days: float

class AnalyticsDashboardResponse(BaseModel):
    overview: AnalyticsOverview
    stage_distribution: List[StageDistributionItem]
    applications_trend: List[ApplicationsTrendItem]
    jobs_metrics: List[JobApplicationMetric]
    score_distribution: List[SkillMatchBucket]
    conversion_metrics: ConversionMetrics
