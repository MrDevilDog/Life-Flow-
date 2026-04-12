// Test script to verify login fix
// Run with: node scripts/test-login-fix.js

const testCases = [
  {
    name: "Valid email login",
    emailOrPhone: "test@example.com",
    password: "TestPassword123!",
    role: "user"
  },
  {
    name: "Valid phone login", 
    emailOrPhone: "+1234567890",
    password: "TestPassword123!",
    role: "user"
  },
  {
    name: "Invalid email",
    emailOrPhone: "nonexistent@example.com",
    password: "TestPassword123!",
    role: "user"
  },
  {
    name: "Wrong password",
    emailOrPhone: "test@example.com", 
    password: "WrongPassword",
    role: "user"
  }
];

async function testLoginAPI() {
  console.log("=== Login API Test ===\n");
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrPhone: testCase.emailOrPhone,
          password: testCase.password,
          role: testCase.role
        })
      });
      
      const result = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, result);
      console.log(`Expected: ${testCase.name.includes('Valid') ? '200' : '4xx/5xx'}`);
      console.log('---');
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      console.log('---');
    }
  }
}

// Test database query directly
async function testDatabaseQuery() {
  console.log("\n=== Database Query Test ===\n");
  
  try {
    const { db } = require('../lib/mysql');
    
    // Test the new query format
    const testEmail = "test@example.com";
    const query = `
      SELECT id, name, email, phone, password, email_verified, phone_verified, role, verification_type 
      FROM users 
      WHERE LOWER(email) = $1 OR phone = $2 
      LIMIT 1
    `;
    
    console.log("Testing query:", query);
    console.log("Parameters:", [testEmail.toLowerCase(), testEmail]);
    
    const rows = await db.query(query, [testEmail.toLowerCase(), testEmail]);
    console.log("Query results:", rows.length, "rows found");
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log("User found:", {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hasPassword: !!user.password,
        passwordHashStart: user.password ? user.password.substring(0, 10) : "N/A"
      });
      
      // Test bcrypt comparison
      const bcrypt = require('bcryptjs');
      const testPassword = "TestPassword123!";
      const passwordMatch = await bcrypt.compare(testPassword, user.password);
      console.log("Password comparison result:", passwordMatch ? "SUCCESS" : "FAILED");
    }
    
  } catch (error) {
    console.error("Database test error:", error);
  }
}

// Main function
async function runTests() {
  await testDatabaseQuery();
  await testLoginAPI();
  
  console.log("\n=== Test Summary ===");
  console.log("1. Check database query results above");
  console.log("2. Check API response logs in Vercel/dashboard");
  console.log("3. Look for 'LOGIN DEBUG START' sections in logs");
  console.log("4. Verify bcrypt comparison results");
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testLoginAPI, testDatabaseQuery };
