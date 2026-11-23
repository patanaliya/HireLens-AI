"""
HireLens AI - ML Feature Preprocessing & Vectorization
Extracts normalized numerical feature vectors and structured tabular matrices
for training and evaluating candidate relevance models.
"""

import re
import numpy as np
from typing import Dict, List, Any, Tuple


STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
    "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
    "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
    "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
    "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
    "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself"
}


def clean_text(text: str) -> str:
    """Normalize text by lowercasing and stripping non-alphanumeric noise."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\.\+\#\-]", " ", text)
    tokens = [w for w in text.split() if w not in STOP_WORDS and len(w) > 1]
    return " ".join(tokens)


def extract_candidate_features(
    candidate_skills: List[str],
    job_required_skills: List[str],
    candidate_exp_years: float,
    job_min_exp_years: float,
    candidate_education: str = "",
    growth_score: float = 75.0,
    project_count: int = 2
) -> np.ndarray:
    """
    Constructs a calibrated 6-dimensional feature vector for candidate ranking:
    1. Skill overlap ratio (0.0 to 1.0)
    2. Normalized experience ratio (min(exp / required, 2.0))
    3. Education match score (1.0 for degree, 0.5 for diploma, 0.0 otherwise)
    4. Project density factor (min(project_count / 3.0, 1.5))
    5. Growth potential index (0.0 to 1.0)
    6. Skill count normalized (min(len(skills) / 10.0, 1.5))
    """
    cand_skills_lower = {s.lower().strip() for s in (candidate_skills or [])}
    req_skills_lower = {s.lower().strip() for s in (job_required_skills or [])}

    if req_skills_lower:
        overlap = len(cand_skills_lower.intersection(req_skills_lower))
        skill_ratio = overlap / float(len(req_skills_lower))
    else:
        skill_ratio = 1.0 if cand_skills_lower else 0.5

    # Experience Ratio
    if job_min_exp_years > 0:
        exp_ratio = min(2.0, (candidate_exp_years or 0.0) / float(job_min_exp_years))
    else:
        exp_ratio = 1.0

    # Education Match
    edu_lower = (candidate_education or "").lower()
    if any(deg in edu_lower for deg in ["b.tech", "m.tech", "b.s", "m.s", "bachelor", "master", "ph.d"]):
        edu_score = 1.0
    elif any(deg in edu_lower for deg in ["diploma", "associate"]):
        edu_score = 0.6
    else:
        edu_score = 0.4

    proj_density = min(1.5, max(0.5, project_count / 3.0))
    growth_idx = min(1.0, max(0.0, growth_score / 100.0))
    skill_density = min(1.5, len(cand_skills_lower) / 10.0)

    return np.array([
        round(skill_ratio, 4),
        round(exp_ratio, 4),
        round(edu_score, 4),
        round(proj_density, 4),
        round(growth_idx, 4),
        round(skill_density, 4)
    ], dtype=np.float32)


FEATURE_NAMES = [
    "Skill Overlap Ratio",
    "Experience Requirement Ratio",
    "Education Qualification Level",
    "Project Density Factor",
    "Growth & Learning Index",
    "Total Skill Portfolio Density"
]
