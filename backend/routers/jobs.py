"""
HireLens AI - Job Posting & Management Router
Endpoints:
- POST /jobs: Recruiter posts a new job opening with required/preferred skills
- GET /jobs: Lists all available jobs with skill tags and applicant counts
- GET /jobs/{job_id}: Fetches full job description, requirements, and applicants
- PUT /jobs/{job_id}: Updates job details
- DELETE /jobs/{job_id}: Closes/archives a job opening
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
from models import Job, JobSkill, Skill, Application, User
from routers.auth import get_current_user, require_role
from screening_engine import screening_engine


router = APIRouter(prefix="/jobs", tags=["Job Management"])


class CreateJobRequest(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    location: Optional[str] = "Remote"
    description: str
    requirements_text: Optional[str] = ""
    experience_min: Optional[int] = 2
    required_skills: List[str] = []
    preferred_skills: List[str] = []


class UpdateJobRequest(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements_text: Optional[str] = None
    experience_min: Optional[int] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    status: Optional[str] = None


@router.get("")
def list_jobs(db: Session = Depends(get_db)):
    """Lists all active job openings with applicant counts and required skills."""
    jobs = db.query(Job).filter(Job.status == "open").order_by(Job.created_at.desc()).all()
    results = []

    for j in jobs:
        applicant_count = db.query(Application).filter(Application.job_id == j.id).count()
        results.append({
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "location": j.location,
            "experience_min": j.experience_min,
            "description": j.description,
            "required_skills": j.required_skills or [],
            "preferred_skills": j.preferred_skills or [],
            "bias_score": j.bias_score,
            "applicant_count": applicant_count,
            "created_at": j.created_at.isoformat() if j.created_at else None
        })

    return {"total": len(results), "jobs": results}


@router.post("")
def create_job(
    req: CreateJobRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Recruiters create a new job posting with automated JD bias analysis."""
    # Run JD bias analyzer to assist the recruiter with inclusive phrasing
    bias_result = screening_engine.analyze_jd_bias(req.description)

    new_job = Job(
        title=req.title.strip(),
        department=req.department.strip() if req.department else "Engineering",
        location=req.location.strip() if req.location else "Remote",
        description=req.description.strip(),
        requirements_text=req.requirements_text.strip() if req.requirements_text else req.description.strip(),
        experience_min=req.experience_min if req.experience_min is not None else 2,
        required_skills=req.required_skills or [],
        preferred_skills=req.preferred_skills or [],
        bias_score=bias_result.get("bias_score", 0.0),
        bias_feedback=bias_result.get("flagged_terms", []),
        inclusive_description=bias_result.get("inclusive_rewrite", req.description),
        created_by_id=current_user.id,
        status="open"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Link skills to JobSkill table
    for skill_name in (req.required_skills or []):
        skill = db.query(Skill).filter(Skill.name.ilike(skill_name.strip())).first()
        if not skill:
            skill = Skill(name=skill_name.strip(), category="core")
            db.add(skill)
            db.commit()
            db.refresh(skill)
        db.add(JobSkill(job_id=new_job.id, skill_id=skill.id, is_required=True))

    db.commit()

    return {
        "message": "Job created successfully.",
        "job_id": new_job.id,
        "bias_feedback": bias_result,
        "job": {
            "id": new_job.id,
            "title": new_job.title,
            "department": new_job.department,
            "location": new_job.location,
            "required_skills": new_job.required_skills,
            "inclusive_description": new_job.inclusive_description
        }
    }


@router.get("/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    """Retrieves full job description, requirements, and applicant breakdown."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    applicants = db.query(Application).filter(Application.job_id == job_id).all()
    applicant_list = []
    for app in applicants:
        cand = app.candidate
        applicant_list.append({
            "application_id": app.id,
            "candidate_id": cand.id if cand else None,
            "candidate_name": cand.user.full_name if (cand and cand.user) else "Applicant",
            "blind_id": cand.blind_id if cand else "Candidate",
            "headline": cand.headline if cand else "",
            "status": app.status,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None
        })

    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "location": job.location,
            "experience_min": job.experience_min,
            "description": job.description,
            "inclusive_description": job.inclusive_description,
            "required_skills": job.required_skills or [],
            "preferred_skills": job.preferred_skills or [],
            "bias_score": job.bias_score,
            "bias_feedback": job.bias_feedback or []
        },
        "applicant_count": len(applicant_list),
        "applicants": applicant_list
    }


@router.put("/{job_id}")
def update_job(
    job_id: int,
    req: UpdateJobRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Updates an existing job opening."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if req.title is not None:
        job.title = req.title.strip()
    if req.department is not None:
        job.department = req.department.strip()
    if req.location is not None:
        job.location = req.location.strip()
    if req.description is not None:
        job.description = req.description.strip()
    if req.experience_min is not None:
        job.experience_min = req.experience_min
    if req.required_skills is not None:
        job.required_skills = req.required_skills
    if req.preferred_skills is not None:
        job.preferred_skills = req.preferred_skills
    if req.status is not None:
        job.status = req.status

    db.commit()
    return {"message": "Job updated successfully.", "job_id": job.id}


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Closes or archives a job opening."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job.status = "closed"
    db.commit()
    return {"message": "Job successfully closed/archived."}
