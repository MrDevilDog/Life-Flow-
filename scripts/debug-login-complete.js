// Complete login debugging script
// Run with: node scripts/debug-login-complete.js

const bcrypt = require('bcryptjs');

async function testCompleteLoginFlow() {
  console.log("=== COMPLETE LOGIN DEBUG ===\n");
  
  try {
    // Test 1: Database connection
    console.log("1. Testing database connection...");
    const { db } = require('../lib/mysql');
    console.log("✅ Database connection: SUCCESS");
    
    // Test 2: Check DATABASE_URL
    console.log("\n2. Checking DATABASE_URL...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    if (process.env.DATABASE_URL) {
      console.log("URL starts with:", process.env.DATABASE_URL.substring(0, 20) + "...");
    }
    
    // Test 3: Check users table structure
    console.log("\n3. Checking users table structure...");
    try {
      const structure = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = current_schema()
        ORDER BY ordinal_position
      `);
      console.log("Users table columns:");
      structure.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } catch (err) {
      console.log("❌ Could not fetch table structure:", err.message);
    }
    
    // Test 4: Check existing users
    console.log("\n4. Checking existing users...");
    const users = await db.query(`
      SELECT id, email, phone, password, role 
      FROM users 
      LIMIT 5
    `);
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Phone: ${user.phone}, Role: ${user.role}`);
      console.log(`    Password hash: ${user.password ? user.password.substring(0, 20) + "..." : "NULL"}`);
      console.log(`    Hash format: ${user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) ? "VALID" : "INVALID"}`);
    });
    
    // Test 5: Test query with different inputs
    console.log("\n5. Testing login query...");
    const testInputs = [
      "test@example.com",
      "Test@Example.com", // Test case sensitivity
      "+1234567890",
      "nonexistent@example.com"
    ];
    
    for (const input of testInputs) {
      const normalizedInput = input.toLowerCase().trim();
      const query = `
        SELECT id, name, email, phone, password, email_verified, phone_verified, role, verification_type 
        FROM users 
        WHERE LOWER(email) = $1 OR phone = $1 
        LIMIT 1
      `;
      
      console.log(`\nTesting input: "${input}"`);
      console.log(`Normalized: "${normalizedInput}"`);
      
      try {
        const rows = await db.query(query, [normalizedInput]);
        console.log(`Query result: ${rows.length} rows found`);
        
        if (rows.length > 0) {
          const user = rows[0];
          console.log(`Found user: ${user.name} (${user.email})`);
          
          // Test bcrypt comparison
          if (user.password) {
            const testPassword = "TestPassword123!";
            const isMatch = await bcrypt.compare(testPassword, user.password);
            console.log(`Password comparison with "${testPassword}": ${isMatch ? "SUCCESS" : "FAILED"}`);
          }
        }
      } catch (err) {
        console.log(`❌ Query error:`, err.message);
      }
    }
    
    // Test 6: Test registration vs login consistency
    console.log("\n6. Testing registration vs login consistency...");
    console.log("Registration uses same db connection:", !!require('../lib/mysql').db);
    
    // Test 7: Environment variables
    console.log("\n7. Checking environment variables...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "NOT SET");
    console.log("JWT_ISSUER:", process.env.JWT_ISSUER || "NOT SET");
    
    console.log("\n=== DEBUG COMPLETE ===");
    console.log("\nNext steps:");
    console.log("1. Check Vercel function logs for '=== LOGIN DEBUG START ==='");
    console.log("2. Test login with actual credentials");
    console.log("3. Verify frontend shows specific error messages");
    console.log("4. Check browser network tab for API responses");
    
  } catch (error) {
    console.error("❌ Debug script error:", error);
  }
}

// Test API endpoint directly
async function testLoginAPI() {
  console.log("\n=== API ENDPOINT TEST ===");
  
  const testLogin = async (emailOrPhone, password, role) => {
    console.log(`\nTesting login: ${emailOrPhone} (${role})`);
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password, role })
      });
      
      const data = await response.json();
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, data);
      
      return { status: response.status, data };
    } catch (error) {
      console.log(`❌ API test error:`, error.message);
      return { error: error.message };
    }
  };
  
  await testLogin("test@example.com", "TestPassword123!", "user");
  await testLogin("Test@Example.com", "TestPassword123!", "user"); // Case sensitivity test
  await testLogin("+1234567890", "TestPassword123!", "user");
  await testLogin("nonexistent@example.com", "TestPassword123!", "user");
}

// Main execution
async function main() {
  await testCompleteLoginFlow();
  
  // Only test API if server is running
  if (process.argv.includes('--api')) {
    await testLoginAPI();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCompleteLoginFlow, testLoginAPI };
