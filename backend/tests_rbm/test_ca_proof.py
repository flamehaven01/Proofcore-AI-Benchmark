import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from proofcore.research_benchmark.ca_proof import (
    formal_check,
    numeric_sanity,
    passes_assumption_guard,
)


def test_formal_check_valid_expression():
    assert formal_check("x^2 + 2*x + 1") is True


def test_formal_check_rejects_invalid_expression():
    assert formal_check("x^2 + ") is False


def test_numeric_sanity_with_safe_expression():
    assert numeric_sanity("4 / (2 + 2)") is True


def test_numeric_sanity_detects_invalid_operation():
    assert numeric_sanity("1 / 0") is False


def test_assumption_guard_blocks_banned_phrase():
    assert passes_assumption_guard("WLOG, assume x > 0") is False


def test_assumption_guard_allows_regular_text():
    assert passes_assumption_guard("Assume x > 0 for contradiction.") is True
