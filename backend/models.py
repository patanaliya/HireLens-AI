"""
HireLens AI - SQLAlchemy Domain Models
An Explainable, Fair & Interactive AI Resume Screening Platform

Designed for:
- Explainability (scores linked to resume sentence evidence)
- Fairness & Blind Screening
- Audit logging & Privacy
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ==========================================
# 1. USER & AUTHENTICATION
# ==========================================
class User(Base):
    """System user: candidate, recruiter, or platform admin."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String(20), nullable=False)  # 'candidate', 'recruiter', 'admin'
    company_name = Column(String(150), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    decisions = relationship("RecruiterDecision", back_populates="recruiter")
    audit_logs = relationship("AuditLog", back_populates="user")

    __table_args__ = (
        CheckConstraint("role IN ('candidate', 'recruiter', 'admin')", name="valid_user_role"),
    )


# ==========================================
# 2. JOB POSTING & BIAS AUDIT
# ==========================================
class Job(Base):
    """Job listing created by recruiters, with built-in JD bias analytics."""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False, index=True)
    department = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    requirements_text = Column(Text, nullable=True)
    experience_min = Column(Integer, default=0)
    status = Column(String(20), default="open")  # 'open', 'closed', 'draft'

    # F8: Job Description Bias Analyzer fields
    bias_score = Column(Float, default=0.0)  # 0.0 (inclusive) to 1.0 (biased)
    bias_feedback = Column(JSON, default=dict)  # Flagged terms & suggested inclusive rewrites
    inclusive_description = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    job_skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="job", cascade="all, delete-orphan")
    decisions = relationship("RecruiterDecision", back_populates="job", cascade="all, delete-orphan")


# ==========================================
# 3. CANDIDATE PROFILE & BLIND SCREENING
# ==========================================
class CandidateProfile(Base):
    """Candidate details with support for F7 Blind Screening Mode."""
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    headline = Column(String(200), nullable=True)
    location = Column(String(100), nullable=True)
    experience_years = Column(Float, default=0.0)
    education = Column(String(255), nullable=True)
    skills = Column(JSON, default=list)  # Stored list of string skill tokens
    resume_path = Column(String(500), nullable=True)

    # F7: Blind Screening Fields (auto-masked during blind review)
    blind_id = Column(String(50), unique=True, nullable=True)  # e.g., 'Candidate #C-8421'
    github_username = Column(String(100), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    resumes = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan")
    candidate_skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="candidate", cascade="all, delete-orphan")
    decisions = relationship("RecruiterDecision", back_populates="candidate", cascade="all, delete-orphan")


# ==========================================
# 4. RESUMES & PARSED SECTIONS
# ==========================================
class Resume(Base):
    """Parsed resume text and structural breakdown."""
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_data_base64 = Column(Text, nullable=True)  # Persistent storage in database for cloud hosting (Render/AWS)
    file_hash = Column(String(64), nullable=True)  # SHA256 for integrity and deduplication
    raw_text = Column(Text, nullable=False)
    anonymized_text = Column(Text, nullable=True)  # PII stripped text (names, emails, phones, colleges)
    parsed_sections = Column(JSON, default=dict)   # { 'experience': [...], 'education': [...], 'projects': [...] }
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="resumes")
    claims = relationship("ResumeClaim", back_populates="resume", cascade="all, delete-orphan")


# ==========================================
# 5. SKILL ONTOLOGY & GRAPH RELATIONS
# ==========================================
class Skill(Base):
    """Master skill dictionary."""
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), default="core")  # 'language', 'framework', 'database', 'cloud', 'soft'

    # Relationships
    source_relations = relationship("SkillRelation", foreign_keys="SkillRelation.source_skill_id", back_populates="source_skill")
    target_relations = relationship("SkillRelation", foreign_keys="SkillRelation.target_skill_id", back_populates="target_skill")


class SkillRelation(Base):
    """
    Skill Graph: captures semantic relationships between skills.
    e.g., Spring Boot implies Java (weight 0.95), Docker related to Kubernetes (weight 0.85).
    """
    __tablename__ = "skill_relations"

    id = Column(Integer, primary_key=True, index=True)
    source_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    target_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    relation_type = Column(String(50), nullable=False)  # 'implies', 'related_to', 'alternative_to'
    weight = Column(Float, default=1.0)                 # Semantic confidence 0.0 - 1.0

    # Relationships
    source_skill = relationship("Skill", foreign_keys=[source_skill_id], back_populates="source_relations")
    target_skill = relationship("Skill", foreign_keys=[target_skill_id], back_populates="target_relations")


class CandidateSkill(Base):
    """F2: Deep and recent skill usage linked to evidence."""
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    depth_score = Column(Float, default=1.0)       # Frequency, role relevance, project density
    recency_years = Column(Float, default=0.0)     # Years since last demonstrated in resume
    evidence_snippet = Column(Text, nullable=True) # Direct quote from resume

    candidate = relationship("CandidateProfile", back_populates="candidate_skills")
    skill = relationship("Skill")


class JobSkill(Base):
    """Requirements specified in Job Descriptions."""
    __tablename__ = "job_skills"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    is_required = Column(Boolean, default=True)
    importance_weight = Column(Float, default=1.0)

    job = relationship("Job", back_populates="job_skills")
    skill = relationship("Skill")


# ==========================================
# 6. MATCH & EXPLAINABLE EVIDENCE TRAIL
# ==========================================
class Match(Base):
    """
    F1 & F3: Explainable Match Score.
    Every overall score is broken down by factor, each linking to highlighted resume sentences.
    """
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    overall_score = Column(Float, nullable=False)      # 0 to 100
    skill_score = Column(Float, nullable=False)        # 0 to 100
    experience_score = Column(Float, nullable=False)   # 0 to 100
    growth_score = Column(Float, nullable=False)       # 0 to 100 (Evidence of growth)

    # F3: Factor breakdown and sentence evidence trail
    factor_breakdown = Column(JSON, default=dict)      # { 'skills': 0.4, 'experience': 0.3, ... }
    evidence_trail = Column(JSON, default=list)        # [ { 'sentence': '...', 'factor': 'Java', 'confidence': 0.95 } ]
    needs_human_review = Column(Boolean, default=True) # Non-negotiable: AI is advisory
    ai_confidence = Column(Float, default=0.85)

    created_at = Column(DateTime, server_default=func.now())

    candidate = relationship("CandidateProfile", back_populates="matches")
    job = relationship("Job", back_populates="matches")
    gap_report = relationship("GapReport", back_populates="match", uselist=False, cascade="all, delete-orphan")


# ==========================================
# 7. GAP REPORT & PERSONALIZED ROADMAP
# ==========================================
class GapReport(Base):
    """F1: Skill gap report, development roadmap, and advisory recommendations."""
    __tablename__ = "gap_reports"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), unique=True, nullable=False)

    matched_skills = Column(JSON, default=list)        # ['React', 'Python', 'FastAPI']
    missing_required = Column(JSON, default=list)      # ['Docker', 'PostgreSQL']
    skills_to_develop = Column(JSON, default=list)     # Transferable skills with highest ROI
    learning_roadmap = Column(JSON, default=list)      # Ordered step-by-step learning milestones
    growth_evidence = Column(Text, nullable=True)      # F1 Learning Potential Analysis (honest AI)
    recommendation_text = Column(Text, nullable=True)  # Recruiter advisory summary paragraph

    match = relationship("Match", back_populates="gap_report")


# ==========================================
# 8. RESUME CLAIM EVIDENCE CHECKER
# ==========================================
class ResumeClaim(Base):
    """
    F4: Verifies bold claims ('led team of 5', 'built microservices')
    Status: 'Supported', 'Needs Evidence' (Never accusations of fraud).
    """
    __tablename__ = "resume_claims"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    claim_text = Column(Text, nullable=False)
    category = Column(String(50), default="technical") # 'leadership', 'scale', 'architecture', 'metrics'
    status = Column(String(30), default="Needs Evidence") # 'Supported', 'Needs Evidence'
    supporting_quote = Column(Text, nullable=True)
    confidence = Column(Float, default=0.7)
    probe_questions = Column(JSON, default=list)       # Polite follow-up interview questions

    resume = relationship("Resume", back_populates="claims")


# ==========================================
# 9. ADAPTIVE INTERVIEW GENERATOR
# ==========================================
class InterviewQuestion(Base):
    """F10: Tailored technical and behavioral questions generated for candidate gaps."""
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    category = Column(String(30), nullable=False)      # 'technical', 'behavioral', 'architecture'
    question_text = Column(Text, nullable=False)
    targeted_gap = Column(String(100), nullable=True)  # e.g., 'Docker & Containerization'
    difficulty = Column(String(20), default="medium")  # 'junior', 'medium', 'senior'
    ideal_answer_outline = Column(Text, nullable=True) # Guidance for recruiter
    red_flags = Column(JSON, default=list)             # Points to verify

    created_at = Column(DateTime, server_default=func.now())


# ==========================================
# 10. RECRUITER DECISIONS & PIPELINE
# ==========================================
class RecruiterDecision(Base):
    """
    Non-negotiable Philosophy: Humans make all final decisions.
    Tracks Kanban pipeline status with visible decision stamps.
    """
    __tablename__ = "recruiter_decisions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    stage = Column(String(30), default="new")  # 'new', 'shortlisted', 'interview', 'offer', 'archived'
    notes = Column(Text, nullable=True)
    is_human_verified = Column(Boolean, default=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    candidate = relationship("CandidateProfile", back_populates="decisions")
    job = relationship("Job", back_populates="decisions")
    recruiter = relationship("User", back_populates="decisions")


# ==========================================
# 11. AUDIT LOGS & COMPLIANCE
# ==========================================
class AuditLog(Base):
    """Privacy & Fairness first: Append-only audit logs for all AI and recruiter actions."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # 'SCREEN_RESUME', 'BLIND_TOGGLE', 'STAGE_CHANGE'
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    model_version = Column(String(50), default="hirelens-v1.0")
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="audit_logs")


# ==========================================
# 12. EMBEDDINGS (pgvector / fallback)
# ==========================================
class EmbeddingRecord(Base):
    """Semantic vector store for candidates, jobs, and skills."""
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(30), nullable=False)  # 'candidate', 'job', 'skill'
    entity_id = Column(Integer, nullable=False, index=True)
    vector_json = Column(JSON, nullable=False)        # 384-dimensional vector list
    created_at = Column(DateTime, server_default=func.now())
