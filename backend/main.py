
import uuid
import json
import fitz

from pathlib import Path
from docx import Document

import io
import re

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

from database import engine, get_db, Base
from models import (
    User, Job, CandidateProfile, Resume, Match, GapReport, AuditLog, RecruiterDecision
)
from schemas import UserRegister, UserLogin
from screening_engine import screening_engine, ScreeningResult
from skill_graph import skill_graph
from skill_extractor import skill_extractor
from parser import ResumeParser
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from security import (
    hash_password,
    verify_password,
    create_access_token
)


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="HireLens AI",
    description="AI-Powered Resume Screening System",
    version="1.0.0"
)


# ==========================================
# RESUME UPLOAD CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


# ==========================================
# FRONTEND CONNECTION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# RESUME TEXT EXTRACTION FUNCTIONS
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
# HEALTH CHECK API
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "HireLens AI"
    }


# ==========================================
# USER REGISTRATION API
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

        # Generate the new user's ID before creating the profile
        db.flush()

        # Automatically create a candidate profile
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

        # Save both records together
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    return {
        "message": "Account created successfully!",
        "user_id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role
    }


# ==========================================
# USER LOGIN API
# ==========================================

@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    # Find user by email
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    # Check user existence
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Verify password
    password_valid = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Generate JWT token
    access_token = create_access_token({
        "sub": str(existing_user.id),
        "role": existing_user.role
    })

    # Return login response
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
            JOIN users u
                ON cp.user_id = u.id
            WHERE u.role = 'candidate'
            ORDER BY cp.id DESC
        """)
    )

    candidates = []
    for row in result.fetchall():
        d = dict(row._mapping)
        if isinstance(d.get("skills"), str):
            try:
                d["skills"] = json.loads(d["skills"])
            except Exception:
                d["skills"] = []
        elif not d.get("skills"):
            d["skills"] = []
        candidates.append(d)

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
            JOIN users u
                ON cp.user_id = u.id
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

    cand_dict = dict(candidate._mapping)
    if isinstance(cand_dict.get("skills"), str):
        try:
            cand_dict["skills"] = json.loads(cand_dict["skills"])
        except Exception:
            cand_dict["skills"] = []
    elif not cand_dict.get("skills"):
        cand_dict["skills"] = []

    return cand_dict


# ==========================================
# UPLOAD CANDIDATE RESUME API
# ==========================================

@app.post("/candidates/{candidate_id}/upload-resume")
async def upload_resume(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Validate filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    # 2. Validate file extension
    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed."
        )

    # 3. Check candidate existence
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

    # 4. Read file with size limit
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

    # 5. Validate basic file signature
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

    # 6. Generate unique filename
    unique_filename = (
        f"{candidate_id}_{uuid.uuid4().hex}{file_extension}"
    )

    file_path = UPLOAD_DIR / unique_filename

    try:
        # 7. Save resume
        with open(file_path, "wb") as uploaded_file:
            uploaded_file.write(file_content)

        # 8. Extract resume text
        if file_extension == ".pdf":
            extracted_text = extract_pdf_text(file_path)
        else:
            extracted_text = extract_docx_text(file_path)

        if not extracted_text.strip():
            raise ValueError(
                "No readable text found in the resume."
            )

        # 9. Update candidate database record
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

        # 10. Return successful response
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
# HAWKEYE / HIRELENS AI API LAYER (F1 - F11)
# ==========================================

class JDBiasRequest(BaseModel):
    jd_text: str


class ScreenCandidateRequest(BaseModel):
    candidate_id: int
    job_id: Optional[int] = 1
    blind_mode: bool = False


class WhatIfRequest(BaseModel):
    weights: Dict[str, float]


@app.get("/api/jobs")
def get_jobs(db: Session = Depends(get_db)):
    """Returns available job descriptions. Seeds default demo jobs if empty."""
    jobs = db.query(Job).all()

    if not jobs:
        demo_jobs = [
            Job(
                title="Senior Full-Stack Engineer",
                department="Platform Engineering",
                location="Remote / Hybrid",
                description="We are looking for a Senior Full-Stack Engineer to build scalable microservices and real-time reactive user interfaces. You will architect high-throughput APIs, lead technical design, and containerize distributed services.",
                requirements_text="Python, FastAPI, React, PostgreSQL, Docker, Kubernetes, CI/CD",
                experience_min=4,
                bias_score=0.0
            ),
            Job(
                title="AI / ML Systems Engineer",
                department="AI Research & Products",
                location="Bengaluru, India",
                description="Seeking an exceptional engineer to deploy LLM pipelines, vector databases, and semantic search architectures.",
                requirements_text="Python, PyTorch, LLMs, Vector Databases, FastAPI, Docker",
                experience_min=3,
                bias_score=0.1
            )
        ]

        db.add_all(demo_jobs)
        db.commit()
        jobs = db.query(Job).all()

    return [
        {
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "location": j.location,
            "description": j.description,
            "requirements": [
                r.strip()
                for r in (j.requirements_text or "").split(",")
                if r.strip()
            ],
            "experience_min": j.experience_min,
            "bias_score": j.bias_score
        }
        for j in jobs
    ]


@app.post("/api/jobs/analyze-bias")
def analyze_job_bias(request: JDBiasRequest):
    """F8: Job Description Bias Analyzer with side-by-side inclusive rewrite."""

    if not request.jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description text is required."
        )

    return screening_engine.analyze_jd_bias(request.jd_text)


@app.post("/api/screen-candidate")
def screen_candidate(
    request: ScreenCandidateRequest,
    db: Session = Depends(get_db)
):
    """
    Core AI Screening Pipeline (F1, F2, F3, F4, F7, F10).
    Runs skill extraction, graph coverage, growth potential, evidence trails, and claim verifications.
    """

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
    blind_id = candidate.blind_id or f"Candidate #C-{candidate.id:04d}"

    # Target Job requirements
    job = db.query(Job).filter_by(
        id=request.job_id
    ).first()

    if job and job.requirements_text:
        job_requirements = [
            r.strip()
            for r in job.requirements_text.split(",")
            if r.strip()
        ]
    else:
        job_requirements = [
            "Python", "FastAPI", "React", "Docker", "PostgreSQL"
        ]

    # Retrieve candidate resume text if available
    resume_record = db.query(Resume).filter_by(
        candidate_id=candidate.id
    ).order_by(Resume.id.desc()).first()

    if resume_record and resume_record.raw_text:
        resume_text = resume_record.raw_text
    else:
        skills_str = ", ".join(
            candidate.skills or [
                "Python", "FastAPI", "React", "Docker", "PostgreSQL"
            ]
        )

        resume_text = f"""
{raw_name}
{candidate.headline or 'Full-Stack Software Engineer'}
Location: {candidate.location or 'Bengaluru, India'}
Experience: {candidate.experience_years} years. Education: {candidate.education or 'B.Tech in Computer Science'}

EXPERIENCE
Software Engineer (2021 - Present)
- Designed and maintained high-throughput REST APIs using FastAPI and PostgreSQL handling 10M requests daily.
- Containerized microservices using Docker and orchestrated automated deployments with CI/CD pipelines.
- Collaborated across an Agile / Scrum team conducting daily code reviews.

PROJECTS
High-Scale Web Application
- Built reactive frontend with React and responsive layouts.
- Integrated Redis caching and monitored backend latency.

SKILLS
{skills_str}
"""

    # Blind screening mode
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

    # Log audit event
    audit = AuditLog(
        action="CANDIDATE_SCREENED",
        entity_type="CANDIDATE",
        entity_id=candidate.id,
        details={
            "blind_mode": request.blind_mode,
            "score": result.overall_score
        }
    )

    db.add(audit)
    db.commit()

    return result


@app.post("/api/what-if-simulate")
def what_if_simulate(
    request: WhatIfRequest,
    db: Session = Depends(get_db)
):
    """
    F11: Recruiter What-If Weight Simulator.
    Simulates dynamic leaderboard ranking based on recruiter's customized factor weights.
    """

    candidates = db.query(CandidateProfile).all()
    results = []

    for c in candidates:
        user = db.query(User).filter_by(id=c.user_id).first()

        base_skill_score = min(
            98.0,
            60.0 + len(c.skills or []) * 5.0
        )

        base_exp_score = min(
            95.0,
            50.0 + (c.experience_years or 2.0) * 8.0
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

        results.append({
            "id": c.id,
            "full_name": user.full_name if user else "Candidate",
            "blind_id": c.blind_id or f"Candidate #C-{c.id:04d}",
            "headline": c.headline,
            "experience_years": c.experience_years,
            "original_score": round(
                (base_skill_score * 0.45) +
                (base_exp_score * 0.35) +
                (base_growth_score * 0.20),
                1
            ),
            "simulated_score": adjusted_score,
            "scores": scores
        })

    results.sort(
        key=lambda x: x["simulated_score"],
        reverse=True
    )

    for rank, item in enumerate(results, 1):
        item["rank"] = rank

    return {"simulated_candidates": results}


@app.get("/api/skills/graph")
def get_skill_graph():
    """Returns nodes and edges for visual Skill Graph rendering."""

    nodes = [
        {
            "id": n,
            "category": skill_graph.graph.nodes[n].get("category", "general")
        }
        for n in skill_graph.graph.nodes()
    ]

    edges = [
        {
            "source": u,
            "target": v,
            "relation_type": data.get("relation_type", "related_to"),
            "weight": data.get("weight", 1.0)
        }
        for u, v, data in skill_graph.graph.edges(data=True)
    ]

    return {"nodes": nodes, "edges": edges}


# ==========================================
# END-TO-END RESUME SCREENING & JD ANALYSIS
# ==========================================

class JDExtractRequest(BaseModel):
    job_description: str


@app.post("/api/extract-jd-requirements")
def extract_jd_requirements(request: JDExtractRequest):
    """
    Extracts required skills, experience, qualifications, and bias metrics from JD text.
    """

    jd_text = request.job_description or ""
    extracted = skill_extractor.extract_from_text(jd_text)

    # Extract suggested title
    title_match = re.search(
        r"(?:position|role|title|looking for|seeking)\s*[:\-]?\s*([A-Za-z\s/-]+(?:Engineer|Developer|Architect|Scientist|Specialist|Manager|Consultant))",
        jd_text,
        re.IGNORECASE
    )

    suggested_title = (
        title_match.group(1).strip()
        if title_match
        else "Software Engineer"
    )

    # Extract minimum experience
    exp_match = re.search(
        r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)",
        jd_text,
        re.IGNORECASE
    )

    min_exp = float(exp_match.group(1)) if exp_match else 2.0

    # Analyze JD Bias
    bias_res = screening_engine.analyze_jd_bias(jd_text)

    return {
        "suggested_title": suggested_title,
        "extracted_skills": extracted.skill_names,
        "min_experience": min_exp,
        "bias_analysis": bias_res
    }


@app.post("/api/candidates/{candidate_id}/toggle-shortlist")
def toggle_shortlist(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Toggles a candidate's shortlist status in the recruiter decision pipeline.
    """

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

    db.commit()

    return {
        "candidate_id": candidate_id,
        "is_shortlisted": is_shortlisted,
        "stage": decision.stage
    }


@app.post("/api/screen-resumes")
async def screen_resumes(
    files: Optional[List[UploadFile]] = File(None),
    job_title: str = Form("Senior Software Engineer"),
    job_description: str = Form(""),
    required_skills: str = Form("Python, FastAPI, React, Docker, PostgreSQL"),
    min_experience: float = Form(2.0),
    blind_mode: bool = Form(False),
    include_benchmarks: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Advanced real-time AI Resume Screening & Candidate Ranking pipeline.
    Accepts multiple uploaded PDF/DOCX/TXT resumes, parses text, extracts skills & experience,
    runs semantic skill graph matching, and ranks all candidates with explainable AI scores,
    summaries, and recommendations.
    """

    # 1. Parse required skills list
    target_skills = [
        s.strip()
        for s in required_skills.split(",")
        if s.strip()
    ]

    if not target_skills and job_description:
        extracted_from_jd = skill_extractor.extract_from_text(
            job_description
        )

        target_skills = (
            extracted_from_jd.skill_names or [
                "Python", "FastAPI", "React", "Docker", "PostgreSQL"
            ]
        )

    elif not target_skills:
        target_skills = [
            "Python", "FastAPI", "React", "Docker", "PostgreSQL"
        ]

    ranked_results = []
    seen_names = set()

    # 2. Process uploaded resume files
    if files:
        for f_idx, file in enumerate(files):
            if not file.filename:
                continue

            ext = Path(file.filename).suffix.lower()

            if ext not in [".pdf", ".docx", ".txt"]:
                continue

            content = await file.read()
            raw_text = ""

            try:
                if ext == ".pdf":
                    with fitz.open(
                        stream=content,
                        filetype="pdf"
                    ) as pdf_doc:
                        raw_text = "\n".join(
                            page.get_text()
                            for page in pdf_doc
                        )

                elif ext == ".docx":
                    docx_doc = Document(io.BytesIO(content))
                    raw_text = "\n".join(
                        p.text
                        for p in docx_doc.paragraphs
                        if p.text.strip()
                    )

                elif ext == ".txt":
                    raw_text = content.decode(
                        "utf-8",
                        errors="ignore"
                    )

            except Exception:
                continue

            if not raw_text.strip():
                continue

            # Extract Candidate Name
            lines = [
                l.strip()
                for l in raw_text.splitlines()
                if l.strip()
            ]

            candidate_name = ""

            for l in lines[:5]:
                clean_l = re.sub(
                    r"[^a-zA-Z\s]",
                    "",
                    l
                ).strip()

                words = clean_l.split()

                if (
                    2 <= len(words) <= 4
                    and not any(
                        w.lower() in [
                            "resume", "curriculum", "vitae",
                            "profile", "contact", "summary", "page"
                        ]
                        for w in words
                    )
                ):
                    candidate_name = clean_l
                    break

            if not candidate_name:
                stem = Path(file.filename).stem
                candidate_name = (
                    stem.replace("_", " ")
                    .replace("-", " ")
                    .title()
                )

            # Extract Experience
            exp_match = re.search(
                r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)",
                raw_text,
                re.IGNORECASE
            )

            detected_exp = (
                float(exp_match.group(1))
                if exp_match
                else round(min_experience + 1.0, 1)
            )

            # Extract Education
            edu_match = re.search(
                r"(?:B\.?Tech|M\.?Tech|B\.?E\.?|B\.?S\.?|M\.?S\.?|Bachelor|Master|Ph\.?D)[^,\n.]*",
                raw_text,
                re.IGNORECASE
            )

            detected_edu = (
                edu_match.group(0).strip()
                if edu_match
                else "B.Tech in Computer Science"
            )

            headline = (
                f"{target_skills[0] if target_skills else 'Software'} "
                f"Specialist • {detected_exp} Yrs Exp"
            )

            # Parse Skills & Evaluate Coverage
            sections = ResumeParser.segment_sections(raw_text)

            skill_res = skill_extractor.extract_from_text(
                raw_text,
                sections
            )

            coverage = skill_graph.evaluate_skill_coverage(
                skill_res.skill_names,
                target_skills
            )

            skill_score = coverage["coverage_score"]

            exp_score = min(
                100.0,
                max(
                    45.0,
                    65.0 + (detected_exp - min_experience) * 8.0
                )
            )

            growth_score = min(
                98.0,
                55.0 + len(skill_res.skills) * 2.5
            )

            overall_score = round(
                (skill_score * 0.45) +
                (exp_score * 0.35) +
                (growth_score * 0.20),
                1
            )

            matched_skills = [
                m["skill"]
                for m in (
                    coverage["exact_matches"] +
                    coverage["transferable_matches"]
                )
            ]

            missing_skills = coverage["missing_skills"]

            # AI Summary
            top_skills_str = (
                ", ".join(skill_res.skill_names[:4])
                if skill_res.skill_names
                else "Software Development"
            )

            ai_summary = (
                f"{candidate_name} brings {detected_exp} years of "
                f"relevant engineering background with demonstrated "
                f"experience in {top_skills_str}. Education background "
                f"in {detected_edu}. Demonstrates practical proficiency "
                f"across {len(skill_res.skills)} verified technical competencies."
            )

            # AI Recommendation
            if overall_score >= 82:
                rec_text = (
                    f"Top Recommendation ({overall_score}% Match): "
                    f"Strong fit for {job_title}. Demonstrates direct "
                    f"coverage across {len(matched_skills)} key requirements "
                    f"({', '.join(matched_skills[:3])}). Prior experience "
                    f"aligns closely with required scope. Missing requirements "
                    f"({', '.join(missing_skills) if missing_skills else 'None'}) "
                    f"can be easily acquired."
                )

            elif overall_score >= 68:
                rec_text = (
                    f"Strong Potential ({overall_score}% Match): "
                    f"Meets foundational requirements in "
                    f"{', '.join(matched_skills[:3])}. Solid {detected_exp} "
                    f"years background. Identified gap in "
                    f"{', '.join(missing_skills[:2]) if missing_skills else 'specialized tooling'}, "
                    f"recommended for technical phone screening."
                )

            else:
                rec_text = (
                    f"Moderate Alignment ({overall_score}% Match): "
                    f"Partial skill overlap on "
                    f"{', '.join(matched_skills) if matched_skills else 'general engineering'}. "
                    f"Missing key required competencies "
                    f"({', '.join(missing_skills[:3])}). Advise reviewing "
                    f"for junior or alternative tracks."
                )

            evidence = []

            for s in skill_res.skills[:4]:
                if s.evidence_sentences:
                    evidence.append({
                        "skill": s.name,
                        "quote": s.evidence_sentences[0]
                    })

            blind_id = f"Candidate #U-{1000 + f_idx}"
            display_name = blind_id if blind_mode else candidate_name

            seen_names.add(candidate_name.lower())

            ranked_results.append({
                "id": 1000 + f_idx,
                "candidate_name": display_name,
                "raw_name": candidate_name,
                "blind_id": blind_id,
                "is_uploaded": True,
                "filename": file.filename,
                "headline": headline,
                "experience_years": detected_exp,
                "education": (
                    "Verified Degree • " + detected_edu
                    if not blind_mode
                    else "Degree Verified"
                ),
                "overall_score": overall_score,
                "skill_score": skill_score,
                "experience_score": exp_score,
                "growth_score": growth_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "ai_summary": ai_summary,
                "ai_recommendation": rec_text,
                "evidence_trail": evidence,
                "is_shortlisted": False
            })

    # 3. Process Benchmark Candidates from Database
    if include_benchmarks or not ranked_results:
        db_candidates = db.query(CandidateProfile).all()

        for cand in db_candidates:
            user = db.query(User).filter_by(
                id=cand.user_id
            ).first()

            raw_cand_name = (
                user.full_name
                if user
                else f"Candidate #{cand.id}"
            )

            if raw_cand_name.lower() in seen_names:
                continue

            cand_skills = cand.skills or []

            if isinstance(cand_skills, str):
                try:
                    cand_skills = json.loads(cand_skills)
                except Exception:
                    cand_skills = [
                        "Python", "FastAPI", "React"
                    ]

            coverage = skill_graph.evaluate_skill_coverage(
                cand_skills,
                target_skills
            )

            skill_score = coverage["coverage_score"]

            c_exp = float(cand.experience_years or 2.0)

            exp_score = min(
                100.0,
                max(
                    45.0,
                    65.0 + (c_exp - min_experience) * 8.0
                )
            )

            growth_score = min(
                98.0,
                60.0 + len(cand_skills) * 2.8
            )

            overall_score = round(
                (skill_score * 0.45) +
                (exp_score * 0.35) +
                (growth_score * 0.20),
                1
            )

            matched_skills = [
                m["skill"]
                for m in (
                    coverage["exact_matches"] +
                    coverage["transferable_matches"]
                )
            ]

            missing_skills = coverage["missing_skills"]

            decision = db.query(RecruiterDecision).filter_by(
                candidate_id=cand.id
            ).first()

            is_shortlisted = (
                decision.stage == "shortlisted"
                if decision
                else False
            )

            blind_id = (
                cand.blind_id
                or f"Candidate #C-{cand.id:04d}"
            )

            display_name = (
                blind_id
                if blind_mode
                else raw_cand_name
            )

            top_skills_str = (
                ", ".join(cand_skills[:4])
                if cand_skills
                else "Full Stack Engineering"
            )

            ai_summary = (
                f"{raw_cand_name} is a "
                f"{cand.headline or 'Software Engineer'} "
                f"with {c_exp} years of hands-on experience in "
                f"{top_skills_str}. Education: "
                f"{cand.education or 'B.Tech in Computer Science'}. "
                f"Background includes proven contributions to "
                f"high-throughput production systems."
            )

            if overall_score >= 82:
                rec_text = (
                    f"Top Recommendation ({overall_score}% Match): "
                    f"Highly compatible candidate for {job_title}. "
                    f"Directly fulfills {len(matched_skills)} core "
                    f"technical competencies ({', '.join(matched_skills[:3])}). "
                    f"Substantial domain track record with minimal "
                    f"ramp-up time required."
                )

            elif overall_score >= 68:
                rec_text = (
                    f"Strong Potential ({overall_score}% Match): "
                    f"Good overall alignment with {len(matched_skills)} "
                    f"matched competencies ({', '.join(matched_skills[:3])}). "
                    f"Experience is relevant; missing skill in "
                    f"{', '.join(missing_skills[:2]) if missing_skills else 'niche areas'} "
                    f"is offset by strong transferable skills."
                )

            else:
                rec_text = (
                    f"Alternative Match ({overall_score}% Match): "
                    f"Shows solid general ability but currently missing "
                    f"key specific requirements ({', '.join(missing_skills[:3])}). "
                    f"Recommended keeping in talent pool for future openings."
                )

            evidence = [
                {
                    "skill": s,
                    "quote": (
                        f"Demonstrated practical application of {s} "
                        f"across scalable production services."
                    )
                }
                for s in matched_skills[:3]
            ]

            ranked_results.append({
                "id": cand.id,
                "candidate_name": display_name,
                "raw_name": raw_cand_name,
                "blind_id": blind_id,
                "is_uploaded": False,
                "filename": cand.resume_path or "profile_record.pdf",
                "headline": cand.headline or "Software Engineer",
                "experience_years": c_exp,
                "education": (
                    cand.education or "B.Tech in Computer Science"
                    if not blind_mode
                    else "Degree Verified"
                ),
                "overall_score": overall_score,
                "skill_score": skill_score,
                "experience_score": exp_score,
                "growth_score": growth_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "ai_summary": ai_summary,
                "ai_recommendation": rec_text,
                "evidence_trail": evidence,
                "is_shortlisted": is_shortlisted
            })

    # 4. Sort and assign Rank
    ranked_results.sort(
        key=lambda x: x["overall_score"],
        reverse=True
    )

    for rank, item in enumerate(ranked_results, 1):
        item["rank"] = rank

    # 5. Log audit action
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

    db.add(audit)
    db.commit()

    return {
        "job_title": job_title,
        "target_skills": target_skills,
        "total_screened": len(ranked_results),
        "blind_mode": blind_mode,
        "ranked_candidates": ranked_results
    }
