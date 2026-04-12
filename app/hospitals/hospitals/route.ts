import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db.query<any[]>(
      `SELECT h.name, h.location, b.blood_group, b.units 
       FROM hospitals h 
       JOIN blood_inventory b ON h.id = b.hospital_id`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}
