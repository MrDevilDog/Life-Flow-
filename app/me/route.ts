import { NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { db } from "@/lib/mysql";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authUser = await requireAuthUser(req);
    
    const rows = await db.query<any[]>(
      `SELECT u.name, u.email, u.created_at, d.phone, d.location, d.blood_group, d.availability
       FROM users u
       LEFT JOIN donors d ON u.id = d.user_id
       WHERE u.id = ? LIMIT 1`,
      [authUser.id]
    );

    const user = rows[0];
    if (!user) {
      return jsonError(404, "User not found");
    }

    if (user.availability !== null && user.availability !== undefined) {
      user.availability = Boolean(user.availability);
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}

