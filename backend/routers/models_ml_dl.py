"""
HireLens AI - Machine Learning & Deep Learning Router
Endpoints:
- GET /api/models/comparison: Benchmarks TF-IDF + Logistic Regression vs Random Forest vs Sentence-BERT
- POST /api/models/train: Trains/retrains ML models on candidate dataset
- POST /api/models/predict: Real-time relevance score with feature importances
- GET /api/models/clusters: K-Means clustering of candidate skill cohorts
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

from database import get_db
from models import CandidateProfile, Job, ModelVersion, ModelEvaluation
from ml.preprocessing import extract_candidate_features, clean_text
from ml.relevance_models import tfidf_relevance_model, rf_relevance_model, skill_cluster_engine
from dl.model_comparison import run_benchmark_comparison, BENCHMARK_DATASET
from dl.neural_embeddings import neural_embedding_engine, neural_candidate_ranker


router = APIRouter(prefix="/api/models", tags=["Machine Learning & Deep Learning"])


class PredictRelevanceRequest(BaseModel):
    candidate_skills: List[str]
    job_required_skills: List[str]
    candidate_exp_years: float = 3.0
    job_min_exp_years: float = 3.0
    candidate_education: str = "B.Tech Computer Science"
    resume_text: Optional[str] = ""
    job_description: Optional[str] = ""


@router.get("/comparison")
def get_model_benchmarks():
    """
    Returns comparative evaluation metrics on the held-out benchmark dataset:
    - Accuracy, Precision, Recall, F1-Score
    - Precision@3, NDCG@3
    - Architectural strengths and limitations
    """
    return run_benchmark_comparison(train_models=True)


@router.post("/train")
def train_models_endpoint(db: Session = Depends(get_db)):
    """
    Trains/re-fits the Applied ML models (TF-IDF + Logistic Regression, Random Forest)
    on the standardized candidate dataset and persists evaluation metrics in the database.
    """
    benchmark_report = run_benchmark_comparison(train_models=True)

    # Persist in database
    for m in benchmark_report["models"]:
        version_str = f"{m['model_id']}-v1.0"
        model_ver = db.query(ModelVersion).filter(ModelVersion.version == version_str).first()
        if not model_ver:
            model_ver = ModelVersion(
                model_name=m["name"],
                model_type=m["category"],
                version=version_str,
                hyperparameters={"architecture": m["architecture"]},
                is_active=True
            )
            db.add(model_ver)
            db.commit()
            db.refresh(model_ver)

        eval_rec = ModelEvaluation(
            model_version_id=model_ver.id,
            dataset_name=benchmark_report["dataset_name"],
            accuracy=m["metrics"]["accuracy"],
            precision=m["metrics"]["precision"],
            recall=m["metrics"]["recall"],
            f1_score=m["metrics"]["f1_score"],
            ndcg_at_k=m["metrics"]["ndcg_at_k"],
            precision_at_k=m["metrics"]["precision_at_k"],
            confusion_matrix_json=m["metrics"]["confusion_matrix"]
        )
        db.add(eval_rec)

    db.commit()

    return {
        "message": "All Applied ML and Deep Learning models successfully trained and evaluated.",
        "results": benchmark_report
    }


@router.post("/predict")
def predict_candidate_relevance(req: PredictRelevanceRequest):
    """
    Dual-head prediction:
    1. Applied ML (Random Forest): Computes probability and feature importances.
    2. Deep Learning (Sentence-BERT): Computes dense contextual cosine similarity.
    """
    # 1. Random Forest prediction
    feat = extract_candidate_features(
        candidate_skills=req.candidate_skills,
        job_required_skills=req.job_required_skills,
        candidate_exp_years=req.candidate_exp_years,
        job_min_exp_years=req.job_min_exp_years,
        candidate_education=req.candidate_education
    )
    rf_res = rf_relevance_model.predict(feat)

    # 2. Deep Learning prediction
    cand_text = req.resume_text or ("Experienced in " + ", ".join(req.candidate_skills) + ". " + req.candidate_education)
    jd_text = req.job_description or ("Looking for " + ", ".join(req.job_required_skills))
    dl_res = neural_embedding_engine.compute_semantic_match(cand_text, jd_text)

    # Hybrid score
    hybrid_score = round((rf_res["relevance_score"] * 0.5) + (dl_res["semantic_match_score"] * 0.5), 1)

    return {
        "hybrid_relevance_score": hybrid_score,
        "applied_ml_random_forest": rf_res,
        "deep_learning_sentence_bert": dl_res,
        "feature_attribution": rf_res["feature_importances"]
    }


@router.get("/clusters")
def cluster_candidate_cohorts(db: Session = Depends(get_db)):
    """
    Applies K-Means clustering across candidate profiles in the database
    to discover talent cohorts (Full-Stack, Data/AI, Cloud/DevOps).
    """
    candidates = db.query(CandidateProfile).all()
    if not candidates:
        return {"cohorts": []}

    vectors = []
    cand_info = []

    for c in candidates:
        skills = c.skills if isinstance(c.skills, list) else []
        feat = extract_candidate_features(
            candidate_skills=skills,
            job_required_skills=["Python", "React", "Docker", "SQL"],
            candidate_exp_years=c.experience_years or 2.0,
            job_min_exp_years=3.0,
            candidate_education=c.education or ""
        )
        vectors.append(feat)
        cand_info.append({
            "id": c.id,
            "name": c.user.full_name if (c.user and c.user.full_name) else "Candidate",
            "blind_id": c.blind_id,
            "headline": c.headline,
            "skills": skills[:5]
        })

    cluster_assignments = skill_cluster_engine.fit_and_cluster(np.array(vectors))

    grouped = {}
    for info, assign in zip(cand_info, cluster_assignments):
        cohort_name = assign["cohort_name"]
        if cohort_name not in grouped:
            grouped[cohort_name] = []
        info["cluster_id"] = assign["cluster_id"]
        grouped[cohort_name].append(info)

    cohort_list = [{"cohort_name": k, "candidate_count": len(v), "candidates": v} for k, v in grouped.items()]

    return {
        "algorithm": "K-Means Clustering (k=3)",
        "total_candidates": len(candidates),
        "cohorts": cohort_list
    }


class InterviewGenRequest(BaseModel):
    role: str = "Full-Stack Engineer"
    candidate_skills: List[str] = ["React", "JavaScript", "Python"]
    required_skills: List[str] = ["React", "FastAPI", "Docker", "PostgreSQL"]
    experience_years: float = 3.0
    difficulty: str = "medium"  # junior, medium, senior


@router.post("/generate-interview")
def generate_interview_questions(req: InterviewGenRequest):
    """
    Phase 11: Adaptive AI Interview Generator.
    Produces role-specific technical, architectural, and behavioral questions
    tailored to the candidate's verified skills and detected skill gaps.
    """
    cand_set = {s.lower().strip() for s in req.candidate_skills}
    missing = [s for s in req.required_skills if s.lower().strip() not in cand_set]
    matched = [s for s in req.required_skills if s.lower().strip() in cand_set]

    questions = []

    # 1. Technical Gap Questions
    for skill in missing[:2]:
        questions.append({
            "category": "Technical Skill Gap Assessment",
            "targeted_skill": skill,
            "difficulty": req.difficulty.capitalize(),
            "question": f"Our architecture for '{req.role}' depends on {skill}. How have you handled analogous problems in other stacks, and how would you approach adopting {skill}?",
            "ideal_answer_outline": f"Candidate explains foundational concepts related to {skill} and cites concrete learning strategies.",
            "red_flags": [f"Unsubstantiated claims of mastery in {skill}", "Dismissal of architectural necessity"]
        })

    # 2. Deep Dive on Matched Skills
    for skill in matched[:2]:
        questions.append({
            "category": "Deep Technical Competency Probe",
            "targeted_skill": skill,
            "difficulty": "Senior" if req.experience_years >= 4 else "Medium",
            "question": f"In your experience with {skill}, what was the most challenging production bug, latency spike, or scalability ceiling you resolved?",
            "ideal_answer_outline": f"Demonstrates rigorous debugging methodology, profiling tools, and structural mitigations in {skill}.",
            "red_flags": ["Surface-level syntax answers without operational context", "Blaming upstream tools without root-cause analysis"]
        })

    # 3. System Architecture / Scale Question
    questions.append({
        "category": "System Architecture & Trade-Offs",
        "targeted_skill": "Distributed Systems",
        "difficulty": "Senior" if req.experience_years >= 4 else "Medium",
        "question": f"For a system handling high-throughput traffic in {req.role}, how do you evaluate synchronous REST vs asynchronous message queues (e.g. Kafka/RabbitMQ)?",
        "ideal_answer_outline": "Candidate articulates decoupling, failure isolation, backpressure handling, and eventual consistency trade-offs.",
        "red_flags": ["Defaulting to synchronous REST for all workloads regardless of scale", "Ignoring idempotency and failure retries"]
    })

    # 4. Behavioral & Team Dynamics
    questions.append({
        "category": "Behavioral & Technical Disagreements",
        "targeted_skill": "Collaboration",
        "difficulty": "Medium",
        "question": "Describe a scenario where you disagreed with a colleague on a major architectural choice. How did you test alternatives and reach alignment?",
        "ideal_answer_outline": "Shows data-driven decision making (benchmarks, RFCs, proof-of-concepts) and constructive team alignment.",
        "red_flags": ["Rigid adherence to personal preference", "Escalating conflict without empirical evidence"]
    })

    return {
        "role": req.role,
        "difficulty_tier": req.difficulty,
        "matched_skills": matched,
        "missing_skills_targeted": missing,
        "total_questions": len(questions),
        "questions": questions
    }

