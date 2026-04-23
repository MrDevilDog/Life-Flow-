/**
 * User Registration API Route
 * Handles new user registration and creates donor record
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { signToken } from "@/services/auth";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { assertEnv } from "@/lib/env";
import { geocodeCity } from "@/lib/geocoding";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables are set
    assertEnv();
    
    // Parse and validate request body
    const body = await req.json();
    console.log("Registration request body:", { 
      name: body.name, 
      email: body.email, 
      phone: body.phone,
      role: body.role 
    });

    // Validate input using schema
    const validatedData = registerSchema.parse(body);
    const { name, email, password, phone, role, blood_group, location } = validatedData;

    // Hash the password for secure storage
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Password hashed successfully");

    // Insert new user into database
    const query = `
      INSERT INTO users (name, email, phone, password, role, email_verified, phone_verified) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query<any[]>(query, [
      name, 
      email.toLowerCase(), // Store email in lowercase for consistency
      phone, 
      hashedPassword, 
      role || 'user', // Default to 'user' role if not specified
      false, // email_verified: false
      false  // phone_verified: false
    ]);
    
    const userId = (result as any)?.insertId;
    if (!userId) {
      console.log("Failed to create user");
      return jsonError(500, "Failed to create user");
    }

    console.log("User created successfully:", userId);

    // Always create donor record with geocoded coordinates
    const donorBloodGroup = blood_group || 'O+';
    const donorLocation = location || 'Unknown';
    
    // Get coordinates for the location
    let donorLat = 0;
    let donorLng = 0;
    
    if (donorLocation && donorLocation !== 'Unknown') {
      try {
        console.log("Geocoding location:", donorLocation);
        const coords = await geocodeCity(String(donorLocation));
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
    
    // Create donor record for the new user
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
    
    // Generate JWT token for the new user
    const token = signToken({
      id: Number(userId),
      role: (role as 'user' | 'hospital') || 'user',
    });

    console.log("JWT token generated successfully");

    // Create response with token and user data
    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        token: token, // Return token in response body
        user: {
          id: Number(userId),
          name: name,
          email: email,
          phone: phone,
          role: role || 'user',
        },
      },
      { status: 201 }
    );

    // Set JWT cookie with proper security settings
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("Registration response sent successfully");
    return response;

  } catch (err: unknown) {
    console.error("Registration error:", err);
    
    // Return specific error information for debugging
    if (err instanceof Error) {
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    // Return a user-friendly error response
    return NextResponse.json(
      { 
        success: false,
        error: "Registration failed. Please check your input and try again.",
        details: process.env.NODE_ENV === 'development' ? err instanceof Error ? err.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}
