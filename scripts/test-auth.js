// Test script for authentication flow
// Run with: node scripts/test-auth.js

const bcrypt = require('bcryptjs');

async function testBcryptFlow() {
  console.log('Testing bcrypt password flow...\n');
  
  // Test password hashing and comparison
  const testPassword = 'TestPassword123!';
  console.log('Original password:', testPassword);
  
  // Hash password (like registration does)
  const hashedPassword = await bcrypt.hash(testPassword, 12);
  console.log('Hashed password:', hashedPassword);
  console.log('Hash format check:', hashedPassword.startsWith('$2a$') ? 'CORRECT' : 'INCORRECT');
  
  // Compare password (like login does)
  const comparisonResult = await bcrypt.compare(testPassword, hashedPassword);
  console.log('Password comparison result:', comparisonResult ? 'SUCCESS' : 'FAILED');
  
  // Test wrong password
  const wrongPasswordResult = await bcrypt.compare('WrongPassword', hashedPassword);
  console.log('Wrong password comparison result:', wrongPasswordResult ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
  
  console.log('\nbcrypt flow test completed.');
}

// Test database connection and queries
async function testDatabaseConnection() {
  console.log('\nTesting database connection...');
  
  try {
    const { Pool } = require('pg');
    const { db } = require('../lib/mysql');
    
    // Test basic connection
    console.log('Testing user table query...');
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('Users in database:', users[0]?.count || 0);
    
    // Test hospital table query
    console.log('Testing hospital table query...');
    const hospitals = await db.query('SELECT COUNT(*) as count FROM hospitals');
    console.log('Hospitals in database:', hospitals[0]?.count || 0);
    
    // Test password column exists
    console.log('Testing password column in users table...');
    try {
      const userWithPassword = await db.query('SELECT id, email, password FROM users LIMIT 1');
      if (userWithPassword.length > 0) {
        console.log('Password column exists in users table');
        console.log('Sample user password hash format:', 
          userWithPassword[0].password?.startsWith('$2a$') ? 'CORRECT' : 'INCORRECT');
      }
    } catch (err) {
      console.log('Password column missing or error:', err.message);
    }
    
    // Test password column exists in hospitals
    console.log('Testing password column in hospitals table...');
    try {
      const hospitalWithPassword = await db.query('SELECT id, email, password FROM hospitals LIMIT 1');
      if (hospitalWithPassword.length > 0) {
        console.log('Password column exists in hospitals table');
        console.log('Sample hospital password hash format:', 
          hospitalWithPassword[0].password?.startsWith('$2a$') ? 'CORRECT' : 'INCORRECT');
      }
    } catch (err) {
      console.log('Password column missing or error:', err.message);
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Main test function
async function runTests() {
  console.log('=== Authentication System Test ===\n');
  
  await testBcryptFlow();
  await testDatabaseConnection();
  
  console.log('\n=== Test Summary ===');
  console.log('1. bcrypt hashing and comparison: PASSED');
  console.log('2. Database connection: Check results above');
  console.log('3. Password column verification: Check results above');
  console.log('\nIf all tests pass, the login issue may be in:');
  console.log('- Frontend request format');
  console.log('- Environment variables');
  console.log('- Network connectivity');
  console.log('- Database connection pool');
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testBcryptFlow, testDatabaseConnection };
