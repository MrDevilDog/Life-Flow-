import nodemailer from 'nodemailer';
import { env } from './env';

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create email transporter
function createTransporter() {
  const config: EmailConfig = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  };

  // Check if email configuration is available
  if (!config.auth.user || !config.auth.pass) {
    console.warn("⚠️  Email configuration not found in environment variables");
    console.warn("📝 Set SMTP_USER and SMTP_PASS in .env.local for real email sending");
    console.warn("🔗 For Gmail, use an App Password: https://myaccount.google.com/apppasswords");
    return null;
  }

  return nodemailer.createTransport(config);
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log("📧 Email transporter not configured, using fallback");
      return await fallbackEmailSending(email, otp);
    }

    const mailOptions = {
      from: `"LifeFlow Blood Donation" <${env.SMTP_USER}>`,
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

    console.log(`📧 Sending OTP email to: ${email}`);
    console.log(`🔢 OTP: ${otp} (for development/testing)`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
}

// Fallback when SMTP is not configured (dev only — production must use real SMTP)
async function fallbackEmailSending(email: string, otp: string): Promise<boolean> {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "SMTP_USER / SMTP_PASS are not set — cannot send OTP email in production.",
    );
    return false;
  }
  console.log("📧 DEVELOPMENT MODE - Email Configuration:");
  console.log(`📧 To: ${email}`);
  console.log(`🔢 OTP: ${otp}`);
  console.log(`⏰ Valid for: 5 minutes`);
  console.log("💡 Configure SMTP_USER and SMTP_PASS for real email sending");
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
