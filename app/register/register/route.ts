import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { signToken } from "@/services/auth";
import { cookies } from "next/headers";
import { z } from "zod";
import { assertEnv } from "@/lib/env";
import { geocodeCity } from "@/lib/geocoding";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    const body = await req.json();
    console.log("🔍 Register request body:", { 
      ...body, 
      password: "***" // Hide password in logs
    });
    
    // Parse using Zod but return clear error if validation fails
    let parsed;
    try {
      parsed = registerSchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Validation error:", validationErr);
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    const {
      name,
      email,
      password,
      phone,
      blood_group,
      city,
    } = parsed;

    const location = city || (parsed as any).location;

    // 1. Check if user exists by email
    const existingUser = await db.query<any[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUser.length > 0) {
      console.log("Email already exists:", email);
      return jsonError(400, "Email already registered");
    }

    // 2. Check if phone number already exists (if provided)
    if (phone) {
      const existingPhone = await db.query<any[]>(
        "SELECT id FROM users WHERE phone = ? LIMIT 1",
        [phone]
      );

      if (existingPhone.length > 0) {
        console.log("Phone already exists:", phone);
        return jsonError(400, "Phone number already registered");
      }
    }

    // 3. Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Password hashed successfully");
    
    const result = await db.query(
      "INSERT INTO users (name, email, phone, password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, phone, hashedPassword, "user", true]
    );
    
    const userId = (result as any)?.insertId;
    if (!userId) {
      return jsonError(500, "Failed to create user");
    }

    console.log("User created successfully:", userId);
    
    // Always create donor record with geocoded coordinates
    const donorBloodGroup = blood_group || 'O+';
    const donorLocation = typeof location === 'string' ? location : 'Unknown';
    
    // Get coordinates for the location
    let donorLat = 0;
    let donorLng = 0;
    
    if (donorLocation && donorLocation !== 'Unknown') {
      try {
        console.log("Geocoding location:", donorLocation);
        const coords = await geocodeCity(donorLocation);
        if (coords) {
          donorLat = coords.lat;
          donorLng = coords.lng;
          console.log("Geocoded coordinates:", { lat: donorLat, lng: donorLng });
        } else {
          console.log("Geocoding failed, using default coordinates");
        }
      } catch (geocodeErr) {
        console.error("Geocoding error:", geocodeErr);
        // Continue with default coordinates
      }
    }
    
    try {
      await db.query(
        "INSERT INTO donors (user_id, blood_group, location, phone, availability, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, donorBloodGroup, donorLocation, phone || '', 1, donorLat, donorLng]
      );
      console.log("Donor record created successfully for user:", userId, { lat: donorLat, lng: donorLng });
    } catch (donorErr) {
      console.error("Failed to create donor record:", donorErr);
      // Don't fail registration if donor creation fails
    }
    
    const token = signToken({
      id: Number(userId),
      role: "user",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful!",
        user_id: userId,
        token
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("❌ Registration error:", err);
    
    // Handle specific database errors
    if (err instanceof Error) {
      // MySQL error code 23505 = duplicate key violation
      if (err.message.includes("23505") || err.message.includes("Duplicate entry")) {
        if (err.message.includes("email") || err.message.includes("users.email")) {
          return jsonError(400, "Email already registered");
        }
        if (err.message.includes("phone") || err.message.includes("users.phone") || err.message.includes("users_phone_key")) {
          return jsonError(400, "Phone number already registered");
        }
      }
      if (err.message.includes("Data too long")) {
        return jsonError(400, "One of the fields is too long. Please check your input.");
      }
      if (err.message.includes("Unknown column 'verification_type'")) {
        return jsonError(500, "Database schema error: Please run the migration script to update the database schema.");
      }
    }
    
    return handleRouteError(err);
  }
}
