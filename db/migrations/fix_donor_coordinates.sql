-- Migration to fix donor coordinates for nearby donors feature
-- This will geocode existing donor locations to get proper latitude/longitude

-- First, let's see how many donors have zero coordinates
SELECT COUNT(*) as donors_with_zero_coords FROM donors WHERE lat = 0 AND lng = 0;

-- Update donors with zero coordinates by geocoding their location
-- Note: This is a manual process, here's the approach:

-- 1. Identify donors with zero coordinates
SELECT id, user_id, name, location, lat, lng 
FROM donors 
WHERE lat = 0 AND lng = 0 
AND location IS NOT NULL 
AND location != 'Unknown'
AND location != '';

-- 2. For each donor, you would typically:
--    - Use a geocoding service to get coordinates from the location
--    - Update the donor record with the new coordinates

-- Example update (you'll need to run this for each donor with actual coordinates):
UPDATE donors 
SET lat = 28.6139, lng = 77.2090 
WHERE id = 1 AND location = 'New Delhi';

-- For testing purposes, let's add some sample coordinates for major cities
-- (In production, you'd use a proper geocoding service)

UPDATE donors SET lat = 28.6139, lng = 77.2090 WHERE location LIKE '%Delhi%' AND lat = 0;
UPDATE donors SET lat = 19.0760, lng = 72.8777 WHERE location LIKE '%Mumbai%' AND lat = 0;
UPDATE donors SET lat = 12.9716, lng = 77.5946 WHERE location LIKE '%Bangalore%' AND lat = 0;
UPDATE donors SET lat = 17.3850, lng = 78.4867 WHERE location LIKE '%Hyderabad%' AND lat = 0;
UPDATE donors SET lat = 22.5726, lng = 88.3639 WHERE location LIKE '%Kolkata%' AND lat = 0;
UPDATE donors SET lat = 13.0827, lng = 80.2707 WHERE location LIKE '%Chennai%' AND lat = 0;
UPDATE donors SET lat = 26.9124, lng = 75.7873 WHERE location LIKE '%Jaipur%' AND lat = 0;
UPDATE donors SET lat = 26.8467, lng = 80.9462 WHERE location LIKE '%Lucknow%' AND lat = 0;

-- Verify the updates
SELECT COUNT(*) as donors_with_coords_now FROM donors WHERE lat != 0 AND lng != 0;

-- Show sample updated donors
SELECT id, name, location, lat, lng 
FROM donors 
WHERE lat != 0 AND lng != 0 
LIMIT 10;

-- Migration completed!
SELECT 'Donor coordinates migration completed!' as message;
