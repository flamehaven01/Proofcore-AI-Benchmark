# [STANDARD] Numeric sanity guard using mpmath interval arithmetic.
from __future__ import annotations

from mpmath import iv

ALLOWED_TOKENS = set("0123456789+-*/(). ")


def numeric_sanity(expr: str | None) -> bool:
    """
    Perform a very coarse numeric sanity check.

    - Only guards expressions composed of digits and arithmetic operators.
    - Uses ``mpmath.iv`` interval evaluation on a dummy variable to detect
      blatant issues such as division by zero.
    """
    if expr is None:
        return True

    text = expr.strip()
    if not text:
        return True

    if any(ch not in ALLOWED_TOKENS for ch in text):
        # Ignore expressions with unknown symbols; symbolic hook will handle them.
        return True

    try:
        # Evaluate expression by binding x to [0, 0].
        # This detects undefined operations (e.g., division by zero).
        x = iv.mpf([0, 0])
        _ = eval(text, {"__builtins__": None}, {"x": x, "iv": iv})
        return True
    except Exception:
        return False
