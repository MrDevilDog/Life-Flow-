
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { verifyOTP } from "@/lib/otp";
import { otpVerifySchema } from "@/lib/validators";
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
      parsed = otpVerifySchema.parse(body);
    } catch (validationErr) {
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    const { email, otp, type, flow = 'registration' } = parsed;

    // ✅ STRICT contact assignment (VERY IMPORTANT)
    const contact = email;

    if (!contact) {
      return jsonError(400, "Email is required");
    }

    if (type !== 'email') {
      return NextResponse.json({
        success: false,
        message: "Only email verification is supported."
      });
    }

    const isValidOTP = await verifyOTP(
      contact,
      otp,
      type,
      email
    );

    if (!isValidOTP) {
      console.log("❌ OTP NOT FOUND FOR:", contact);
      return jsonError(400, "Invalid or expired OTP");
    }

    // ✅ USER HANDLING
    if (flow === 'registration' || flow === 'post_registration') {
      const userRows = await db.query<any[]>(
        "SELECT id, name, email, role FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (userRows.length > 0) {
        const user = userRows[0];

        if (type === 'email') {
          await db.query(
            `UPDATE users SET email_verified = TRUE WHERE id = ?`,
            [user.id]
          );
        }

        const tokenPayload = {
          id: Number(user.id),
          role: user.role,
        };

        const { signToken } = await import("@/lib/auth");
        const token = signToken(tokenPayload);

        return NextResponse.json({
          success: true,
          message: "OTP verified successfully",
          verified: type,
          flow,
          allowRegistration: true,
          token,
          verificationSession: Buffer.from(
            `${type}:${contact}:${Date.now()}`
          ).toString('base64')
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      verified: type,
      flow,
      allowRegistration: true,
      verificationSession: Buffer.from(
        `${type}:${contact}:${Date.now()}`
      ).toString('base64')
    });

  } catch (err) {
    return handleRouteError(err);
  }
}

