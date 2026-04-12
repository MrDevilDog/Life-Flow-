import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { generateOTP, storeOTP, sendOTP } from "@/lib/otp";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

const preRegisterOTPSchema = {
  email: z.string().email("Invalid email address").max(255),
  type: z.literal("email"),
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Pre-register OTP request");
    const body = await req.json();
    console.log("📝 Pre-register OTP body:", { ...body });
    
    let parsed;
    try {
      parsed = preRegisterOTPSchema;
      // Manual validation since we don't have a schema object
      if (body.type !== 'email') {
        return jsonError(400, "Type is required and must be 'email'");
      }
      if (!body.email) {
        return jsonError(400, "Email is required for email OTP");
      }
      parsed = body;
    } catch (validationErr: any) {
      console.error("❌ Pre-register OTP validation error:", validationErr);
      return jsonError(400, validationErr.message || "Validation failed");
    }

    const { email, type } = parsed;
    console.log("📨 Sending pre-register OTP:", { email, type });

    // Check if user already exists
    const existingUsers = await db.query<any[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email || '']
    );

    if (existingUsers.length > 0) {
      console.log("❌ User already exists");
      return jsonError(400, "User with this email already exists");
    }

    // Use the contact (email only) for OTP storage
    const contact = email;
    console.log("👤 Using contact for OTP:", contact);

    // Generate and store OTP
    const otp = generateOTP();
    console.log("🔢 Generated pre-register OTP:", otp);

    const stored = await storeOTP(contact, otp, type);
    if (!stored) {
      console.log("❌ Failed to store pre-register OTP");
      return jsonError(500, "Failed to generate OTP");
    }

    // Send OTP
    const sent = await sendOTP('', email || '', otp, type);
    if (!sent) {
      console.log("❌ Failed to send pre-register OTP");
      return jsonError(500, "Failed to send OTP");
    }

    console.log("✅ Pre-register OTP sent successfully");
    return NextResponse.json({
      success: true,
      message: `Verification OTP sent to email`,
      contact: contact,
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (err: unknown) {
    console.error("❌ Pre-register OTP error:", err);
    return handleRouteError(err);
  }
}
