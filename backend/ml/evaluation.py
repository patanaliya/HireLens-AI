"""
HireLens AI - Model Evaluation & Ranking Metrics
Calculates standard classification metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
and Information Retrieval / Ranking metrics (Precision@K, Recall@K, NDCG@K).
"""

import math
import numpy as np
from typing import Dict, List, Any
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


def calculate_classification_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, Any]:
    """Calculate classification performance metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "sample_count": len(y_true)
    }


def calculate_precision_at_k(actual_relevance: List[int], predicted_scores: List[float], k: int = 3) -> float:
    """
    Precision@K: Fraction of top-K ranked candidates who are genuinely relevant.
    """
    if not actual_relevance or k <= 0:
        return 0.0

    # Sort items descending by predicted score
    ranked_indices = np.argsort(predicted_scores)[::-1]
    top_k_indices = ranked_indices[:k]

    relevant_in_top_k = sum(actual_relevance[i] for i in top_k_indices)
    return round(relevant_in_top_k / float(min(k, len(actual_relevance))), 4)


def calculate_ndcg_at_k(actual_relevance: List[int], predicted_scores: List[float], k: int = 3) -> float:
    """
    Normalized Discounted Cumulative Gain (NDCG@K):
    Measures ranking quality with higher weight given to relevant candidates ranked higher.
    Formula: DCG@K / IDCG@K where DCG@K = sum((2^rel - 1) / log2(rank + 1))
    """
    if not actual_relevance or k <= 0:
        return 0.0

    ranked_indices = np.argsort(predicted_scores)[::-1]
    top_k_indices = ranked_indices[:k]

    # Calculate DCG@K
    dcg = 0.0
    for rank_pos, idx in enumerate(top_k_indices):
        rel = actual_relevance[idx]
        dcg += (math.pow(2, rel) - 1.0) / math.log2(rank_pos + 2.0)

    # Calculate Ideal DCG@K (sorted by true relevance)
    ideal_sorted_rel = sorted(actual_relevance, reverse=True)[:k]
    idcg = 0.0
    for rank_pos, rel in enumerate(ideal_sorted_rel):
        idcg += (math.pow(2, rel) - 1.0) / math.log2(rank_pos + 2.0)

    if idcg == 0.0:
        return 1.0 if dcg == 0.0 else 0.0

    return round(dcg / idcg, 4)


def evaluate_model_pipeline(
    y_true: List[int],
    y_pred: List[int],
    predicted_probs: List[float],
    k: int = 3
) -> Dict[str, Any]:
    """Complete evaluation report for Applied ML and Deep Learning candidate ranking."""
    metrics = calculate_classification_metrics(y_true, y_pred)
    p_at_k = calculate_precision_at_k(y_true, predicted_probs, k=k)
    ndcg_at_k = calculate_ndcg_at_k(y_true, predicted_probs, k=k)

    metrics["precision_at_k"] = p_at_k
    metrics["ndcg_at_k"] = ndcg_at_k
    metrics["evaluated_k"] = k

    return metrics
