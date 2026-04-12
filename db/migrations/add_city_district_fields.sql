-- Migration: Add City and District Fields for Geocoding
-- Purpose: Support automatic city and district detection from latitude/longitude

-- Add city and district fields to donors table
ALTER TABLE donors 
ADD COLUMN city VARCHAR(255) NULL AFTER location,
ADD COLUMN district VARCHAR(255) NULL AFTER city;

-- Add city and district fields to requests table (already has city, add district)
ALTER TABLE requests 
ADD COLUMN district VARCHAR(255) NULL AFTER city;

-- Add indexes for better search performance
ALTER TABLE donors 
ADD INDEX donors_city_idx (city),
ADD INDEX donors_district_idx (district),
ADD INDEX donors_city_district_idx (city, district);

ALTER TABLE requests 
ADD INDEX requests_district_idx (district),
ADD INDEX requests_city_district_idx (city, district);

-- Add comment explaining the purpose
ALTER TABLE donors COMMENT = 'Donor information with geocoded location data';
ALTER TABLE requests COMMENT = 'Blood requests with geocoded location data';

-- Update existing records to populate city/district from location field
-- This is a one-time migration for existing data
UPDATE donors d 
SET d.city = (
  CASE 
    WHEN d.location LIKE '%,%' THEN TRIM(SUBSTRING_INDEX(d.location, ',', 1))
    ELSE d.location
  END
)
WHERE d.city IS NULL AND d.location IS NOT NULL;

-- Log migration completion
SELECT 'Migration completed: Added city and district fields with indexes' as status;
