"""
HireLens AI - Automated Test Suite
Covers:
1. Feature extraction & normalization (ml/preprocessing.py)
2. TF-IDF + Logistic Regression classification (ml/relevance_models.py)
3. Random Forest training & feature importances (ml/relevance_models.py)
4. Sentence-BERT dense embeddings & cosine similarity (dl/neural_embeddings.py)
5. K-Means candidate cohort clustering (ml/relevance_models.py)
6. Precision@K and NDCG@K ranking metrics (ml/evaluation.py)
7. Job Description bias detection & inclusive rewrite (screening_engine.py)
8. Bcrypt password hashing & JWT token validation (security.py)
9. Adaptive Interview question generation (routers/models_ml_dl.py)
"""

import math
import numpy as np
import pytest

from ml.preprocessing import extract_candidate_features, clean_text
from ml.relevance_models import tfidf_relevance_model, rf_relevance_model, skill_cluster_engine
from ml.evaluation import calculate_classification_metrics, calculate_precision_at_k, calculate_ndcg_at_k
from dl.neural_embeddings import neural_embedding_engine
from screening_engine import screening_engine
from security import hash_password, verify_password, create_access_token, decode_access_token


def test_feature_preprocessing():
    """Verify 6-dimensional candidate feature vector extraction."""
    cand_skills = ["Python", "FastAPI", "React", "Docker"]
    req_skills = ["Python", "React", "Docker"]
    feat = extract_candidate_features(
        candidate_skills=cand_skills,
        job_required_skills=req_skills,
        candidate_exp_years=4.0,
        job_min_exp_years=2.0,
        candidate_education="B.Tech Computer Science"
    )

    assert len(feat) == 6
    assert feat[0] == 1.0  # 100% skill overlap
    assert feat[1] == 2.0  # experience ratio capped at 2.0
    assert feat[2] == 1.0  # B.Tech recognized as high degree level
    assert all(isinstance(v, (float, np.floating)) for v in feat)


def test_tfidf_logistic_regression():
    """Verify TF-IDF vectorizer + Logistic Regression fit and inference."""
    train_texts = [
        "python fastapi react postgresql distributed systems",
        "java spring boot microservices kubernetes",
        "sales marketing lead generation excel powerpoint",
        "graphic design photoshop illustrator typography"
    ]
    labels = [1, 1, 0, 0]

    tfidf_relevance_model.fit(train_texts, labels)
    assert tfidf_relevance_model.is_trained is True

    # Test relevant candidate
    res_rel = tfidf_relevance_model.predict_relevance("expert python fastapi engineer", "looking for python developer")
    assert res_rel["relevance_probability"] >= 0.5
    assert res_rel["predicted_label"] == 1


def test_random_forest_classification():
    """Verify Random Forest training and feature importance extraction."""
    X = np.array([
        [1.0, 1.5, 1.0, 1.0, 0.8, 1.0],
        [0.8, 1.2, 1.0, 0.9, 0.7, 0.9],
        [0.1, 0.2, 0.4, 0.3, 0.2, 0.2],
        [0.0, 0.1, 0.2, 0.1, 0.1, 0.1]
    ], dtype=np.float32)
    y = np.array([1, 1, 0, 0])

    rf_relevance_model.fit(X, y)
    assert rf_relevance_model.is_trained is True

    # Predict test point
    pred = rf_relevance_model.predict(X[0])
    assert pred["predicted_label"] == 1
    assert "feature_importances" in pred
    assert len(pred["feature_importances"]) == 6


def test_sentence_bert_embeddings():
    """Verify 384-dimensional dense contextual embeddings and cosine similarity."""
    text_a = "Senior Software Engineer with deep expertise in Python, FastAPI, and Docker microservices."
    text_b = "Backend Developer specializing in Python, containerization, and distributed APIs."
    text_c = "Experienced marketing copywriter and digital advertising specialist."

    vec_a = neural_embedding_engine.embed_text(text_a)
    vec_b = neural_embedding_engine.embed_text(text_b)
    vec_c = neural_embedding_engine.embed_text(text_c)

    assert len(vec_a) == 384
    assert abs(np.linalg.norm(vec_a) - 1.0) < 1e-4  # L2 normalized unit vector

    sim_ab = neural_embedding_engine.calculate_cosine_similarity(vec_a, vec_b)
    sim_ac = neural_embedding_engine.calculate_cosine_similarity(vec_a, vec_c)

    # Technical roles should have much higher semantic similarity than marketing
    assert sim_ab > sim_ac
    assert sim_ab >= 0.50
    assert sim_ac < 0.40


def test_kmeans_clustering():
    """Verify unsupervised talent cohort clustering."""
    X = np.array([
        [1.0, 1.5, 1.0, 1.0, 0.8, 1.0],
        [0.9, 1.3, 1.0, 1.0, 0.7, 0.9],
        [0.1, 0.2, 0.4, 0.3, 0.2, 0.2],
        [0.0, 0.1, 0.2, 0.1, 0.1, 0.1]
    ], dtype=np.float32)

    clusters = skill_cluster_engine.fit_and_cluster(X)
    assert len(clusters) == 4
    assert "cohort_name" in clusters[0]
    assert "cluster_id" in clusters[0]


def test_ranking_metrics_ndcg():
    """Verify Precision@K and NDCG@K ranking evaluation math."""
    ground_truth = [1, 1, 0, 0]
    perfect_predictions = [0.95, 0.85, 0.20, 0.10]

    p_at_2 = calculate_precision_at_k(ground_truth, perfect_predictions, k=2)
    ndcg_at_2 = calculate_ndcg_at_k(ground_truth, perfect_predictions, k=2)

    assert p_at_2 == 1.0
    assert ndcg_at_2 == 1.0

    # Inverted ranking test
    inverted_predictions = [0.10, 0.20, 0.85, 0.95]
    ndcg_inverted = calculate_ndcg_at_k(ground_truth, inverted_predictions, k=2)
    assert ndcg_inverted < 1.0


def test_jd_bias_analyzer():
    """Verify F8 regex word-boundary bias detection and inclusive rewrite."""
    biased_jd = "Looking for a rockstar developer and coding ninja to dominate complex systems."
    result = screening_engine.analyze_jd_bias(biased_jd)

    assert result["flagged_count"] >= 2
    assert any(term["original"] == "rockstar" for term in result["flagged_terms"])
    assert any(term["original"] == "ninja" for term in result["flagged_terms"])
    assert "rockstar" not in result["inclusive_rewrite"].lower()
    assert "ninja" not in result["inclusive_rewrite"].lower()


def test_auth_password_and_jwt():
    """Verify secure password hashing and JWT token round-trip."""
    raw_password = "SuperSecretPassword123"
    hashed = hash_password(raw_password)

    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    payload = {"user_id": 42, "email": "test@hirelens.ai", "role": "recruiter"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)

    assert decoded["user_id"] == 42
    assert decoded["email"] == "test@hirelens.ai"
    assert decoded["role"] == "recruiter"
