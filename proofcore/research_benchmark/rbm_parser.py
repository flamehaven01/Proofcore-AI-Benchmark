# [HEURISTIC] <step> parser utility
from __future__ import annotations

import re
from typing import Iterable, List

STEP_PATTERN = re.compile(r"<step>(.*?)</step>", re.DOTALL)


def to_steps(source: str | Iterable[str] | None) -> List[str]:
    """
    Normalise step representations.

    - If ``source`` is already an iterable of strings, normalise whitespace.
    - If ``source`` is a string, extract ``<step>...</step>`` blocks.
    - If ``source`` is ``None`` or empty, return an empty list.
    """
    if source is None:
        return []

    if isinstance(source, str):
        if not source.strip():
            return []
        return [match.group(1).strip() for match in STEP_PATTERN.finditer(source)]

    steps: List[str] = []
    for item in source:
        if item is None:
            continue
        text = str(item).strip()
        if text:
            steps.append(text)
    return steps
