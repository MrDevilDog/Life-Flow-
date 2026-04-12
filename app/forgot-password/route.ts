import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { verifyOTP, storeOTP, sendOTP, generateOTP } from "@/lib/otp";
import { forgotPasswordSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Forgot password request");
    const body = await req.json();
    console.log("📝 Forgot password body:", { ...body, password: body.password ? "***" : undefined });
    
    let parsed;
    try {
      parsed = forgotPasswordSchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Forgot password validation error:", validationErr);
      if (validationErr instanceof z.ZodError) {
        // Return structured field errors instead of comma-separated messages
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

    const { email, phone, otp, newPassword, step } = parsed;
    console.log("🔐 Forgot password step:", step);

    if (step === 'send_otp') {
      // Step 1: Send OTP for password reset
      const userRows = await db.query<any[]>(
        "SELECT id, name, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1",
        [email || '', phone || '']
      );

      if (userRows.length === 0) {
        console.log("❌ User not found for password reset");
        return jsonError(404, "User not found");
      }

      const user = userRows[0];
      const userId = user.id;
      console.log("👤 Found user for password reset:", userId);

      // Use contact (email or phone) for OTP
      const contact = email || phone;
      if (!contact) {
        console.log("❌ Contact is required for password reset OTP");
        return jsonError(400, "Email or phone is required");
      }
      console.log("👤 Using contact for password reset OTP:", contact);

      // Generate and store OTP
      const generatedOTP = generateOTP();
      const stored = await storeOTP(contact, generatedOTP, 'forgot_password');
      if (!stored) {
        console.log("❌ Failed to generate OTP for password reset");
        return jsonError(500, "Failed to generate OTP");
      }

      // Send OTP
      const sent = await sendOTP(user.phone || '', user.email || '', generatedOTP, 'forgot_password');
      if (!sent) {
        console.log("❌ Failed to send OTP for password reset");
        return jsonError(500, "Failed to send OTP");
      }

      console.log("✅ Password reset OTP sent successfully");
      return NextResponse.json({
        success: true,
        message: "Password reset OTP sent to your email/phone",
        next_step: "verify_otp",
        contact: contact,
        // For development only - remove in production
        ...(process.env.NODE_ENV === 'development' && { otp: generatedOTP })
      });

    } else if (step === 'reset_password') {
      // Step 2: Verify OTP and reset password
      const userRows = await db.query<any[]>(
        "SELECT id, name, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1",
        [email || '', phone || '']
      );

      if (userRows.length === 0) {
        console.log("❌ User not found for password reset");
        return jsonError(404, "User not found");
      }

      const user = userRows[0];
      const userId = user.id;
      console.log("👤 Found user for password reset:", userId);

      // Use contact (email or phone) for verification
      const contact = email || phone;
      if (!contact) {
        console.log("❌ Contact is required for password reset verification");
        return jsonError(400, "Email or phone is required");
      }
      console.log("👤 Using contact for password reset verification:", contact);

      if (!otp) {
        return jsonError(400, "OTP is required");
      }
      if (!newPassword) {
        return jsonError(400, "New password is required");
      }

      // Verify OTP
      const isValidOTP = await verifyOTP(contact, otp, 'forgot_password');
      if (!isValidOTP) {
        console.log("❌ Invalid OTP for password reset");
        return jsonError(400, "Invalid or expired OTP");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      console.log("✅ New password hashed");

      // Update password
      await db.query(
        "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [hashedPassword, userId]
      );

      console.log("✅ Password reset successfully");
      return NextResponse.json({
        success: true,
        message: "Password reset successfully. You can now login with your new password."
      });

    } else {
      console.log("❌ Invalid step in forgot password");
      return jsonError(400, "Invalid step");
    }

  } catch (err: unknown) {
    console.error("❌ Forgot password error:", err);
    return handleRouteError(err);
  }
}
