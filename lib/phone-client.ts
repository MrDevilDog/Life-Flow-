/**
 * Client-side Phone Number Utilities
 * 
 * Client-side phone number formatting and validation utilities
 */

export class PhoneFormatter {
  /**
   * Format phone number for display
   * @param phone - Phone number from API (should be standardized)
   * @returns Formatted phone number or 'N/A'
   */
  static formatDisplay(phone: string): string {
    if (!phone || phone === 'N/A') {
      return 'N/A';
    }
    
    // If already in international format, return as-is
    if (phone.startsWith('+91')) {
      return phone;
    }
    
    // Try to format any other format to international
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    
    // Return original if can't format
    return phone;
  }

  /**
   * Format phone number for input field (user-friendly)
   * @param phone - Phone number
   * @returns User-friendly format
   */
  static formatInput(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it's 10 digits, format as XXXXX-XXXXX
    if (digits.length === 10) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    
    // If it's 12 digits with country code, format as +91 XXXXX-XXXXX
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+91 ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    
    return phone;
  }

  /**
   * Validate phone number input
   * @param phone - Phone number input
   * @returns Validation result
   */
  static validateInput(phone: string): { isValid: boolean; error?: string; formatted?: string } {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check length
    if (digits.length < 10) {
      return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }
    
    if (digits.length > 10) {
      return { isValid: false, error: 'Phone number must be exactly 10 digits' };
    }
    
    // Check if it starts with valid Indian mobile prefix
    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, error: 'Invalid Indian mobile number. Must start with 6, 7, 8, or 9' };
    }
    
    // Return standardized format
    return { 
      isValid: true, 
      formatted: `+91${digits}` 
    };
  }

  /**
   * Handle phone number input change
   * @param value - Input value
   * @returns Formatted value and validation
   */
  static handleInputChange(value: string): { value: string; isValid: boolean; error?: string } {
    // Remove all non-digit characters for validation
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    
    // Format for display
    let displayValue = value;
    if (limitedDigits.length <= 10) {
      displayValue = limitedDigits;
      if (limitedDigits.length === 10) {
        displayValue = `${limitedDigits.slice(0, 5)}-${limitedDigits.slice(5)}`;
      }
    }
    
    // Validate
    const validation = this.validateInput(limitedDigits);
    
    return {
      value: displayValue,
      isValid: validation.isValid,
      error: validation.error
    };
  }

  /**
   * Get phone number type (mobile/landline)
   * @param phone - Phone number
   * @returns Phone number type
   */
  static getPhoneType(phone: string): 'mobile' | 'landline' | 'unknown' {
    if (!phone) return 'unknown';
    
    const digits = phone.replace(/\D/g, '');
    
    // Indian mobile numbers start with 6, 7, 8, or 9
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return 'mobile';
    }
    
    // Landline numbers typically start with 2, 3, or 4 in India
    if (digits.length === 10 && /^[2-4]/.test(digits)) {
      return 'landline';
    }
    
    return 'unknown';
  }

  /**
   * Mask phone number for privacy
   * @param phone - Phone number
   * @returns Masked phone number
   */
  static maskPhone(phone: string): string {
    if (!phone) return 'N/A';
    
    // If in international format
    if (phone.startsWith('+91')) {
      return `+91XXXXX${phone.slice(-4)}`;
    }
    
    // If 10 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `XXXXX${digits.slice(-4)}`;
    }
    
    return phone;
  }
}
