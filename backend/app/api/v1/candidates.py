import os
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.models.resume import Resume, ExtractionStatus
from app.models.candidate_skill import CandidateSkill
from app.models.application import Application
from app.models.recruiter_note import RecruiterNote
from app.models.audit_log import AuditLog
from app.ai.resume_parser import parse_resume
from app.ai.skill_taxonomy import normalize_skill, get_skill_category
from app.schemas.candidate import (
    CandidateCreate, CandidateUpdate, CandidateResponse,
    CandidateDetailResponse, CandidateListResponse,
    CandidateSkillSchema, RecruiterNoteSchema, RecruiterNoteCreate
)
from app.schemas.resume import ResumeResponse, ParsedResumeData

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.get("", response_model=CandidateListResponse)
def list_candidates(
    search: Optional[str] = None,
    skill: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists organization candidates with searching and skills filtering."""
    query = db.query(Candidate).filter(Candidate.organization_id == current_user.organization_id)

    if search:
        query = query.filter(
            or_(
                Candidate.full_name.ilike(f"%{search}%"),
                Candidate.email.ilike(f"%{search}%"),
                Candidate.current_title.ilike(f"%{search}%"),
                Candidate.location.ilike(f"%{search}%")
            )
        )

    if skill:
        norm_skill = normalize_skill(skill)
        query = query.join(CandidateSkill).filter(CandidateSkill.skill_name.ilike(f"%{norm_skill}%"))

    total = query.count()
    candidates = query.order_by(Candidate.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for c in candidates:
        latest_resume = db.query(Resume).filter(Resume.candidate_id == c.id).order_by(Resume.created_at.desc()).first()
        app_count = db.query(Application).filter(Application.candidate_id == c.id).count()
        skills = [
            CandidateSkillSchema(
                id=s.id,
                skill_name=s.skill_name,
                category=s.category,
                years_of_experience=s.years_of_experience,
                is_verified=s.is_verified
            ) for s in c.skills
        ]

        items.append(
            CandidateResponse(
                id=c.id,
                organization_id=c.organization_id,
                full_name=c.full_name,
                email=c.email,
                phone=c.phone,
                location=c.location,
                current_title=c.current_title,
                experience_years=c.experience_years,
                education_level=c.education_level,
                linkedin_url=c.linkedin_url,
                github_url=c.github_url,
                summary=c.summary,
                is_verified_by_recruiter=c.is_verified_by_recruiter,
                skills=skills,
                latest_resume_id=latest_resume.id if latest_resume else None,
                latest_resume_file_name=latest_resume.file_name if latest_resume else None,
                active_applications_count=app_count,
                created_at=c.created_at,
                updated_at=c.updated_at
            )
        )

    return CandidateListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    req: CandidateCreate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Manually creates a candidate record."""
    cand = Candidate(
        organization_id=current_user.organization_id,
        full_name=req.full_name,
        email=req.email.lower(),
        phone=req.phone,
        location=req.location,
        current_title=req.current_title,
        experience_years=req.experience_years,
        education_level=req.education_level,
        linkedin_url=req.linkedin_url,
        github_url=req.github_url,
        summary=req.summary,
        is_verified_by_recruiter=True
    )
    db.add(cand)
    db.flush()

    if req.skills:
        for s_name in req.skills:
            norm_name = normalize_skill(s_name)
            cat = get_skill_category(norm_name)
            skill_obj = CandidateSkill(
                candidate_id=cand.id,
                skill_name=norm_name,
                category=cat,
                is_verified=True
            )
            db.add(skill_obj)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CANDIDATE_CREATED",
        resource_type="CANDIDATE",
        resource_id=cand.id,
        details={"name": cand.full_name, "email": cand.email},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(cand)

    return CandidateResponse(
        id=cand.id,
        organization_id=cand.organization_id,
        full_name=cand.full_name,
        email=cand.email,
        phone=cand.phone,
        location=cand.location,
        current_title=cand.current_title,
        experience_years=cand.experience_years,
        education_level=cand.education_level,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        summary=cand.summary,
        is_verified_by_recruiter=cand.is_verified_by_recruiter,
        skills=[
            CandidateSkillSchema(
                id=s.id,
                skill_name=s.skill_name,
                category=s.category,
                is_verified=s.is_verified
            ) for s in cand.skills
        ],
        latest_resume_id=None,
        latest_resume_file_name=None,
        active_applications_count=0,
        created_at=cand.created_at,
        updated_at=cand.updated_at
    )

@router.get("/{id}", response_model=CandidateDetailResponse)
def get_candidate(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves full candidate profile including notes and skills."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    latest_resume = db.query(Resume).filter(Resume.candidate_id == cand.id).order_by(Resume.created_at.desc()).first()
    app_count = db.query(Application).filter(Application.candidate_id == cand.id).count()

    skills = [
        CandidateSkillSchema(
            id=s.id,
            skill_name=s.skill_name,
            category=s.category,
            years_of_experience=s.years_of_experience,
            is_verified=s.is_verified
        ) for s in cand.skills
    ]

    notes = [
        RecruiterNoteSchema(
            id=n.id,
            author_id=n.author_id,
            author_name=n.author.full_name if n.author else "Recruiter",
            content=n.content,
            is_private=n.is_private,
            created_at=n.created_at
        ) for n in cand.notes
    ]

    return CandidateDetailResponse(
        id=cand.id,
        organization_id=cand.organization_id,
        full_name=cand.full_name,
        email=cand.email,
        phone=cand.phone,
        location=cand.location,
        current_title=cand.current_title,
        experience_years=cand.experience_years,
        education_level=cand.education_level,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        summary=cand.summary,
        raw_text=cand.raw_text,
        is_verified_by_recruiter=cand.is_verified_by_recruiter,
        skills=skills,
        notes=notes,
        latest_resume_id=latest_resume.id if latest_resume else None,
        latest_resume_file_name=latest_resume.file_name if latest_resume else None,
        active_applications_count=app_count,
        created_at=cand.created_at,
        updated_at=cand.updated_at
    )

@router.patch("/{id}", response_model=CandidateResponse)
def update_candidate(
    id: str,
    req: CandidateUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Updates candidate profile or verifies parsed info."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email" and value:
            setattr(cand, field, value.lower())
        else:
            setattr(cand, field, value)

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CANDIDATE_UPDATED",
        resource_type="CANDIDATE",
        resource_id=cand.id,
        details={"updated_fields": list(update_data.keys())},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(cand)

    latest_resume = db.query(Resume).filter(Resume.candidate_id == cand.id).order_by(Resume.created_at.desc()).first()
    app_count = db.query(Application).filter(Application.candidate_id == cand.id).count()

    return CandidateResponse(
        id=cand.id,
        organization_id=cand.organization_id,
        full_name=cand.full_name,
        email=cand.email,
        phone=cand.phone,
        location=cand.location,
        current_title=cand.current_title,
        experience_years=cand.experience_years,
        education_level=cand.education_level,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        summary=cand.summary,
        is_verified_by_recruiter=cand.is_verified_by_recruiter,
        skills=[
            CandidateSkillSchema(
                id=s.id,
                skill_name=s.skill_name,
                category=s.category,
                is_verified=s.is_verified
            ) for s in cand.skills
        ],
        latest_resume_id=latest_resume.id if latest_resume else None,
        latest_resume_file_name=latest_resume.file_name if latest_resume else None,
        active_applications_count=app_count,
        created_at=cand.created_at,
        updated_at=cand.updated_at
    )

@router.delete("/{id}")
def delete_candidate(
    id: str,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Deletes candidate record, associated resumes, and applications."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    db.delete(cand)
    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="CANDIDATE_DELETED",
        resource_type="CANDIDATE",
        resource_id=id,
        details={"name": cand.full_name},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return {"message": "Candidate deleted successfully."}

@router.post("/{id}/resume", response_model=ResumeResponse)
async def upload_candidate_resume(
    id: str,
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER])),
    db: Session = Depends(get_db)
):
    """Uploads, validates, parses PDF/DOCX resume, and updates candidate skills and profile."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension {ext}. Only PDF and DOCX files are permitted."
        )

    # Save to upload dir
    cand_dir = Path(settings.UPLOAD_DIR) / cand.organization_id / cand.id
    cand_dir.mkdir(parents=True, exist_ok=True)
    safe_filename = f"{int(datetime.utcnow().timestamp())}_{Path(file.filename).name}"
    file_path = cand_dir / safe_filename

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES / (1024*1024)}MB."
        )

    with open(file_path, "wb") as f:
        f.write(contents)

    # Parse resume
    try:
        parsed_result = parse_resume(str(file_path))
        status_enum = ExtractionStatus.PARSED
    except Exception as e:
        parsed_result = {
            "full_name": None,
            "email": None,
            "phone": None,
            "skills": [],
            "uncertain_fields": ["extraction_error"],
            "raw_text_snippet": str(e),
            "full_raw_text": ""
        }
        status_enum = ExtractionStatus.FAILED

    # Store Resume Record
    resume_obj = Resume(
        candidate_id=cand.id,
        file_name=file.filename,
        file_path=str(file_path),
        file_size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        parsed_data=parsed_result,
        extraction_status=status_enum
    )
    db.add(resume_obj)

    # Populate candidate missing fields if available
    if parsed_result.get("full_name") and (not cand.full_name or cand.full_name == "New Candidate"):
        cand.full_name = parsed_result["full_name"]
    if parsed_result.get("phone") and not cand.phone:
        cand.phone = parsed_result["phone"]
    if parsed_result.get("education_level") and not cand.education_level:
        cand.education_level = parsed_result["education_level"]
    if parsed_result.get("experience_years") and cand.experience_years == 0.0:
        cand.experience_years = parsed_result["experience_years"]
    if parsed_result.get("full_raw_text"):
        cand.raw_text = parsed_result["full_raw_text"]

    # Sync parsed skills to candidate_skills table
    existing_skills = {s.skill_name.lower() for s in cand.skills}
    for sk in parsed_result.get("skills", []):
        norm = normalize_skill(sk)
        if norm.lower() not in existing_skills:
            cand_skill = CandidateSkill(
                candidate_id=cand.id,
                skill_name=norm,
                category=get_skill_category(norm),
                is_verified=False
            )
            db.add(cand_skill)
            existing_skills.add(norm.lower())

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="RESUME_UPLOADED",
        resource_type="RESUME",
        resource_id=resume_obj.id,
        details={"candidate_id": cand.id, "file_name": file.filename},
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(resume_obj)

    return ResumeResponse(
        id=resume_obj.id,
        candidate_id=cand.id,
        file_name=resume_obj.file_name,
        file_size=resume_obj.file_size,
        mime_type=resume_obj.mime_type,
        extraction_status=resume_obj.extraction_status,
        parsed_data=parsed_result,
        created_at=resume_obj.created_at
    )

@router.get("/{id}/resume/{resume_id}/download")
def download_resume(
    id: str,
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Secured download endpoint for candidate resumes."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.candidate_id == cand.id).first()
    if not resume or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found on disk.")

    return FileResponse(
        path=resume.file_path,
        filename=resume.file_name,
        media_type=resume.mime_type
    )

@router.post("/{id}/notes", response_model=RecruiterNoteSchema, status_code=status.HTTP_201_CREATED)
def add_candidate_note(
    id: str,
    req: RecruiterNoteCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER])),
    db: Session = Depends(get_db)
):
    """Adds a recruiter/interviewer note to candidate file."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.organization_id == current_user.organization_id
    ).first()
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    note = RecruiterNote(
        candidate_id=cand.id,
        author_id=current_user.id,
        content=req.content,
        is_private=req.is_private
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return RecruiterNoteSchema(
        id=note.id,
        author_id=note.author_id,
        author_name=current_user.full_name,
        content=note.content,
        is_private=note.is_private,
        created_at=note.created_at
    )
