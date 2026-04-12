-- Migration to add email_verified and phone_verified columns to users table
-- This fixes the "Unknown column 'email_verified' in 'field list'" error

-- Add verification columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add indexes for better query performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS users_email_verified_idx (email_verified),
ADD INDEX IF NOT EXISTS users_phone_verified_idx (phone_verified);

-- Update existing records to have default verification status
-- Existing users are considered unverified until they go through verification
UPDATE users 
SET email_verified = FALSE, phone_verified = FALSE 
WHERE email_verified IS NULL OR phone_verified IS NULL;

-- Migration completed successfully!
SELECT 'Verification columns added successfully!' as message;

-- Verify the columns were added
DESCRIBE users;
