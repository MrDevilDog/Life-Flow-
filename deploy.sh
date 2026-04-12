#!/bin/bash

# 🚀 Blood Donation App - Vercel Deployment Script

echo "🩸 Blood Donation App Deployment to Vercel"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI found"
fi

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run 'vercel login' first."
    exit 1
else
    echo "✅ Logged in to Vercel"
fi

# Check environment variables
echo "🔍 Checking environment configuration..."
if [ ! -f ".env.local" ] && [ -s ".env.local" ]; then
    echo "⚠️  Warning: .env.local found. Make sure to set these in Vercel dashboard:"
    grep -E "^(DB_|JWT_)" .env.local | sed 's/^/  - /'
    echo ""
    echo "📝 Set these in Vercel Dashboard → Project Settings → Environment Variables"
else
    echo "✅ No local .env.local found (good for production)"
fi

# Run tests if available
echo "🧪 Running build test..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy with production settings
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Next steps:"
echo "1. Check your deployment at the URL above"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Test all API endpoints"
echo "4. Monitor logs in Vercel dashboard"
echo ""
echo "📖 For detailed guide, see: DEPLOYMENT.md"
