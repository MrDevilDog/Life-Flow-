-- Migration: Secure OTP Verification with Email+Phone Binding
-- Purpose: Ensure OTP is tied to specific email+phone combinations to prevent misuse

-- Add columns to store email and phone for secure verification
ALTER TABLE otps 
ADD COLUMN email VARCHAR(255) NULL AFTER contact,
ADD COLUMN phone VARCHAR(255) NULL AFTER email,
ADD COLUMN verification_session VARCHAR(255) NULL AFTER phone;

-- Add index for verification session lookup
ALTER TABLE otps 
ADD INDEX otps_verification_session_idx (verification_session);

-- Add constraint to ensure either email or phone is provided
ALTER TABLE otps 
ADD CONSTRAINT chk_otps_contact 
CHECK (
  (contact IS NOT NULL) OR 
  (email IS NOT NULL AND phone IS NOT NULL)
);

-- Add comment explaining the security enhancement
ALTER TABLE otps COMMENT = 'OTP verification table with email+phone binding for secure registration';

-- Update existing OTPs to maintain compatibility
-- For existing records, we'll populate email/phone from users table based on contact
UPDATE otps o 
JOIN users u ON (o.contact = u.email OR o.contact = u.phone)
SET 
  o.email = u.email,
  o.phone = u.phone,
  o.verification_session = CONCAT(u.email, ':', u.phone)
WHERE o.verification_session IS NULL;

-- Create a view for secure OTP lookups
CREATE OR REPLACE VIEW secure_otps AS
SELECT 
  id,
  COALESCE(email, contact) as primary_contact,
  email,
  phone,
  verification_session,
  otp,
  type,
  expires_at,
  used,
  created_at
FROM otps
WHERE verification_session IS NOT NULL OR contact IS NOT NULL;
