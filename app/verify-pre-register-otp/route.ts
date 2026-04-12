import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { verifyOTP } from "@/lib/otp";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

const verifyPreRegisterOTPSchema = {
  contact: z.string(),
  email: z.string().email("Invalid email address").max(255),
  otp: z.string().length(6, "OTP must be 6 digits"),
  type: z.literal("email"),
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Verify pre-register OTP request");
    const body = await req.json();
    console.log("📝 Verify pre-register OTP body:", { ...body, otp: body.otp ? "***" : undefined });
    
    let parsed;
    try {
      // Manual validation
      if (!body.contact || !body.otp || !body.type) {
        return jsonError(400, "contact, otp, and type are required");
      }
      if (body.type !== 'email') {
        return jsonError(400, "Type must be 'email'");
      }
      if (!body.email) {
        return jsonError(400, "Email is required for email verification");
      }
      parsed = body;
    } catch (validationErr: any) {
      console.error("❌ Verify pre-register OTP validation error:", validationErr);
      return jsonError(400, validationErr.message || "Validation failed");
    }

    const { contact, email, otp, type } = parsed;
    console.log("🔐 Verifying pre-register OTP:", { contact, email, type });

    // Verify OTP
    const isValidOTP = await verifyOTP(contact, otp, type);
    if (!isValidOTP) {
      console.log("❌ Invalid or expired pre-register OTP");
      return jsonError(400, "Invalid or expired OTP");
    }

    console.log("✅ Pre-register OTP verified successfully");
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. You can now proceed with registration.",
      verified: true,
      email: email,
      type: type,
      contact: contact
    });

  } catch (err: unknown) {
    console.error("❌ Verify pre-register OTP error:", err);
    return handleRouteError(err);
  }
}
