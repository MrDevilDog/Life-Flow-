-- DATABASE CLEANUP SCRIPT
-- Run this to remove duplicates and reset donors

-- 1. DELETE ALL DONORS (RESET)
-- This will completely reset the donors table
DELETE FROM donors;
ALTER TABLE donors AUTO_INCREMENT = 1;
SELECT '✅ All donors deleted and table reset' as status;

-- 2. REMOVE DUPLICATE USERS
-- Keep only the most recent user for each email/phone combination

-- First, let's see the duplicates
SELECT 
    email, 
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY id DESC) as user_ids
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Remove duplicate users, keeping the latest one (highest ID)
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.id < u2.id 
AND (u1.email = u2.email OR u1.phone = u2.phone);

-- Alternative approach if the above doesn't work:
-- Create a temporary table with unique users
CREATE TEMPORARY TABLE temp_users AS
SELECT u.*
FROM users u
WHERE u.id IN (
    SELECT MAX(id) as max_id
    FROM users
    GROUP BY email
);

-- Delete all users
DELETE FROM users;

-- Insert back only unique users
INSERT INTO users 
SELECT * FROM temp_users;

-- Drop temp table
DROP TEMPORARY TABLE temp_users;

SELECT '✅ Duplicate users removed' as status;

-- 3. ADD UNIQUE CONSTRAINTS (if not already exists)
-- Add unique constraint to email
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add unique constraint to phone  
ALTER TABLE users 
ADD CONSTRAINT users_phone_unique UNIQUE (phone);

SELECT '✅ Unique constraints added to email and phone' as status;

-- 4. VERIFY CLEANUP
-- Show remaining users
SELECT COUNT(*) as total_users FROM users;
SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC LIMIT 10;

-- Show donors (should be empty)
SELECT COUNT(*) as total_donors FROM donors;

-- 5. RESET AUTO INCREMENT
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE donors AUTO_INCREMENT = 1;

SELECT '✅ Auto increment reset' as status;

-- 6. CLEANUP EXPIRED OTPs
DELETE FROM otps WHERE expires_at < NOW() OR used = TRUE;
SELECT '✅ Expired OTPs cleaned' as status;

-- FINAL SUMMARY
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM donors) as total_donors,
    (SELECT COUNT(*) FROM otps WHERE used = FALSE AND expires_at > NOW()) as active_otps;

SELECT '🎉 Database cleanup completed!' as final_status;
