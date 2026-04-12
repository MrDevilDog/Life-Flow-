import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { signToken } from "@/services/auth";
import { assertEnv } from "@/lib/env";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    // Log DATABASE_URL for debugging (remove in production)
    console.log("DATABASE_URL check:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    console.log("DB connection test - attempting to connect...");
    
    const body = await req.json();
    console.log("=== LOGIN DEBUG START ===");
    console.log("Incoming request body:", { 
      emailOrPhone: body.emailOrPhone,
      password: "***", // Hide password in logs
      role: body.role
    });
    
    let parsed;
    try {
      parsed = loginSchema.parse(body);
      console.log("Validation: PASSED");
    } catch (validationErr) {
      console.error("Validation: FAILED", validationErr);
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    const { emailOrPhone, password, role } = parsed;
    
    // Convert email to lowercase for case-insensitive comparison
    const normalizedInput = emailOrPhone.toLowerCase().trim();
    console.log("Normalized input:", normalizedInput);
    
    // Enhanced query to support both email and phone with single parameter
    const query = `
      SELECT id, name, email, phone, password, email_verified, phone_verified, role, verification_type 
      FROM users 
      WHERE LOWER(email) = $1 OR phone = $1 
      LIMIT 1
    `;
    
    console.log("Executing query:", query);
    console.log("Query parameters:", [normalizedInput]);
    
    const rows = await db.query<any[]>(query, [normalizedInput]);
    console.log("Query result rows:", rows.length);
    
    const user = rows[0];
    
    if (!user) {
      console.log("ERROR: User not found in database");
      console.log("=== LOGIN DEBUG END ===");
      return jsonError(404, "User not found. Please check your email/phone and try again.");
    }

    console.log("User found:", {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hasPassword: !!user.password,
      passwordHashStart: user.password ? user.password.substring(0, 10) : "N/A"
    });

    // Handle missing columns gracefully
    user.email_verified = user.email_verified !== undefined ? user.email_verified : false;
    user.phone_verified = user.phone_verified !== undefined ? user.phone_verified : false;
    user.verification_type = user.verification_type !== undefined ? user.verification_type : 'email';

    // Safety check: Ensure password exists
    if (!user.password) {
      console.log("ERROR: User password is missing from database");
      console.log("=== LOGIN DEBUG END ===");
      return jsonError(500, "Invalid credentials - password not found in database");
    }

    // Verify password hash format
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      console.log("ERROR: Invalid password hash format");
      console.log("Password hash starts with:", user.password.substring(0, 10));
      console.log("=== LOGIN DEBUG END ===");
      return jsonError(500, "Invalid password format in database");
    }

    console.log("Password hash format: VALID");
    console.log("Starting bcrypt comparison...");
    
    const passwordOk = await bcrypt.compare(password, user.password);
    console.log("bcrypt comparison result:", passwordOk ? "SUCCESS" : "FAILED");
    
    if (!passwordOk) {
      console.log("ERROR: Password comparison failed");
      console.log("=== LOGIN DEBUG END ===");
      return jsonError(401, "Incorrect password. Please try again.");
    }

    console.log("SUCCESS: User authenticated successfully");
    console.log("User details:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    const token = signToken({
      id: Number(user.id),
      role: user.role,
    });

    console.log("JWT token generated successfully");

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          verification_type: user.verification_type,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set JWT cookie with proper security settings
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("Cookie set successfully");
    console.log("=== LOGIN DEBUG END ===");

    return response;
    
  } catch (err: unknown) {
    console.error("=== LOGIN ERROR ===");
    console.error("Error type:", typeof err);
    console.error("Error message:", err instanceof Error ? err.message : String(err));
    console.error("Stack trace:", err instanceof Error ? err.stack : "No stack trace");
    console.error("=== LOGIN ERROR END ===");
    
    // Handle specific database errors
    if (err instanceof Error) {
      if (err.message.includes("connection")) {
        return jsonError(500, "Database connection error. Please try again later.");
      }
      if (err.message.includes("timeout")) {
        return jsonError(500, "Database timeout. Please try again later.");
      }
    }
    
    return handleRouteError(err);
  }
}