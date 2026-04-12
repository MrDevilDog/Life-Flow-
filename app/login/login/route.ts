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
    
    const body = await req.json();
    console.log("🔍 Login request body:", { 
      ...body, 
      password: "***" // Hide password in logs
    });
    
    let parsed;
    try {
      parsed = loginSchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Login validation error:", validationErr);
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    const { emailOrPhone, password, role } = parsed;
    
    // Detect if input is email or phone
    const isEmail = emailOrPhone.includes('@');
    const email = isEmail ? emailOrPhone : null;
    const phone = !isEmail ? emailOrPhone : null;
    
    console.log("🔑 Attempting login for:", { 
      input: emailOrPhone, 
      isEmail, 
      email, 
      phone, 
      role 
    });

    if (role === "hospital") {
      console.log("🏥 Hospital login attempt");
      // Hospitals can only login with email
      if (!isEmail) {
        console.log("❌ Hospital must use email for login");
        return jsonError(400, "Hospital accounts must use email for login");
      }
      
      const rows = await db.query<any[]>(
        "SELECT id, name, email FROM hospitals WHERE email = ? LIMIT 1",
        [email]
      );
      const hospital = rows[0];

      if (!hospital) {
        console.log("❌ Hospital not found:", email);
        return jsonError(404, "Hospital not found or role mismatch");
      }

      const passwordOk = await bcrypt.compare(password, hospital.password);
      if (!passwordOk) {
        console.log("❌ Hospital password incorrect");
        return jsonError(401, "Incorrect password");
      }

      console.log("✅ Hospital login successful:", hospital.id);
      const token = signToken({
        id: Number(hospital.id),
        role: "hospital",
      });

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: Number(hospital.id),
            name: hospital.name,
            email: hospital.email,
            role: "hospital",
          },
        },
        { status: 200 }
      );

      // Set JWT cookie with proper security settings
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } 
    
    // role === "donor"
    console.log("👤 Donor login attempt");
    
    // Support both email and phone login for donors
    let query, queryParams;
    if (isEmail) {
      query = "SELECT id, name, email, phone, password, email_verified, phone_verified, role, verification_type FROM users WHERE email = ? LIMIT 1";
      queryParams = [email];
    } else {
      query = "SELECT id, name, email, phone, password, email_verified, phone_verified, role, verification_type FROM users WHERE phone = ? LIMIT 1";
      queryParams = [phone];
    }
    
    const rows = await db.query<any[]>(query, queryParams);
    const user = rows[0];
    
    // Handle missing columns gracefully
    if (user) {
      // Add default values if columns don't exist
      user.email_verified = user.email_verified !== undefined ? user.email_verified : false;
      user.phone_verified = user.phone_verified !== undefined ? user.phone_verified : false;
      user.verification_type = user.verification_type !== undefined ? user.verification_type : 'email';
    }

    if (!user) {
      console.log("❌ User not found:", isEmail ? email : phone);
      return jsonError(404, "User not found or role mismatch");
    }

    // Safety check: Ensure password exists
    if (!user.password) {
      console.log("❌ User password is missing from database");
      return jsonError(500, "Invalid credentials - password not found");
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      console.log("❌ User password incorrect");
      return jsonError(401, "Incorrect password");
    }

    console.log("✅ User login successful:", user.id);

    const token = signToken({
      id: Number(user.id),
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          verification_type: user.verification_type, // NEW: Include verification type
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set JWT cookie with proper security settings
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    console.error("❌ Login error:", err);
    return handleRouteError(err);
  }
}