#!/usr/bin/env node
/**
 * Offline asset sanity check driven by pyodide-manifest.json.
 *
 * Validates that every entry in the manifest exists locally and (if hashes are
 * provided) that the hash matches. Mirrors the logic used by
 * fetch-pyodide-assets.mjs to keep expectations aligned.
 */

import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

const args = process.argv.slice(2);
let manifestPath = "pyodide-manifest.json";
let destDir = path.join(ROOT, "public", "pyodide");

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--manifest" && args[i + 1]) {
    manifestPath = args[++i];
  } else if (arg === "--dest" && args[i + 1]) {
    destDir = args[++i];
  } else if (arg === "--help") {
    printHelp();
    process.exit(0);
  }
}

const manifestFullPath = path.resolve(manifestPath);
if (!fs.existsSync(manifestFullPath)) {
  console.error(`[OFFLINE CHECK] Manifest not found: ${manifestFullPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFullPath, "utf8"));
const files = manifest.files || [];
if (!Array.isArray(files)) {
  console.error("[OFFLINE CHECK] Manifest `files` must be an array.");
  process.exit(1);
}

let failures = 0;
for (const entry of files) {
  const relPath = entry.path || path.basename(entry.url || "");
  if (!relPath) {
    console.warn("[OFFLINE CHECK] Skipping entry without path/url:", entry);
    continue;
  }
  const filePath = path.join(destDir, relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`[OFFLINE CHECK] Missing file: ${filePath}`);
    failures++;
    continue;
  }
  if (!verifyFile(filePath, entry)) {
    console.error(`[OFFLINE CHECK] Hash mismatch: ${filePath}`);
    failures++;
  }
}

if (files.length === 0) {
  console.warn("[OFFLINE CHECK] Manifest contains no files; nothing to verify.");
} else if (failures === 0) {
  console.log("[OFFLINE CHECK] All required offline assets are present.");
} else {
  console.error(`[OFFLINE CHECK] ${failures} issue(s) detected.`);
  process.exitCode = 1;
}

function verifyFile(filePath, entry) {
  const hashes = normaliseHashes(entry);
  if (Object.keys(hashes).length === 0) {
    return true;
  }
  const data = fs.readFileSync(filePath);
  for (const [algorithm, expected] of Object.entries(hashes)) {
    const actual = createHash(algorithm).update(data).digest("hex");
    if (actual !== expected.toLowerCase()) {
      console.warn(`[OFFLINE CHECK] ${algorithm} mismatch for ${filePath}`);
      return false;
    }
  }
  return true;
}

function normaliseHashes(entry) {
  const result = {};
  if (entry.integrity && typeof entry.integrity === "string") {
    const parts = entry.integrity.split("-");
    if (parts.length === 2) {
      const algorithm = parts[0].toLowerCase();
      const buffer = Buffer.from(parts[1], "base64");
      result[algorithm] = buffer.toString("hex");
    }
  }
  for (const algo of ["sha512", "sha384", "sha256"]) {
    if (entry[algo]) {
      result[algo] = entry[algo];
    }
  }
  return result;
}

function printHelp() {
  console.log(`Usage: node scripts/verify-offline-assets.mjs [options]

Options:
  --manifest <path>   Path to pyodide-manifest.json (default: ./pyodide-manifest.json)
  --dest <dir>        Directory where assets are stored (default: ./public/pyodide)
  --help              Show this help message`);
}
