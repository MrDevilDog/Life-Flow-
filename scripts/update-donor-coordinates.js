// Update donor coordinates for testing nearby donors feature
const { db } = require('./lib/mysql');

async function updateDonorCoordinates() {
  try {
    console.log('=== UPDATING DONOR COORDINATES ===\n');
    
    // Check current state
    const totalDonors = await db.query('SELECT COUNT(*) as count FROM donors');
    console.log(`Total donors: ${totalDonors[0].count}`);
    
    const donorsWithCoords = await db.query('SELECT COUNT(*) as count FROM donors WHERE lat != 0 AND lng != 0');
    console.log(`Donors with coordinates: ${donorsWithCoords[0].count}`);
    
    const donorsWithZeroCoords = await db.query('SELECT COUNT(*) as count FROM donors WHERE lat = 0 AND lng = 0');
    console.log(`Donors with zero coordinates: ${donorsWithZeroCoords[0].count}`);
    
    // Update donors with zero coordinates using sample city coordinates
    const updates = [
      { city: 'Delhi', lat: 28.6139, lng: 77.2090 },
      { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
      { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
      { city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
      { city: 'Pune', lat: 18.5204, lng: 73.8567 },
      { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    ];
    
    for (const update of updates) {
      const result = await db.query(
        'UPDATE donors SET lat = ?, lng = ? WHERE lat = 0 AND lng = 0 AND (location LIKE ? OR location LIKE ?)',
        [update.lat, update.lng, `%${update.city}%`, `%${update.city}%`]
      );
      console.log(`Updated ${result.affectedRows} donors for ${update.city} with coordinates (${update.lat}, ${update.lng})`);
    }
    
    // Verify updates
    const updatedDonorsWithCoords = await db.query('SELECT COUNT(*) as count FROM donors WHERE lat != 0 AND lng != 0');
    console.log(`Donors with coordinates after update: ${updatedDonorsWithCoords[0].count}`);
    
    // Show sample updated donors
    const sampleDonors = await db.query(`
      SELECT d.id, d.location, d.lat, d.lng, u.name 
      FROM donors d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.lat != 0 AND d.lng != 0 
      LIMIT 10
    `);
    
    console.log('\nSample donors with coordinates:');
    sampleDonors.forEach((donor, index) => {
      console.log(`  ${index + 1}. ID: ${donor.id}, Name: ${donor.name}, Location: ${donor.location}, Lat: ${donor.lat}, Lng: ${donor.lng}`);
    });
    
    console.log('\n=== COORDINATE UPDATE COMPLETE ===');
    
  } catch (error) {
    console.error('Error updating donor coordinates:', error);
  }
}

updateDonorCoordinates();
