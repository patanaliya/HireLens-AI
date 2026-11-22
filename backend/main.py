
import uuid
import json
import fitz
import io
import re
import base64
import os

from pathlib import Path
from docx import Document
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from pydantic import BaseModel

from database import engine, get_db, Base
from models import (
    User,
    Job,
    CandidateProfile,
    Resume,
    Match,
    GapReport,
    AuditLog,
    RecruiterDecision
)

from schemas import UserRegister, UserLogin

from screening_engine import screening_engine, ScreeningResult
from skill_graph import skill_graph
from skill_extractor import skill_extractor
from parser import ResumeParser

from security import (
    hash_password,
    verify_password,
    create_access_token
)


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

Base.metadata.create_all(bind=engine)

# Auto-seed benchmark data if new / empty database (Render PostgreSQL)
try:
    from seed_data import seed_demo_data
    from database import SessionLocal
    _init_db = SessionLocal()
    if _init_db.query(User).count() == 0:
        seed_demo_data()
    _init_db.close()
except Exception:
    pass


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="HireLens AI",
    description="AI-Powered Resume Screening System",
    version="1.0.0"
)
app.openapi_version = "3.0.3"
# Custom OpenAPI schema for Swagger file uploads
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    openapi_schema["openapi"] = "3.0.3"

    request_body = (
        openapi_schema["paths"]["/api/screen-resumes"]["post"]
        ["requestBody"]["content"]["multipart/form-data"]["schema"]
    )

    ref = request_body.get("$ref")

    if ref:
        schema_name = ref.split("/")[-1]
        files_schema = (
            openapi_schema["components"]["schemas"]
            [schema_name]["properties"]["files"]
        )

        files_schema["items"].pop("contentMediaType", None)
        files_schema["items"]["format"] = "binary"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# ==========================================
# RESUME UPLOAD CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


# ==========================================
# CORS CONFIGURATION
# ==========================================

frontend_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
custom_frontend = os.getenv("FRONTEND_URL")
if custom_frontend:
    frontend_origins.append(custom_frontend.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://.*:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# RESUME TEXT EXTRACTION
# ==========================================

def extract_pdf_text(file_path):
    text_content = ""

    with fitz.open(file_path) as pdf:
        for page in pdf:
            text_content += page.get_text()

    return text_content


def extract_docx_text(file_path):
    document = Document(file_path)

    return "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
    )


def extract_experience(text_content):
    """
    Extract an explicitly stated number of years of experience.
    Returns None when no reliable number is found.
    """

    patterns = [
        r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+)?(?:work\s+)?(?:experience|exp)",
        r"(?:experience|exp)\s*[:\-]\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)"
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text_content,
            re.IGNORECASE
        )

        if match:
            return float(match.group(1))

    return None


def extract_education(text_content):
    pattern = (
        r"(?:B\.?Tech|M\.?Tech|B\.?E\.?|B\.?S\.?|M\.?S\.?|"
        r"Bachelor(?:'s)?|Master(?:'s)?|Ph\.?D)[^,\n.]*"
    )

    match = re.search(
        pattern,
        text_content,
        re.IGNORECASE
    )

    return match.group(0).strip() if match else "Not specified"


def calculate_experience_score(
    detected_experience,
    minimum_experience
):
    """
    Does not invent experience when it is absent.
    """

    if detected_experience is None:
        return 0.0

    if minimum_experience <= 0:
        return 100.0

    return round(
        min(
            100.0,
            max(
                0.0,
                (detected_experience / minimum_experience) * 100.0
            )
        ),
        1
    )


def calculate_overall_score(
    skill_score,
    experience_score,
    growth_score
):
    return round(
        (skill_score * 0.45)
        + (experience_score * 0.35)
        + (growth_score * 0.20),
        1
    )


def get_matched_skills(coverage):
    """
    SkillGraph uses required_skill in its match dictionaries.
    """

    matches = (
        coverage.get("exact_matches", [])
        + coverage.get("transferable_matches", [])
    )

    return [
        match["required_skill"]
        for match in matches
        if match.get("required_skill")
    ]


# ==========================================
# HOME API
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to HireLens AI Backend!",
        "status": "Running successfully"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "HireLens AI"
    }


# ==========================================
# USER REGISTRATION
# ==========================================

@app.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    password = user.password

    if not password or not password[0].isupper():
        raise HTTPException(
            status_code=400,
            detail="Password must start with a capital letter."
        )

    if not any(char.isalpha() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain a letter."
        )

    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain a number."
        )

    if not any(not char.isalnum() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain a special character."
        )

    if user.role == "recruiter" and not user.company_name:
        raise HTTPException(
            status_code=400,
            detail="Company name is required for recruiters."
        )

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(password),
        role=user.role,
        company_name=(
            user.company_name
            if user.role == "recruiter"
            else None
        )
    )

    try:
        db.add(new_user)
        db.flush()

        if user.role == "candidate":
            candidate_profile = CandidateProfile(
                user_id=new_user.id,
                headline="",
                location="",
                experience_years=0.0,
                education="",
                skills=[],
                blind_id=f"Candidate #C-{new_user.id:04d}"
            )

            db.add(candidate_profile)

        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Account created successfully!",
        "user_id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role
    }


# ==========================================
# USER LOGIN
# ==========================================

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    password_valid = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    access_token = create_access_token({
        "sub": str(existing_user.id),
        "role": existing_user.role
    })

    return {
        "message": "Login successful!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "full_name": existing_user.full_name,
            "email": existing_user.email,
            "role": existing_user.role
        }
    }


# ==========================================
# GET ALL CANDIDATE PROFILES
# ==========================================

@app.get("/candidates")
def get_candidates(
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                cp.id,
                u.full_name,
                cp.headline,
                cp.location,
                cp.experience_years,
                cp.education,
                cp.skills
            FROM candidate_profiles cp
            JOIN users u ON cp.user_id = u.id
            WHERE u.role = 'candidate'
            ORDER BY cp.id DESC
        """)
    )

    candidates = []

    for row in result.fetchall():
        candidate = dict(row._mapping)

        if isinstance(candidate.get("skills"), str):
            try:
                candidate["skills"] = json.loads(
                    candidate["skills"]
                )
            except (ValueError, TypeError):
                candidate["skills"] = []

        elif not candidate.get("skills"):
            candidate["skills"] = []

        candidates.append(candidate)

    return {
        "total_candidates": len(candidates),
        "candidates": candidates
    }


# ==========================================
# GET INDIVIDUAL CANDIDATE PROFILE
# ==========================================

@app.get("/candidates/{candidate_id}")
def get_candidate_profile(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                cp.id,
                u.full_name,
                u.email,
                cp.headline,
                cp.location,
                cp.experience_years,
                cp.education,
                cp.skills,
                cp.resume_path,
                cp.created_at
            FROM candidate_profiles cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.id = :candidate_id
            AND u.role = 'candidate'
        """),
        {"candidate_id": candidate_id}
    )

    candidate = result.fetchone()

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found."
        )

    candidate_dict = dict(candidate._mapping)

    if isinstance(candidate_dict.get("skills"), str):
        try:
            candidate_dict["skills"] = json.loads(
                candidate_dict["skills"]
            )
        except (ValueError, TypeError):
            candidate_dict["skills"] = []

    elif not candidate_dict.get("skills"):
        candidate_dict["skills"] = []

    return candidate_dict


# ==========================================
# UPLOAD CANDIDATE RESUME
# ==========================================

@app.post("/candidates/{candidate_id}/upload-resume")
async def upload_resume(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed."
        )

    candidate = db.execute(
        text("""
            SELECT id
            FROM candidate_profiles
            WHERE id = :candidate_id
        """),
        {"candidate_id": candidate_id}
    ).fetchone()

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found."
        )

    file_content = await file.read(MAX_FILE_SIZE + 1)

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 5 MB."
        )

    if file_extension == ".pdf":
        if not file_content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file."
            )

    elif file_extension == ".docx":
        if not file_content.startswith(b"PK"):
            raise HTTPException(
                status_code=400,
                detail="Invalid DOCX file."
            )

    unique_filename = (
        f"{candidate_id}_{uuid.uuid4().hex}{file_extension}"
    )

    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as uploaded_file:
            uploaded_file.write(file_content)

        if file_extension == ".pdf":
            extracted_text = extract_pdf_text(file_path)
        else:
            extracted_text = extract_docx_text(file_path)

        if not extracted_text.strip():
            raise ValueError(
                "No readable text found in the resume."
            )

        # Store persistent resume record in database (guaranteed survival across Render restarts)
        file_b64 = base64.b64encode(file_content).decode("utf-8")
        resume_record = db.query(Resume).filter_by(candidate_id=candidate_id).first()
        if not resume_record:
            resume_record = Resume(
                candidate_id=candidate_id,
                file_path=str(file_path),
                file_name=file.filename,
                file_data_base64=file_b64,
                raw_text=extracted_text,
                anonymized_text=ResumeParser.anonymize_text(extracted_text)
            )
            db.add(resume_record)
        else:
            resume_record.file_path = str(file_path)
            resume_record.file_name = file.filename
            resume_record.file_data_base64 = file_b64
            resume_record.raw_text = extracted_text
            resume_record.anonymized_text = ResumeParser.anonymize_text(extracted_text)

        db.execute(
            text("""
                UPDATE candidate_profiles
                SET resume_path = :resume_path
                WHERE id = :candidate_id
            """),
            {
                "resume_path": str(file_path),
                "candidate_id": candidate_id
            }
        )

        db.commit()

        return {
            "message": "Resume uploaded successfully!",
            "candidate_id": candidate_id,
            "filename": unique_filename,
            "text_extracted": True
        }

    except ValueError as error:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Resume upload failed."
        )

    finally:
        await file.close()


# ==========================================
# REQUEST MODELS
# ==========================================

class JDBiasRequest(BaseModel):
    jd_text: str


class ScreenCandidateRequest(BaseModel):
    candidate_id: int
    job_id: Optional[int] = 1
    blind_mode: bool = False


class WhatIfRequest(BaseModel):
    weights: Dict[str, float]


class JDExtractRequest(BaseModel):
    job_description: str


# ==========================================
# GET JOBS
# ==========================================

@app.get("/api/jobs")
def get_jobs(
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).all()

    if not jobs:
        demo_jobs = [
            Job(
                title="Senior Full-Stack Engineer",
                department="Platform Engineering",
                location="Remote / Hybrid",
                description=(
                    "We are looking for a Senior Full-Stack Engineer "
                    "to build scalable microservices and real-time "
                    "reactive user interfaces."
                ),
                requirements_text=(
                    "Python, FastAPI, React, PostgreSQL, "
                    "Docker, Kubernetes, CI/CD"
                ),
                experience_min=4,
                bias_score=0.0
            ),
            Job(
                title="AI / ML Systems Engineer",
                department="AI Research & Products",
                location="Bengaluru, India",
                description=(
                    "Seeking an engineer to deploy LLM pipelines, "
                    "vector databases, and semantic search architectures."
                ),
                requirements_text=(
                    "Python, PyTorch, LLMs, Vector Databases, "
                    "FastAPI, Docker"
                ),
                experience_min=3,
                bias_score=0.1
            )
        ]

        db.add_all(demo_jobs)
        db.commit()
        jobs = db.query(Job).all()

    return [
        {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "location": job.location,
            "description": job.description,
            "requirements": [
                item.strip()
                for item in (job.requirements_text or "").split(",")
                if item.strip()
            ],
            "experience_min": job.experience_min,
            "bias_score": job.bias_score
        }
        for job in jobs
    ]


# ==========================================
# JOB DESCRIPTION BIAS ANALYZER
# ==========================================

@app.post("/api/jobs/analyze-bias")
def analyze_job_bias(
    request: JDBiasRequest
):
    if not request.jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description text is required."
        )

    return screening_engine.analyze_jd_bias(
        request.jd_text
    )


# ==========================================
# SCREEN INDIVIDUAL CANDIDATE
# ==========================================

@app.post("/api/screen-candidate")
def screen_candidate(
    request: ScreenCandidateRequest,
    db: Session = Depends(get_db)
):
    candidate = db.query(CandidateProfile).filter_by(
        id=request.candidate_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found."
        )

    user = db.query(User).filter_by(
        id=candidate.user_id
    ).first()

    raw_name = user.full_name if user else "Candidate"

    blind_id = (
        candidate.blind_id
        or f"Candidate #C-{candidate.id:04d}"
    )

    job = db.query(Job).filter_by(
        id=request.job_id
    ).first()

    if job and job.requirements_text:
        job_requirements = [
            item.strip()
            for item in job.requirements_text.split(",")
            if item.strip()
        ]
    else:
        job_requirements = [
            "Python",
            "FastAPI",
            "React",
            "Docker",
            "PostgreSQL"
        ]

    resume_record = (
        db.query(Resume)
        .filter_by(candidate_id=candidate.id)
        .order_by(Resume.id.desc())
        .first()
    )

    if resume_record and resume_record.raw_text:
        resume_text = resume_record.raw_text
    else:
        skills = candidate.skills or []

        if isinstance(skills, str):
            try:
                skills = json.loads(skills)
            except (ValueError, TypeError):
                skills = []

        skills_str = ", ".join(skills)

        resume_text = f"""
{raw_name}
{candidate.headline or 'Software Engineer'}
Location: {candidate.location or 'Not specified'}
Experience: {candidate.experience_years or 0} years.
Education: {candidate.education or 'Not specified'}

SKILLS
{skills_str}
"""

    if request.blind_mode:
        resume_text = ResumeParser.anonymize_text(
            resume_text,
            candidate_name=raw_name
        )
        display_name = blind_id
    else:
        display_name = raw_name

    result = screening_engine.screen_candidate(
        resume_text=resume_text,
        job_requirements=job_requirements,
        candidate_name=display_name,
        blind_id=blind_id
    )

    audit = AuditLog(
        action="CANDIDATE_SCREENED",
        entity_type="CANDIDATE",
        entity_id=candidate.id,
        details={
            "blind_mode": request.blind_mode,
            "score": result.overall_score
        }
    )

    try:
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return result


# ==========================================
# WHAT-IF WEIGHT SIMULATOR
# ==========================================

@app.post("/api/what-if-simulate")
def what_if_simulate(
    request: WhatIfRequest,
    db: Session = Depends(get_db)
):
    candidates = db.query(CandidateProfile).all()
    results = []

    for candidate in candidates:
        user = db.query(User).filter_by(
            id=candidate.user_id
        ).first()

        skills = candidate.skills or []

        if isinstance(skills, str):
            try:
                skills = json.loads(skills)
            except (ValueError, TypeError):
                skills = []

        base_skill_score = min(
            98.0,
            60.0 + len(skills) * 5.0
        )

        experience = float(
            candidate.experience_years or 0.0
        )

        base_exp_score = min(
            100.0,
            experience * 10.0
        )

        base_growth_score = 85.0

        scores = {
            "skills": base_skill_score,
            "experience": base_exp_score,
            "growth": base_growth_score
        }

        adjusted_score = screening_engine.calculate_what_if_rank(
            scores,
            request.weights
        )

        original_score = (
            base_skill_score * 0.45
            + base_exp_score * 0.35
            + base_growth_score * 0.20
        )

        results.append({
            "id": candidate.id,
            "full_name": (
                user.full_name if user else "Candidate"
            ),
            "blind_id": (
                candidate.blind_id
                or f"Candidate #C-{candidate.id:04d}"
            ),
            "headline": candidate.headline,
            "experience_years": experience,
            "original_score": round(original_score, 1),
            "simulated_score": adjusted_score,
            "scores": scores
        })

    results.sort(
        key=lambda item: item["simulated_score"],
        reverse=True
    )

    for rank, item in enumerate(results, 1):
        item["rank"] = rank

    return {
        "simulated_candidates": results
    }


# ==========================================
# SKILL GRAPH API
# ==========================================

@app.get("/api/skills/graph")
def get_skill_graph():
    nodes = [
        {
            "id": node,
            "category": skill_graph.graph.nodes[node].get(
                "category",
                "general"
            )
        }
        for node in skill_graph.graph.nodes()
    ]

    edges = [
        {
            "source": source,
            "target": target,
            "relation_type": data.get(
                "relation_type",
                "related_to"
            ),
            "weight": data.get("weight", 1.0)
        }
        for source, target, data in skill_graph.graph.edges(
            data=True
        )
    ]

    return {
        "nodes": nodes,
        "edges": edges
    }


# ==========================================
# EXTRACT JOB DESCRIPTION REQUIREMENTS
# ==========================================

@app.post("/api/extract-jd-requirements")
def extract_jd_requirements(
    request: JDExtractRequest
):
    jd_text = request.job_description or ""

    if not jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required."
        )

    extracted = skill_extractor.extract_from_text(
        jd_text
    )

    title_match = re.search(
        r"(?:position|role|title|looking for|seeking)"
        r"\s*[:\-]?\s*([A-Za-z\s/-]+"
        r"(?:Engineer|Developer|Architect|Scientist|"
        r"Specialist|Manager|Consultant))",
        jd_text,
        re.IGNORECASE
    )

    suggested_title = (
        title_match.group(1).strip()
        if title_match
        else "Software Engineer"
    )

    exp_match = re.search(
        r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)"
        r"(?:\s+of)?\s+(?:experience|exp)",
        jd_text,
        re.IGNORECASE
    )

    min_exp = (
        float(exp_match.group(1))
        if exp_match
        else 2.0
    )

    bias_result = screening_engine.analyze_jd_bias(
        jd_text
    )

    return {
        "suggested_title": suggested_title,
        "extracted_skills": extracted.skill_names,
        "min_experience": min_exp,
        "bias_analysis": bias_result
    }


# ==========================================
# TOGGLE CANDIDATE SHORTLIST
# ==========================================

@app.post("/api/candidates/{candidate_id}/toggle-shortlist")
def toggle_shortlist(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    candidate = db.query(CandidateProfile).filter_by(
        id=candidate_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found."
        )

    decision = db.query(RecruiterDecision).filter_by(
        candidate_id=candidate_id
    ).first()

    if not decision:
        decision = RecruiterDecision(
            candidate_id=candidate_id,
            job_id=1,
            recruiter_id=1,
            stage="shortlisted",
            notes="Shortlisted via AI Resume Screener",
            is_human_verified=True
        )

        db.add(decision)
        is_shortlisted = True

    else:
        if decision.stage == "shortlisted":
            decision.stage = "new"
            is_shortlisted = False
        else:
            decision.stage = "shortlisted"
            is_shortlisted = True

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "candidate_id": candidate_id,
        "is_shortlisted": is_shortlisted,
        "stage": decision.stage
    }


# ==========================================
# END-TO-END RESUME SCREENING
# ==========================================

@app.post("/api/screen-resumes")
async def screen_resumes(
    files: List[UploadFile] = File(None),
    job_title: str = Form("Senior Software Engineer"),
    job_description: str = Form(""),
    required_skills: str = Form(
        "Python, FastAPI, React, Docker, PostgreSQL"
    ),
    min_experience: float = Form(2.0),
    blind_mode: bool = Form(False),
    include_benchmarks: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Processes uploaded resumes, extracts skills,
    calculates explainable scores, and ranks candidates.
    """

    if min_experience < 0:
        raise HTTPException(
            status_code=400,
            detail="Minimum experience cannot be negative."
        )

    # 1. Determine required skills

    target_skills = [
        skill.strip()
        for skill in required_skills.split(",")
        if skill.strip()
    ]

    if not target_skills and job_description:
        extracted_from_jd = skill_extractor.extract_from_text(
            job_description
        )

        target_skills = extracted_from_jd.skill_names

    if not target_skills:
        target_skills = [
            "Python",
            "FastAPI",
            "React",
            "Docker",
            "PostgreSQL"
        ]

    ranked_results = []
    seen_names = set()

    # 2. Process uploaded resumes

    if files:
        for file_index, file in enumerate(files):

            if not file.filename:
                continue

            extension = Path(file.filename).suffix.lower()

            if extension not in [".pdf", ".docx", ".txt"]:
                continue

            content = await file.read(MAX_FILE_SIZE + 1)

            if not content:
                continue

            if len(content) > MAX_FILE_SIZE:
                continue

            raw_text = ""

            try:
                if extension == ".pdf":
                    if not content.startswith(b"%PDF-"):
                        continue

                    with fitz.open(
                        stream=content,
                        filetype="pdf"
                    ) as pdf_document:

                        raw_text = "\n".join(
                            page.get_text()
                            for page in pdf_document
                        )

                elif extension == ".docx":
                    if not content.startswith(b"PK"):
                        continue

                    document = Document(
                        io.BytesIO(content)
                    )

                    raw_text = "\n".join(
                        paragraph.text
                        for paragraph in document.paragraphs
                        if paragraph.text.strip()
                    )

                elif extension == ".txt":
                    raw_text = content.decode(
                        "utf-8",
                        errors="ignore"
                    )

            except Exception:
                continue

            if not raw_text.strip():
                continue

            # Extract candidate name

            lines = [
                line.strip()
                for line in raw_text.splitlines()
                if line.strip()
            ]

            candidate_name = ""

            for line in lines[:5]:
                clean_line = re.sub(
                    r"[^a-zA-Z\s]",
                    "",
                    line
                ).strip()

                words = clean_line.split()

                if (
                    2 <= len(words) <= 4
                    and not any(
                        word.lower() in {
                            "resume",
                            "curriculum",
                            "vitae",
                            "profile",
                            "contact",
                            "summary",
                            "page"
                        }
                        for word in words
                    )
                ):
                    candidate_name = clean_line
                    break

            if not candidate_name:
                candidate_name = (
                    Path(file.filename)
                    .stem
                    .replace("_", " ")
                    .replace("-", " ")
                    .title()
                )

            # Extract experience and education

            detected_exp = extract_experience(raw_text)
            detected_edu = extract_education(raw_text)

            experience_label = (
                f"{detected_exp} years"
                if detected_exp is not None
                else "Not specified"
            )

            headline = (
                f"{target_skills[0]} Specialist"
            )

            # Extract skills

            sections = ResumeParser.segment_sections(
                raw_text
            )

            skill_result = skill_extractor.extract_from_text(
                raw_text,
                sections
            )

            coverage = skill_graph.evaluate_skill_coverage(
                skill_result.skill_names,
                target_skills
            )

            skill_score = coverage["coverage_score"]

            experience_score = calculate_experience_score(
                detected_exp,
                min_experience
            )

            growth_score = min(
                98.0,
                55.0 + len(skill_result.skills) * 2.5
            )

            overall_score = calculate_overall_score(
                skill_score,
                experience_score,
                growth_score
            )

            matched_skills = get_matched_skills(
                coverage
            )

            missing_skills = coverage.get(
                "missing_skills",
                []
            )

            # Generate summary using extracted information

            top_skills = (
                ", ".join(skill_result.skill_names[:4])
                if skill_result.skill_names
                else "No technical skills detected"
            )

            ai_summary = (
                f"{candidate_name} has the following extracted "
                f"technical skills: {top_skills}. "
                f"Experience: {experience_label}. "
                f"Education: {detected_edu}. "
                f"This summary is based on information extracted "
                f"from the uploaded resume."
            )

            # Generate recommendation

            if overall_score >= 82:
                recommendation = (
                    f"Top Recommendation ({overall_score}% Match): "
                    f"Strong alignment with {job_title}. "
                    f"Matched skills: "
                    f"{', '.join(matched_skills[:3]) or 'None'}. "
                    f"Missing skills: "
                    f"{', '.join(missing_skills) or 'None'}."
                )

            elif overall_score >= 68:
                recommendation = (
                    f"Strong Potential ({overall_score}% Match): "
                    f"Some requirements match the candidate profile. "
                    f"Matched skills: "
                    f"{', '.join(matched_skills[:3]) or 'None'}. "
                    f"Missing skills: "
                    f"{', '.join(missing_skills[:3]) or 'None'}."
                )

            else:
                recommendation = (
                    f"Moderate Alignment ({overall_score}% Match): "
                    f"Additional review may be required. "
                    f"Matched skills: "
                    f"{', '.join(matched_skills[:3]) or 'None'}. "
                    f"Missing skills: "
                    f"{', '.join(missing_skills[:3]) or 'None'}."
                )

            # Evidence from extracted resume text

            evidence = []

            for extracted_skill in skill_result.skills[:4]:
                if extracted_skill.evidence_sentences:
                    evidence.append({
                        "skill": extracted_skill.name,
                        "quote": (
                            extracted_skill.evidence_sentences[0]
                        )
                    })

            blind_id = (
                f"Candidate #U-{1000 + file_index}"
            )

            display_name = (
                blind_id
                if blind_mode
                else candidate_name
            )

            seen_names.add(candidate_name.lower())

            ranked_results.append({
                "id": 1000 + file_index,
                "candidate_name": display_name,
                "raw_name": candidate_name,
                "blind_id": blind_id,
                "is_uploaded": True,
                "filename": file.filename,
                "headline": headline,
                "experience_years": detected_exp,
                "education": (
                    "Not specified"
                    if blind_mode
                    else detected_edu
                ),
                "overall_score": overall_score,
                "skill_score": skill_score,
                "experience_score": experience_score,
                "growth_score": growth_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "ai_summary": ai_summary,
                "ai_recommendation": recommendation,
                "evidence_trail": evidence,
                "is_shortlisted": False
            })

    # 3. Process benchmark candidates (only if explicitly requested)
    if include_benchmarks:

        db_candidates = db.query(
            CandidateProfile
        ).all()

        for candidate in db_candidates:

            user = db.query(User).filter_by(
                id=candidate.user_id
            ).first()

            raw_candidate_name = (
                user.full_name
                if user
                else f"Candidate #{candidate.id}"
            )

            if raw_candidate_name.lower() in seen_names:
                continue

            candidate_skills = candidate.skills or []

            if isinstance(candidate_skills, str):
                try:
                    candidate_skills = json.loads(
                        candidate_skills
                    )
                except (ValueError, TypeError):
                    candidate_skills = []

            if not isinstance(candidate_skills, list):
                candidate_skills = []

            coverage = skill_graph.evaluate_skill_coverage(
                candidate_skills,
                target_skills
            )

            skill_score = coverage["coverage_score"]

            candidate_experience = float(
                candidate.experience_years or 0.0
            )

            experience_score = calculate_experience_score(
                candidate_experience,
                min_experience
            )

            growth_score = min(
                98.0,
                60.0 + len(candidate_skills) * 2.8
            )

            overall_score = calculate_overall_score(
                skill_score,
                experience_score,
                growth_score
            )

            matched_skills = get_matched_skills(
                coverage
            )

            missing_skills = coverage.get(
                "missing_skills",
                []
            )

            decision = db.query(
                RecruiterDecision
            ).filter_by(
                candidate_id=candidate.id
            ).first()

            is_shortlisted = (
                decision.stage == "shortlisted"
                if decision
                else False
            )

            blind_id = (
                candidate.blind_id
                or f"Candidate #C-{candidate.id:04d}"
            )

            display_name = (
                blind_id
                if blind_mode
                else raw_candidate_name
            )

            top_skills = (
                ", ".join(candidate_skills[:4])
                if candidate_skills
                else "No skills listed"
            )

            ai_summary = (
                f"{raw_candidate_name} has the headline "
                f"{candidate.headline or 'Not specified'}. "
                f"Listed skills: {top_skills}. "
                f"Experience: {candidate_experience} years. "
                f"Education: {candidate.education or 'Not specified'}."
            )

            if overall_score >= 82:
                recommendation = (
                    f"Top Recommendation ({overall_score}% Match): "
                    f"Strong profile alignment. "
                    f"Matched skills: "
                    f"{', '.join(matched_skills[:3]) or 'None'}."
                )

            elif overall_score >= 68:
                recommendation = (
                    f"Strong Potential ({overall_score}% Match): "
                    f"Some required competencies are present. "
                    f"Missing skills: "
                    f"{', '.join(missing_skills[:3]) or 'None'}."
                )

            else:
                recommendation = (
                    f"Alternative Match ({overall_score}% Match): "
                    f"Further evaluation is recommended."
                )

            # Do not manufacture evidence quotes for benchmark records.
            evidence = []

            ranked_results.append({
                "id": candidate.id,
                "candidate_name": display_name,
                "raw_name": raw_candidate_name,
                "blind_id": blind_id,
                "is_uploaded": False,
                "filename": (
                    candidate.resume_path
                    or "No resume file recorded"
                ),
                "headline": (
                    candidate.headline
                    or "Software Engineer"
                ),
                "experience_years": candidate_experience,
                "education": (
                    "Not specified"
                    if blind_mode
                    else candidate.education or "Not specified"
                ),
                "overall_score": overall_score,
                "skill_score": skill_score,
                "experience_score": experience_score,
                "growth_score": growth_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "ai_summary": ai_summary,
                "ai_recommendation": recommendation,
                "evidence_trail": evidence,
                "is_shortlisted": is_shortlisted
            })

    # 4. Sort candidates and assign ranks

    ranked_results.sort(
        key=lambda item: item["overall_score"],
        reverse=True
    )

    for rank, item in enumerate(ranked_results, 1):
        item["rank"] = rank

    # 5. Log screening activity

    audit = AuditLog(
        action="RESUMES_SCREENED",
        entity_type="JOB",
        entity_id=1,
        details={
            "total_screened": len(ranked_results),
            "blind_mode": blind_mode,
            "job_title": job_title
        }
    )

    try:
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "job_title": job_title,
        "target_skills": target_skills,
        "total_screened": len(ranked_results),
        "blind_mode": blind_mode,
        "ranked_candidates": ranked_results
    }
# ==========================================
# CUSTOM OPENAPI FOR SWAGGER FILE UPLOADS
# ==========================================
from fastapi.openapi.utils import get_openapi
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        openapi_version="3.0.3"
    )

    schema = (
        openapi_schema["paths"]
        ["/api/screen-resumes"]["post"]
        ["requestBody"]["content"]
        ["multipart/form-data"]["schema"]
    )

    ref = schema.get("$ref")

    if ref:
        schema_name = ref.split("/")[-1]

        files_schema = (
            openapi_schema["components"]["schemas"]
            [schema_name]["properties"]["files"]
        )

        files_schema["items"].pop("contentMediaType", None)
        files_schema["items"]["format"] = "binary"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi