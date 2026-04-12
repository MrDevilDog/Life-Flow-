-- Add latitude and longitude columns to donors table
ALTER TABLE donors ADD COLUMN lat DECIMAL(9,6) NULL;
ALTER TABLE donors ADD COLUMN lng DECIMAL(9,6) NULL;

-- Add index for location-based queries
CREATE INDEX idx_donor_location ON donors(lat, lng);
