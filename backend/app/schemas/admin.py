from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserRoleUpdate(BaseModel):
    role: UserRole

class UserStatusUpdate(BaseModel):
    is_active: bool

class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationSettingsUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None

class GlobalMatchingWeightsUpdate(BaseModel):
    required_skills_weight: float
    semantic_similarity_weight: float
    preferred_skills_weight: float
    experience_weight: float
