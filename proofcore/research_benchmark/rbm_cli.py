from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .rbm_loader import load_rbm_set
from .rbm_validator import evaluate_dataset
from .rbm_metrics import balanced_scores, omega_rbm


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Research Benchmark Module CLI")
    parser.add_argument(
        "--dataset",
        required=True,
        type=Path,
        help="Path to an RBM dataset JSON file",
    )
    return parser


def run(dataset_path: Path) -> dict[str, object]:
    dataset = load_rbm_set(dataset_path)
    evaluation = evaluate_dataset(dataset)

    predictions = evaluation["predictions"]
    targets = evaluation["targets"]
    metrics = {}
    if predictions and targets:
        metrics = balanced_scores(predictions, targets)
        metrics["omega"] = omega_rbm(predictions, targets)

    return {
        "metadata": dataset.get("metadata", {}),
        "metrics": metrics,
        "samples": evaluation["samples"],
    }


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    report = run(args.dataset)
    json.dump(report, fp=sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
