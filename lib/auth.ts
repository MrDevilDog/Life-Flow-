import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";

import { env, assertEnv } from "@/lib/env";
import { db } from "@/lib/mysql";

export type UserRole = "user" | "admin" | "hospital";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  verification_type?: 'email' | 'phone'; // NEW: Track verification method
};

type JwtPayload = DefaultJwtPayload & {
  sub: string;
  role: UserRole;
};

export type TokenPayload = {
  id: number;
  role: "user" | "hospital";
};

// 🔐 Create JWT
export function signToken(payload: TokenPayload): string {
  assertEnv();

  return jwt.sign(
    {
      sub: String(payload.id),
      role: payload.role,
    },
    env.JWT_SECRET as jwt.Secret, // ✅ FIXED typing
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"], // ✅ FIXED typing
      issuer: env.JWT_ISSUER,
    }
  );
}

// 🔑 Extract Bearer token
export function getBearerToken(req: Request): string | null {
  const auth =
    req.headers.get("authorization") ??
    req.headers.get("Authorization");

  if (!auth) return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// 👤 Get current user
export async function getAuthUser(
  req: Request
): Promise<AuthUser | null> {
  assertEnv();

  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET as jwt.Secret,
      {
        issuer: env.JWT_ISSUER,
      }
    ) as JwtPayload;

    const role = decoded.role;
    let query;

    if (role === "hospital") {
      query = "SELECT id, name, email, 'hospital' as role FROM hospitals WHERE id = ? LIMIT 1";
    } else {
      query = "SELECT id, name, email, phone, role, email_verified, phone_verified FROM users WHERE id = ? LIMIT 1";
    }

    const rows = await db.query<any[]>(query, [Number(decoded.sub)]);

    const row = rows[0];
    if (!row) return null;

    return {
      id: Number(row.id),
      email: row.email,
      name: row.name,
      phone: row.phone || '',
      role: row.role as UserRole,
      email_verified: Boolean(row.email_verified),
      phone_verified: Boolean(row.phone_verified),
    };
  } catch (error) {
    console.error("❌ AUTH ERROR:", error);
    return null;
  }
}


// 🔒 Require auth
export async function requireAuthUser(
  req: Request
): Promise<AuthUser> {
  const user = await getAuthUser(req);

  if (!user) {
    const err = new Error("Unauthorized") as Error & {
      status?: number;
    };
    err.status = 401;
    throw err;
  }

  return user;
}