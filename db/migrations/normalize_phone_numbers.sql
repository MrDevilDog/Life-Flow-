-- Normalize Phone Numbers Migration
-- This script converts all existing phone numbers to international format (+91XXXXXXXXXX)
-- and removes duplicates

-- Step 1: Create a backup of existing data
CREATE TABLE IF NOT EXISTS users_phone_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS donors_phone_backup AS SELECT * FROM donors;

-- Step 2: Normalize phone numbers in users table
UPDATE users 
SET phone = CASE 
    -- Already in correct format
    WHEN phone REGEXP '^\\+91[0-9]{10}$' THEN phone
    
    -- 10-digit numbers, add +91 prefix
    WHEN phone REGEXP '^[0-9]{10}$' THEN CONCAT('+91', phone)
    
    -- Numbers with spaces/hyphens, extract digits and add +91
    WHEN phone REGEXP '^[0-9\\s\\-]{10,}$' THEN CONCAT('+91', REGEXP_REPLACE(REGEXP_REPLACE(phone, '[^0-9]', ''), '^91', ''))
    
    -- Numbers starting with 0, replace with +91
    WHEN phone REGEXP '^0[0-9]{9}$' THEN CONCAT('+91', SUBSTRING(phone, 2))
    
    -- Numbers starting with 91, add + prefix
    WHEN phone REGEXP '^91[0-9]{10}$' THEN CONCAT('+', phone)
    
    -- Invalid format, set to empty for manual review
    ELSE ''
END
WHERE phone != '' AND phone IS NOT NULL;

-- Step 3: Normalize phone numbers in donors table
UPDATE donors 
SET phone = CASE 
    -- Already in correct format
    WHEN phone REGEXP '^\\+91[0-9]{10}$' THEN phone
    
    -- 10-digit numbers, add +91 prefix
    WHEN phone REGEXP '^[0-9]{10}$' THEN CONCAT('+91', phone)
    
    -- Numbers with spaces/hyphens, extract digits and add +91
    WHEN phone REGEXP '^[0-9\\s\\-]{10,}$' THEN CONCAT('+91', REGEXP_REPLACE(REGEXP_REPLACE(phone, '[^0-9]', ''), '^91', ''))
    
    -- Numbers starting with 0, replace with +91
    WHEN phone REGEXP '^0[0-9]{9}$' THEN CONCAT('+91', SUBSTRING(phone, 2))
    
    -- Numbers starting with 91, add + prefix
    WHEN phone REGEXP '^91[0-9]{10}$' THEN CONCAT('+', phone)
    
    -- Invalid format, set to empty for manual review
    ELSE ''
END
WHERE phone != '' AND phone IS NOT NULL;

-- Step 4: Remove duplicates in users table
-- Keep the first occurrence and mark others for review
CREATE TEMPORARY TABLE user_duplicates AS
SELECT phone, COUNT(*) as count, GROUP_CONCAT(id) as ids
FROM users 
WHERE phone != '' AND phone IS NOT NULL
GROUP BY phone 
HAVING count > 1;

-- Step 5: Remove duplicates in donors table (keep first occurrence)
DELETE d1 FROM donors d1
INNER JOIN donors d2 
WHERE d1.phone = d2.phone 
AND d1.id > d2.id
AND d1.phone != '' 
AND d1.phone IS NOT NULL;

-- Step 6: Add validation constraint for future entries
-- This ensures all new phone numbers follow the international format
ALTER TABLE users 
ADD CONSTRAINT chk_phone_format 
CHECK (phone = '' OR phone IS NULL OR phone REGEXP '^\\+91[0-9]{10}$');

ALTER TABLE donors 
ADD CONSTRAINT chk_phone_format 
CHECK (phone = '' OR phone IS NULL OR phone REGEXP '^\\+91[0-9]{10}$');

-- Step 7: Report results
SELECT 
    'users_table' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN phone REGEXP '^\\+91[0-9]{10}$' THEN 1 ELSE 0 END) as normalized_phones,
    SUM(CASE WHEN phone = '' OR phone IS NULL THEN 1 ELSE 0 END) as empty_phones
FROM users

UNION ALL

SELECT 
    'donors_table' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN phone REGEXP '^\\+91[0-9]{10}$' THEN 1 ELSE 0 END) as normalized_phones,
    SUM(CASE WHEN phone = '' OR phone IS NULL THEN 1 ELSE 0 END) as empty_phones
FROM donors;

-- Step 8: Show any invalid numbers that need manual review
SELECT 'users_invalid_phones' as issue, phone, id, name, email
FROM users 
WHERE phone != '' 
AND phone IS NOT NULL 
AND phone NOT REGEXP '^\\+91[0-9]{10}$'

UNION ALL

SELECT 'donors_invalid_phones' as issue, phone, id, '' as name, '' as email
FROM donors 
WHERE phone != '' 
AND phone IS NOT NULL 
AND phone NOT REGEXP '^\\+91[0-9]{10}$';

-- Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS user_duplicates;
