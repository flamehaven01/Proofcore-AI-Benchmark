# [VERIFIED] Minimal symbolic screening using SymPy.
from __future__ import annotations

from sympy import sympify

SYMBOLIC_CHARS = set("+-*/^=()")


def formal_check(step_text: str | None) -> bool:
    """
    Lightweight symbolic validation.

    If the step contains arithmetic symbols, attempt to ``sympify`` it. The
    function returns ``False`` when SymPy raises (indicative of malformed
    syntax) and ``True`` otherwise. Empty strings are treated as invalid steps.
    """
    if not step_text or not step_text.strip():
        return False

    text = step_text.strip()

    try:
        if any(ch in SYMBOLIC_CHARS for ch in text):
            sympify(text, evaluate=False)
        return True
    except Exception:
        return False
