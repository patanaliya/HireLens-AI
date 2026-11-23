"""
HireLens AI - Admin Management & Audit Logs Router
Endpoints:
- GET /api/admin/users: Lists registered users, roles, and timestamps
- GET /api/admin/audit-logs: System-wide audit log trail
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User, AuditLog
from routers.auth import require_role


router = APIRouter(prefix="/api/admin", tags=["Administrator"])


@router.get("/users")
def list_system_users(
    admin_user: User = Depends(require_role(["admin", "recruiter"])),
    db: Session = Depends(get_db)
):
    """Lists registered users and assigned system roles."""
    users = db.query(User).order_by(User.id.desc()).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "company_name": u.company_name,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return {"total": len(results), "users": results}


@router.get("/audit-logs")
def get_audit_trail(
    admin_user: User = Depends(require_role(["admin", "recruiter"])),
    db: Session = Depends(get_db)
):
    """Returns append-only compliance audit logs for screening and decisions."""
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "model_version": l.model_version,
            "details": l.details,
            "timestamp": l.created_at.isoformat() if l.created_at else None
        })
    return {"total": len(results), "logs": results}
