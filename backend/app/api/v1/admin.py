from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.audit_log import AuditLog
from app.schemas.admin import (
    UserRoleUpdate, UserStatusUpdate, AdminUserResponse,
    AuditLogResponse, OrganizationSettingsUpdate
)

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/users", response_model=List[AdminUserResponse])
def list_org_users(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Lists all users belonging to the current organization."""
    users = db.query(User).filter(User.organization_id == current_user.organization_id).order_by(User.created_at.desc()).all()
    return [
        AdminUserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at
        ) for u in users
    ]

@router.patch("/users/{id}/role", response_model=AdminUserResponse)
def update_user_role(
    id: str,
    req: UserRoleUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Updates user role within the organization. Only Admins can modify roles."""
    if current_user.id == id and req.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot demote their own account to prevent lock-out."
        )

    user = db.query(User).filter(
        User.id == id,
        User.organization_id == current_user.organization_id
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    old_role = user.role.value
    user.role = req.role

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="USER_ROLE_UPDATED",
        resource_type="USER",
        resource_id=user.id,
        details={"old_role": old_role, "new_role": req.role.value, "target_email": user.email},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.patch("/users/{id}/status", response_model=AdminUserResponse)
def update_user_status(
    id: str,
    req: UserStatusUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Activates or deactivates a user account."""
    if current_user.id == id and not req.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )

    user = db.query(User).filter(
        User.id == id,
        User.organization_id == current_user.organization_id
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_active = req.is_active

    audit = AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="USER_STATUS_UPDATED",
        resource_type="USER",
        resource_id=user.id,
        details={"is_active": req.is_active, "target_email": user.email},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Retrieves immutable audit trail entries for the organization."""
    query = db.query(AuditLog).filter(AuditLog.organization_id == current_user.organization_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    items = []
    for log in logs:
        items.append(
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                user_name=log.user.full_name if log.user else "System",
                user_email=log.user.email if log.user else None,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=log.details or {},
                ip_address=log.ip_address,
                created_at=log.created_at
            )
        )

    return items

@router.get("/organization")
def get_organization_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves organization metadata and configuration."""
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "domain": org.domain,
        "created_at": org.created_at
    }

@router.patch("/organization")
def update_organization_settings(
    req: OrganizationSettingsUpdate,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Updates organization profile name and domain."""
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    if req.name is not None:
        org.name = req.name
    if req.domain is not None:
        org.domain = req.domain

    audit = AuditLog(
        organization_id=org.id,
        user_id=current_user.id,
        action="ORGANIZATION_UPDATED",
        resource_type="ORGANIZATION",
        resource_id=org.id,
        details={"name": org.name, "domain": org.domain},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "domain": org.domain,
        "updated_at": org.updated_at
    }
