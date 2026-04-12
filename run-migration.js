// Simple script to run the verification_type migration
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running verification_type migration...');
  
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
      path.join(__dirname, 'db/migrations/add_verification_type.sql'),
      'utf8'
    );
    
    console.log('📝 Executing migration SQL...');
    const [results] = await connection.execute(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Results:', results);
    
    // Close connection
    await connection.end();
    
    console.log('🎉 Database schema updated successfully!');
    console.log('📝 verification_type column added to users table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists - no action needed');
    } else {
      process.exit(1);
    }
  }
}

// Run the migration
runMigration();
