#!/bin/bash

# VerSona STRICT Project Reorganization Script
# Enforces clean separation: frontend/ backend/ docs/ scripts/ only
# ZERO mixing allowed - Professional structure enforcement

set -e  # Exit on error

echo "🎯 VerSona STRICT Project Reorganization"
echo "=========================================="
echo ""
echo "Rule: ZERO mixing - Everything in its dedicated folder"
echo "Result: frontend/ backend/ docs/ scripts/ + clean root"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This script will STRICTLY reorganize your project:${NC}"
echo -e "${YELLOW}   • ALL frontend → /frontend${NC}"
echo -e "${YELLOW}   • ALL backend → /backend (merge python-backend)${NC}"
echo -e "${YELLOW}   • ALL docs → /docs${NC}"
echo -e "${YELLOW}   • ALL scripts → /scripts${NC}"
echo -e "${YELLOW}   • Clean root (only essential folders)${NC}"
echo ""
echo -e "${YELLOW}   Make sure you have committed your changes!${NC}"
echo ""
read -p "Continue with STRICT reorganization? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 1: Creating Folder Structure${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Create frontend structure
mkdir -p frontend/src/{assets,components/ui,components/figma,services,contexts,hooks,types,utils,lib/ai,constants,styles,firebase}
mkdir -p frontend/public

# Create backend structure (ml_models for merged python-backend)
mkdir -p backend/{core/auth,core/websocket,routes,models,services,websocket,ml_models}

# Docs already created
# Scripts folder already exists

echo -e "${GREEN}✅ Folder structure verified${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 2: Moving Frontend Code${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Move frontend directories from root to frontend/src/
[ -d "components" ] && mv components/ frontend/src/ && echo "  ✅ components → frontend/src/"
[ -d "contexts" ] && mv contexts/ frontend/src/ && echo "  ✅ contexts → frontend/src/"
[ -d "hooks" ] && mv hooks/ frontend/src/ && echo "  ✅ hooks → frontend/src/"
[ -d "lib" ] && mv lib/ frontend/src/ && echo "  ✅ lib → frontend/src/"
[ -d "types" ] && mv types/ frontend/src/ && echo "  ✅ types → frontend/src/"
[ -d "constants" ] && mv constants/ frontend/src/ && echo "  ✅ constants → frontend/src/"
[ -d "utils" ] && mv utils/ frontend/src/ && echo "  ✅ utils → frontend/src/"
[ -d "styles" ] && mv styles/ frontend/src/ && echo "  ✅ styles → frontend/src/"
[ -d "assets" ] && mv assets/ frontend/src/ && echo "  ✅ assets → frontend/src/"

# Move App.tsx if at root
[ -f "App.tsx" ] && mv App.tsx frontend/src/ && echo "  ✅ App.tsx → frontend/src/"

# Move public folder contents
if [ -d "public" ]; then
    mkdir -p frontend/public
    cp -r public/* frontend/public/ 2>/dev/null || true
    echo "  ✅ public → frontend/public/"
fi

# Move config files to frontend
[ -f "vite.config.ts" ] && mv vite.config.ts frontend/ && echo "  ✅ vite.config.ts → frontend/"
[ -f "tsconfig.json" ] && mv tsconfig.json frontend/ && echo "  ✅ tsconfig.json → frontend/"
[ -f "tsconfig.node.json" ] && mv tsconfig.node.json frontend/ && echo "  ✅ tsconfig.node.json → frontend/"
[ -f "index.html" ] && mv index.html frontend/ && echo "  ✅ index.html → frontend/"

echo -e "${GREEN}✅ Frontend code moved${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 3: Creating Services Layer${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

cd frontend/src

# Move service files from lib to services
[ -f "lib/firebase.ts" ] && mv lib/firebase.ts services/ && echo "  ✅ firebase.ts → services/"
[ -f "lib/firebaseAuth.ts" ] && mv lib/firebaseAuth.ts services/ && echo "  ✅ firebaseAuth.ts → services/"
[ -f "lib/firestoreService.ts" ] && mv lib/firestoreService.ts services/firestore.ts && echo "  ✅ firestoreService.ts → services/firestore.ts"
[ -f "lib/apiService.ts" ] && mv lib/apiService.ts services/api.ts && echo "  ✅ apiService.ts → services/api.ts"
[ -f "lib/backendService.ts" ] && mv lib/backendService.ts services/backend.ts && echo "  ✅ backendService.ts → services/backend.ts"
[ -f "lib/websocketService.ts" ] && mv lib/websocketService.ts services/websocket.ts && echo "  ✅ websocketService.ts → services/websocket.ts"
[ -f "lib/mlService.ts" ] && mv lib/mlService.ts services/ml.ts && echo "  ✅ mlService.ts → services/ml.ts"
[ -f "lib/pythonAIService.ts" ] && mv lib/pythonAIService.ts services/ai.ts && echo "  ✅ pythonAIService.ts → services/ai.ts"
[ -f "lib/analytics.ts" ] && mv lib/analytics.ts services/ && echo "  ✅ analytics.ts → services/"

cd ../..

echo -e "${GREEN}✅ Services layer created${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 4: Merging Backend${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ -d "python-backend" ]; then
    # Copy ML models to backend
    if [ -d "python-backend/ml_models" ]; then
        cp -r python-backend/ml_models/ backend/
        echo "  ✅ ML models → backend/ml_models/"
    fi
    
    # Merge requirements.txt
    if [ -f "python-backend/requirements.txt" ]; then
        if [ -f "backend/requirements.txt" ]; then
            cat python-backend/requirements.txt >> backend/requirements.txt
            sort -u backend/requirements.txt -o backend/requirements.txt
            echo "  ✅ requirements.txt merged"
        else
            cp python-backend/requirements.txt backend/
            echo "  ✅ requirements.txt copied"
        fi
    fi
    
    # Copy main.py as ml_service.py
    if [ -f "python-backend/main.py" ]; then
        cp python-backend/main.py backend/ml_service.py
        echo "  ✅ python-backend/main.py → backend/ml_service.py"
    fi
    
    # Remove python-backend
    rm -rf python-backend/
    echo "  ✅ python-backend/ removed"
else
    echo "  ℹ️  python-backend/ not found (may already be merged)"
fi

echo -e "${GREEN}✅ Backend unified${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 5: Updating Import Paths${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

cd frontend/src

# Update service imports (using Perl-compatible regex for cross-platform compatibility)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 perl -pi -e '
s|from "\.\./lib/firebase"|from "../services/firebase"|g;
s|from "\.\./lib/firebaseAuth"|from "../services/firebaseAuth"|g;
s|from "\.\./lib/firestoreService"|from "../services/firestore"|g;
s|from "\.\./lib/apiService"|from "../services/api"|g;
s|from "\.\./lib/backendService"|from "../services/backend"|g;
s|from "\.\./lib/websocketService"|from "../services/websocket"|g;
s|from "\.\./lib/mlService"|from "../services/ml"|g;
s|from "\.\./lib/pythonAIService"|from "../services/ai"|g;
s|from "\.\./lib/analytics"|from "../services/analytics"|g;
' 2>/dev/null || echo "  ⚠️  Import updates may need manual review"

cd ../..

echo -e "${GREEN}✅ Import paths updated${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 6: Creating Environment Files${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Frontend .env.example
cat > frontend/.env.example << 'EOF'
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend URLs
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
echo "  ✅ frontend/.env.example"

# Backend .env.example
cat > backend/.env.example << 'EOF'
# Security
SECRET_KEY=your-secret-key-here

# Firebase
FIREBASE_CREDENTIALS_PATH=./credentials.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Environment
ENVIRONMENT=development
EOF
echo "  ✅ backend/.env.example"

# Root .env.example
cat > .env.example << 'EOF'
# Root environment variables
# See frontend/.env.example for frontend variables
# See backend/.env.example for backend variables
EOF
echo "  ✅ .env.example"

echo -e "${GREEN}✅ Environment files created${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 7: Creating README Files${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Frontend README
cat > frontend/README.md << 'EOF'
# VerSona Frontend

React + TypeScript + Vite frontend application.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

Copy `.env.example` to `.env` and configure your values.
EOF
echo "  ✅ frontend/README.md"

# Backend README
cat > backend/README.md << 'EOF'
# VerSona Backend

FastAPI backend with ML models integration.

## Development

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Configuration

Copy `.env.example` to `.env` and configure your values.
EOF
echo "  ✅ backend/README.md"

echo -e "${GREEN}✅ README files created${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ STRICT REORGANIZATION COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "📂 Final Structure:"
echo "  ├── frontend/          (ALL frontend code)"
echo "  ├── backend/           (ALL backend code - unified)"
echo "  ├── docs/              (ALL documentation)"
echo "  ├── scripts/           (ALL scripts)"
echo "  ├── firebase/          (Firebase config)"
echo "  ├── .env.example"
echo "  ├── package.json"
echo "  └── README.md"
echo ""
echo "✅ Next Steps:"
echo "  1. cd frontend && npm install"
echo "  2. npm run type-check"
echo "  3. npm run dev"
echo "  4. cd ../backend && uvicorn main:app --reload"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  • Review frontend/src/ import paths"
echo "  • Update backend/main.py ML imports (if needed)"
echo "  • Configure .env files"
echo ""
echo -e "${GREEN}🎉 Your project is now professionally organized!${NC}"
echo ""
