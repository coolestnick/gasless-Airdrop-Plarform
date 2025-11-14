#!/bin/bash

# Vercel Deployment Script
# This script helps set up and deploy both frontend and backend to Vercel

set -e

echo "🚀 Vercel Deployment Setup"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✓ Vercel CLI installed${NC}"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel...${NC}"
    vercel login
fi

echo -e "${GREEN}✓ Logged in to Vercel${NC}"
echo ""

# Deploy Backend
echo "📦 Deploying Backend..."
echo "======================="
cd gasless-airdrop/backend

if [ ! -f ".vercel/project.json" ]; then
    echo "Linking backend project to Vercel..."
    vercel link
fi

echo "Deploying backend..."
vercel --prod

BACKEND_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "Check Vercel dashboard for URL")
echo -e "${GREEN}✓ Backend deployed: $BACKEND_URL${NC}"
echo ""

cd ../..

# Deploy Frontend
echo "📦 Deploying Frontend..."
echo "======================="
cd gasless-airdrop/frontend

if [ ! -f ".vercel/project.json" ]; then
    echo "Linking frontend project to Vercel..."
    vercel link
fi

echo "Deploying frontend..."
vercel --prod

FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "Check Vercel dashboard for URL")
echo -e "${GREEN}✓ Frontend deployed: $FRONTEND_URL${NC}"
echo ""

cd ../..

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Update backend environment variable FRONTEND_URL with: $FRONTEND_URL"
echo "2. Update frontend environment variable REACT_APP_API_URL with: $BACKEND_URL/api"
echo "3. Redeploy both projects after updating environment variables"
echo ""
echo "To update environment variables:"
echo "  - Go to Vercel Dashboard"
echo "  - Select your project"
echo "  - Go to Settings > Environment Variables"
echo "  - Add/Update the variables"
echo "  - Redeploy"
echo ""

