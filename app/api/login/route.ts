/**
 * Login API Route
 * Handles user authentication and returns JWT token
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { registerSchema, loginSchema } from "@/lib/validators";
import { signToken } from "@/services/auth";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables are set
    assertEnv();
    
    // Parse and validate request body
    const body = await req.json();
    console.log("Login request body:", { 
      emailOrPhone: body.emailOrPhone, 
      role: body.role 
    });

    // Validate input using schema
    const validatedData = loginSchema.parse(body);
    const { emailOrPhone, password, role } = validatedData;

    // Normalize input for database query (handle both email and phone)
    const normalizedInput = emailOrPhone.toLowerCase().trim();
    
    // Enhanced query to support both email and phone with single parameter
    const query = `
      SELECT id, name, email, phone, password, email_verified, phone_verified, role, verification_type 
      FROM users 
      WHERE LOWER(email) = ? OR phone = ? 
      LIMIT 1
    `;
    
    const rows = await db.query<any[]>(query, [normalizedInput, normalizedInput]);
    
    if (rows.length === 0) {
      console.log("User not found");
      return jsonError(401, "Invalid credentials");
    }

    const user = rows[0];
    console.log("User found:", { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log("Invalid password");
      return jsonError(401, "Invalid credentials");
    }

    console.log("Password validated successfully");

    // Generate JWT token for the authenticated user
    const token = signToken({
      id: Number(user.id),
      role: user.role,
    });

    console.log("JWT token generated successfully");

    // Create response with token and user data
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token: token, // Return token in response body
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

    console.log("Login response sent successfully");
    return response;

  } catch (err: unknown) {
    console.error("Login error:", err);
    
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
        error: "Login failed. Please check your credentials and try again.",
        details: process.env.NODE_ENV === 'development' ? err instanceof Error ? err.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}
