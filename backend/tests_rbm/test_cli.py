import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def test_cli_generates_report():
    dataset = ROOT / "proofcore" / "research_benchmark" / "data_examples" / "sample_set.json"
    result = subprocess.run(
        [sys.executable, "-m", "proofcore.research_benchmark.rbm_cli", "--dataset", str(dataset)],
        capture_output=True,
        text=True,
        check=True,
    )
    payload = json.loads(result.stdout)
    assert "metrics" in payload
    assert payload["metrics"].get("omega", 0.0) >= 0.0
