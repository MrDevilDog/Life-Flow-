const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runPhoneNormalization() {
  let connection;
  
  try {
    console.log("🔄 Starting phone number normalization...");
    
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blood_donation',
      multipleStatements: true // Allow multiple SQL statements
    });
    
    console.log("✅ Connected to database");
    
    // Read and execute the migration script
    const migrationPath = path.join(__dirname, 'db/migrations/normalize_phone_numbers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log("📝 Executing phone normalization migration...");
    
    // Execute the migration
    const [results] = await connection.execute(migrationSQL);
    
    console.log("✅ Phone normalization completed successfully!");
    
    // Show results
    if (Array.isArray(results) && results.length > 0) {
      console.log("\n📊 Migration Results:");
      
      // Find the result sets that contain our reporting data
      const reportResults = results.filter(result => 
        Array.isArray(result) && 
        result.length > 0 && 
        result[0].table_name
      );
      
      if (reportResults.length > 0) {
        console.log("\n📈 Phone Number Statistics:");
        reportResults[0].forEach(row => {
          console.log(`  ${row.table_name}:`);
          console.log(`    Total records: ${row.total_records}`);
          console.log(`    Normalized phones: ${row.normalized_phones}`);
          console.log(`    Empty phones: ${row.empty_phones}`);
        });
      }
      
      // Show any invalid numbers that need manual review
      const invalidResults = results.filter(result => 
        Array.isArray(result) && 
        result.length > 0 && 
        result[0].issue
      );
      
      if (invalidResults.length > 0 && invalidResults[0].length > 0) {
        console.log("\n⚠️  Invalid Numbers (Need Manual Review):");
        invalidResults[0].forEach(row => {
          console.log(`  ${row.issue}: ${row.phone} (ID: ${row.id})`);
        });
      } else {
        console.log("\n✅ All phone numbers are now properly formatted!");
      }
    }
    
    console.log("\n🎉 Phone number normalization completed!");
    console.log("📱 All phone numbers are now in format: +91XXXXXXXXXX");
    console.log("🔒 Database constraints added to prevent invalid formats");
    
  } catch (error) {
    console.error("❌ Phone normalization failed:", error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log("💡 Tip: Remove duplicate phone numbers before running this migration");
    }
    
    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      console.log("💡 Tip: Some phone numbers have invalid format and need manual review");
    }
    
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Check if this file is being run directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  runPhoneNormalization();
}

module.exports = { runPhoneNormalization };
