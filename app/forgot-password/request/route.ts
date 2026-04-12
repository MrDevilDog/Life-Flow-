import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { storeOTP, sendOTP, generateOTP } from "@/lib/otp";
import { forgotPasswordRequestSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";
import { assertEnv } from "@/lib/env";
import { createRateLimiter, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    assertEnv();
    
    // Rate limiting by IP and contact method
    const clientIP = getClientIP(req);
    const rateLimiter = createRateLimiter(RATE_LIMITS.forgotPassword);
    
    // Check rate limit by IP
    const ipCheck = rateLimiter(clientIP);
    if (!ipCheck.allowed) {
      console.log("� Rate limit exceeded for IP:", clientIP);
      return NextResponse.json({
        success: false,
        error: ipCheck.error
      }, { 
        status: 429,
        headers: ipCheck.headers
      });
    }
    
    console.log("�🔍 Forgot Password - Request OTP");
    const body = await req.json();
    console.log("📝 Request OTP body:", { method: body.method, [body.method]: body[body.method] });
    
    // Validate request body
    let parsed;
    try {
      parsed = forgotPasswordRequestSchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Request OTP validation error:", validationErr);
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
        }, { status: 400, headers: ipCheck.headers });
      }
      return jsonError(400, "Validation failed");
    }

    const { method, email, phone } = parsed;
    
    // Additional rate limiting by contact method
    const contact = method === "email" ? email : phone;
    if (!contact) {
      return jsonError(400, `Missing ${method}`);
    }
    const contactCheck = rateLimiter(contact);
    if (!contactCheck.allowed) {
      console.log(`🚫 Rate limit exceeded for ${method}:`, contact);
      return NextResponse.json({
        success: false,
        error: contactCheck.error
      }, { 
        status: 429,
        headers: contactCheck.headers
      });
    }
    
    // Prevent account enumeration - always return success message
    // But only send OTP if user exists
    let userRows = [];
    
    if (method === "email") {
      console.log("📧 Sending OTP to email:", email);
      
      // Check if user exists
      userRows = await db.query<any[]>(
        "SELECT id, name, email, phone FROM users WHERE email = ? LIMIT 1",
        [email]
      );
    } else if (method === "phone") {
      console.log("📱 Sending OTP to phone:", phone);
      
      // Check if user exists
      userRows = await db.query<any[]>(
        "SELECT id, name, email, phone FROM users WHERE phone = ? LIMIT 1",
        [phone]
      );
    }

    if (userRows.length === 0) {
      console.log(`❌ User not found for ${method}:`, contact);
      // Don't reveal if user exists or not - return generic success message
      // This prevents account enumeration attacks
      return NextResponse.json({
        success: true,
        message: `If an account exists with this ${method}, you will receive a verification code.`
      }, { headers: ipCheck.headers });
    }

    const user = userRows[0];
    const userId = user.id;
    console.log(`👤 Found user for ${method}:`, userId);

    // Generate and store OTP
    const otp = generateOTP();
    console.log(`📧 Generated OTP for ${method}:`, otp);

    // Store OTP
    const otpStored = await storeOTP(contact, otp, 'forgot_password');
    if (!otpStored) {
      console.error(`❌ Failed to store OTP for ${method}:`, contact);
      return jsonError(500, "Failed to generate verification code");
    }

    // Send OTP
    const otpSent = await sendOTP(contact, user.email, otp, method === "email" ? "email" : "phone");
    if (!otpSent) {
      console.error(`❌ Failed to send OTP via ${method}:`, contact);
      // Don't fail completely, but log the error
      console.log(`⚠️  OTP generation successful, but sending failed for ${method}`);
    }

    console.log(`✅ OTP process completed for ${method}:`, contact);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to your ${method}. Check your ${method === "email" ? "inbox (and spam folder)" : "phone"}.`,
      // Don't include user data for security
    }, { headers: ipCheck.headers });

  } catch (err: unknown) {
    console.error("❌ Forgot Password Request error:", err);
    return handleRouteError(err);
  }
}
