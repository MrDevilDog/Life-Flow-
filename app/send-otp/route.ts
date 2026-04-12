
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { generateOTP, storeOTP, sendOTP } from "@/lib/otp";
import { otpSendSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";



export async function POST(req: Request) {
  try {
    assertEnv();

    const body = await req.json();

    let parsed;
    try {
      parsed = otpSendSchema.parse(body);
    } catch (validationErr) {
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    const { email, type } = parsed;

    console.log("OTP Send Request:", { email, type, body });

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
      console.error("Failed to send OTP email");
      return jsonError(500, "Failed to send OTP email. Please check email configuration.");
    }

    console.log("OTP sent successfully to:", email);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (err) {
    return handleRouteError(err);
  }
}

