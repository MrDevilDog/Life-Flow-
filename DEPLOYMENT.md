# 🚀 Vercel Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Vercel account
- PostgreSQL database (Neon.tech Recommended)
- Git repository (GitHub, GitLab, etc.)

## 📋 Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [Neon.tech](https://neon.tech/)
2. Create a new project
3. Get the `DATABASE_URL` (connection string) from the dashboard
4. Ensure the connection string ends with `?sslmode=require`

### Option B: Supabase
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get the PostgreSQL connection string
4. Use the pooled connection URL if possible

## 📋 Step 2: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts to set environment variables
```

### Method 2: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Connect your Git repository
4. Vercel will auto-detect Next.js

## 📋 Step 3: Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables
```
DATABASE_URL=postgresql://user:password@host:5432/neondb?sslmode=require
JWT_SECRET=your_long_random_secret_key_here
JWT_ISSUER=blood-donation-app
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

> [!NOTE]
> The application uses a PostgreSQL adapter that provides MySQL compatibility, so your existing queries will still work, but the underlying database MUST be PostgreSQL.

## 📋 Step 4: Database Migration

After setting your environment variables in Vercel, run the migration script locally using your production `DATABASE_URL`:

```bash
# Set your production URL temporarily
export DATABASE_URL="your_production_postgresql_url"
# Or create/edit .env.local with the production URL
npm run migrate
```

## 📋 Step 5: Custom Domain (Optional)

1. In Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown by Vercel

## 🔧 Configuration Files

The project includes:
- `next.config.mjs` - Next.js configuration and security headers
- `package.json` - Build scripts and dependencies
- `lib/mysql.ts` - Production-ready PostgreSQL pooling adapter

## 🚨 Troubleshooting

### Database Connection Issues
- Check if your `DATABASE_URL` is correct.
- Ensure `?sslmode=require` is appended to the URL for cloud providers like Neon.
- Verify that your IP is allowed to connect (Neon allows all by default, some others don't).

### build issues
- Clear Vercel cache: `vercel --force`
- Check Next.js version compatibility
- Review build logs in Vercel dashboard

### Runtime Issues
- Check Vercel Function Logs for "DB CONNECTION ERROR".
- Verify API endpoints work (e.g., `/api/me`).

## 📊 Monitoring

### Vercel Analytics
- Automatically enabled with `@vercel/analytics`
- View in Vercel Dashboard → Analytics

## 🔄 Continuous Deployment

Every push to main branch will:
1. Trigger Vercel build
2. Run database migrations if needed (if configured in build hooks)
3. Deploy to production

## 📱 Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify database connectivity
- [ ] Test user registration/login
- [ ] Check emergency requests
- [ ] Test donor dashboard
- [ ] Verify map functionality
- [ ] Test mobile responsiveness
- [ ] Check SSL certificates
- [ ] Monitor error logs

---

**🆘 Support**

- [Vercel Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
