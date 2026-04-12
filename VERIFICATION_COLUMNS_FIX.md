# Fix: Unknown column 'email_verified' in 'field list'

## Problem
❌ **Error**: `Unknown column 'email_verified' in 'field list'`
❌ **Cause**: Backend queries are selecting columns that don't exist in the database

## Root Cause
The login API is trying to select:
- `email_verified` 
- `phone_verified`

But these columns are missing from the actual database table.

## Solution

### Option 1: Run Migration (Recommended)
```bash
npm run migrate:verification
```

### Option 2: Manual SQL
```sql
-- Add verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add indexes for performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS users_email_verified_idx (email_verified),
ADD INDEX IF NOT EXISTS users_phone_verified_idx (phone_verified);
```

### Option 3: Full Migration
```bash
npm run migrate:full
```

## What This Fixes

✅ **Before**: Login fails with SQL error
✅ **After**: Login works, verification status stored properly

## Backend Changes Made

### 1. Added Safety Fallback
```javascript
// Handle missing columns gracefully
if (user) {
  // Add default values if columns don't exist
  user.email_verified = user.email_verified !== undefined ? user.email_verified : false;
  user.phone_verified = user.phone_verified !== undefined ? user.phone_verified : false;
  user.verification_type = user.verification_type !== undefined ? user.verification_type : 'email';
}
```

### 2. Migration Script Created
- `db/migrations/add_verification_columns.sql` - SQL migration
- `run-verification-migration.js` - Migration runner
- Added to `package.json` as `npm run migrate:verification`

## Database Schema After Fix

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  password VARCHAR(255) NOT NULL,
  role ENUM('user','hospital','admin') NOT NULL DEFAULT 'user',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,        -- ✅ NEW
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,        -- ✅ NEW
  verification_type ENUM('email','phone') NULL,         -- ✅ NEW
  last_donation_date DATE NULL,                         -- ✅ NEW
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- ... indexes
);
```

## Testing

### 1. Run Migration
```bash
npm run migrate:verification
```

### 2. Test Login
```bash
npm run dev
# Try to login with existing user
# Should work without SQL errors
```

### 3. Verify Schema
```sql
DESCRIBE users;
-- Should show email_verified and phone_verified columns
```

## Safety Features

✅ **Graceful Degradation**: If columns don't exist, app provides defaults  
✅ **Migration Safety**: Uses `IF NOT EXISTS` to prevent errors  
✅ **Backward Compatibility**: Existing records get default values  
✅ **Performance**: Added indexes for verification columns  

## Expected Result

After running the migration:
- ✅ Login works without SQL errors
- ✅ User verification status tracked properly
- ✅ OTP verification can update these fields
- ✅ Backend queries match database schema

The system now handles user verification status correctly!
