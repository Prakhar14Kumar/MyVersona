#!/bin/bash
# VerSona Unified Backend - Quick Start Script
# This script starts all required services for local development

set -e  # Exit on error

echo "🚀 VerSona Unified Backend - Starting Services..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Redis is installed
echo "📦 Checking dependencies..."
if ! command -v redis-server &> /dev/null; then
    echo -e "${RED}❌ Redis is not installed${NC}"
    echo ""
    echo "Install Redis:"
    echo "  macOS:   brew install redis"
    echo "  Ubuntu:  sudo apt install redis-server"
    echo "  Docker:  docker run -d -p 6379:6379 redis:alpine"
    exit 1
fi

# Check if Python dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Python dependencies not installed${NC}"
    echo "Installing dependencies..."
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your credentials before continuing${NC}"
    exit 1
fi

# Start Redis if not running
echo "🔴 Starting Redis..."
if ! redis-cli ping &> /dev/null; then
    # Try to start Redis based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis &> /dev/null || redis-server --daemonize yes
    else
        sudo systemctl start redis &> /dev/null || redis-server --daemonize yes
    fi
    sleep 2
fi

if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Failed to start Redis${NC}"
    exit 1
fi

# Create logs directory
mkdir -p logs

echo ""
echo "🎯 Starting services in separate terminals..."
echo ""

# Function to open a new terminal based on OS
open_terminal() {
    local command=$1
    local title=$2
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd) && echo '${title}' && ${command}"
    activate
end tell
EOF
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - try different terminal emulators
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="${title}" -- bash -c "cd $(pwd) && echo '${title}' && ${command}; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "${title}" -e "cd $(pwd) && echo '${title}' && ${command}; bash" &
        else
            echo -e "${YELLOW}⚠️  Could not detect terminal emulator. Run manually:${NC}"
            echo "   ${command}"
        fi
    else
        echo -e "${YELLOW}⚠️  Unsupported OS. Run manually:${NC}"
        echo "   ${command}"
    fi
}

# Start FastAPI server
echo "1️⃣  Starting FastAPI server (port 8000)..."
open_terminal "uvicorn main:app --reload --host 0.0.0.0 --port 8000" "VerSona API Server"
sleep 2

# Start Celery worker - High Priority
echo "2️⃣  Starting Celery worker (High Priority)..."
open_terminal "celery -A modules.ai.celery_app worker -Q high_priority --loglevel=info --concurrency=2" "Celery Worker - High Priority"
sleep 1

# Start Celery worker - Medium Priority
echo "3️⃣  Starting Celery worker (Medium Priority)..."
open_terminal "celery -A modules.ai.celery_app worker -Q medium_priority --loglevel=info --concurrency=4" "Celery Worker - Medium Priority"
sleep 1

# Start Celery worker - Low Priority
echo "4️⃣  Starting Celery worker (Low Priority)..."
open_terminal "celery -A modules.ai.celery_app worker -Q low_priority --loglevel=info --concurrency=4" "Celery Worker - Low Priority"
sleep 1

# Optional: Start Flower for monitoring
read -p "Do you want to start Flower (Celery monitoring)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "5️⃣  Starting Flower (port 5555)..."
    open_terminal "celery -A modules.ai.celery_app flower --port=5555" "Celery Flower - Monitoring"
fi

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📚 Available endpoints:"
echo "   API:          http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/health"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Flower:       http://localhost:5555"
fi
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f uvicorn"
echo "   pkill -f celery"
echo "   redis-cli shutdown  # or: brew services stop redis"
echo ""
echo -e "${YELLOW}💡 Tip: Check logs in the terminal windows or in ./logs/${NC}"
echo ""
