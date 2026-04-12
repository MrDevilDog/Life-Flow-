import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { verifyOTP } from "@/lib/otp";
import { forgotPasswordVerifySchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("🔍 Forgot Password - Verify OTP");
    const body = await req.json();
    console.log("📝 Verify OTP body:", { method: body.method, otp: body.otp });
    
    // Validate request body
    let parsed;
    try {
      parsed = forgotPasswordVerifySchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Verify OTP validation error:", validationErr);
      if (validationErr instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        validationErr.errors.forEach(error => {
          const field = error.path.join('.');
          fieldErrors[field] = error.message;
        });
        
        return NextResponse.json({
          success: false,
          error: "Validation failed",
          fieldErrors: fieldErrors
        }, { status: 400 });
      }
      return jsonError(400, "Validation failed");
    }

    const { method, email, phone, otp } = parsed;
    
    // Determine contact based on method
    const contact = method === "email" ? email : phone;
    console.log(`🔐 Verifying OTP for ${method}:`, contact);

    // Check if user exists
    let userRows = [];
    
    if (method === "email") {
      userRows = await db.query<any[]>(
        "SELECT id, name, email, phone FROM users WHERE email = ? LIMIT 1",
        [email]
      );
    } else if (method === "phone") {
      userRows = await db.query<any[]>(
        "SELECT id, name, email, phone FROM users WHERE phone = ? LIMIT 1",
        [phone]
      );
    }

    if (userRows.length === 0) {
      console.log(`❌ User not found for ${method}:`, contact);
      return jsonError(404, "User not found");
    }

    const user = userRows[0];
    const userId = user.id;
    console.log(`👤 Found user for ${method}:`, userId);

    // Verify OTP
    const isValidOTP = await verifyOTP(contact || "", otp, 'forgot_password');
    if (!isValidOTP) {
      console.log(`❌ Invalid or expired OTP for ${method}:`, contact);
      return jsonError(400, "Invalid or expired OTP");
    }

    console.log(`✅ OTP verified successfully for ${method}:`, contact);

    // Mark user as verified for this method (if not already verified)
    if (method === "email") {
      await db.query(
        "UPDATE users SET email_verified = TRUE WHERE id = ?",
        [userId]
      );
    } else if (method === "phone") {
      await db.query(
        "UPDATE users SET phone_verified = TRUE WHERE id = ?",
        [userId]
      );
    }

    console.log(`✅ User ${method} verification status updated:`, userId);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      verified: true,
      method: method
    });

  } catch (err: unknown) {
    console.error("❌ Forgot Password Verify error:", err);
    return handleRouteError(err);
  }
}
