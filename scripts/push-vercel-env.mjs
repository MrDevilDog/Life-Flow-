/**
 * Push variables from .env.vercel to Vercel (production, preview, development).
 * Copy .env.example → .env.vercel, fill a public cloud MySQL (never localhost), then:
 *   npm run vercel:env:push
 *
 * Optional: VERCEL_SCOPE=your-team-slug if the CLI asks for a team in CI.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envFile = path.join(root, ".env.vercel");

function resolveVercelScope() {
  const fromEnv = process.env.VERCEL_SCOPE?.trim();
  if (fromEnv) return fromEnv;
  try {
    const linkPath = path.join(root, ".vercel", "project.json");
    const j = JSON.parse(fs.readFileSync(linkPath, "utf8"));
    if (j.orgId && String(j.orgId).startsWith("team_")) return j.orgId;
  } catch {
    /* no link */
  }
  return "";
}

const KEYS = [
  "DATABASE_URL",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_CONNECTION_LIMIT",
  "DB_SSL",
  "DB_SSL_REJECT_UNAUTHORIZED",
  "JWT_SECRET",
  "JWT_ISSUER",
  "JWT_EXPIRES_IN",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "NEXT_PUBLIC_APP_URL",
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function isLocalHost(host) {
  if (!host) return false;
  const h = String(host).toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.endsWith(".local")
  );
}

function mysqlUrlHost(url) {
  try {
    const n = url.trim().replace(/^mysql:\/\//i, "http://");
    return new URL(n).hostname || null;
  } catch {
    return null;
  }
}

function runVercelEnvAdd(key, target, value) {
  const sensitive =
    /SECRET|PASSWORD|DATABASE_URL|SMTP_PASS/i.test(key) ||
    key === "DB_PASSWORD" ||
    key === "SMTP_PASS";
  const args = [
    "vercel",
    "env",
    "add",
    key,
    target,
    "--value",
    value,
    "--yes",
    "--force",
  ];
  if (sensitive) args.push("--sensitive");
  const scope = resolveVercelScope();
  if (scope) args.push("--scope", scope);

  const isWin = process.platform === "win32";
  const res = spawnSync(isWin ? "npx.cmd" : "npx", args, {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
    env: { ...process.env },
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

if (!fs.existsSync(envFile)) {
  console.error(
    "Missing .env.vercel — copy .env.example to .env.vercel and set a public cloud MySQL (Railway, Aiven, etc.). Never use localhost for production.",
  );
  process.exit(1);
}

const parsed = parseEnv(fs.readFileSync(envFile, "utf8"));

const dbUrl = parsed.DATABASE_URL?.trim();
if (dbUrl) {
  const h = mysqlUrlHost(dbUrl);
  if (h && isLocalHost(h)) {
    console.error(
      "DATABASE_URL must not point to localhost. Use a public MySQL host from Railway / Aiven / your provider.",
    );
    process.exit(1);
  }
} else {
  const discrete =
    parsed.DB_HOST &&
    parsed.DB_USER &&
    parsed.DB_PASSWORD &&
    parsed.DB_NAME;
  if (!discrete) {
    console.error(
      "Set DATABASE_URL or all of DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env.vercel",
    );
    process.exit(1);
  }
  if (isLocalHost(parsed.DB_HOST)) {
    console.error(
      "DB_HOST cannot be localhost for Vercel. Provision cloud MySQL and use its public hostname.",
    );
    process.exit(1);
  }
}

if (!parsed.JWT_SECRET?.trim() || parsed.JWT_SECRET.trim().length < 16) {
  console.error(
    "JWT_SECRET in .env.vercel must be set and at least 16 characters.",
  );
  process.exit(1);
}

const targets = ["production", "preview", "development"];

console.log("Pushing env to Vercel for:", targets.join(", "));
for (const target of targets) {
  for (const key of KEYS) {
    const value = parsed[key];
    if (value === undefined || value === "") continue;
    console.log(`  ${key} → ${target}`);
    runVercelEnvAdd(key, target, value);
  }
}

console.log("\nDone. Redeploy: npm run vercel:deploy");
