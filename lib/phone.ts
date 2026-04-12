/**
 * Phone Number Standardization Library
 * 
 * This library ensures consistent phone number formatting across the entire system.
 * All phone numbers are stored and displayed in international format: +91XXXXXXXXXX
 */

export class PhoneValidator {
  /**
   * Standardize phone number to international format (+91XXXXXXXXXX)
   * @param phone - Input phone number (any format)
   * @returns Standardized phone number or null if invalid
   */
  static standardize(phone: string): string | null {
    if (!phone) return null;

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    let cleanDigits = digits;
    
    // Remove leading 91 or +91 if present
    if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
      cleanDigits = cleanDigits.substring(2);
    }
    
    // Remove leading 0 if present
    if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
      cleanDigits = cleanDigits.substring(1);
    }
    
    // Validate length (must be exactly 10 digits)
    if (cleanDigits.length !== 10) {
      return null;
    }

    // Validate that it's a valid Indian mobile number
    // Indian mobile numbers start with 6, 7, 8, or 9
    if (!/^[6-9]/.test(cleanDigits)) {
      return null;
    }

    // Return in international format
    return `+91${cleanDigits}`;
  }

  /**
   * Validate phone number format
   * @param phone - Phone number to validate
   * @returns True if valid, false otherwise
   */
  static isValid(phone: string): boolean {
    return this.standardize(phone) !== null;
  }

  /**
   * Format phone number for display
   * @param phone - Phone number (should already be standardized)
   * @returns Formatted phone number or 'N/A'
   */
  static formatDisplay(phone: string): string {
    if (!phone) return 'N/A';
    
    // If already in international format, return as-is
    if (phone.startsWith('+91')) {
      return phone;
    }
    
    // Try to standardize first
    const standardized = this.standardize(phone);
    return standardized || phone;
  }

  /**
   * Extract digits from phone number
   * @param phone - Phone number in any format
   * @returns Digits only
   */
  static extractDigits(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Check if two phone numbers are the same (ignoring format)
   * @param phone1 - First phone number
   * @param phone2 - Second phone number
   * @returns True if they represent the same number
   */
  static areSame(phone1: string, phone2: string): boolean {
    const standardized1 = this.standardize(phone1);
    const standardized2 = this.standardize(phone2);
    
    return standardized1 !== null && standardized1 === standardized2;
  }

  /**
   * Generate validation error message
   * @param phone - Invalid phone number
   * @returns Appropriate error message
   */
  static getErrorMessage(phone: string): string {
    const digits = this.extractDigits(phone);
    
    if (!phone) {
      return "Phone number is required";
    }
    
    if (digits.length < 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    if (digits.length > 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    if (!/^[6-9]/.test(digits)) {
      return "Invalid Indian mobile number. Must start with 6, 7, 8, or 9";
    }
    
    return "Invalid phone number format";
  }
}

/**
 * Zod schema for phone number validation with standardization
 */
import { z } from "zod";

export const phoneSchema = z.string()
  .min(1, "Phone number is required")
  .transform((val) => PhoneValidator.standardize(val))
  .refine((val) => val !== null, {
    message: "Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9"
  });

/**
 * Middleware for phone number standardization in API routes
 */
export function standardizePhoneMiddleware(phone: string): { success: boolean; phone?: string; error?: string } {
  const standardized = PhoneValidator.standardize(phone);
  
  if (!standardized) {
    return {
      success: false,
      error: PhoneValidator.getErrorMessage(phone)
    };
  }
  
  return {
    success: true,
    phone: standardized
  };
}
