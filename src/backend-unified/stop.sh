#!/bin/bash
# VerSona Unified Backend - Stop Script
# Gracefully stops all running services

set -e

echo "🛑 Stopping VerSona Unified Backend services..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop Uvicorn (FastAPI)
echo "1️⃣  Stopping FastAPI server..."
if pgrep -f "uvicorn main:app" > /dev/null; then
    pkill -f "uvicorn main:app"
    echo -e "${GREEN}✅ FastAPI server stopped${NC}"
else
    echo -e "${YELLOW}⚠️  FastAPI server was not running${NC}"
fi

# Stop Celery workers
echo "2️⃣  Stopping Celery workers..."
if pgrep -f "celery.*worker" > /dev/null; then
    pkill -f "celery.*worker"
    echo -e "${GREEN}✅ Celery workers stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Celery workers were not running${NC}"
fi

# Stop Flower (if running)
echo "3️⃣  Stopping Flower..."
if pgrep -f "celery.*flower" > /dev/null; then
    pkill -f "celery.*flower"
    echo -e "${GREEN}✅ Flower stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Flower was not running${NC}"
fi

# Ask about Redis
echo ""
read -p "Do you want to stop Redis? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "4️⃣  Stopping Redis..."
    
    # Try different methods based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS with Homebrew
        if brew services list | grep redis | grep started > /dev/null; then
            brew services stop redis
            echo -e "${GREEN}✅ Redis stopped${NC}"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux with systemd
        if systemctl is-active redis > /dev/null 2>&1; then
            sudo systemctl stop redis
            echo -e "${GREEN}✅ Redis stopped${NC}"
        fi
    fi
    
    # Try redis-cli shutdown as fallback
    if redis-cli ping &> /dev/null; then
        redis-cli shutdown
        echo -e "${GREEN}✅ Redis stopped${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Redis left running (use 'redis-cli shutdown' to stop manually)${NC}"
fi

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
echo ""
echo "💡 To start services again, run: ./start.sh"
echo ""
