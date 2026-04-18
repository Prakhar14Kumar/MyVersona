# VerSona Unified Backend - Deployment Guide

Complete guide for deploying the unified backend to production.

## 📋 Pre-Deployment Checklist

- [ ] All dependencies in `requirements.txt`
- [ ] Environment variables configured
- [ ] Firebase service account configured
- [ ] Redis instance provisioned
- [ ] Celery workers configured
- [ ] CORS settings updated with production URLs
- [ ] Rate limiting configured
- [ ] Security settings reviewed

## 🚀 Deployment Options

### Option 1: Railway (Recommended)

**Why Railway?**
- Easy Redis provisioning
- Multi-process support (API + Celery workers)
- Automatic HTTPS
- Environment variable management
- GitHub integration

**Steps:**

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Create Railway Project**
```bash
cd backend-unified
railway init
```

3. **Add Redis Plugin**
```bash
railway add redis
```

This automatically sets `REDIS_URL` environment variable.

4. **Configure Environment Variables**

In Railway dashboard, add:
```env
SECRET_KEY=<generate-with-python -c "import secrets; print(secrets.token_urlsafe(32))">
FIREBASE_CONFIG=<paste-firebase-service-account-json>
FIREBASE_STORAGE_BUCKET=versona-app.appspot.com
GEMINI_API_KEY=<your-gemini-api-key>
ALLOWED_ORIGINS=https://your-frontend.com
DEBUG=False
```

5. **Create Procfile**
```yaml
# Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
worker_high: celery -A modules.ai.celery_app worker -Q high_priority --loglevel=info --concurrency=2
worker_medium: celery -A modules.ai.celery_app worker -Q medium_priority --loglevel=info --concurrency=4
worker_low: celery -A modules.ai.celery_app worker -Q low_priority --loglevel=info --concurrency=4
```

6. **Deploy**
```bash
railway up
```

7. **Scale Processes**

In Railway dashboard:
- `web`: 2-4 instances (based on traffic)
- `worker_high`: 1-2 instances
- `worker_medium`: 2-4 instances
- `worker_low`: 1-2 instances

---

### Option 2: Render

**Steps:**

1. **Create Redis Instance**
- Go to Render Dashboard → New → Redis
- Copy Redis URL

2. **Create Web Service**
- Go to Render Dashboard → New → Web Service
- Connect GitHub repo
- Configure:
  - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4`

3. **Create Background Workers**

Create 3 separate Background Workers:

**Worker 1 - High Priority:**
```bash
celery -A modules.ai.celery_app worker -Q high_priority --loglevel=info --concurrency=2
```

**Worker 2 - Medium Priority:**
```bash
celery -A modules.ai.celery_app worker -Q medium_priority --loglevel=info --concurrency=4
```

**Worker 3 - Low Priority:**
```bash
celery -A modules.ai.celery_app worker -Q low_priority --loglevel=info --concurrency=4
```

4. **Set Environment Variables** (same as Railway above)

---

### Option 3: Docker + AWS/GCP

**1. Create Dockerfile**

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Default command (override in docker-compose)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**2. Create docker-compose.yml**

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SECRET_KEY=${SECRET_KEY}
      - FIREBASE_CONFIG=${FIREBASE_CONFIG}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - redis
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

  celery_worker_high:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SECRET_KEY=${SECRET_KEY}
      - FIREBASE_CONFIG=${FIREBASE_CONFIG}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - redis
    command: celery -A modules.ai.celery_app worker -Q high_priority --loglevel=info --concurrency=2

  celery_worker_medium:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SECRET_KEY=${SECRET_KEY}
      - FIREBASE_CONFIG=${FIREBASE_CONFIG}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - redis
    command: celery -A modules.ai.celery_app worker -Q medium_priority --loglevel=info --concurrency=4

  celery_worker_low:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SECRET_KEY=${SECRET_KEY}
      - FIREBASE_CONFIG=${FIREBASE_CONFIG}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - redis
    command: celery -A modules.ai.celery_app worker -Q low_priority --loglevel=info --concurrency=4

  flower:
    build: .
    ports:
      - "5555:5555"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    command: celery -A modules.ai.celery_app flower --port=5555

volumes:
  redis_data:
```

**3. Deploy to AWS ECS / Google Cloud Run**

Follow provider-specific docs for container deployment.

---

## 🔐 Security Configuration

### 1. Generate Strong SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Firebase Service Account

**Option A: File (Development)**
```env
FIREBASE_CREDENTIALS_PATH=/app/firebase-key.json
```

**Option B: Environment Variable (Production - Recommended)**
```bash
# Get JSON content
cat firebase-service-account.json | jq -c

# Set as env var
FIREBASE_CONFIG='{"type":"service_account",...}'
```

### 3. CORS Configuration
```python
# Update in production
ALLOWED_ORIGINS=https://versona.app,https://www.versona.app
```

### 4. Rate Limiting
```env
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=5000
```

---

## 📊 Monitoring & Logging

### 1. Celery Monitoring with Flower

Access at: `http://your-domain:5555`

```bash
# Run Flower
celery -A modules.ai.celery_app flower --port=5555
```

### 2. Health Check Endpoint

```bash
curl https://your-api.com/health

# Response
{
  "status": "healthy",
  "firebase": "connected",
  "redis": "connected",
  "celery_workers": "running",
  "websockets": "12 active"
}
```

### 3. Sentry Error Tracking (Optional)

```bash
pip install sentry-sdk[fastapi]
```

```python
# In main.py
import sentry_sdk

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    traces_sample_rate=1.0,
)
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up
```

---

## 📈 Scaling Guide

### Vertical Scaling (Single Server)
- **CPU**: 4-8 cores
- **RAM**: 8-16 GB
- **Workers**: 4-8 Uvicorn workers
- **Celery**: 8-16 total workers

### Horizontal Scaling (Multiple Servers)
```
┌─────────────┐
│   Nginx     │  (Load Balancer)
└──────┬──────┘
       │
   ┌───┴───┬───────────┬──────────┐
   │       │           │          │
┌──▼──┐ ┌──▼──┐    ┌──▼──┐   ┌──▼──┐
│ API │ │ API │    │ API │   │ API │
│  #1 │ │  #2 │    │  #3 │   │  #4 │
└─────┘ └─────┘    └─────┘   └─────┘
   │
   └───────────────┬──────────────┘
                   │
              ┌────▼────┐
              │  Redis  │
              │ Cluster │
              └────┬────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
   │Celery │   │Celery │   │Celery │
   │Worker │   │Worker │   │Worker │
   │  #1   │   │  #2   │   │  #3   │
   └───────┘   └───────┘   └───────┘
```

---

## 🧪 Testing Production Deployment

### 1. Health Check
```bash
curl https://your-api.com/health
```

### 2. Test Sync API
```bash
curl -X POST https://your-api.com/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test post"}'
```

### 3. Test Async AI API
```bash
# Submit task
TASK_ID=$(curl -X POST https://your-api.com/api/v1/ai/career/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Python"],
    "interests": ["AI"]
  }' | jq -r '.task_id')

# Check task status
curl https://your-api.com/api/v1/tasks/$TASK_ID
```

### 4. Test WebSocket
```javascript
const ws = new WebSocket('wss://your-api.com/ws/chat/user123');
ws.onopen = () => console.log('Connected');
ws.onmessage = (msg) => console.log('Message:', msg.data);
```

---

## 🐛 Troubleshooting

### Issue: Celery workers not starting

**Check:**
1. Redis connection: `redis-cli ping`
2. Environment variables: `echo $REDIS_URL`
3. Celery logs: `celery -A modules.ai.celery_app inspect active`

### Issue: Tasks stuck in PENDING state

**Fix:**
```bash
# Restart workers
pkill -f celery
celery -A modules.ai.celery_app worker --loglevel=info
```

### Issue: High memory usage

**Fix:**
```python
# In celery_app.py
worker_max_tasks_per_child=100  # Restart worker after 100 tasks
```

### Issue: Firebase not initializing

**Check:**
1. FIREBASE_CONFIG environment variable is valid JSON
2. Service account has correct permissions
3. FIREBASE_PROJECT_ID matches your project

---

## 📞 Support

For deployment help:
- Check logs: `railway logs` or `render logs`
- Health endpoint: `/health`
- Celery status: `celery -A modules.ai.celery_app inspect active`

---

Built with ❤️ by the VerSona team
