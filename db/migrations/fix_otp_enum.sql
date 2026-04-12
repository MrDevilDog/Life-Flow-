-- Migration to fix OTP ENUM to include forgot_password type
-- This fixes the "Data truncated for column 'type' at row 1" error

-- Update the type ENUM to include forgot_password
ALTER TABLE otps 
MODIFY COLUMN type ENUM('email','phone','forgot_password') NOT NULL;

-- Verify the change was applied
DESCRIBE otps;

-- Test the ENUM values
SELECT 'Testing ENUM values:' as info;
SELECT 'email' as test_value, 'email' IN (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'otps' AND COLUMN_NAME = 'type') as valid;
SELECT 'phone' as test_value, 'phone' IN (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'otps' AND COLUMN_NAME = 'type') as valid;
SELECT 'forgot_password' as test_value, 'forgot_password' IN (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'otps' AND COLUMN_NAME = 'type') as valid;

-- Migration completed successfully!
SELECT 'OTP ENUM migration completed successfully!' as message;
