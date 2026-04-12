import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { requireAuthUser } from "@/services/auth"; // Will work for hospital if we use the same verify flow, actually need to make sure auth works
import { handleRouteError, jsonError } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const inventoryUpdateSchema = z.object({
  blood_group: z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-']),
  units: z.coerce.number().int().min(0),
});

export async function GET(req: Request) {
  try {
    const authUser = await requireAuthUser(req);
    // requireAuthUser returns whatever is in the JWT. For hospital, role: 'hospital'
    if (authUser.role !== "hospital") {
      return jsonError(403, "Forbidden");
    }

    const rows = await db.query<any[]>(
      "SELECT blood_group, units, updated_at FROM blood_inventory WHERE hospital_id = ?",
      [authUser.id]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await requireAuthUser(req);
    if (authUser.role !== "hospital") {
      return jsonError(403, "Forbidden");
    }

    const body = await req.json();
    const { blood_group, units } = inventoryUpdateSchema.parse(body);

    // Update if exists, otherwise insert
    await db.query(
      `INSERT INTO blood_inventory (hospital_id, blood_group, units) 
       VALUES (?, ?, ?) 
       ON CONFLICT (hospital_id, blood_group) DO UPDATE SET units = EXCLUDED.units`,
      [authUser.id, blood_group, units]
    );

    return NextResponse.json({ success: true, message: "Inventory updated" }, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}
