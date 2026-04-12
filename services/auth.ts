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

// 🔑 Extract Bearer token from header
export function getBearerToken(req: Request): string | null {
  const auth =
    req.headers.get("authorization") ??
    req.headers.get("Authorization");

  if (!auth) return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// 🍪 Extract token from cookie
export function getCookieToken(req: Request): string | null {
  // For Next.js API routes, we need to parse cookies manually
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies.token || null;
}

// 🔑 Get token from both header and cookie (cookie takes priority)
export function getToken(req: Request): string | null {
  return getCookieToken(req) || getBearerToken(req);
}

// 👤 Get current user
export async function getAuthUser(
  req: Request
): Promise<AuthUser | null> {
  assertEnv();

  // First try to get user info from middleware headers
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  
  if (userId && userRole) {
    // Use middleware-verified user info
    try {
      const userRows = await db.query<any[]>(
        "SELECT id, name, email, phone, email_verified, phone_verified, role, verification_type FROM users WHERE id = ? LIMIT 1",
        [userId]
      );
      
      if (userRows.length > 0) {
        const user = userRows[0];
        return {
          id: Number(user.id),
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role as UserRole,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          verification_type: user.verification_type,
        };
      }
    } catch (error) {
      console.error("Error fetching user from middleware data:", error);
    }
  }

  // Fallback to token verification
  const token = getToken(req);
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

// Verify JWT token (for middleware)
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(
      token,
      env.JWT_SECRET as jwt.Secret,
      {
        issuer: env.JWT_ISSUER,
      }
    ) as JwtPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}