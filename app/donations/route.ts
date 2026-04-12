import { NextResponse } from "next/server";

import { db } from "@/lib/mysql";
import { requireAuthUser } from "@/services/auth";
import { handleRouteError } from "@/lib/http";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Get donations request");
    
    const authUser = await requireAuthUser(req);

    const donorRows = await db.query(
      "SELECT id FROM donors WHERE user_id = ? LIMIT 1",
      [authUser.id]
    );
    const donor = Array.isArray(donorRows) ? (donorRows as any[])[0] : undefined;
    if (!donor) {
      console.log("❌ Donor not found for user:", authUser.id);
      return NextResponse.json([], { status: 200 });
    }

    const rows = await db.query(
      `SELECT d.id AS donation_id,
              d.date,
              r.id AS request_id,
              r.patient_name,
              r.blood_group,
              r.units,
              r.hospital,
              r.city,
              r.urgency,
              r.status AS request_status
       FROM donations d
       INNER JOIN requests r ON r.id = d.request_id
       WHERE d.donor_id = ?
       ORDER BY d.date DESC`,
      [donor.id]
    );

    console.log("✅ Retrieved donations for donor:", rows.length);
    return NextResponse.json(rows, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Get donations error:", err);
    return handleRouteError(err);
  }
}

// POST - Record a new donation
export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Record donation request");
    const body = await req.json();
    console.log("📝 Record donation body:", body);
    
    const authUser = await requireAuthUser(req);

    // Get donor ID from user
    const donorRows = await db.query(
      "SELECT id FROM donors WHERE user_id = ? LIMIT 1",
      [authUser.id]
    );
    const donor = Array.isArray(donorRows) ? (donorRows as any[])[0] : undefined;
    if (!donor) {
      console.log("❌ Donor not found for user:", authUser.id);
      return NextResponse.json({ success: false, error: "Donor profile not found" }, { status: 404 });
    }

    const { request_id } = body;
    if (!request_id) {
      console.log("❌ Missing request_id for donation");
      return NextResponse.json({ success: false, error: "request_id is required" }, { status: 400 });
    }

    // Check if request exists and is active
    const requestRows = await db.query(
      "SELECT id, patient_name, blood_group FROM requests WHERE id = ? AND status = 'active' LIMIT 1",
      [request_id]
    );
    const request = Array.isArray(requestRows) ? (requestRows as any[])[0] : undefined;
    if (!request) {
      console.log("❌ Request not found or not active:", request_id);
      return NextResponse.json({ success: false, error: "Request not found or not active" }, { status: 404 });
    }

    // Check if donation already exists
    const existingDonation = await db.query(
      "SELECT id FROM donations WHERE donor_id = ? AND request_id = ? LIMIT 1",
      [donor.id, request_id]
    );
    if (Array.isArray(existingDonation) && (existingDonation as any[]).length > 0) {
      console.log("❌ Donation already recorded");
      return NextResponse.json({ success: false, error: "Donation already recorded" }, { status: 400 });
    }

    // Record the donation
    const result = await db.query(
      "INSERT INTO donations (donor_id, request_id, date) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [donor.id, request_id]
    );

    const donationId = (result as any)?.insertId;
    if (!donationId) {
      console.log("❌ Failed to record donation");
      return NextResponse.json({ success: false, error: "Failed to record donation" }, { status: 500 });
    }

    console.log("✅ Donation recorded successfully:", donationId);

    // Update request status to fulfilled
    await db.query(
      "UPDATE requests SET status = 'fulfilled' WHERE id = ?",
      [request_id]
    );

    console.log("✅ Request marked as fulfilled:", request_id);

    return NextResponse.json({
      success: true,
      message: "Donation recorded successfully!",
      donation_id: donationId
    }, { status: 201 });

  } catch (err: unknown) {
    console.error("❌ Record donation error:", err);
    return handleRouteError(err);
  }
}

