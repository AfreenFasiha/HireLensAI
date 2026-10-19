from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database.session import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus, EmploymentType
from app.models.application import Application
from app.models.audit_log import AuditLog
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobListResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=JobListResponse)
def list_jobs(
    status: Optional[JobStatus] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists organization jobs with multi-criteria filtering and application counts."""
    query = db.query(Job).filter(Job.organization_id == current_user.organization_id)

    if status:
        query = query.filter(Job.status == status)
    if department:
        query = query.filter(Job.department.ilike(f"%{department}%"))
    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
                Job.location.ilike(f"%{search}%")
            )
        )

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Compute candidate application count for each job
    job_ids = [j.id for j in jobs]
    counts_map = {}
    if job_ids:
        app_counts = db.query(Application.job_id, func.count(Application.id))\
            .filter(Application.job_id.in_(job_ids))\
            .group_by(Application.job_id).all()
        counts_map = {jid: cnt for jid, cnt in app_counts}

    items = []
    for j in jobs:
        resp = JobResponse(
            id=j.id,
            organization_id=j.organization_id,
            created_by_id=j.created_by_id,
            title=j.title,
            department=j.department,
            description=j.description,
            required_skills=j.required_skills or [],
            preferred_skills=j.preferred_skills or [],
            min_experience_years=j.min_experience_years,
            location=j.location,
            employment_type=j.employment_type,
            status=j.status,
            matching_weights=j.matching_weights or {},
            created_at=j.created_at,
            updated_at=j.updated_at,
            candidates_count=counts_map.get(j.id, 0)
        )
        items.append(resp)

    return JobListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    req: JobCreate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Creates a new job requisition within the organization."""
    job = Job(
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        title=req.title,
        department=req.department,
        description=req.description,
        required_skills=req.required_skills,
        preferred_skills=req.preferred_skills,
        min_experience_years=req.min_experience_years,
        location=req.location,
        employment_type=req.employment_type,
        status=req.status,
        matching_weights=req.matching_weights or {}
    )
    db.add(job)
    db.flush()

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="JOB_CREATED",
        resource_type="JOB",
        resource_id=job.id,
        details={"title": job.title, "department": job.department},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(job)

    return JobResponse(
        id=job.id,
        organization_id=job.organization_id,
        created_by_id=job.created_by_id,
        title=job.title,
        department=job.department,
        description=job.description,
        required_skills=job.required_skills or [],
        preferred_skills=job.preferred_skills or [],
        min_experience_years=job.min_experience_years,
        location=job.location,
        employment_type=job.employment_type,
        status=job.status,
        matching_weights=job.matching_weights or {},
        created_at=job.created_at,
        updated_at=job.updated_at,
        candidates_count=0
    )

@router.get("/{id}", response_model=JobResponse)
def get_job(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves single job details."""
    job = db.query(Job).filter(Job.id == id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found.")

    candidates_count = db.query(Application).filter(Application.job_id == job.id).count()

    return JobResponse(
        id=job.id,
        organization_id=job.organization_id,
        created_by_id=job.created_by_id,
        title=job.title,
        department=job.department,
        description=job.description,
        required_skills=job.required_skills or [],
        preferred_skills=job.preferred_skills or [],
        min_experience_years=job.min_experience_years,
        location=job.location,
        employment_type=job.employment_type,
        status=job.status,
        matching_weights=job.matching_weights or {},
        created_at=job.created_at,
        updated_at=job.updated_at,
        candidates_count=candidates_count
    )

@router.patch("/{id}", response_model=JobResponse)
def update_job(
    id: str,
    req: JobUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Updates job requirements, status, or details."""
    job = db.query(Job).filter(Job.id == id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found.")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="JOB_UPDATED",
        resource_type="JOB",
        resource_id=job.id,
        details={"updated_fields": list(update_data.keys())},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(job)

    candidates_count = db.query(Application).filter(Application.job_id == job.id).count()

    return JobResponse(
        id=job.id,
        organization_id=job.organization_id,
        created_by_id=job.created_by_id,
        title=job.title,
        department=job.department,
        description=job.description,
        required_skills=job.required_skills or [],
        preferred_skills=job.preferred_skills or [],
        min_experience_years=job.min_experience_years,
        location=job.location,
        employment_type=job.employment_type,
        status=job.status,
        matching_weights=job.matching_weights or {},
        created_at=job.created_at,
        updated_at=job.updated_at,
        candidates_count=candidates_count
    )

@router.delete("/{id}")
def delete_job(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Deletes or archives a job requisition."""
    job = db.query(Job).filter(Job.id == id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job opening not found.")

    db.delete(job)
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="JOB_DELETED",
        resource_type="JOB",
        resource_id=id,
        details={"title": job.title},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return {"message": "Job opening deleted successfully."}
