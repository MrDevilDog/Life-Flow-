import { Pool, type PoolClient, type QueryResult } from "pg";
import { env, assertEnv } from "@/lib/env";

let pool: Pool | null = null;

function pgUrlHostname(url: string): string | null {
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

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local");
}

function sslForHost(host: string): { rejectUnauthorized: boolean } | undefined {
  const flag = process.env.DB_SSL?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") {
    return undefined;
  }
  if (isLocalHost(host)) {
    return undefined;
  }
  return {
    rejectUnauthorized:
      process.env.DB_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase() !== "false",
  };
}

function isReadQuery(sql: string): boolean {
  return /^\s*(select|with|show|describe|explain)\b/i.test(sql);
}

function isInsertQuery(sql: string): boolean {
  return /^\s*insert\b/i.test(sql);
}

function convertPlaceholders(sql: string): string {
  let index = 0;
  let inSingle = false;
  let inDouble = false;
  let out = "";

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : "";

    if (ch === "'" && !inDouble && prev !== "\\") {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== "\\") {
      inDouble = !inDouble;
      out += ch;
      continue;
    }

    if (ch === "?" && !inSingle && !inDouble) {
      index += 1;
      out += `$${index}`;
      continue;
    }

    out += ch;
  }

  return out;
}

function normalizeSql(sql: string): string {
  return convertPlaceholders(sql.replace(/`/g, '"'));
}

function toLegacyWriteResult(result: QueryResult) {
  return {
    insertId: (result.rows?.[0] as any)?.id ?? null,
    affectedRows: result.rowCount ?? 0,
    rows: result.rows,
  };
}

function mapDbError(error: any) {
  if (!error || typeof error !== "object") return error;

  if (error.code === "23505") {
    (error as any).code = "ER_DUP_ENTRY";
  }

  return error;
}

function maybeAddReturningId(sql: string): string {
  if (!isInsertQuery(sql)) return sql;
  if (/\breturning\b/i.test(sql)) return sql;
  return `${sql.trimEnd()} RETURNING id`;
}

function getPool(): Pool {
  if (pool) return pool;

  assertEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for PostgreSQL connection");
  }

  const host = pgUrlHostname(env.DATABASE_URL);
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: host ? sslForHost(host) : undefined,
    max: env.DB_CONNECTION_LIMIT,
  });

  return pool;
}

async function executeQuery<T = any>(
  executor: Pool | PoolClient,
  sql: string,
  values?: unknown[]
): Promise<T> {
  const read = isReadQuery(sql);
  const prepared = normalizeSql(maybeAddReturningId(sql));
  const result = await executor.query(prepared, values ?? []);

  if (read) {
    return result.rows as T;
  }

  if (isInsertQuery(sql)) {
    return toLegacyWriteResult(result) as T;
  }

  return { affectedRows: result.rowCount ?? 0, rows: result.rows } as T;
}

export const db = {
  query: async <T = any>(sql: string, values?: unknown[]): Promise<T> => {
    try {
      return await executeQuery<T>(getPool(), sql, values);
    } catch (error) {
      console.error("❌ DB QUERY ERROR:", { sql, values, error });
      throw mapDbError(error);
    }
  },

  getConnection: async () => {
    try {
      const client = await getPool().connect();
      return {
        beginTransaction: async () => {
          await client.query("BEGIN");
        },
        query: async (sql: string, values?: unknown[]) => {
          try {
            const rows = await executeQuery(client, sql, values);
            return [rows];
          } catch (error) {
            throw mapDbError(error);
          }
        },
        commit: async () => {
          await client.query("COMMIT");
        },
        rollback: async () => {
          await client.query("ROLLBACK");
        },
        release: () => {
          client.release();
        },
      };
    } catch (error) {
      console.error("❌ DB CONNECTION ERROR:", error);
      throw mapDbError(error);
    }
  },
};