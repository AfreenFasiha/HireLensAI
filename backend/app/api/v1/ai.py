import os
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.models.match_score import MatchScore
from app.ai.resume_parser import parse_resume
from app.ai.matching_engine import evaluate_candidate_match
from app.schemas.resume import ParsedResumeData
from app.schemas.matching import (
    MatchCandidateRequest, MatchScoreResponse,
    JobRankingResponse, CandidateRankItem
)

router = APIRouter(prefix="/ai", tags=["AI & Matching"])

@router.post("/parse-resume", response_model=ParsedResumeData)
async def preview_resume_parser(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Directly parses an uploaded PDF or DOCX resume to test and preview NLP extraction."""
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format {ext}. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Temporary write
    temp_dir = Path(settings.UPLOAD_DIR) / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / f"preview_{file.filename}"

    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)

    try:
        parsed = parse_resume(str(temp_path))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return ParsedResumeData(
        full_name=parsed.get("full_name"),
        email=parsed.get("email"),
        phone=parsed.get("phone"),
        location=parsed.get("location"),
        current_title=parsed.get("current_title"),
        experience_years=parsed.get("experience_years", 0.0),
        education_level=parsed.get("education_level"),
        skills=parsed.get("skills", []),
        education=parsed.get("education", []),
        experience=parsed.get("experience", []),
        certifications=parsed.get("certifications", []),
        projects=parsed.get("projects", []),
        uncertain_fields=parsed.get("uncertain_fields", []),
        raw_text_snippet=parsed.get("raw_text_snippet")
    )

@router.post("/match-candidate", response_model=MatchScoreResponse)
def match_candidate(
    req: MatchCandidateRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Calculates or recalculates explainable match score for a candidate against a job."""
    job = db.query(Job).filter(Job.id == req.job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found.")

    cand = db.query(Candidate).filter(Candidate.id == req.candidate_id, Candidate.organization_id == current_user.organization_id).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    app = db.query(Application).filter(Application.job_id == job.id, Application.candidate_id == cand.id).first()
    if not app:
        # Create application automatically if matching directly
        app = Application(
            organization_id=current_user.organization_id,
            job_id=job.id,
            candidate_id=cand.id
        )
        db.add(app)
        db.flush()

    weights = None
    if req.custom_weights:
        weights = req.custom_weights.model_dump()
    elif job.matching_weights:
        weights = job.matching_weights

    cand_skills = [s.skill_name for s in cand.skills]
    evaluation = evaluate_candidate_match(
        candidate_skills=cand_skills,
        candidate_experience=cand.experience_years,
        candidate_text=cand.raw_text or cand.summary or "",
        job_required_skills=job.required_skills or [],
        job_preferred_skills=job.preferred_skills or [],
        job_min_experience=job.min_experience_years,
        job_description=job.description,
        custom_weights=weights
    )

    ms = db.query(MatchScore).filter(MatchScore.application_id == app.id).first()
    if not ms:
        ms = MatchScore(application_id=app.id)
        db.add(ms)

    ms.overall_score = evaluation["overall_score"]
    ms.required_skills_score = evaluation["required_skills_score"]
    ms.preferred_skills_score = evaluation["preferred_skills_score"]
    ms.semantic_similarity_score = evaluation["semantic_similarity_score"]
    ms.experience_alignment_score = evaluation["experience_alignment_score"]
    ms.matched_required_skills = evaluation["matched_required_skills"]
    ms.missing_required_skills = evaluation["missing_required_skills"]
    ms.matched_preferred_skills = evaluation["matched_preferred_skills"]
    ms.score_explanation = evaluation["score_explanation"]
    ms.weights_used = evaluation["weights_used"]
    db.commit()
    db.refresh(ms)

    return MatchScoreResponse(
        id=ms.id,
        application_id=app.id,
        overall_score=ms.overall_score,
        required_skills_score=ms.required_skills_score,
        preferred_skills_score=ms.preferred_skills_score,
        semantic_similarity_score=ms.semantic_similarity_score,
        experience_alignment_score=ms.experience_alignment_score,
        matched_required_skills=ms.matched_required_skills,
        missing_required_skills=ms.missing_required_skills,
        matched_preferred_skills=ms.matched_preferred_skills,
        score_explanation=ms.score_explanation,
        weights_used=ms.weights_used,
        calculated_at=ms.calculated_at
    )

@router.get("/job-rankings/{job_id}", response_model=JobRankingResponse)
def get_job_rankings(
    job_id: str,
    stage: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns candidate ranking ordered by AI match score with explainability metrics and human-in-the-loop notice."""
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found.")

    query = db.query(Application).filter(Application.job_id == job.id)
    if stage:
        query = query.filter(Application.stage == stage)

    applications = query.all()

    ranked_items = []
    for app in applications:
        ms = app.match_score
        cand = app.candidate
        if not cand:
            continue

        # If match score not yet calculated, calculate it on the fly
        if not ms:
            cand_skills = [s.skill_name for s in cand.skills]
            eval_res = evaluate_candidate_match(
                candidate_skills=cand_skills,
                candidate_experience=cand.experience_years,
                candidate_text=cand.raw_text or cand.summary or "",
                job_required_skills=job.required_skills or [],
                job_preferred_skills=job.preferred_skills or [],
                job_min_experience=job.min_experience_years,
                job_description=job.description,
                custom_weights=job.matching_weights or None
            )
            ms = MatchScore(
                application_id=app.id,
                overall_score=eval_res["overall_score"],
                required_skills_score=eval_res["required_skills_score"],
                preferred_skills_score=eval_res["preferred_skills_score"],
                semantic_similarity_score=eval_res["semantic_similarity_score"],
                experience_alignment_score=eval_res["experience_alignment_score"],
                matched_required_skills=eval_res["matched_required_skills"],
                missing_required_skills=eval_res["missing_required_skills"],
                matched_preferred_skills=eval_res["matched_preferred_skills"],
                score_explanation=eval_res["score_explanation"],
                weights_used=eval_res["weights_used"]
            )
            db.add(ms)
            db.commit()
            db.refresh(ms)

        ranked_items.append(
            CandidateRankItem(
                application_id=app.id,
                candidate_id=cand.id,
                candidate_name=cand.full_name,
                candidate_title=cand.current_title,
                candidate_email=cand.email,
                candidate_experience=cand.experience_years,
                stage=app.stage.value,
                overall_score=ms.overall_score,
                required_skills_score=ms.required_skills_score,
                preferred_skills_score=ms.preferred_skills_score,
                semantic_similarity_score=ms.semantic_similarity_score,
                experience_alignment_score=ms.experience_alignment_score,
                matched_required_skills=ms.matched_required_skills or [],
                missing_required_skills=ms.missing_required_skills or [],
                matched_preferred_skills=ms.matched_preferred_skills or [],
                score_explanation=ms.score_explanation,
                applied_at=app.applied_at
            )
        )

    # Sort descending by overall_score
    ranked_items.sort(key=lambda x: x.overall_score, reverse=True)

    return JobRankingResponse(
        job_id=job.id,
        job_title=job.title,
        total_candidates=len(ranked_items),
        ranked_candidates=ranked_items
    )
