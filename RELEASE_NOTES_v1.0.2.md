# ProofCore v1.0.2 – Maintenance Update

**Release Date**: 2025-11-04  
**Status**: ✅ Production Ready  
**License**: MIT

---

## Overview

This maintenance refresh for ProofCore v1.0.2 reinforces the offline-first contract, aligns configuration defaults across frontend and backend, and refreshes key dependencies to address recent advisories. No breaking API changes were introduced; existing 1.0.x deployments can adopt this update without migration steps beyond vendoring Pyodide assets.

---

## Highlights

### Offline Mode Hardening

- `VITE_OFFLINE_MODE` now defaults to `true`, with bundled verification weights used when the backend is absent.
- All browser API calls route through the `safeFetch` gate, which blocks network traffic unless `VITE_ALLOW_NETWORK=true`.
- Backend exposes `OFFLINE_MODE` and `ENABLE_LLM_PROVIDERS` toggles; the LLM adapter refuses to initialize remote providers when offline mode is enabled.
- Offline Vitest suite exercises the actual network guard instead of mocks, preventing regressions.

### Pyodide Bundling Support

- Added `pyodide` dependency declaration plus `npm run verify:offline-assets` to confirm required WASM artifacts (`pyodide.js`, `packages.json`, 그리고 `pyodide_py.tar` 또는 `python_stdlib.zip`) are vendored under `public/pyodide/`.
- `public/pyodide/README.md` documents the manual download workflow for air-gapped deployments.

### Research Benchmark Module (RBM)

- Introduced `proofcore/research_benchmark` skeleton with loader/parser, cascade validator, and metrics helpers.
- Added `rbm_cli` for report generation plus `data_examples/sample_set.json` for quick smoke tests.
- Python regression tests (`backend/tests_rbm`) cover hooks, metrics, and CLI execution.

### Dependency Refresh

- Upgraded to `vite@5.4.x`, `esbuild@0.25.x`, `@mswjs/data@0.16.x`, and `msw@2.4.x`, clearing previously reported low/moderate CVEs in the stack.
- Remaining advisories require major upgrades to Vite/Vitest and are slated for a future release.

### Documentation & Metadata

- `.env.example`, backend `.env.example`, and packaging metadata (`package.json`, `pyproject.toml`, `setup.py`) now report version **1.0.2** and describe the new offline toggles.
- README adds an explicit offline mode section, Pyodide vendoring instructions, and the offline asset verification command.
- CHANGELOG updated to capture the maintenance scope.

---

## Installation Notes

1. `npm install` – installs refreshed dependencies.
2. `npm run verify:offline-assets` – confirms Pyodide bundles are present (requires manual download, see README).
3. `npm run test` – Vitest suite (including offline guard cases).

---

## Known Issues / Follow Ups

- Remaining `npm audit` warnings: upgrading to Vite 7.x / Vitest 4.x will be evaluated separately.
- Pyodide assets still require manual download due to licensing and size considerations.

---

## Acknowledgements

Thanks to the ProofCore maintainers for prioritising offline robustness and secure defaults in this iteration.
