// Simple script to run OTP ENUM migration
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runOTPEnumMigration() {
  console.log('🔄 Running OTP ENUM migration...');
  
  try {
    // Read database configuration from environment or use defaults
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blood_donation',
      multipleStatements: true
    };

    console.log('📊 Connecting to database:', dbConfig.database);
    
    // Create connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Read and execute migration
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'db/migrations/fix_otp_enum.sql'),
      'utf8'
    );
    
    console.log('📝 Executing OTP ENUM migration...');
    const [results] = await connection.execute(migrationSQL);
    
    console.log('✅ OTP ENUM migration completed!');
    
    // Close connection
    await connection.end();
    
    console.log('🎉 OTP table ENUM updated successfully!');
    console.log('📝 Added forgot_password to OTP type ENUM');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  ENUM already includes forgot_password - no action needed');
    } else {
      process.exit(1);
    }
  }
}

// Run the migration
runOTPEnumMigration();
