# ProofCore v1.0.3 – Research Benchmark Module Preview

**Release Date**: 2025-11-06  
**Status**: ✅ Production Ready  
**License**: MIT

---

## Overview

This release introduces the Research Benchmark Module (RBM) skeleton to ProofCore. RBM standardises step-level dataset ingestion, computer-assisted proof checks, evaluation metrics, and reporting so we can integrate internal corpora and public benchmarks (e.g., IMO-Bench) in a repeatable way. It also kicks off a broader plan to externalise Pyodide assets for security and performance.

---

## Highlights

### Research Benchmark Module (RBM)

- Added `proofcore/research_benchmark/` with loader/parser helpers, a cascade validator that leverages CA proof hooks, and the first metrics helpers (`balanced_scores`, `omega_rbm`).
- Delivered `rbm_cli` to run end-to-end evaluations and emit JSON reports; bundled `data_examples/sample_set.json` for smoke testing.
- Added Python regression suites in `backend/tests_rbm/` covering the CA proof hooks, cascade pipeline, metrics, and CLI execution.

### Pyodide Asset Pipeline

- Repository now ships with an empty `public/pyodide/` plus `pyodide-manifest.json`; assets are fetched on demand.
- Added `npm run setup:pyodide` (fetch) and `npm run verify:offline-assets` (manifest verification) to manage downloads safely.
- Hash verification is supported via manifest entries and should be enabled for production deployments.

### Next Steps

- Expand manifest generation to include Subresource Integrity hashes automatically.
- Integrate dependency scanning (npm audit, pip-audit, OSV) into CI for Pyodide bundles.
- Introduce Service Worker background caching to improve first-use latency.

### Documentation & Versioning

- CHANGELOG, README, and release notes updated to describe RBM usage and Pyodide asset strategy.
- Version bumped to **1.0.3** in `pyproject.toml`, `package.json`, and `setup.py`.

---

## Installation Notes

1. `npm install` (updates lockfile to 1.0.3).  
2. `python -m pytest backend/tests_rbm -q --no-cov` (verifies RBM stack).  
3. `npm run test -- tests/offline/offline_guarantee.test.ts` (ensures offline hardening remains intact).

---

## Known Issues / Follow Ups

- Manifest entries currently ship without hashes; add SRI/hash values before production deployment.
- Remaining npm audit warnings require larger upgrades (Vite/Vitest majors).

---

## Acknowledgements

Thanks to the ProofCore maintainers for laying the groundwork for research dataset integration and tightening our asset security posture.***
