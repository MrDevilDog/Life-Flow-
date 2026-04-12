import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/mysql";
import { requireAuthUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { requestStatusPatchSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthUser(req);
    const { id } = await params;
    const requestId = Number(id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return jsonError(400, "Invalid request id");
    }

    const body = await req.json();
    const parsed = requestStatusPatchSchema.parse(body);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [requestRows] = await conn.query(
        "SELECT id, status, blood_group, user_id FROM requests WHERE id = ? LIMIT 1",
        [requestId]
      );
      const request = Array.isArray(requestRows) ? (requestRows as any[])[0] : undefined;
      if (!request) {
        await conn.rollback();
        return jsonError(404, "Request not found");
      }

      const currentStatus = request.status as string;
      if (currentStatus !== "active") {
        await conn.rollback();
        return jsonError(409, `Request is already ${currentStatus}`);
      }

      if (parsed.status === "cancelled") {
        const isOwner = Number(request.user_id) === authUser.id;
        if (authUser.role !== "admin" && !isOwner) {
          await conn.rollback();
          return jsonError(403, "Forbidden");
        }
      }

      if (parsed.status === "fulfilled") {
        const [donorRows] = await conn.query(
          "SELECT id, blood_group, availability FROM donors WHERE user_id = ? LIMIT 1",
          [authUser.id]
        );
        const donor = Array.isArray(donorRows) ? (donorRows as any[])[0] : undefined;
        if (!donor) {
          await conn.rollback();
          return jsonError(400, "Donor profile not found");
        }

        if (donor.availability !== 1) {
          await conn.rollback();
          return jsonError(400, "Donor is not available");
        }

        if (donor.blood_group !== request.blood_group) {
          await conn.rollback();
          return jsonError(400, "Donor blood group does not match request");
        }

        await conn.query(
          "INSERT INTO donations (donor_id, request_id, date) VALUES (?, ?, NOW())",
          [donor.id, requestId]
        );
      }

      await conn.query("UPDATE requests SET status = ? WHERE id = ?", [
        parsed.status,
        requestId,
      ]);

      await conn.commit();

      return NextResponse.json(
        { message: "Request updated", status: parsed.status },
        { status: 200 }
      );
    } catch (txnErr) {
      await conn.rollback();
      throw txnErr;
    } finally {
      conn.release();
    }
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}

