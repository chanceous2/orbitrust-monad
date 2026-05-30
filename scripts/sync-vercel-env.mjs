#!/usr/bin/env node
/**
 * Syncs selected keys from .env to Vercel (production + preview).
 * Usage: node scripts/sync-vercel-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const PROD_URL = process.env.VERCEL_PROD_URL || "https://trust.orbi.tienda";

const SKIP = new Set([
  "PRIVATE_KEY",
  "TENANT_STORE_PATH",
  "ORDER_STORE_PATH",
]);

const OVERRIDE = {
  BETTER_AUTH_URL: PROD_URL,
  NEXT_PUBLIC_APP_URL: PROD_URL,
};

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) out[key] = val;
  }
  return out;
}

function add(key, value, target) {
  const r = spawnSync(
    "npx",
    ["vercel", "env", "add", key, target, "--yes", "--value", value, "--force"],
    { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  );
  const msg = (r.stdout || r.stderr || "").trim().split("\n").pop();
  if (r.status !== 0 && !/already exists|Overwriting/i.test(r.stdout + r.stderr)) {
    console.error(`FAIL ${key}@${target}: ${msg || r.status}`);
    return false;
  }
  console.log(`OK ${key} → ${target}`);
  return true;
}

const vars = parseEnvFile(envPath);
if (!Object.keys(vars).length) {
  console.error("No .env found or empty");
  process.exit(1);
}

if (!vars.NEXT_PUBLIC_APP_URL) vars.NEXT_PUBLIC_APP_URL = PROD_URL;

let ok = true;
for (const target of ["production", "preview"]) {
  for (const [key, raw] of Object.entries(vars)) {
    if (SKIP.has(key)) continue;
    const value = OVERRIDE[key] ?? raw;
    if (!add(key, value, target)) ok = false;
  }
}

process.exit(ok ? 0 : 1);
