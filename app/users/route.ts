import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("Fetching users from DB...");
    const rows = await db.query<any[]>(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    console.log(`✅ Fetched ${rows.length} users`);
    return NextResponse.json(rows, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}
