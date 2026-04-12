-- Migration to add verification_type column to users table
-- This fixes the "Unknown column 'verification_type' in 'field list'" error

-- Add verification_type column with default value for existing data
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_type ENUM('email', 'phone') NOT NULL DEFAULT 'email';

-- Add index for better query performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS users_verification_type_idx (verification_type);

-- Update any existing records to have a default verification type
-- (This handles any records that might exist before this migration)
UPDATE users 
SET verification_type = 'email' 
WHERE verification_type IS NULL;

-- Add last_donation_date column if it doesn't exist (for completeness)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_donation_date DATE NULL;

-- Add index for last_donation_date for better performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS users_last_donation_idx (last_donation_date);

-- Migration completed successfully!
SELECT 'verification_type column added successfully!' as message;
