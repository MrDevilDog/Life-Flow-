-- Migration script to upgrade existing database to production-level features
-- Run this script to update your existing database

-- 1. Add phone field to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_type ENUM('email', 'phone') NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_donation_date DATE NULL;

-- 2. Add unique constraints for email and phone
ALTER TABLE users 
ADD UNIQUE INDEX IF NOT EXISTS users_email_unique (email),
ADD UNIQUE INDEX IF NOT EXISTS users_phone_unique (phone),
ADD INDEX IF NOT EXISTS users_verification_type_idx (verification_type),
ADD INDEX IF NOT EXISTS users_last_donation_idx (last_donation_date);

-- 3. Create OTP verification table
CREATE TABLE IF NOT EXISTS otps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  otp VARCHAR(6) NOT NULL,
  type ENUM('email','phone','forgot_password') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX otps_user_type_idx (user_id, type),
  INDEX otps_expires_idx (expires_at),
  CONSTRAINT otps_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- 4. Update donors table with required coordinates
ALTER TABLE donors 
MODIFY COLUMN lat DECIMAL(9,6) NOT NULL DEFAULT 0.000000,
MODIFY COLUMN lng DECIMAL(9,6) NOT NULL DEFAULT 0.000000;

-- 5. Add index for location-based queries
ALTER TABLE donors 
ADD INDEX IF NOT EXISTS donors_location_idx (lat, lng);

-- 6. Add patient_phone to requests table (if not exists)
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(20) NOT NULL DEFAULT '';

-- 7. Clean up any duplicate users (keep the most recent one)
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.id > u2.id 
AND (u1.email = u2.email OR u1.phone = u2.phone);

-- 8. Update existing donors to have default coordinates if null
UPDATE donors 
SET lat = 0.000000, lng = 0.000000 
WHERE lat IS NULL OR lng IS NULL;

-- 9. Set existing users as verified (for existing data)
UPDATE users 
SET email_verified = TRUE, phone_verified = TRUE 
WHERE created_at < NOW() - INTERVAL 1 DAY;

-- 10. Create a cleanup function for expired OTPs
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupExpiredOTPs()
BEGIN
  DELETE FROM otps WHERE expires_at < NOW() OR used = TRUE;
END //
DELIMITER ;

-- Migration completed successfully!
SELECT 'Database migration completed successfully!' as message;
