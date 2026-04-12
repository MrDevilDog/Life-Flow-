# Database Migration: Add verification_type Column

## Problem
The registration form is failing with the error:
```
Unknown column 'verification_type' in 'field list'
```

## Solution
Run the database migration to add the missing `verification_type` column to the users table.

## Quick Fix (Recommended)

### Option 1: Run Migration Script
```bash
npm run migrate
```

### Option 2: Run Full Migration
```bash
npm run migrate:full
```

### Option 3: Manual SQL
If the scripts don't work, run this SQL directly in your MySQL client:

```sql
-- Add verification_type column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_type ENUM('email', 'phone') NOT NULL DEFAULT 'email';

-- Add index for better performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS users_verification_type_idx (verification_type);

-- Add last_donation_date column if missing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_donation_date DATE NULL;

-- Add index for last_donation_date
ALTER TABLE users 
ADD INDEX IF NOT EXISTS users_last_donation_idx (last_donation_date);

-- Update any existing records
UPDATE users 
SET verification_type = 'email' 
WHERE verification_type IS NULL;
```

## What This Fixes

✅ **Before**: Registration fails with "Unknown column 'verification_type'" error
✅ **After**: Registration works successfully, verification_type is stored correctly

## Verification

After running the migration, the users table should have these columns:
- `id` ✅
- `name` ✅  
- `email` ✅
- `phone` ✅
- `password` ✅
- `role` ✅
- `verification_type` ✅ **(NEW)**
- `email_verified` ✅
- `phone_verified` ✅
- `last_donation_date` ✅ **(NEW)**
- `created_at` ✅
- `updated_at` ✅

## Testing

1. Run the migration
2. Start the dev server: `npm run dev`
3. Try to register a new user
4. Should work without any database column errors

## Troubleshooting

**Error: Access denied**
- Check your .env.local file for correct database credentials
- Ensure MySQL server is running
- Verify user has ALTER table permissions

**Error: Column already exists**
- That's fine! The migration uses `IF NOT EXISTS` so it's safe to run multiple times

**Error: Database doesn't exist**
- Create the database first: `CREATE DATABASE blood_donation;`
- Then run the migration

## Backend Changes

The backend now includes better error handling for database issues:
- Catches "Unknown column" errors and provides helpful messages
- Handles duplicate entry errors gracefully  
- Provides user-friendly error messages instead of raw SQL errors
