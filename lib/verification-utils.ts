/**
 * Verification utilities for masking and securing contact information
 */

export class VerificationUtils {
  /**
   * Mask email address for security
   * Example: john.doe@gmail.com → j****@gmail.com
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number for security
   * Example: +919876543210 → +91******3210
   */
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    
    // Keep first 4 and last 4 characters, mask the rest
    const start = phone.slice(0, 4);
    const end = phone.slice(-4);
    const middle = '*'.repeat(phone.length - 8);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Generate a verification session key
   */
  static generateSessionKey(email: string, phone: string): string {
    // Create a unique key for the email+phone combination
    const combined = `${email}:${phone}`;
    return Buffer.from(combined).toString('base64');
  }

  /**
   * Extract email and phone from session key
   */
  static extractFromSessionKey(sessionKey: string): { email: string; phone: string } | null {
    try {
      const decoded = Buffer.from(sessionKey, 'base64').toString();
      const [email, phone] = decoded.split(':');
      return { email, phone };
    } catch {
      return null;
    }
  }

  /**
   * Validate that OTP verification matches original registration data
   */
  static validateVerificationData(
    originalEmail: string,
    originalPhone: string,
    currentEmail: string,
    currentPhone: string
  ): boolean {
    return originalEmail === currentEmail && originalPhone === currentPhone;
  }
}
