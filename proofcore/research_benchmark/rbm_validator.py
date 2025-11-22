from __future__ import annotations

from typing import Any, Dict, List, Mapping, Sequence, Tuple

from .ca_proof import formal_check, numeric_sanity, passes_assumption_guard
from .rbm_parser import to_steps


def _normalise_steps(steps: Sequence[Any] | Any | None) -> Tuple[List[str], List[Any]]:
    if steps is None:
        return [], []

    if isinstance(steps, (str, bytes)):
        normalised = to_steps(steps)
        return normalised, [None] * len(normalised)

    texts: List[str] = []
    expected: List[Any] = []
    for entry in steps:
        if isinstance(entry, Mapping):
            texts.append(str(entry.get("text", "")).strip())
            expected.append(entry.get("expected"))
        else:
            texts.append(str(entry).strip())
            expected.append(None)
    texts = [text for text in texts if text]
    if len(expected) != len(texts):
        expected = expected[: len(texts)] + [None] * max(0, len(texts) - len(expected))
    return texts, expected


def verify_steps_cascade(steps: Sequence[Any] | Any | None) -> List[Dict[str, object]]:
    texts, expected = _normalise_steps(steps)
    results: List[Dict[str, object]] = []

    for idx, step in enumerate(texts):
        step_formal = formal_check(step)
        step_numeric = numeric_sanity(step)
        step_assumption = passes_assumption_guard(step)
        record: Dict[str, object] = {
            "step": step,
            "formal": step_formal,
            "numeric": step_numeric,
            "assumption": step_assumption,
            "valid": step_formal and step_numeric and step_assumption,
        }
        if idx < len(expected) and expected[idx] is not None:
            record["expected"] = bool(expected[idx])
        results.append(record)

    return results


def evaluate_sample(sample: Mapping[str, Any]) -> Dict[str, object]:
    steps = sample.get("steps", [])
    cascaded = verify_steps_cascade(steps)

    paired = [
        (entry["valid"], bool(entry["expected"]))
        for entry in cascaded
        if "expected" in entry
    ]
    predictions = [pair[0] for pair in paired]
    targets = [pair[1] for pair in paired]

    return {
        "id": sample.get("id"),
        "steps": cascaded,
        "predictions": predictions,
        "targets": targets,
    }


def evaluate_dataset(dataset: Mapping[str, Any]) -> Dict[str, object]:
    sample_results = []
    all_predictions: List[bool] = []
    all_targets: List[bool] = []

    for sample in dataset.get("samples", []):
        evaluation = evaluate_sample(sample)
        sample_results.append(evaluation)
        all_predictions.extend(evaluation["predictions"])
        all_targets.extend(evaluation["targets"])

    return {
        "samples": sample_results,
        "predictions": all_predictions,
        "targets": all_targets,
    }
