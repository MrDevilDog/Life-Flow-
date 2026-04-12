// Check donor coordinates in database
const { db } = require('./lib/mysql');

async function checkDonorCoordinates() {
  try {
    console.log('=== DONOR COORDINATES CHECK ===\n');
    
    // Check total donors
    const totalDonors = await db.query('SELECT COUNT(*) as count FROM donors');
    console.log(`Total donors in database: ${totalDonors[0].count}`);
    
    // Check donors with coordinates
    const donorsWithCoords = await db.query('SELECT COUNT(*) as count FROM donors WHERE lat IS NOT NULL AND lng IS NOT NULL');
    console.log(`Donors with coordinates: ${donorsWithCoords[0].count}`);
    
    // Check donors without coordinates
    const donorsWithoutCoords = await db.query('SELECT COUNT(*) as count FROM donors WHERE lat IS NULL OR lng IS NULL');
    console.log(`Donors without coordinates: ${donorsWithoutCoords[0].count}`);
    
    // Sample donor data
    const sampleDonors = await db.query(`
      SELECT id, name, lat, lng, location, availability 
      FROM donors 
      LIMIT 10
    `);
    
    console.log('\nSample donor data:');
    sampleDonors.forEach(donor => {
      console.log(`ID: ${donor.id}, Name: ${donor.name}`);
      console.log(`  Location: ${donor.location}`);
      console.log(`  Lat: ${donor.lat}, Lng: ${donor.lng}`);
      console.log(`  Available: ${donor.availability}`);
      console.log('---');
    });
    
    // Check if lat/lng are 0 (default values)
    const donorsWithZeroCoords = await db.query('SELECT COUNT(*) as count FROM donors WHERE lat = 0 AND lng = 0');
    console.log(`Donors with zero coordinates (default): ${donorsWithZeroCoords[0].count}`);
    
    // Check registration flow - see if recent users have donor records
    const recentUsers = await db.query(`
      SELECT u.id, u.name, u.email, u.created_at,
             d.id as donor_id, d.lat, d.lng, d.location
      FROM users u 
      LEFT JOIN donors d ON u.id = d.user_id 
      WHERE u.role = 'user' 
      ORDER BY u.created_at DESC 
      LIMIT 5
    `);
    
    console.log('\nRecent users and their donor records:');
    recentUsers.forEach(user => {
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  Donor record: ${user.donor_id ? 'YES' : 'NO'}`);
      if (user.donor_id) {
        console.log(`  Donor location: ${user.location}`);
        console.log(`  Donor coords: ${user.lat}, ${user.lng}`);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking donor coordinates:', error);
  }
}

checkDonorCoordinates();
