import nodemailer from 'nodemailer';
import { env } from './env';

/**
 * Email Configuration for OTP System
 * 
 * IMPORTANT: Gmail requires App Password for SMTP authentication
 * 1. Enable 2-factor authentication on your Gmail account
 * 2. Generate an App Password: https://myaccount.google.com/apppasswords
 * 3. Use the App Password (16-character string) as EMAIL_PASS
 * 4. Use your Gmail address as EMAIL_USER
 * 
 * Environment Variables (Required for Production):
 * - EMAIL_USER: your_email@gmail.com
 * - EMAIL_PASS: your_gmail_app_password
 * 
 * Legacy Support: Also supports SMTP_USER/SMTP_PASS for backward compatibility
 */

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Creates a production-safe Gmail email transporter
 * Uses SSL/TLS connection (port 465) for reliable delivery
 */
function createTransporter() {
  // Use EMAIL_USER/EMAIL_PASS if available, fallback to SMTP_USER/SMTP_PASS for backward compatibility
  const emailUser = env.EMAIL_USER || env.SMTP_USER;
  const emailPass = env.EMAIL_PASS || env.SMTP_PASS;
  
  // Production-safe Gmail SMTP configuration
  // Port 465 with SSL (secure: true) is most reliable for production
  const config: EmailConfig = {
    host: "smtp.gmail.com", // Always use Gmail SMTP for production
    port: 465, // Use SSL port for production (more reliable than 587)
    secure: true, // SSL encryption for port 465
    auth: {
      user: emailUser,
      pass: emailPass
    }
  };

  // Check if email configuration is available
  if (!config.auth.user || !config.auth.pass) {
    console.error("Email configuration not found in environment variables");
    console.error("Missing EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS");
    console.error("For Gmail, enable 2FA and generate an App Password: https://myaccount.google.com/apppasswords");
    console.error("Environment check:", {
      NODE_ENV: env.NODE_ENV,
      EMAIL_USER: env.EMAIL_USER ? "***" : "MISSING",
      EMAIL_PASS: env.EMAIL_PASS ? "***" : "MISSING",
      SMTP_USER: env.SMTP_USER ? "***" : "MISSING",
      SMTP_PASS: env.SMTP_PASS ? "***" : "MISSING",
      emailUser: config.auth.user ? "***" : "MISSING",
      emailPass: config.auth.pass ? "***" : "MISSING"
    });
    return null;
  }

  // Log email transporter creation (without exposing credentials)
  console.log("Creating Gmail email transporter with config:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    hasPassword: !!config.auth.pass
  });

  return nodemailer.createTransport(config);
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // Use EMAIL_USER for the from address, fallback to SMTP_USER
  const fromUser = env.EMAIL_USER || env.SMTP_USER;
  
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log("Email transporter not configured, using fallback");
      return await fallbackEmailSending(email, otp);
    }
    
    const mailOptions = {
      from: `"LifeFlow Blood Donation" <${fromUser}>`,
      to: email,
      subject: "Your LifeFlow Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🩸 LifeFlow</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Blood Donation Platform</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px 20px;">
            <h2 style="color: #374151; margin: 0 0 10px 0;">Email Verification</h2>
            <p style="color: #6b7280; margin: 0 0 20px 0;">Your verification code is:</p>
            
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #374151; letter-spacing: 3px;">${otp}</span>
            </div>
            
            <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            
            <p style="color: #ef4444; margin: 10px 0 0 0; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              © 2024 LifeFlow. Saving lives, one donation at a time.
            </p>
          </div>
        </div>
      `,
      text: `Your LifeFlow verification code is: ${otp}. This code will expire in 5 minutes. If you didn't request this code, please ignore this email.`
    };

    // Detailed debugging logs
    console.log(`Sending OTP email to: ${email}`);
    console.log(`OTP: ${otp} (for development/testing)`);
    console.log(`From: ${fromUser}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    
    // Test transporter connection before sending
    console.log("Testing transporter connection...");
    await transporter.verify();
    console.log("Transporter connection verified successfully");
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    console.log(`Email response:`, info);
    
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      email: email,
      fromUser: fromUser,
      environment: env.NODE_ENV,
      emailUserExists: !!env.EMAIL_USER,
      emailPassExists: !!env.EMAIL_PASS,
      smtpUserExists: !!env.SMTP_USER,
      smtpPassExists: !!env.SMTP_PASS
    });
    return false;
  }
}

// Fallback when email is not configured (dev only - production must use real SMTP)
async function fallbackEmailSending(email: string, otp: string): Promise<boolean> {
  if (process.env.NODE_ENV === "production") {
    console.error("PRODUCTION ERROR: EMAIL_USER/EMAIL_PASS are not set - cannot send OTP email in production.");
    console.error("Please configure email settings in Vercel dashboard:");
    console.error("- EMAIL_USER: your_email@gmail.com");
    console.error("- EMAIL_PASS: your_gmail_app_password");
    console.error("IMPORTANT: Use Gmail App Password, not your regular password!");
    console.error("Enable 2FA and generate App Password at: https://myaccount.google.com/apppasswords");
    return false;
  }
  
  console.log("DEVELOPMENT MODE - Email Configuration:");
  console.log(`To: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Valid for: 5 minutes`);
  console.log("Configure EMAIL_USER and EMAIL_PASS for real email sending");
  console.log("Gmail App Password required: https://myaccount.google.com/apppasswords");
  return true;
}

// Send welcome email after successful registration
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log("📧 Email transporter not configured, skipping welcome email");
      return true; // Don't fail registration if email is not configured
    }

    const mailOptions = {
      from: `"LifeFlow Blood Donation" <${env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to LifeFlow - Thank You for Registering!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🩸 LifeFlow</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Blood Donation Platform</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px 20px;">
            <h2 style="color: #374151; margin: 0 0 10px 0;">Welcome, ${name}! 🎉</h2>
            <p style="color: #6b7280; margin: 0 0 20px 0;">
              Thank you for joining LifeFlow! Your registration is complete and you're now part of our life-saving community.
            </p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 10px 0;">What's Next?</h3>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                <li>Complete your profile information</li>
                <li>Verify your email and phone number</li>
                <li>Set your availability status</li>
                <li>Start helping save lives! 🩸</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              © 2024 LifeFlow. Saving lives, one donation at a time.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to LifeFlow, ${name}! Thank you for registering. Your account is now active and you can start using our platform to help save lives.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent! Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    return true; // Don't fail registration for welcome email
  }
}
