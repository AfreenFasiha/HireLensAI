from datetime import datetime, timedelta
from typing import Optional, List
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, create_access_token,
    generate_refresh_token, hash_token, get_current_user
)
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.refresh_session import RefreshSession
from app.models.audit_log import AuditLog
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, RefreshTokenRequest,
    UserResponse, UserUpdate
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, response: Response, request: Request, db: Session = Depends(get_db)):
    """Registers a new organization and admin user."""
    # Check if user email already exists
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Create organization
    slug = req.organization_name.lower().replace(" ", "-") + "-" + secrets.token_hex(3)
    org = Organization(
        name=req.organization_name,
        slug=slug
    )
    db.add(org)
    db.flush()

    # Create admin user
    hashed_pwd = hash_password(req.password)
    user = User(
        organization_id=org.id,
        email=req.email.lower(),
        hashed_password=hashed_pwd,
        full_name=req.full_name,
        role=req.role or UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create access token and refresh token
    access_token = create_access_token({
        "sub": user.id,
        "org_id": org.id,
        "role": user.role.value
    })
    raw_refresh = generate_refresh_token()
    refresh_session = RefreshSession(
        user_id=user.id,
        refresh_token_hash=hash_token(raw_refresh),
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_session)

    # Audit log
    audit = AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="USER_REGISTER",
        resource_type="USER",
        resource_id=user.id,
        details={"email": user.email, "organization": org.name},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    # Set secure HTTP-only refresh cookie
    response.set_cookie(
        key="hirelens_refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    user_resp = UserResponse(
        id=user.id,
        organization_id=org.id,
        organization_name=org.name,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_resp
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, response: Response, request: Request, db: Session = Depends(get_db)):
    """Authenticates credentials, returns JWT access token and rotating refresh token."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your organization administrator."
        )

    access_token = create_access_token({
        "sub": user.id,
        "org_id": user.organization_id,
        "role": user.role.value
    })
    raw_refresh = generate_refresh_token()
    refresh_session = RefreshSession(
        user_id=user.id,
        refresh_token_hash=hash_token(raw_refresh),
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_session)

    audit = AuditLog(
        organization_id=user.organization_id,
        user_id=user.id,
        action="USER_LOGIN",
        resource_type="USER",
        resource_id=user.id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    response.set_cookie(
        key="hirelens_refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    user_resp = UserResponse(
        id=user.id,
        organization_id=user.organization_id,
        organization_name=org.name if org else None,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_resp
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db)
):
    """Refreshes an access token using a rotating refresh token."""
    raw_token = None
    if body and body.refresh_token:
        raw_token = body.refresh_token
    elif "hirelens_refresh_token" in request.cookies:
        raw_token = request.cookies.get("hirelens_refresh_token")

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided."
        )

    hashed = hash_token(raw_token)
    session_record = db.query(RefreshSession).filter(
        RefreshSession.refresh_token_hash == hashed,
        RefreshSession.is_revoked == False,
        RefreshSession.expires_at > datetime.utcnow()
    ).first()

    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    # Invalidate old session (token rotation)
    session_record.is_revoked = True

    user = db.query(User).filter(User.id == session_record.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    # Issue new token pair
    new_access = create_access_token({
        "sub": user.id,
        "org_id": user.organization_id,
        "role": user.role.value
    })
    new_raw_refresh = generate_refresh_token()
    new_session = RefreshSession(
        user_id=user.id,
        refresh_token_hash=hash_token(new_raw_refresh),
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_session)
    db.commit()

    response.set_cookie(
        key="hirelens_refresh_token",
        value=new_raw_refresh,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    user_resp = UserResponse(
        id=user.id,
        organization_id=user.organization_id,
        organization_name=org.name if org else None,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_raw_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_resp
    )

@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revokes active refresh sessions and clears auth cookies."""
    raw_cookie = request.cookies.get("hirelens_refresh_token")
    if raw_cookie:
        hashed = hash_token(raw_cookie)
        sess = db.query(RefreshSession).filter(RefreshSession.refresh_token_hash == hashed).first()
        if sess:
            sess.is_revoked = True
            db.commit()

    response.delete_cookie("hirelens_refresh_token")
    return {"message": "Logged out successfully."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the authenticated user profile and organization info."""
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    return UserResponse(
        id=current_user.id,
        organization_id=current_user.organization_id,
        organization_name=org.name if org else None,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at
    )

@router.patch("/me", response_model=UserResponse)
def update_me(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user profile details or changes password."""
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url

    if req.password:
        if not req.current_password or not verify_password(req.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required and must match."
            )
        current_user.hashed_password = hash_password(req.password)

    db.commit()
    db.refresh(current_user)

    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    return UserResponse(
        id=current_user.id,
        organization_id=current_user.organization_id,
        organization_name=org.name if org else None,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at
    )
