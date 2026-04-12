
import crypto from 'crypto';
import { db } from '@/lib/mysql';
import { sendOTPEmail } from './email';
import { VerificationUtils } from './verification-utils';

export type OTPType = 'email' | 'phone' | 'forgot_password';

export interface OTPData {
  id: number;
  user_id: number;
  otp: string;
  type: OTPType;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  email?: string;
  phone?: string;
  verification_session?: string;
}

// ✅ Normalize phone
function normalizePhone(phone?: string) {
  if (!phone) return phone;
  return phone.replace(/\D/g, '');
}

// Generate 6-digit OTP
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`🔢 Generated OTP: ${otp}`);
  return otp;
}

// Send OTP
export async function sendOTP(phone: string, email: string, otp: string, type: OTPType): Promise<boolean> {
  try {
    console.log(`📤 Sending OTP via ${type}`);

    if (type === 'email') {
      return await sendOTPEmail(email, otp);
    } else {
      console.log(`📱 SMS OTP not implemented. OTP: ${otp}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to send OTP:', error);
    return false;
  }
}

// Store OTP
export async function storeOTP(
  contact: string,
  otp: string,
  type: OTPType,
  email?: string,
  phone?: string
): Promise<boolean> {
  try {
    const cleanContact =
      type === 'phone' ? normalizePhone(contact) : contact;

    console.log("📝 STORE OTP:", {
      original: contact,
      cleaned: cleanContact,
      type
    });

    // delete old OTPs
    await db.query(
      'DELETE FROM otps WHERE contact = ? AND type = ? AND used = FALSE',
      [cleanContact, type]
    );

    let verificationSession = null;
    if (email && phone) {
      verificationSession = VerificationUtils.generateSessionKey(email, phone);
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'INSERT INTO otps (contact, otp, type, expires_at, email, phone, verification_session) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        cleanContact,
        otp,
        type,
        expiresAt,
        email || null,
        phone ? normalizePhone(phone) : null,
        verificationSession
      ]
    );

    console.log("✅ OTP STORED FOR:", cleanContact);
    return true;

  } catch (error) {
    console.error('❌ Failed to store OTP:', error);
    return false;
  }
}

// Verify OTP
export async function verifyOTP(
  contact: string,
  otp: string,
  type: OTPType,
  expectedEmail?: string,
  expectedPhone?: string
): Promise<boolean> {
  try {
    const cleanContact =
      type === 'phone' ? normalizePhone(contact) : contact;

    console.log("🔍 VERIFY OTP:", {
      original: contact,
      cleaned: cleanContact,
      type
    });

    const rows = await db.query<any[]>(
      `SELECT id, email, phone, verification_session, used, expires_at
       FROM otps
       WHERE contact = ? AND otp = ? AND type = ? AND used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [cleanContact, otp, type]
    );

    if (rows.length === 0) {
      console.log("❌ OTP NOT FOUND FOR:", cleanContact);
      return false;
    }

    const record = rows[0];

    // expiry check
    if (new Date() > new Date(record.expires_at)) {
      console.log("❌ OTP EXPIRED");
      return false;
    }

    // optional security check
    if (expectedEmail && expectedPhone && record.verification_session) {
      const valid = VerificationUtils.validateVerificationData(
        expectedEmail,
        expectedPhone,
        record.email,
        record.phone
      );
      if (!valid) {
        console.log("❌ SECURITY CHECK FAILED");
        return false;
      }
    }

    // mark used
    await db.query('UPDATE otps SET used = TRUE WHERE id = ?', [record.id]);

    console.log("✅ OTP VERIFIED:", cleanContact);
    return true;

  } catch (error) {
    console.error('❌ Failed to verify OTP:', error);
    return false;
  }
}

