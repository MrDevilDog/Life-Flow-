import { NextResponse } from "next/server";

import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const donorsRows = await db.query<any[]>(
      "SELECT COUNT(*) AS total FROM donors"
    );
    const totalDonors = donorsRows?.[0]?.total ?? 0;

    const activeReqRows = await db.query<any[]>(
      "SELECT COUNT(*) AS total FROM requests WHERE status = ?",
      ["active"]
    );
    const activeRequests = activeReqRows?.[0]?.total ?? 0;

    const donationsRows = await db.query<any[]>(
      "SELECT COUNT(*) AS total FROM donations"
    );
    const completedDonations = donationsRows?.[0]?.total ?? 0;

    return NextResponse.json(
      {
        total_donors: Number(totalDonors),
        active_requests: Number(activeRequests),
        completed_donations: Number(completedDonations),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}

