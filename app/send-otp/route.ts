
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { generateOTP, storeOTP, sendOTP } from "@/lib/otp";
import { otpSendSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";



export async function POST(req: Request) {
  let requestEmail = ''; // Declare outside try block for use in catch
  
  try {
    assertEnv();

    const body = await req.json();

    // Log incoming request for debugging
    console.log("Incoming OTP send request:", {
      method: req.method,
      contentType: req.headers.get("content-type"),
      body: body
    });

    let parsed;
    try {
      parsed = otpSendSchema.parse(body);
      requestEmail = parsed.email || '';
    } catch (validationErr) {
      console.error("OTP validation error:", validationErr);
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    const { email, type } = parsed;

    console.log("Validated OTP request:", { email, type });

    // Email validation
    if (!email || !email.includes('@')) {
      return jsonError(400, "Valid email address is required");
    }

    if (type !== 'email') {
      return jsonError(400, "Only email OTP is supported");
    }

    // ✅ STRICT contact assignment (VERY IMPORTANT)
    const contact = email.trim().toLowerCase();

    if (!contact) {
      return jsonError(400, "Email is required");
    }

    // ✅ Use email in DB lookup
    const userRows = await db.query<any[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email || '']
    );

    if (userRows.length === 0) {
      return jsonError(404, "User not found");
    }

    const otp = generateOTP();

    console.log("Generated OTP for:", contact);

    // Store OTP
    const stored = await storeOTP(
      contact,
      otp,
      type,
      email
    );

    if (!stored) {
      console.error("Failed to store OTP in database");
      return jsonError(500, "Failed to store OTP");
    }

    console.log("OTP stored successfully, sending email...");

    const sent = await sendOTP(
      '',
      email,
      otp,
      type
    );

    if (!sent) {
      console.error("Failed to send OTP email to:", email);
      console.error("Check email configuration: EMAIL_USER/EMAIL_PASS environment variables");
      return jsonError(500, "Failed to send OTP email. Please check email configuration or try again later.");
    }

    console.log("OTP sent successfully to:", email);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (err) {
    console.error("Unexpected error in OTP send route:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      email: requestEmail || 'unknown'
    });
    
    // Return specific error message for production debugging
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return jsonError(500, `Failed to send OTP: ${errorMessage}`);
  }
}

