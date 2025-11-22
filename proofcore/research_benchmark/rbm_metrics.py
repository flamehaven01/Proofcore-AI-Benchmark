# [STANDARD] Basic metrics for RBM evaluations.
from __future__ import annotations

from typing import Sequence


def balanced_scores(predictions: Sequence[bool], targets: Sequence[bool]) -> dict[str, float]:
    if len(predictions) != len(targets):
        raise ValueError("Predictions and targets must have the same length")

    tp = tn = fp = fn = 0
    for pred, target in zip(predictions, targets):
        if pred and target:
            tp += 1
        elif pred and not target:
            fp += 1
        elif not pred and target:
            fn += 1
        else:
            tn += 1

    def safe_div(n: float, d: float) -> float:
        return n / d if d else 0.0

    tpr = safe_div(tp, tp + fn)  # recall / sensitivity
    tnr = safe_div(tn, tn + fp)  # specificity
    precision = safe_div(tp, tp + fp)
    recall = tpr
    f1 = safe_div(2 * precision * recall, precision + recall) if precision or recall else 0.0

    return {
        "tp": float(tp),
        "tn": float(tn),
        "fp": float(fp),
        "fn": float(fn),
        "tpr": tpr,
        "tnr": tnr,
        "balanced_accuracy": (tpr + tnr) / 2,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def omega_rbm(predictions: Sequence[bool], targets: Sequence[bool]) -> float:
    """
    Aggregate RBM performance into a single Ω score.

    For the initial implementation we map Ω to the balanced accuracy. Future
    revisions can incorporate SR9/DI2 specific adjustments without changing
    the function contract.
    """
    metrics = balanced_scores(predictions, targets)
    return metrics["balanced_accuracy"]
