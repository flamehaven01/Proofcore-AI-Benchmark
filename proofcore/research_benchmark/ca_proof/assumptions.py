# [HEURISTIC] Assumption guard for prohibited phrases.
from __future__ import annotations

BANNED_PHRASES = (
    "wlog",
    "without loss of generality",
    "obviously true",
    "trivial by inspection",
)


def passes_assumption_guard(step_text: str | None) -> bool:
    """
    Reject steps that rely on vague or disallowed assumptions.

    The heuristic scans for known banned phrases. This is intentionally simple
    so that downstream modules can supply richer rule sets.
    """
    if not step_text:
        return True

    lower = step_text.lower()
    return not any(phrase in lower for phrase in BANNED_PHRASES)
