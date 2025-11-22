#!/usr/bin/env node
/**
 * Fetch Pyodide assets defined in a manifest file.
 *
 * Downloads each entry in pyodide-manifest.json (or a custom path) and writes
 * it under the destination directory (default: public/pyodide). Optional hash
 * values are verified when provided.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import https from "node:https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let manifestPath = "pyodide-manifest.json";
let destDir = path.join(__dirname, "..", "public", "pyodide");
let overwrite = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--manifest" && args[i + 1]) {
    manifestPath = args[++i];
  } else if (arg === "--dest" && args[i + 1]) {
    destDir = args[++i];
  } else if (arg === "--overwrite") {
    overwrite = true;
  } else if (arg === "--help") {
    printHelp();
    process.exit(0);
  }
}

const manifestFullPath = path.resolve(manifestPath);
if (!fs.existsSync(manifestFullPath)) {
  console.error(`[fetch-pyodide-assets] Manifest not found: ${manifestFullPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFullPath, "utf8"));
const files = manifest.files || [];
if (!Array.isArray(files)) {
  console.error("[fetch-pyodide-assets] Manifest `files` must be an array");
  process.exit(1);
}

if (files.length === 0) {
  console.log("[fetch-pyodide-assets] Manifest contains no files; nothing to download.");
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

const baseUrl = manifest.base_url || manifest.baseUrl || "";
if (!baseUrl) {
  console.error("[fetch-pyodide-assets] Manifest missing `base_url`.");
  process.exit(1);
}

async function downloadFile(entry) {
  const url = entry.url || `${baseUrl}${entry.path}`;
  if (!url) {
    throw new Error(`Entry missing url/path: ${JSON.stringify(entry)}`);
  }

  const targetPath = path.join(destDir, entry.path || path.basename(url));
  const targetDir = path.dirname(targetPath);
  fs.mkdirSync(targetDir, { recursive: true });

  if (!overwrite && fs.existsSync(targetPath)) {
    const valid = await verifyFile(targetPath, entry);
    if (valid) {
      console.log(`[fetch-pyodide-assets] Skipping existing file: ${entry.path}`);
      return;
    }
    console.warn(`[fetch-pyodide-assets] Existing file failed integrity check; redownloading: ${entry.path}`);
  }

  console.log(`[fetch-pyodide-assets] Downloading ${url}`);
  await new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Request failed with status ${res.statusCode} (${url})`));
        return;
      }
      const fileStream = fs.createWriteStream(targetPath);
      pipeline(res, fileStream)
        .then(resolve)
        .catch(reject);
    });
    request.on("error", reject);
  });

  const valid = await verifyFile(targetPath, entry);
  if (!valid) {
    throw new Error(`Integrity verification failed for ${entry.path}`);
  }
}

async function verifyFile(filePath, entry) {
  const hashes = normaliseHashes(entry);
  if (Object.keys(hashes).length === 0) {
    return true;
  }

  const data = await fs.promises.readFile(filePath);
  for (const [algorithm, expected] of Object.entries(hashes)) {
    const actual = createHash(algorithm).update(data).digest("hex");
    if (actual !== expected.toLowerCase()) {
      console.warn(`[fetch-pyodide-assets] Hash mismatch (${algorithm}): expected ${expected}, got ${actual}`);
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

async function main() {
  for (const entry of files) {
    await downloadFile(entry);
  }
  console.log("[fetch-pyodide-assets] Completed.");
}

function printHelp() {
  console.log(`Usage: node scripts/fetch-pyodide-assets.mjs [options]

Options:
  --manifest <path>   Path to pyodide-manifest.json (default: ./pyodide-manifest.json)
  --dest <dir>        Destination directory (default: ./public/pyodide)
  --overwrite         Redownload files even if they already exist
  --help              Show this help message`);
}

main().catch((err) => {
  console.error("[fetch-pyodide-assets] Error:", err.message);
  process.exit(1);
});
