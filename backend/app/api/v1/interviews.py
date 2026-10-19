from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database.session import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.interview import Interview, InterviewStatus, InterviewType
from app.models.interview_feedback import InterviewFeedback, RecommendationType
from app.models.audit_log import AuditLog
from app.schemas.interview import (
    InterviewCreate, InterviewUpdate, InterviewResponse,
    InterviewFeedbackCreate, InterviewFeedbackResponse
)

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.get("", response_model=List[InterviewResponse])
def list_interviews(
    application_id: Optional[str] = None,
    status: Optional[InterviewStatus] = None,
    upcoming_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists organization interviews with calendar scheduling details."""
    query = db.query(Interview).join(Application).filter(Application.organization_id == current_user.organization_id)

    if application_id:
        query = query.filter(Interview.application_id == application_id)
    if status:
        query = query.filter(Interview.status == status)
    if upcoming_only:
        query = query.filter(
            Interview.scheduled_start >= datetime.utcnow(),
            Interview.status == InterviewStatus.SCHEDULED
        )

    interviews = query.order_by(Interview.scheduled_start.asc()).all()

    items = []
    for iv in interviews:
        feedbacks = [
            InterviewFeedbackResponse(
                id=fb.id,
                interview_id=fb.interview_id,
                reviewer_id=fb.reviewer_id,
                reviewer_name=fb.reviewer.full_name if fb.reviewer else "Interviewer",
                rating=fb.rating,
                recommendation=fb.recommendation,
                technical_skills_feedback=fb.technical_skills_feedback,
                communication_feedback=fb.communication_feedback,
                general_notes=fb.general_notes,
                created_at=fb.created_at
            ) for fb in iv.feedback
        ]

        app = iv.application
        items.append(
            InterviewResponse(
                id=iv.id,
                application_id=iv.application_id,
                interviewer_id=iv.interviewer_id,
                interviewer_name=iv.interviewer.full_name if iv.interviewer else None,
                candidate_id=app.candidate_id if app else None,
                candidate_name=app.candidate.full_name if app and app.candidate else None,
                candidate_email=app.candidate.email if app and app.candidate else None,
                job_id=app.job_id if app else None,
                job_title=app.job.title if app and app.job else None,
                title=iv.title,
                interview_type=iv.interview_type,
                scheduled_start=iv.scheduled_start,
                scheduled_end=iv.scheduled_end,
                timezone=iv.timezone,
                meeting_link=iv.meeting_link,
                location=iv.location,
                status=iv.status,
                cancellation_reason=iv.cancellation_reason,
                created_at=iv.created_at,
                feedbacks=feedbacks
            )
        )

    return items

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    req: InterviewCreate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Schedules an interview with date/time, timezone, and interviewer conflict validation."""
    app = db.query(Application).filter(
        Application.id == req.application_id,
        Application.organization_id == current_user.organization_id
    ).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if req.scheduled_end <= req.scheduled_start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview end time must be after start time.")

    interviewer_id = req.interviewer_id or current_user.id

    # Check scheduling conflict for the interviewer
    conflict = db.query(Interview).filter(
        Interview.interviewer_id == interviewer_id,
        Interview.status == InterviewStatus.SCHEDULED,
        and_(
            Interview.scheduled_start < req.scheduled_end,
            Interview.scheduled_end > req.scheduled_start
        )
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Scheduling conflict: The assigned interviewer already has an interview scheduled from {conflict.scheduled_start} to {conflict.scheduled_end}."
        )

    interview = Interview(
        application_id=app.id,
        interviewer_id=interviewer_id,
        title=req.title,
        interview_type=req.interview_type,
        scheduled_start=req.scheduled_start,
        scheduled_end=req.scheduled_end,
        timezone=req.timezone,
        meeting_link=req.meeting_link,
        location=req.location,
        status=InterviewStatus.SCHEDULED
    )
    db.add(interview)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="INTERVIEW_SCHEDULED",
        resource_type="INTERVIEW",
        resource_id=interview.id,
        details={"title": interview.title, "candidate_id": app.candidate_id},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(interview)

    return InterviewResponse(
        id=interview.id,
        application_id=interview.application_id,
        interviewer_id=interview.interviewer_id,
        interviewer_name=interview.interviewer.full_name if interview.interviewer else None,
        candidate_id=app.candidate_id,
        candidate_name=app.candidate.full_name if app.candidate else None,
        candidate_email=app.candidate.email if app.candidate else None,
        job_id=app.job_id,
        job_title=app.job.title if app.job else None,
        title=interview.title,
        interview_type=interview.interview_type,
        scheduled_start=interview.scheduled_start,
        scheduled_end=interview.scheduled_end,
        timezone=interview.timezone,
        meeting_link=interview.meeting_link,
        location=interview.location,
        status=interview.status,
        cancellation_reason=None,
        created_at=interview.created_at,
        feedbacks=[]
    )

@router.patch("/{id}", response_model=InterviewResponse)
def update_interview(
    id: str,
    req: InterviewUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER])),
    db: Session = Depends(get_db)
):
    """Updates, reschedules, or cancels an interview."""
    iv = db.query(Interview).join(Application).filter(
        Interview.id == id,
        Application.organization_id == current_user.organization_id
    ).first()
    if not iv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(iv, field, val)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="INTERVIEW_UPDATED",
        resource_type="INTERVIEW",
        resource_id=iv.id,
        details={"updated_fields": list(update_data.keys()), "status": iv.status.value},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(iv)

    app = iv.application
    return InterviewResponse(
        id=iv.id,
        application_id=iv.application_id,
        interviewer_id=iv.interviewer_id,
        interviewer_name=iv.interviewer.full_name if iv.interviewer else None,
        candidate_id=app.candidate_id if app else None,
        candidate_name=app.candidate.full_name if app and app.candidate else None,
        candidate_email=app.candidate.email if app and app.candidate else None,
        job_id=app.job_id if app else None,
        job_title=app.job.title if app and app.job else None,
        title=iv.title,
        interview_type=iv.interview_type,
        scheduled_start=iv.scheduled_start,
        scheduled_end=iv.scheduled_end,
        timezone=iv.timezone,
        meeting_link=iv.meeting_link,
        location=iv.location,
        status=iv.status,
        cancellation_reason=iv.cancellation_reason,
        created_at=iv.created_at,
        feedbacks=[]
    )

@router.delete("/{id}")
def delete_interview(
    id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Deletes an interview."""
    iv = db.query(Interview).join(Application).filter(
        Interview.id == id,
        Application.organization_id == current_user.organization_id
    ).first()
    if not iv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    db.delete(iv)
    db.commit()
    return {"message": "Interview deleted successfully."}

@router.post("/{id}/feedback", response_model=InterviewFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    id: str,
    req: InterviewFeedbackCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER])),
    db: Session = Depends(get_db)
):
    """Submits structured interviewer feedback with rating and hiring recommendation."""
    iv = db.query(Interview).join(Application).filter(
        Interview.id == id,
        Application.organization_id == current_user.organization_id
    ).first()
    if not iv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    fb = InterviewFeedback(
        interview_id=iv.id,
        reviewer_id=current_user.id,
        rating=req.rating,
        recommendation=req.recommendation,
        technical_skills_feedback=req.technical_skills_feedback,
        communication_feedback=req.communication_feedback,
        general_notes=req.general_notes
    )
    db.add(fb)
    iv.status = InterviewStatus.COMPLETED
    db.commit()
    db.refresh(fb)

    return InterviewFeedbackResponse(
        id=fb.id,
        interview_id=fb.interview_id,
        reviewer_id=fb.reviewer_id,
        reviewer_name=current_user.full_name,
        rating=fb.rating,
        recommendation=fb.recommendation,
        technical_skills_feedback=fb.technical_skills_feedback,
        communication_feedback=fb.communication_feedback,
        general_notes=fb.general_notes,
        created_at=fb.created_at
    )
