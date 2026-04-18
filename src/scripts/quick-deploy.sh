#!/bin/bash

# VerSona - Quick Deployment Script
# ==================================
# Deploys VerSona to production in minutes
#
# Prerequisites:
#   - Vercel CLI: npm i -g vercel
#   - Railway CLI: npm i -g @railway/cli
#   - Firebase CLI: npm i -g firebase-tools
#
# Usage:
#   chmod +x scripts/quick-deploy.sh
#   ./scripts/quick-deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  VerSona - Quick Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to print section headers
section() {
    echo ""
    echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

# Function to print success messages
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error messages
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print info messages
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
section "Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js not found. Install from https://nodejs.org"
    exit 1
fi
success "Node.js installed: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm not found"
    exit 1
fi
success "npm installed: $(npm --version)"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi
success "Vercel CLI installed"

# Check Railway CLI (optional)
if ! command -v railway &> /dev/null; then
    info "Railway CLI not found (optional). Install with: npm i -g @railway/cli"
else
    success "Railway CLI installed"
fi

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    error "Firebase CLI not found. Install with: npm i -g firebase-tools"
    exit 1
fi
success "Firebase CLI installed"

# Check environment files
section "Checking Environment Configuration"

if [ ! -f "backend/.env" ]; then
    error "backend/.env not found"
    info "Copy backend/.env.example to backend/.env and fill in values"
    exit 1
fi
success "Backend .env found"

if [ ! -f "python-backend/.env" ]; then
    info "python-backend/.env not found (optional for AI features)"
else
    success "Python backend .env found"
fi

# Deploy Firebase indexes
section "Deploying Firebase Indexes"

info "Deploying Firestore indexes..."
cd firebase
if firebase deploy --only firestore:indexes; then
    success "Firestore indexes deployed"
else
    error "Failed to deploy indexes. Make sure you're logged in: firebase login"
    exit 1
fi
cd ..

# Deploy Firestore rules
info "Deploying Firestore security rules..."
cd firebase
if firebase deploy --only firestore:rules; then
    success "Firestore rules deployed"
else
    error "Failed to deploy rules"
    exit 1
fi
cd ..

# Deploy Storage rules
info "Deploying Storage security rules..."
cd firebase
if firebase deploy --only storage; then
    success "Storage rules deployed"
else
    error "Failed to deploy storage rules"
    exit 1
fi
cd ..

# Deploy Frontend
section "Deploying Frontend to Vercel"

info "Building frontend..."
cd frontend
npm install
npm run build

info "Deploying to Vercel..."
if vercel --prod; then
    success "Frontend deployed to Vercel"
    FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url')
    info "Frontend URL: https://${FRONTEND_URL}"
else
    error "Frontend deployment failed"
    exit 1
fi
cd ..

# Deploy Backend (Railway)
section "Backend Deployment Instructions"

echo ""
info "To deploy backend to Railway:"
echo "  1. Create account at https://railway.app"
echo "  2. Install Railway CLI: npm i -g @railway/cli"
echo "  3. Run: cd backend && railway login"
echo "  4. Run: railway init"
echo "  5. Run: railway up"
echo "  6. Set environment variables in Railway dashboard"
echo ""

info "Alternatively, deploy to Render.com:"
echo "  1. Create account at https://render.com"
echo "  2. Create new Web Service"
echo "  3. Connect GitHub repo"
echo "  4. Set build command: pip install -r requirements.txt"
echo "  5. Set start command: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo "  6. Add environment variables from backend/.env"
echo ""

# Summary
section "Deployment Summary"

echo ""
success "Frontend deployed successfully!"
echo ""
info "Next Steps:"
echo "  1. Deploy backend to Railway or Render"
echo "  2. Update frontend environment variables with backend URL"
echo "  3. Run seed script to add demo data:"
echo "     python scripts/seed-demo-data.py"
echo "  4. Test the deployed app"
echo "  5. Practice your demo!"
echo ""

info "Frontend URL: Check Vercel dashboard"
info "Backend URL: Will be available after Railway/Render deployment"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment complete! Good luck with your demo! 🚀${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
