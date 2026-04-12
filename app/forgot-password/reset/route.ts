import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { forgotPasswordResetSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    console.log("🔍 Forgot Password - Reset Password");
    const body = await req.json();
    console.log("📝 Reset password body:", { method: body.method, [body.method]: body[body.method], password: body.newPassword ? "***" : undefined });
    
    // Validate request body
    let parsed;
    try {
      parsed = forgotPasswordResetSchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Reset password validation error:", validationErr);
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

    const { method, email, phone, newPassword } = parsed;
    console.log(`🔐 Resetting password for ${method}:`, method === "email" ? email : phone);

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
      console.log(`❌ User not found for ${method}:`, method === "email" ? email : phone);
      return jsonError(404, "User not found");
    }

    const user = userRows[0];
    const userId = user.id;
    console.log(`👤 Found user for ${method}:`, userId);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log("✅ Password hashed successfully");

    // Update user password
    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    console.log("✅ Password reset successfully:", userId);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now login with your new password."
    });

  } catch (err: unknown) {
    console.error("❌ Forgot Password Reset error:", err);
    return handleRouteError(err);
  }
}
