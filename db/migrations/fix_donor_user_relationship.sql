-- Migration to fix donor-user relationship and ensure consistency
-- This addresses the "column blood_group does not exist" error by ensuring proper table structure

-- 1. Ensure donors table has all required columns
ALTER TABLE donors 
ADD COLUMN IF NOT EXISTS user_id BIGINT UNSIGNED NOT NULL,
ADD COLUMN IF NOT EXISTS blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL,
ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NOT NULL,
ADD COLUMN IF NOT EXISTS availability BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Ensure foreign key constraint exists
ALTER TABLE donors 
ADD CONSTRAINT IF NOT EXISTS donors_user_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Ensure unique constraint on user_id
ALTER TABLE donors 
ADD UNIQUE KEY IF NOT EXISTS donors_user_unique (user_id);

-- 4. Create donor records for users who don't have them
INSERT IGNORE INTO donors (user_id, blood_group, location, phone, availability, lat, lng)
SELECT u.id, 'O+', 'Unknown', u.phone, 1, 0, 0
FROM users u 
LEFT JOIN donors d ON u.id = d.user_id 
WHERE d.user_id IS NULL 
AND u.role = 'user';

-- 5. Update indexes for better performance
CREATE INDEX IF NOT EXISTS donors_search_idx ON donors (location, blood_group);
CREATE INDEX IF NOT EXISTS donors_location_idx ON donors (lat, lng);
CREATE INDEX IF NOT EXISTS donors_user_id_idx ON donors (user_id);

-- Migration completed successfully!
SELECT 'Donor-user relationship fixed successfully!' as message;

-- Verify the structure
DESCRIBE donors;
SELECT COUNT(*) as users_without_donor_records FROM users u 
LEFT JOIN donors d ON u.id = d.user_id 
WHERE d.user_id IS NULL AND u.role = 'user';
