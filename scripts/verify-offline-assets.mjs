#!/usr/bin/env node

/**
 * Offline asset sanity check.
 *
 * Ensures required bundles (Pyodide, WASM artifacts) exist locally
 * so the app can run without network access.
 */

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');
const runtimePath = resolve(ROOT, 'public', 'pyodide', 'pyodide.js');
const packagesPath = resolve(ROOT, 'public', 'pyodide', 'packages.json');

const stdlibCandidates = [
  resolve(ROOT, 'public', 'pyodide', 'pyodide_py.tar'),
  resolve(ROOT, 'public', 'pyodide', 'python_stdlib.zip')
];

const missing = [];

if (!existsSync(runtimePath)) {
  missing.push(runtimePath);
}

if (!stdlibCandidates.some(existsSync)) {
  missing.push(`${resolve(ROOT, 'public', 'pyodide')}\\(pyodide_py.tar|python_stdlib.zip)`);
}

if (!existsSync(packagesPath)) {
  missing.push(packagesPath);
}

if (missing.length > 0) {
  console.error('[OFFLINE CHECK] Missing assets:');
  for (const entry of missing) {
    console.error(`  - ${entry}`);
  }
  console.error('');
  console.error('Run `npm run setup:pyodide` (see README) to download and vendor Pyodide assets.');
  process.exitCode = 1;
} else {
  console.log('[OFFLINE CHECK] All required offline assets are present.');
}
