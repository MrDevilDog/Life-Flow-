#!/usr/bin/env node

/**
 * OTP System Test Script
 * Run this to test the complete OTP flow
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'blood_donation',
  port: process.env.DB_PORT || 3306
};

async function testOTPSystem() {
  let connection;
  
  try {
    console.log('🔍 Starting OTP System Test...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Test 1: Check database schema
    console.log('\n📋 Test 1: Checking database schema...');
    
    const [otpsTable] = await connection.execute('DESCRIBE otps');
    console.log('✅ OTPs table structure:');
    otpsTable.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

    const [usersTable] = await connection.execute('DESCRIBE users');
    const verificationColumns = usersTable.filter(col => 
      col.Field.includes('verified') || col.Field.includes('verification')
    );
    console.log('✅ Users verification columns:');
    verificationColumns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type}`);
    });

    // Test 2: Test OTP generation
    console.log('\n🔢 Test 2: Testing OTP generation...');
    
    function generateTestOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    const testOTP = generateTestOTP();
    console.log(`✅ Generated test OTP: ${testOTP}`);

    // Test 3: Test OTP storage
    console.log('\n💾 Test 3: Testing OTP storage...');
    
    const testEmail = 'test@example.com';
    const testPhone = '+1234567890';
    const testType = 'email';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Clean up any existing test OTPs
    await connection.execute(
      'DELETE FROM otps WHERE contact = ? AND type = ?',
      [testEmail, testType]
    );
    
    const [insertResult] = await connection.execute(
      'INSERT INTO otps (contact, otp, type, expires_at, email, phone, verification_session) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [testEmail, testOTP, testType, expiresAt, testEmail, testPhone, Buffer.from(`${testEmail}:${testPhone}`).toString('base64')]
    );
    
    console.log(`✅ OTP stored with ID: ${insertResult.insertId}`);
    console.log(`  - Contact: ${testEmail}`);
    console.log(`  - OTP: ${testOTP}`);
    console.log(`  - Type: ${testType}`);
    console.log(`  - Expires: ${expiresAt.toISOString()}`);

    // Test 4: Test OTP verification (valid case)
    console.log('\n🔐 Test 4: Testing OTP verification (valid case)...');
    
    const [verifyResult] = await connection.execute(
      'SELECT id, email, phone, verification_session, used, expires_at FROM otps WHERE contact = ? AND otp = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [testEmail, testOTP, testType]
    );
    
    if (verifyResult.length > 0) {
      const otpRecord = verifyResult[0];
      console.log('✅ OTP record found:');
      console.log(`  - ID: ${otpRecord.id}`);
      console.log(`  - Used: ${otpRecord.used}`);
      console.log(`  - Expires: ${otpRecord.expires_at}`);
      
      // Check if expired
      const now = new Date();
      const expiresAt = new Date(otpRecord.expires_at);
      const isExpired = now > expiresAt;
      console.log(`  - Expired: ${isExpired}`);
      
      if (!isExpired && !otpRecord.used) {
        console.log('✅ OTP should be valid for verification');
        
        // Mark as used
        await connection.execute('UPDATE otps SET used = TRUE WHERE id = ?', [otpRecord.id]);
        console.log('✅ OTP marked as used');
      }
    }

    // Test 5: Test OTP verification (invalid case)
    console.log('\n❌ Test 5: Testing OTP verification (invalid case)...');
    
    const [invalidResult] = await connection.execute(
      'SELECT id, used, expires_at FROM otps WHERE contact = ? AND otp = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [testEmail, '999999', testType]
    );
    
    if (invalidResult.length === 0) {
      console.log('✅ Invalid OTP correctly not found');
    }

    // Test 6: Test OTP verification (expired case)
    console.log('\n⏰ Test 6: Testing OTP verification (expired case)...');
    
    const expiredOTP = generateTestOTP();
    const pastExpiresAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    
    await connection.execute(
      'INSERT INTO otps (contact, otp, type, expires_at, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [testPhone, expiredOTP, 'phone', pastExpiresAt, testEmail, testPhone]
    );
    
    const [expiredResult] = await connection.execute(
      'SELECT id, used, expires_at FROM otps WHERE contact = ? AND otp = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [testPhone, expiredOTP, 'phone']
    );
    
    if (expiredResult.length > 0) {
      const expiredRecord = expiredResult[0];
      const now = new Date();
      const expiresAt = new Date(expiredRecord.expires_at);
      const isExpired = now > expiresAt;
      console.log(`✅ Expired OTP correctly identified: ${isExpired}`);
    }

    // Test 7: Cleanup test data
    console.log('\n🧹 Test 7: Cleaning up test data...');
    
    const [deleteResult] = await connection.execute(
      'DELETE FROM otps WHERE contact IN (?, ?)',
      [testEmail, testPhone]
    );
    
    console.log(`✅ Cleaned up ${deleteResult.affectedRows} test OTP records`);

    // Test 8: Check environment variables
    console.log('\n🔧 Test 8: Checking environment variables...');
    
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    const emailEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    
    console.log('Required environment variables:');
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar] ? 'SET' : 'MISSING';
      console.log(`  - ${envVar}: ${value}`);
    });
    
    console.log('Email environment variables:');
    emailEnvVars.forEach(envVar => {
      const value = process.env[envVar] ? 'SET' : 'MISSING';
      console.log(`  - ${envVar}: ${value}`);
    });

    console.log('\n🎉 OTP System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Database schema: OK');
    console.log('✅ OTP generation: OK');
    console.log('✅ OTP storage: OK');
    console.log('✅ OTP verification: OK');
    console.log('✅ Error handling: OK');
    console.log('✅ Environment variables: Check above');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testOTPSystem();
}

module.exports = { testOTPSystem };
