// Environment variables with safe loading and validation
// Only runs on server-side

// Check if we're on server side
const isServer = typeof window === 'undefined';

function readEnv(key: string): string {
  if (!isServer) {
    return ''; // Don't expose env vars on client side
  }
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : "";
}

function readEnvNumber(key: string, fallback: number): number {
  if (!isServer) {
    return fallback;
  }
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

// IMPORTANT:
// Do NOT snapshot process.env at module load time.
// Next.js dev servers (Turbopack) may start before env is fully populated.
// These getters always read the latest process.env values.
export const env = {
  get DB_HOST() {
    return readEnv("DB_HOST") || "localhost";
  },
  get DB_PORT() {
    return readEnvNumber("DB_PORT", 5432);
  },
  get DB_USER() {
    return readEnv("DB_USER");
  },
  get DB_PASSWORD() {
    return readEnv("DB_PASSWORD");
  },
  get DB_NAME() {
    return readEnv("DB_NAME") || "neondb";
  },
  get DB_CONNECTION_LIMIT() {
    return readEnvNumber("DB_CONNECTION_LIMIT", 10);
  },
  /** Full PostgreSQL URL (e.g. Neon). When set, DB_HOST/DB_USER/DB_PASSWORD/DB_NAME are optional. */
  get DATABASE_URL() {
    return readEnv("DATABASE_URL");
  },
  get JWT_SECRET() {
    return readEnv("JWT_SECRET");
  },
  get JWT_ISSUER() {
    return readEnv("JWT_ISSUER") || "blood-donation-app";
  },
  get JWT_EXPIRES_IN() {
    return readEnv("JWT_EXPIRES_IN") || "7d";
  },
  get NODE_ENV() {
    return readEnv("NODE_ENV") || "development";
  },
  // Email configuration
  get SMTP_HOST() {
    return readEnv("SMTP_HOST") || "smtp.gmail.com";
  },
  get SMTP_PORT() {
    return readEnvNumber("SMTP_PORT", 587);
  },
  get SMTP_USER() {
    return readEnv("SMTP_USER");
  },
  get SMTP_PASS() {
    return readEnv("SMTP_PASS");
  },
  // SMS configuration (optional)
  get SMS_API_KEY() {
    return readEnv("SMS_API_KEY");
  },
  get SMS_API_URL() {
    return readEnv("SMS_API_URL");
  },
} as const;

function databaseUrlHostname(url: string): string | null {
  try {
    const normalized = url
      .trim()
      .replace(/^postgresql:\/\//i, "http://")
      .replace(/^postgres:\/\//i, "http://");
    const u = new URL(normalized);
    return u.hostname || null;
  } catch {
    return null;
  }
}

function isLocalDbHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.endsWith(".local")
  );
}

function isVercelRuntime(): boolean {
  return readEnv("VERCEL") === "1";
}

export function assertEnv() {
  // Only validate on server side
  if (!isServer) {
    return;
  }

  if (!readEnv("JWT_SECRET")) {
    console.error("Missing required environment variable: JWT_SECRET");
    throw new Error("Missing required environment variable: JWT_SECRET");
  }

  const dbUrl = readEnv("DATABASE_URL");
  if (dbUrl) {
    if (isVercelRuntime()) {
      const host = databaseUrlHostname(dbUrl);
      if (host && isLocalDbHost(host)) {
        throw new Error(
          "DATABASE_URL cannot point to localhost on Vercel. Use a public PostgreSQL host (e.g. Neon)."
        );
      }
    }
  } else {
    const discreteRequired = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
    const missingDiscrete = discreteRequired.filter((name) => !readEnv(name));
    if (missingDiscrete.length > 0) {
      console.error("Missing database configuration:", missingDiscrete);
      throw new Error(
        `Missing database configuration: set DATABASE_URL or all of: ${missingDiscrete.join(", ")}`
      );
    }
    if (isVercelRuntime() && isLocalDbHost(readEnv("DB_HOST"))) {
      throw new Error(
        "DB_HOST cannot be localhost on Vercel. Use a cloud PostgreSQL instance and set DATABASE_URL or DB_HOST to its public hostname."
      );
    }
  }

  // In production, validate SMTP configuration for OTP emails
  if (env.NODE_ENV === "production") {
    if (!readEnv("SMTP_USER") || !readEnv("SMTP_PASS")) {
      console.error("PRODUCTION WARNING: SMTP_USER and SMTP_PASS are required for OTP emails");
      console.error("Set these in Vercel dashboard environment variables");
    }
  }

  // Log environment status in development
  if (env.NODE_ENV === "development") {
    console.log("Environment variables loaded:", {
      DATABASE_URL: readEnv("DATABASE_URL") ? "***" : "not set",
      DB_HOST: env.DB_HOST,
      DB_PORT: env.DB_PORT,
      DB_USER: env.DB_USER ? "***" : "MISSING",
      DB_PASSWORD: env.DB_PASSWORD ? "***" : "MISSING",
      DB_NAME: env.DB_NAME,
      JWT_SECRET: env.JWT_SECRET ? "***" : "MISSING",
      NODE_ENV: env.NODE_ENV,
      SMTP_HOST: env.SMTP_HOST,
      SMTP_PORT: env.SMTP_PORT,
      SMTP_USER: env.SMTP_USER ? "***" : "MISSING",
      SMTP_PASS: env.SMTP_PASS ? "***" : "MISSING",
    });
  }
}
