import { db } from "@/lib/mysql";
import { donorUpsertSchema, donorUpdateSchema } from "@/lib/validators";
import { getAuthUser, requireAuthUser } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { NextResponse } from "next/server";
import { geocodeCity } from "@/lib/geocoding";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Donor creation request");
    const body = await req.json();
    console.log("📝 Request body:", { 
      ...body, 
      password: body.password ? "***" : undefined 
    });
    
    const {
      name,
      age,
      email,
      blood_group,
      phone,
      city,
      availability,
      lat,
      lng
    } = body;

    // 1. Basic Validation
    if (!blood_group || !phone || !city) {
      console.log("❌ Missing required fields");
      return jsonError(400, "Missing required fields");
    }

    // 2. Auth or User Resolution
    const authUser = await getAuthUser(req);
    let userId = authUser?.id ?? body.user_id;

    if (!userId) {
      if (!name || !email) {
        console.log("❌ Name and Email required for unauthenticated registration");
        return jsonError(400, "Name and Email are required for unauthenticated registration");
      }

      // Find user by email first
      const userRows = await db.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      const existingUser = Array.isArray(userRows) ? (userRows as any[])[0] : undefined;

      if (existingUser) {
        userId = existingUser.id;
        console.log("✅ Found existing user:", userId);
      } else {
        console.log("ℹ️ Creating new user for donor");
        return jsonError(400, "User not found. Please register first.");
      }
    }

    // 3. Check if donor already exists for this user
    const existingDonorRows = await db.query(
      "SELECT id FROM donors WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const existingDonor = Array.isArray(existingDonorRows) ? (existingDonorRows as any[])[0] : undefined;

    if (existingDonor) {
      console.log("ℹ️ Donor already exists for user:", userId);
      // Update existing donor
      const updateData = {
        blood_group,
        phone,
        location: city,
        availability: availability ? 1 : 0,
        lat: lat || 0,
        lng: lng || 0,
      };

      const parsed = donorUpdateSchema.parse(updateData);
      await db.query(
        `UPDATE donors SET 
          blood_group = ?, 
          phone = ?, 
          location = ?, 
          availability = ?, 
          lat = ?, 
          lng = ?
        WHERE user_id = ?`,
        [
          parsed.blood_group,
          parsed.phone,
          parsed.location,
          parsed.availability,
          parsed.lat,
          parsed.lng,
          userId
        ]
      );

      console.log("✅ Donor updated successfully:", userId);
      return NextResponse.json({
        success: true,
        message: "Donor profile updated successfully",
        donor_id: existingDonor.id
      });
    }

    // 4. Create new donor record
    const insertData = {
      user_id: userId,
      blood_group,
      phone,
      location: city,
      availability: availability ? 1 : 0,
      lat: lat || 0,
      lng: lng || 0,
    };

    const parsed = donorUpsertSchema.parse(insertData);
    const result = await db.query(
      "INSERT INTO donors (user_id, blood_group, phone, location, availability, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        parsed.user_id,
        parsed.blood_group,
        parsed.phone,
        parsed.location,
        parsed.availability,
        parsed.lat,
        parsed.lng
      ]
    );

    const donorId = (result as any)?.insertId;
    if (!donorId) {
      console.error("❌ Failed to create donor record");
      return jsonError(500, "Failed to create donor record");
    }

    console.log("✅ Donor created successfully:", donorId);
    return NextResponse.json({
      success: true,
      message: "Donor profile created successfully",
      donor_id: donorId
    });

  } catch (err: unknown) {
    console.error("❌ Donor creation error:", err);
    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return jsonError(401, "Authentication required");
    }

    const donors = await db.query(
      `SELECT d.*, u.name, u.email 
       FROM donors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.user_id = ?`,
      [authUser.id]
    );

    return NextResponse.json({
      success: true,
      data: donors
    });
  } catch (err: unknown) {
    console.error("❌ Get donor error:", err);
    return handleRouteError(err);
  }
}
