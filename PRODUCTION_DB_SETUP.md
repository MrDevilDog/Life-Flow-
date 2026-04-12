# 🗄️ Production Database Setup Guide

## Recommended Database Option: Neon.tech

The application has been migrated to **PostgreSQL** to take advantage of serverless features and better integration with Vercel. **Neon** is the recommended provider.

### 1. Neon Setup
**Pros:**
- Serverless PostgreSQL
- Free tier available
- Excellent Vercel integration
- Scalable and high performance

**Setup:**
1. Go to [Neon.tech](https://neon.tech/)
2. Create a new project.
3. Once created, go to the **Dashboard**.
4. Copy the **Connection String** (DATABASE_URL).
5. Ensure it looks like `postgresql://user:password@host/neondb?sslmode=require`.

### 2. Other PostgreSQL Options (Supabase, Railway)
The application works with any standard PostgreSQL 14+ instance.
- **Supabase**: Great for managed Postgres.
- **Railway**: Easy to provision a Postgres service.

## Vercel Environment Variables Setup

### Required Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Database (Single most important variable)
DATABASE_URL=postgresql://user:password@host:5432/neondb?sslmode=require

# Authentication
JWT_SECRET=your_very_long_random_secret_32_chars_minimum
JWT_ISSUER=blood-donation-app
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=production
```

### Optional Services
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

## Database Migration

### 1. Run Setup Script
The project includes an automatic schema setup script that works with PostgreSQL.

```bash
# Local terminal
export DATABASE_URL="your_production_postgresql_url"
npm run migrate
```

This script will:
- Create the Enums (user_role, blood_group, etc.)
- Create all Tables (users, donors, requests, donations)
- Set up Indexes for performance
- Set up Triggers for `updated_at` fields

### 2. Verify Schema
You can use the Neon SQL Console to verify your tables:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Connection Issues & Solutions

### SSL Certificate Issues
Always ensure `?sslmode=require` is at the end of your `DATABASE_URL`.

### Pool Exhaustion
Vercel functions are stateless. The app uses `pg.Pool` with a singleton pattern, but if you have extremely high traffic, you may need to increase the connection limit or use a connection pooling proxy (like Neon's built-in pooling).

## Production Considerations

### Security
- ✅ Use SSL connections
- ✅ Strong database passwords
- ✅ Environment variables encrypted in Vercel

### Performance
- ✅ Connection pooling (via `lib/mysql.ts`)
- ✅ Database indexes (created via migration script)
- ✅ Serverless-friendly data fetching

## Testing Database Connection

### 1. Local Test
Set your environment variable and run the dev server:
```bash
SET DATABASE_URL=postgresql://...
npm run dev
```

### 2. API Test
Once deployed to Vercel, test the profile endpoint:
```bash
curl https://your-app.vercel.app/api/me
```

---

**🚀 Once your database is set up and environment variables are configured, your application is ready for the world!**
