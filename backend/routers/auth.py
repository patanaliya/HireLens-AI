"""
HireLens AI - Authentication & Role-Based Access Router
Endpoints:
- POST /register: User registration with role assignment ('candidate', 'recruiter', 'admin')
- POST /login: Secure credentials authentication with JWT token issuance
- GET /me: Current session verification and profile retrieval
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import get_db
from models import User, CandidateProfile, Company, AuditLog
from security import hash_password, verify_password, create_access_token, decode_access_token


router = APIRouter(tags=["Authentication"])


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str  # 'candidate', 'recruiter', 'admin'
    company_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency: Extract and validate Bearer token, return User instance."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token.")

    token = authorization.split(" ")[1]
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please log in again.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    return user


def require_role(allowed_roles: list):
    """RBAC guard decorator enforcing role permissions."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Action requires one of {allowed_roles} roles. Your role is '{current_user.role}'."
            )
        return current_user
    return role_checker


@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user and creates their associated candidate or recruiter profile."""
    role = req.role.lower().strip()
    if role not in ["candidate", "recruiter", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be candidate, recruiter, or admin.")

    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    new_user = User(
        full_name=req.full_name.strip(),
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        role=role,
        company_name=req.company_name.strip() if req.company_name else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize associated profile
    if role == "candidate":
        blind_id = f"Candidate #C-{new_user.id:04d}"
        profile = CandidateProfile(
            user_id=new_user.id,
            headline="Aspiring Professional",
            location="Remote",
            blind_id=blind_id,
            skills=[]
        )
        db.add(profile)
        db.commit()
    elif role == "recruiter" and req.company_name:
        company_name = req.company_name.strip()
        existing_company = db.query(Company).filter(Company.name == company_name).first()
        if not existing_company:
            db.add(Company(name=company_name, industry="Technology"))
            db.commit()

    token = create_access_token({"user_id": new_user.id, "email": new_user.email, "role": new_user.role})

    return {
        "message": "User registered successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "company_name": new_user.company_name
        }
    }


@router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a signed JWT access token."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"user_id": user.id, "email": user.email, "role": user.role})

    # Log login action
    try:
        db.add(AuditLog(user_id=user.id, action="USER_LOGIN", entity_type="user", entity_id=user.id))
        db.commit()
    except Exception:
        pass

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "company_name": user.company_name
        }
    }


@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns currently authenticated user profile and associated data."""
    profile_data = None
    if user.role == "candidate":
        cand = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if cand:
            profile_data = {
                "candidate_id": cand.id,
                "headline": cand.headline,
                "location": cand.location,
                "experience_years": cand.experience_years,
                "education": cand.education,
                "skills": cand.skills,
                "blind_id": cand.blind_id
            }

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "company_name": user.company_name
        },
        "profile": profile_data
    }
