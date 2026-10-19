from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStage
from app.models.application_stage_history import ApplicationStageHistory
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.match_score import MatchScore
from app.models.audit_log import AuditLog
from app.ai.matching_engine import evaluate_candidate_match
from app.schemas.application import (
    ApplicationCreate, ApplicationStageUpdate,
    ApplicationResponse, ApplicationDetailResponse, StageHistoryResponse
)
from app.schemas.matching import MatchScoreResponse

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    job_id: Optional[str] = None,
    candidate_id: Optional[str] = None,
    stage: Optional[ApplicationStage] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists applications with optional filtering by job, candidate, or pipeline stage."""
    query = db.query(Application).filter(Application.organization_id == current_user.organization_id)

    if job_id:
        query = query.filter(Application.job_id == job_id)
    if candidate_id:
        query = query.filter(Application.candidate_id == candidate_id)
    if stage:
        query = query.filter(Application.stage == stage)

    applications = query.order_by(Application.applied_at.desc()).all()

    items = []
    for app in applications:
        match_resp = None
        if app.match_score:
            ms = app.match_score
            match_resp = MatchScoreResponse(
                id=ms.id,
                application_id=ms.application_id,
                overall_score=ms.overall_score,
                required_skills_score=ms.required_skills_score,
                preferred_skills_score=ms.preferred_skills_score,
                semantic_similarity_score=ms.semantic_similarity_score,
                experience_alignment_score=ms.experience_alignment_score,
                matched_required_skills=ms.matched_required_skills or [],
                missing_required_skills=ms.missing_required_skills or [],
                matched_preferred_skills=ms.matched_preferred_skills or [],
                score_explanation=ms.score_explanation,
                weights_used=ms.weights_used or {},
                calculated_at=ms.calculated_at
            )

        items.append(
            ApplicationResponse(
                id=app.id,
                organization_id=app.organization_id,
                job_id=app.job_id,
                candidate_id=app.candidate_id,
                candidate_name=app.candidate.full_name if app.candidate else None,
                candidate_email=app.candidate.email if app.candidate else None,
                candidate_title=app.candidate.current_title if app.candidate else None,
                job_title=app.job.title if app.job else None,
                job_department=app.job.department if app.job else None,
                stage=app.stage,
                applied_at=app.applied_at,
                updated_at=app.updated_at,
                match_score=match_resp
            )
        )

    return items

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    req: ApplicationCreate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Creates an application and triggers automated AI candidate match evaluation."""
    job = db.query(Job).filter(Job.id == req.job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found.")

    cand = db.query(Candidate).filter(Candidate.id == req.candidate_id, Candidate.organization_id == current_user.organization_id).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    # Check duplicate application
    existing = db.query(Application).filter(
        Application.job_id == job.id,
        Application.candidate_id == cand.id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Candidate has already applied to this position.")

    app = Application(
        organization_id=current_user.organization_id,
        job_id=job.id,
        candidate_id=cand.id,
        stage=ApplicationStage.APPLIED
    )
    db.add(app)
    db.flush()

    # Create initial stage history entry
    history = ApplicationStageHistory(
        application_id=app.id,
        changed_by_id=current_user.id,
        from_stage="NEW",
        to_stage=ApplicationStage.APPLIED.value,
        reason="Initial application submission"
    )
    db.add(history)

    # Perform automated AI matching evaluation
    cand_skills = [s.skill_name for s in cand.skills]
    evaluation = evaluate_candidate_match(
        candidate_skills=cand_skills,
        candidate_experience=cand.experience_years,
        candidate_text=cand.raw_text or cand.summary or "",
        job_required_skills=job.required_skills or [],
        job_preferred_skills=job.preferred_skills or [],
        job_min_experience=job.min_experience_years,
        job_description=job.description,
        custom_weights=job.matching_weights or None
    )

    score_record = MatchScore(
        application_id=app.id,
        overall_score=evaluation["overall_score"],
        required_skills_score=evaluation["required_skills_score"],
        preferred_skills_score=evaluation["preferred_skills_score"],
        semantic_similarity_score=evaluation["semantic_similarity_score"],
        experience_alignment_score=evaluation["experience_alignment_score"],
        matched_required_skills=evaluation["matched_required_skills"],
        missing_required_skills=evaluation["missing_required_skills"],
        matched_preferred_skills=evaluation["matched_preferred_skills"],
        score_explanation=evaluation["score_explanation"],
        weights_used=evaluation["weights_used"]
    )
    db.add(score_record)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="APPLICATION_CREATED",
        resource_type="APPLICATION",
        resource_id=app.id,
        details={"job_id": job.id, "candidate_id": cand.id},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(app)

    match_resp = MatchScoreResponse(
        id=score_record.id,
        application_id=app.id,
        overall_score=score_record.overall_score,
        required_skills_score=score_record.required_skills_score,
        preferred_skills_score=score_record.preferred_skills_score,
        semantic_similarity_score=score_record.semantic_similarity_score,
        experience_alignment_score=score_record.experience_alignment_score,
        matched_required_skills=score_record.matched_required_skills,
        missing_required_skills=score_record.missing_required_skills,
        matched_preferred_skills=score_record.matched_preferred_skills,
        score_explanation=score_record.score_explanation,
        weights_used=score_record.weights_used,
        calculated_at=score_record.calculated_at
    )

    return ApplicationResponse(
        id=app.id,
        organization_id=app.organization_id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        candidate_name=cand.full_name,
        candidate_email=cand.email,
        candidate_title=cand.current_title,
        job_title=job.title,
        job_department=job.department,
        stage=app.stage,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
        match_score=match_resp
    )

@router.get("/{id}", response_model=ApplicationDetailResponse)
def get_application(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves single application with stage history and match score."""
    app = db.query(Application).filter(
        Application.id == id,
        Application.organization_id == current_user.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    match_resp = None
    if app.match_score:
        ms = app.match_score
        match_resp = MatchScoreResponse(
            id=ms.id,
            application_id=ms.application_id,
            overall_score=ms.overall_score,
            required_skills_score=ms.required_skills_score,
            preferred_skills_score=ms.preferred_skills_score,
            semantic_similarity_score=ms.semantic_similarity_score,
            experience_alignment_score=ms.experience_alignment_score,
            matched_required_skills=ms.matched_required_skills or [],
            missing_required_skills=ms.missing_required_skills or [],
            matched_preferred_skills=ms.matched_preferred_skills or [],
            score_explanation=ms.score_explanation,
            weights_used=ms.weights_used or {},
            calculated_at=ms.calculated_at
        )

    history_items = [
        StageHistoryResponse(
            id=h.id,
            from_stage=h.from_stage,
            to_stage=h.to_stage,
            reason=h.reason,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            created_at=h.created_at
        ) for h in app.stage_history
    ]

    return ApplicationDetailResponse(
        id=app.id,
        organization_id=app.organization_id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        candidate_name=app.candidate.full_name if app.candidate else None,
        candidate_email=app.candidate.email if app.candidate else None,
        candidate_title=app.candidate.current_title if app.candidate else None,
        job_title=app.job.title if app.job else None,
        job_department=app.job.department if app.job else None,
        stage=app.stage,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
        match_score=match_resp,
        stage_history=history_items
    )

@router.patch("/{id}/stage", response_model=ApplicationResponse)
def update_application_stage(
    id: str,
    req: ApplicationStageUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER])),
    db: Session = Depends(get_db)
):
    """Updates candidate stage in the hiring pipeline (Kanban drag-and-drop support)."""
    app = db.query(Application).filter(
        Application.id == id,
        Application.organization_id == current_user.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    old_stage = app.stage.value
    new_stage = req.stage.value

    if old_stage != new_stage:
        app.stage = req.stage
        
        # Record history
        history = ApplicationStageHistory(
            application_id=app.id,
            changed_by_id=current_user.id,
            from_stage=old_stage,
            to_stage=new_stage,
            reason=req.reason or f"Candidate transitioned to {new_stage} stage"
        )
        db.add(history)

        audit = AuditLog(
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            action="STAGE_CHANGED",
            resource_type="APPLICATION",
            resource_id=app.id,
            details={"old_stage": old_stage, "new_stage": new_stage, "reason": req.reason},
            ip_address=request.client.host if request.client else None
        )
        db.add(audit)
        db.commit()
        db.refresh(app)

    match_resp = None
    if app.match_score:
        ms = app.match_score
        match_resp = MatchScoreResponse(
            id=ms.id,
            application_id=ms.application_id,
            overall_score=ms.overall_score,
            required_skills_score=ms.required_skills_score,
            preferred_skills_score=ms.preferred_skills_score,
            semantic_similarity_score=ms.semantic_similarity_score,
            experience_alignment_score=ms.experience_alignment_score,
            matched_required_skills=ms.matched_required_skills or [],
            missing_required_skills=ms.missing_required_skills or [],
            matched_preferred_skills=ms.matched_preferred_skills or [],
            score_explanation=ms.score_explanation,
            weights_used=ms.weights_used or {},
            calculated_at=ms.calculated_at
        )

    return ApplicationResponse(
        id=app.id,
        organization_id=app.organization_id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        candidate_name=app.candidate.full_name if app.candidate else None,
        candidate_email=app.candidate.email if app.candidate else None,
        candidate_title=app.candidate.current_title if app.candidate else None,
        job_title=app.job.title if app.job else None,
        job_department=app.job.department if app.job else None,
        stage=app.stage,
        applied_at=app.applied_at,
        updated_at=app.updated_at,
        match_score=match_resp
    )
