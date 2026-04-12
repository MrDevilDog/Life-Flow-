import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { requestCreateSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { requireAuthUser } from "@/lib/auth";
import { calculateDistance } from "@/lib/geocoding";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authUser = await requireAuthUser(req);
    const body = await req.json();
    
    const parsed = requestCreateSchema.parse(body);
    const {
      patient_name,
      blood_group,
      units,
      city,
      contact_number,
      urgency,
      notes
    } = parsed;

    // Map contact_number to patient_phone, and notes to hospital (as fallback)
    const patient_phone = contact_number;
    const mappedHospital = notes || "Hospital N/A";
    
    console.log("Incoming request body:", body);
    console.log("Mapped patient_phone:", patient_phone);
    
    // Validate patient_phone
    if (!patient_phone || patient_phone.trim().length < 10) {
      return jsonError(400, "Valid patient phone number is required");
    }

    const urgencyMap: Record<string, string> = {
      normal: "low",
      urgent: "medium",
      critical: "high"
    };
    
    const dbUrgency = urgencyMap[urgency] || "medium";
    
    // Create the blood request
    const result = await db.query(
      `INSERT INTO requests (user_id, patient_name, patient_phone, blood_group, units, hospital, city, urgency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [authUser.id, patient_name, patient_phone, blood_group, units, mappedHospital, city, dbUrgency]
    );
    
    console.log("DB insert result:", result);

    const requestId = (result as any)?.insertId;
    if (!requestId) {
      return jsonError(500, "Failed to create request");
    }

    // Find nearby donors within 10km and notify them
    await notifyNearbyDonors(blood_group, city, mappedHospital, requestId);

    return NextResponse.json({
      success: true,
      message: "Blood request created successfully",
      request_id: requestId
    }, { status: 201 });

  } catch (err: unknown) {
    console.error("Create request error:", err);
    return handleRouteError(err);
  }
}

async function notifyNearbyDonors(blood_group: string, city: string, hospital: string, requestId: number) {
  try {
    // Get city coordinates (you might want to cache this)
    const cityCoords = await getCityCoordinates(city);
    if (!cityCoords) {
      console.log(`Could not get coordinates for city: ${city}`);
      return;
    }

    // Find nearby donors within 10km
    const nearbyDonors = await db.query<any[]>(
      `SELECT d.user_id, d.lat, d.lng, u.name, u.phone, u.email
       FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE d.blood_group = ?
       AND d.availability = 1
       AND d.lat IS NOT NULL 
       AND d.lng IS NOT NULL
       AND u.email_verified = 1 
       AND u.phone_verified = 1`,
      [blood_group]
    );

    const donorsWithin10km = nearbyDonors.filter(donor => {
      const distance = calculateDistance(
        cityCoords.lat, cityCoords.lng,
        donor.lat, donor.lng
      );
      return distance <= 10; // 10km radius
    });

    // Send notifications to nearby donors
    for (const donor of donorsWithin10km) {
      await sendNotificationToDonor(donor, blood_group, hospital, requestId);
    }

    console.log(`📢 Notified ${donorsWithin10km.length} nearby donors for request ${requestId}`);

  } catch (error) {
    console.error("Error notifying nearby donors:", error);
  }
}

async function getCityCoordinates(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use the existing geocoding utility
    const { geocodeCity } = await import("@/lib/geocoding");
    return await geocodeCity(city);
  } catch (error) {
    console.error("Error getting city coordinates:", error);
    return null;
  }
}

async function sendNotificationToDonor(donor: any, blood_group: string, hospital: string, requestId: number) {
  try {
    const message = `🚨 Urgent blood request for ${blood_group} at ${hospital}. Please respond if you can donate! Request ID: ${requestId}`;
    
    // Mock notification - in production, use real SMS/Push notification service
    console.log(`📱 SMS to ${donor.phone}: ${message}`);
    console.log(`📧 Email to ${donor.email}: ${message}`);
    
    // In production, you would use:
    // - Twilio for SMS
    // - Firebase Cloud Messaging for push notifications
    // - Email service for email notifications
    
    return true;
  } catch (error) {
    console.error(`Failed to notify donor ${donor.user_id}:`, error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const city = url.searchParams.get("city");
    const blood_group = url.searchParams.get("blood_group") ?? url.searchParams.get("bloodGroup");

    const where: string[] = [];
    const params: any[] = [];

    if (city) {
      where.push("city = ?");
      params.push(city);
    }
    if (blood_group) {
      where.push("blood_group = ?");
      params.push(blood_group);
    }

    const sql =
      where.length > 0
        ? `SELECT id, user_id, patient_name, blood_group, units, hospital, city, urgency, status, created_at FROM requests WHERE ${where.join(
            " AND "
          )} ORDER BY created_at DESC`
        : `SELECT id, user_id, patient_name, blood_group, units, hospital, city, urgency, status, created_at FROM requests ORDER BY created_at DESC`;

    const rows = await db.query(sql, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}

