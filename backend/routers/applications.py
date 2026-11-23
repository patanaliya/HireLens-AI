"""
HireLens AI - Candidate Application & Pipeline Router
Endpoints:
- POST /jobs/{job_id}/apply: Candidate applies to a job opening
- GET /applications: Candidate views their active applications & status updates
- GET /applications/{application_id}: Application detail view
- PATCH /applications/{application_id}/status: Recruiter updates pipeline stage ('screened', 'shortlisted', 'interview', 'rejected', 'offer')
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Application, Job, CandidateProfile, User, RecruiterDecision, AuditLog
from routers.auth import get_current_user, require_role


router = APIRouter(tags=["Application Pipeline"])


class ApplyRequest(BaseModel):
    notes: Optional[str] = ""


class UpdateStatusRequest(BaseModel):
    status: str  # 'applied', 'screened', 'shortlisted', 'interview', 'rejected', 'offer'
    notes: Optional[str] = ""


@router.post("/jobs/{job_id}/apply")
def apply_to_job(
    job_id: int,
    req: ApplyRequest,
    current_user: User = Depends(require_role(["candidate"])),
    db: Session = Depends(get_db)
):
    """Candidate submits an application for an open job posting."""
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job opening is either closed or does not exist.")

    cand = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not cand:
        raise HTTPException(status_code=400, detail="Candidate profile not found. Please complete your profile first.")

    existing_app = db.query(Application).filter(
        Application.candidate_id == cand.id,
        Application.job_id == job_id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already submitted an application for this position.")

    new_app = Application(
        candidate_id=cand.id,
        job_id=job_id,
        status="applied",
        notes=req.notes or ""
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Log application submission
    try:
        db.add(AuditLog(user_id=current_user.id, action="JOB_APPLICATION", entity_type="application", entity_id=new_app.id))
        db.commit()
    except Exception:
        pass

    return {
        "message": f"Successfully applied for '{job.title}'.",
        "application_id": new_app.id,
        "status": new_app.status,
        "applied_at": new_app.applied_at.isoformat()
    }


@router.get("/applications")
def list_candidate_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns applications: for candidate, their own applications; for recruiter/admin, all applications."""
    if current_user.role == "candidate":
        cand = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
        if not cand:
            return {"applications": []}
        apps = db.query(Application).filter(Application.candidate_id == cand.id).order_by(Application.applied_at.desc()).all()
    else:
        apps = db.query(Application).order_by(Application.applied_at.desc()).all()

    results = []
    for a in apps:
        job = a.job
        cand = a.candidate
        results.append({
            "id": a.id,
            "job_id": a.job_id,
            "job_title": job.title if job else "Position",
            "department": job.department if job else "Engineering",
            "location": job.location if job else "Remote",
            "candidate_id": cand.id if cand else None,
            "candidate_name": cand.user.full_name if (cand and cand.user) else "Applicant",
            "blind_id": cand.blind_id if cand else "Candidate",
            "status": a.status,
            "notes": a.notes,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None
        })

    return {"total": len(results), "applications": results}


@router.patch("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    req: UpdateStatusRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """Recruiters update candidate status in the hiring pipeline with audit stamp."""
    valid_statuses = ["applied", "screened", "shortlisted", "interview", "rejected", "offer"]
    new_status = req.status.lower().strip()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    app_record = db.query(Application).filter(Application.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    old_status = app_record.status
    app_record.status = new_status
    if req.notes:
        app_record.notes = req.notes.strip()

    # Record recruiter decision
    decision = db.query(RecruiterDecision).filter(
        RecruiterDecision.candidate_id == app_record.candidate_id,
        RecruiterDecision.job_id == app_record.job_id
    ).first()

    if not decision:
        decision = RecruiterDecision(
            candidate_id=app_record.candidate_id,
            job_id=app_record.job_id,
            recruiter_id=current_user.id,
            stage=new_status,
            notes=req.notes or "",
            is_human_verified=True
        )
        db.add(decision)
    else:
        decision.stage = new_status
        decision.notes = req.notes or decision.notes
        decision.recruiter_id = current_user.id
        decision.is_human_verified = True

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="PIPELINE_STATUS_UPDATE",
        entity_type="application",
        entity_id=app_record.id,
        details={"from_status": old_status, "to_status": new_status, "recruiter_id": current_user.id}
    ))

    db.commit()

    return {
        "message": f"Status updated to '{new_status}'.",
        "application_id": app_record.id,
        "new_status": new_status,
        "is_human_verified": True
    }
