import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

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
    } = parsed;

    // 1. Check if user exists by email
    const existingUser = await db.query<any[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUser.length > 0) {
      console.log("Email already exists:", email);
      return jsonError(400, "Email already registered");
    }

    // 2. Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Password hashed successfully");
    
    const result = await db.query(
      "INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, "user", true]
    );
    
    const userId = (result as any)?.insertId;
    if (!userId) {
      return jsonError(500, "Failed to create user");
    }

    console.log("User created successfully:", userId);

          "SELECT id FROM donors WHERE user_id = ? LIMIT 1",
          [userId]
        );

        if (existingDonor.length === 0) {
          await db.query(
            "INSERT INTO donors (user_id, blood_group, phone, location, city, district, availability, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [userId, blood_group, phone, city, city, district || null, availability ? 1 : 0, lat, lng]
          );
          console.log("✅ Donor record created for user:", userId);
        } else {
          console.log("ℹ️ Donor record already exists for user:", userId);
        }
      } catch (err: any) {
        console.error("❌ Failed to create donor record:", err);
        // Don't fail registration, but log the error
      }
    }

    console.log("✅ Registration completed for user:", userId);
    
    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail(email, name).catch(err => {
      console.log("⚠️  Welcome email failed (non-critical):", err);
    });
    
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
      if (err.message.includes("Unknown column 'verification_type'")) {
        return jsonError(500, "Database schema error: Please run the migration script to update the database schema.");
      }
      if (err.message.includes("Duplicate entry")) {
        if (err.message.includes("email")) {
          return jsonError(400, "Email already registered");
        }
        if (err.message.includes("phone")) {
          return jsonError(400, "Phone number already registered");
        }
      }
      if (err.message.includes("Data too long")) {
        return jsonError(400, "One of the fields is too long. Please check your input.");
      }
    }
    
    return handleRouteError(err);
  }
}
