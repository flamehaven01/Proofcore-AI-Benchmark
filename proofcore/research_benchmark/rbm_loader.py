# [STANDARD] Minimal JSON loading and schema check
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def load_rbm_set(path: str | Path) -> Dict[str, Any]:
    """
    Load a Research Benchmark dataset from JSON.

    The file is expected to contain a top-level ``samples`` array. The content
    will be returned verbatim so downstream hooks (parsers, metrics) can
    iterate without additional transformations.
    """
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))

    if not isinstance(data, dict):
        raise ValueError("Research benchmark file must decode to a JSON object")

    samples = data.get("samples")
    if not isinstance(samples, list):
        raise ValueError("Research benchmark file must contain samples[]")

    return data
