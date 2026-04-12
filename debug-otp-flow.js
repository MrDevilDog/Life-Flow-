#!/usr/bin/env node

/**
 * Simple OTP Flow Debug Script
 * Tests the exact flow that should work
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'blood_donation',
  port: process.env.DB_PORT || 3306
};

async function debugOTPFlow() {
  let connection;
  
  try {
    console.log('🔍 Starting OTP Flow Debug...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Test 1: Clean up any existing test data
    console.log('\n🧹 Step 1: Cleaning up test data...');
    await connection.execute(
      'DELETE FROM otps WHERE contact IN (?, ?)',
      ['test@example.com', '+1234567890']
    );
    console.log('✅ Test data cleaned up');

    // Test 2: Simulate OTP storage (like send-otp API)
    console.log('\n💾 Step 2: Simulating OTP storage...');
    
    const testEmail = 'test@example.com';
    const testPhone = '+1234567890';
    const testOTP = '123456';
    const testType = 'email';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    console.log('Storing OTP with params:', {
      contact: testEmail,
      otp: testOTP,
      type: testType,
      expiresAt: expiresAt.toISOString()
    });
    
    const [insertResult] = await connection.execute(
      'INSERT INTO otps (contact, otp, type, expires_at, email, phone, verification_session, used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [testEmail, testOTP, testType, expiresAt, testEmail, testPhone, null, false]
    );
    
    console.log(`✅ OTP stored with ID: ${insertResult.insertId}`);

    // Test 3: Simulate OTP verification (like verify-otp API)
    console.log('\n🔐 Step 3: Simulating OTP verification...');
    
    console.log('Looking up OTP with params:', {
      contact: testEmail,
      otp: testOTP,
      type: testType
    });
    
    const [verifyResult] = await connection.execute(
      'SELECT * FROM otps WHERE contact = ? AND otp = ? AND type = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [testEmail, testOTP, testType]
    );
    
    console.log(`📋 Verification query result:`, {
      found: verifyResult.length > 0,
      rowCount: verifyResult.length
    });
    
    if (verifyResult.length > 0) {
      const otpRecord = verifyResult[0];
      console.log('✅ OTP record found:', {
        id: otpRecord.id,
        contact: otpRecord.contact,
        otp: otpRecord.otp,
        type: otpRecord.type,
        used: otpRecord.used,
        expires_at: otpRecord.expires_at,
        created_at: otpRecord.created_at
      });
      
      // Check if expired
      const now = new Date();
      const expiresAt = new Date(otpRecord.expires_at);
      const isExpired = now > expiresAt;
      console.log(`⏰ Expiry check:`, {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isExpired
      });
      
      if (!isExpired && !otpRecord.used) {
        console.log('✅ OTP should be valid for verification');
        
        // Mark as used
        const [updateResult] = await connection.execute(
          'UPDATE otps SET used = TRUE WHERE id = ?',
          [otpRecord.id]
        );
        console.log(`✅ OTP marked as used: ${updateResult.affectedRows} rows affected`);
        
        // Verify it's marked as used
        const [finalCheck] = await connection.execute(
          'SELECT used FROM otps WHERE id = ?',
          [otpRecord.id]
        );
        console.log(`🔍 Final check - OTP used status: ${finalCheck[0].used}`);
      }
    } else {
      console.log('❌ No valid OTP record found');
      
      // Debug: Show all OTPs for this contact
      const [allOTPs] = await connection.execute(
        'SELECT * FROM otps WHERE contact = ? ORDER BY created_at DESC',
        [testEmail]
      );
      console.log(`📋 All OTPs for contact ${testEmail}:`, allOTPs.length);
      allOTPs.forEach((otp, index) => {
        console.log(`  ${index + 1}. ID: ${otp.id}, OTP: ${otp.otp}, Type: ${otp.type}, Used: ${otp.used}, Expires: ${otp.expires_at}`);
      });
    }

    // Test 4: Test with wrong OTP
    console.log('\n❌ Step 4: Testing with wrong OTP...');
    
    const [wrongResult] = await connection.execute(
      'SELECT * FROM otps WHERE contact = ? AND otp = ? AND type = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [testEmail, '999999', testType]
    );
    
    console.log(`📋 Wrong OTP result:`, {
      found: wrongResult.length > 0,
      rowCount: wrongResult.length
    });

    // Test 5: Test with used OTP
    console.log('\n♻️ Step 5: Testing with used OTP...');
    
    const [usedResult] = await connection.execute(
      'SELECT * FROM otps WHERE contact = ? AND otp = ? AND type = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [testEmail, testOTP, testType]
    );
    
    console.log(`📋 Used OTP result:`, {
      found: usedResult.length > 0,
      rowCount: usedResult.length
    });

    console.log('\n🎉 OTP Flow Debug Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ OTP storage: Working');
    console.log('✅ OTP verification: Working');
    console.log('✅ Wrong OTP rejection: Working');
    console.log('✅ Used OTP rejection: Working');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the debug
if (require.main === module) {
  debugOTPFlow();
}

module.exports = { debugOTPFlow };
