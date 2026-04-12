import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { requireAuthUser } from "@/services/auth";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

// POST - Record donation with 90-day cooldown check
export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Donation request");
    const body = await req.json();
    console.log("📝 Donation body:", body);
    
    const authUser = await requireAuthUser(req);

    // Get donor ID from user
    const donorRows = await db.query<any[]>(
      "SELECT id FROM donors WHERE user_id = ? LIMIT 1",
      [authUser.id]
    );

    if (donorRows.length === 0) {
      console.log("❌ Donor not found for user:", authUser.id);
      return jsonError(404, "Donor profile not found");
    }

    const donorId = donorRows[0].id;
    console.log("👤 Found donor for donation:", donorId);

    const { request_id } = body;
    if (!request_id) {
      console.log("❌ Missing request_id for donation");
      return jsonError(400, "request_id is required");
    }

    // Check if request exists and is active
    const requestRows = await db.query<any[]>(
      "SELECT id, patient_name FROM requests WHERE id = ? AND status = 'active' LIMIT 1",
      [request_id]
    );

    if (requestRows.length === 0) {
      console.log("❌ Request not found or not active:", request_id);
      return jsonError(404, "Request not found or not active");
    }

    // Check 90-day cooldown
    const cooldownRows = await db.query<any[]>(
      "SELECT last_donation_date FROM users WHERE id = ? LIMIT 1",
      [authUser.id]
    );

    const lastDonationDate = cooldownRows[0]?.last_donation_date;
    let canDonate = true;
    let nextEligibleDate = null;

    if (lastDonationDate) {
      const today = new Date();
      const lastDate = new Date(lastDonationDate);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 90) {
        canDonate = false;
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 90);
        nextEligibleDate = nextDate.toISOString().split('T')[0];
        console.log("❌ Donor in cooldown period:", diffDays, "days since last donation");
      }
    }

    if (!canDonate) {
      return NextResponse.json({
        success: false,
        message: `You can donate again after ${nextEligibleDate}`,
        next_eligible_date: nextEligibleDate,
        days_remaining: 90 - Math.ceil((new Date().getTime() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24))
      }, { status: 400 });
    }

    // Record the donation
    const result = await db.query(
      "INSERT INTO donations (donor_id, request_id, date) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [donorId, request_id]
    );

    const donationId = (result as any)?.insertId;
    if (!donationId) {
      console.log("❌ Failed to record donation");
      return jsonError(500, "Failed to record donation");
    }

    // Update user's last donation date
    await db.query(
      "UPDATE users SET last_donation_date = CURRENT_DATE WHERE id = ?",
      [authUser.id]
    );

    console.log("✅ Donation recorded successfully:", donationId);

    // Update request status to fulfilled
    await db.query(
      "UPDATE requests SET status = 'fulfilled' WHERE id = ?",
      [request_id]
    );

    console.log("✅ Request marked as fulfilled:", request_id);

    return NextResponse.json({
      success: true,
      message: "Donation recorded successfully! Thank you for your contribution.",
      donation_id: donationId,
      last_donation_date: new Date().toISOString().split('T')[0]
    }, { status: 201 });

  } catch (err: unknown) {
    console.error("❌ Donation error:", err);
    return handleRouteError(err);
  }
}

// GET - Check donation eligibility
export async function GET(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Donation eligibility check");
    
    const authUser = await requireAuthUser(req);

    // Check 90-day cooldown
    const cooldownRows = await db.query<any[]>(
      "SELECT last_donation_date FROM users WHERE id = ? LIMIT 1",
      [authUser.id]
    );

    const lastDonationDate = cooldownRows[0]?.last_donation_date;
    let canDonate = true;
    let nextEligibleDate = null;
    let daysRemaining = 0;

    if (lastDonationDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate calculation
      
      const lastDate = new Date(lastDonationDate);
      lastDate.setHours(0, 0, 0, 0); // Set to start of day for accurate calculation
      
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`📅 Last donation: ${lastDonationDate}, Days since: ${diffDays}`);
      
      if (diffDays < 90) {
        canDonate = false;
        daysRemaining = 90 - diffDays;
        
        // Calculate next eligible date
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 90);
        nextEligibleDate = nextDate.toISOString().split('T')[0];
        
        console.log(`❌ Donor in cooldown period: ${daysRemaining} days remaining`);
      } else {
        console.log(`✅ Donor eligible: ${diffDays} days since last donation`);
      }
    } else {
      console.log("✅ No previous donation record - donor eligible");
    }

    const response = {
      success: true,
      eligible: canDonate,
      can_donate: canDonate, // Keep for backward compatibility
      last_donation_date: lastDonationDate,
      next_eligible_date: nextEligibleDate,
      days_remaining: daysRemaining,
      message: canDonate 
        ? "You are eligible to donate blood" 
        : `You can donate after ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${nextEligibleDate})`
    };

    console.log("📋 Eligibility result:", response);
    return NextResponse.json(response);

  } catch (err: unknown) {
    console.error("❌ Eligibility check error:", err);
    
    // Return a more specific error message
    if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required. Please login to check eligibility." 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Unable to check eligibility. Please try again later." 
      },
      { status: 500 }
    );
  }
}
