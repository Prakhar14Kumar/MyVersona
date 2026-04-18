# Migration Guide: Separate Backends → Unified Backend

Complete step-by-step guide to migrate from your current two-backend architecture to the unified backend.

## 📊 Current State vs Target State

### Current Architecture
```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                            │
│  http://localhost:5173                              │
└───────────────┬─────────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
   ┌────▼─────┐    ┌────▼─────┐
   │ Backend  │    │  Python  │
   │   :8000  │    │  Backend │
   │          │    │   :8001  │
   │ General  │    │  AI/ML   │
   │   API    │    │   API    │
   └────┬─────┘    └────┬─────┘
        │               │
        └───────┬───────┘
                │
         ┌──────▼──────┐
         │  Firebase   │
         │  (2x init)  │
         └─────────────┘
```

### Target Architecture (Unified)
```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                            │
│  http://localhost:5173                              │
└───────────────┬─────────────────────────────────────┘
                │
         ┌──────▼──────┐
         │   Unified   │
         │   Backend   │
         │    :8000    │
         ├─────────────┤
         │ General API │
         │  + AI/ML    │
         ├─────────────┤
         │   Celery    │
         │  Workers    │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  Firebase   │
         │  (1x init)  │
         └─────────────┘
```

## 🎯 Migration Benefits

1. **Single Deployment** - One backend to deploy and maintain
2. **Shared Firebase** - No duplicate initialization, shared auth/db
3. **Non-blocking AI** - Celery queue prevents slow ML inference from blocking API
4. **Better Scaling** - Scale API and AI workers independently
5. **Simplified Frontend** - Single API base URL, task polling pattern for AI

## 📋 Migration Steps

### Phase 1: Setup Unified Backend (Week 3 - Day 1)

#### 1.1 Create Unified Backend Directory
```bash
# Already created for you
cd backend-unified
```

#### 1.2 Install Dependencies
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

#### 1.3 Copy Environment Variables
```bash
# Create .env from existing backends
cp ../backend/.env .env

# Add new variables for Celery
echo "REDIS_HOST=localhost" >> .env
echo "REDIS_PORT=6379" >> .env
```

#### 1.4 Start Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

#### 1.5 Test Firebase Initialization
```bash
python -c "from core.config import initialize_firebase; initialize_firebase()"
# Should print: ✅ Firebase Admin SDK initialized successfully
```

---

### Phase 2: Migrate General API Routes (Week 3 - Day 2)

#### 2.1 Copy Route Files
```bash
# Copy existing routes
mkdir -p api/v1/routes
cp ../backend/routes/*.py api/v1/routes/

# Update imports in each file
# Old: from services.auth_service import ...
# New: from modules.general.services.auth_service import ...
```

#### 2.2 Copy Core Services
```bash
# Copy existing services
mkdir -p modules/general/services
cp ../backend/services/*.py modules/general/services/

# Update imports
# Old: from config import get_firestore_client
# New: from core.config import get_firestore_client
```

#### 2.3 Copy WebSocket Handlers
```bash
mkdir -p core/websocket
cp ../backend/websocket/*.py core/websocket/
```

#### 2.4 Copy Models
```bash
mkdir -p schemas
cp ../backend/models/*.py schemas/
```

#### 2.5 Test General API
```bash
# Start unified backend
uvicorn main:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/posts
```

---

### Phase 3: Migrate AI/ML Models (Week 3 - Day 3)

#### 3.1 Copy ML Models
```bash
# Copy all ML model implementations
mkdir -p modules/ai/models
cp ../python-backend/ml_models/*.py modules/ai/models/
```

#### 3.2 Wrap Models in Celery Tasks

For each ML model, create a corresponding Celery task.

**Example: Career Recommendations**

Old (python-backend/main.py):
```python
@app.post("/api/career/recommendations")
async def get_career_recommendations(request: CareerRecommendationRequest):
    # This blocks the API for 2-5 seconds!
    recommendations = career_recommender.recommend(
        skills=request.user_profile.skills,
        interests=request.user_profile.interests
    )
    return {"data": recommendations}
```

New (modules/ai/tasks/career_tasks.py):
```python
@celery_app.task
def get_career_recommendations(skills, interests):
    # Runs in background worker
    recommendations = career_recommender.recommend(
        skills=skills,
        interests=interests
    )
    return {"data": recommendations}
```

New API Route (api/v1/routes/ai/ai_career.py):
```python
@router.post("/career/recommendations")
async def career_recommendations(request: CareerRecommendationRequest):
    # Returns immediately with task_id
    task = get_career_recommendations.delay(
        skills=request.skills,
        interests=request.interests
    )
    return {"task_id": task.id, "status": "processing"}
```

#### 3.3 Create Celery Tasks for All 8 Models

Based on your existing models:
1. ✅ Career Recommender → `career_tasks.py`
2. ✅ Content Recommender → `content_tasks.py`
3. Resume Analyzer → `resume_tasks.py`
4. Text Classifier → `moderation_tasks.py`
5. AI Content Moderation → `moderation_tasks.py`
6. AI Feed Ranking → `feed_tasks.py`
7. AI Semantic Search → `search_tasks.py`
8. AI Recommendations → `recommendation_tasks.py`

#### 3.4 Test Celery Workers
```bash
# Terminal 1: Start worker
celery -A modules.ai.celery_app worker --loglevel=info

# Terminal 2: Test task
python
>>> from modules.ai.tasks.career_tasks import get_career_recommendations
>>> task = get_career_recommendations.delay(["Python"], ["AI"])
>>> print(task.id)
>>> print(task.status)  # PENDING → STARTED → SUCCESS
>>> print(task.result)  # Get result when done
```

---

### Phase 4: Update Frontend (Week 3 - Day 4)

#### 4.1 Update API Base URL

Old (lib/config.ts):
```typescript
export const API_CONFIG = {
  GENERAL_API: "http://localhost:8000",
  AI_API: "http://localhost:8001"
};
```

New:
```typescript
export const API_CONFIG = {
  BASE_URL: "http://localhost:8000",
  API_V1: "http://localhost:8000/api/v1"
};
```

#### 4.2 Create Task Polling Utility

```typescript
// lib/taskPoller.ts
export async function pollTask<T>(
  taskId: string,
  maxRetries: number = 30,
  interval: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(`/api/v1/tasks/${taskId}`);
    const data = await response.json();
    
    if (data.state === 'SUCCESS') {
      return data.result;
    }
    
    if (data.state === 'FAILURE') {
      throw new Error(data.error);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Task timeout');
}
```

#### 4.3 Update AI API Calls

Old (lib/pythonAIService.ts):
```typescript
// Synchronous call - blocks for 3-5 seconds
export async function getCareerRecommendations(profile: UserProfile) {
  const response = await fetch('http://localhost:8001/api/career/recommendations', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
  return response.json();
}
```

New (lib/aiService.ts):
```typescript
import { pollTask } from './taskPoller';

// Async call - returns immediately, then polls for result
export async function getCareerRecommendations(profile: UserProfile) {
  // Step 1: Submit task
  const submitResponse = await fetch('/api/v1/ai/career/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  
  const { task_id } = await submitResponse.json();
  
  // Step 2: Poll for result
  const result = await pollTask(task_id);
  return result;
}
```

#### 4.4 Add Loading States in Components

```tsx
// components/AICareerAssistant.tsx
const [isLoading, setIsLoading] = useState(false);
const [taskId, setTaskId] = useState<string | null>(null);

const handleGetRecommendations = async () => {
  setIsLoading(true);
  try {
    // Submit task
    const response = await fetch('/api/v1/ai/career/recommendations', {
      method: 'POST',
      body: JSON.stringify(profile)
    });
    
    const { task_id } = await response.json();
    setTaskId(task_id);
    
    // Poll for result
    const result = await pollTask(task_id);
    setRecommendations(result.data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setIsLoading(false);
    setTaskId(null);
  }
};

return (
  <div>
    {isLoading && taskId && (
      <div>Processing... (Task: {taskId.slice(0, 8)}...)</div>
    )}
  </div>
);
```

---

### Phase 5: Testing & Validation (Week 3 - Day 5)

#### 5.1 Test General API Endpoints
```bash
# Auth
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Posts
curl http://localhost:8000/api/v1/posts

# Users
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5.2 Test AI/ML Endpoints (Async)
```bash
# Submit AI task
TASK_ID=$(curl -X POST http://localhost:8000/api/v1/ai/career/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "skills": ["Python", "FastAPI"],
    "interests": ["AI", "Web Dev"]
  }' | jq -r '.task_id')

echo "Task ID: $TASK_ID"

# Poll for result
while true; do
  STATUS=$(curl -s http://localhost:8000/api/v1/tasks/$TASK_ID | jq -r '.state')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "SUCCESS" ]; then
    curl http://localhost:8000/api/v1/tasks/$TASK_ID | jq '.result'
    break
  fi
  
  sleep 1
done
```

#### 5.3 Test WebSockets
```bash
# Install wscat for testing
npm install -g wscat

# Test chat WebSocket
wscat -c ws://localhost:8000/ws/chat/user123
```

#### 5.4 Load Testing
```bash
# Install Apache Bench
brew install httpd  # macOS
sudo apt install apache2-utils  # Ubuntu

# Test API under load
ab -n 1000 -c 10 http://localhost:8000/health

# Test concurrent AI tasks
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/ai/career/recommendations \
    -H "Content-Type: application/json" \
    -d '{"skills": ["Python"], "interests": ["AI"]}' &
done
```

---

### Phase 6: Deploy to Production (Week 3 - Day 6-7)

Follow the **DEPLOYMENT_GUIDE.md** for detailed deployment instructions.

#### Quick Deploy to Railway:
```bash
cd backend-unified
railway init
railway add redis
railway up
```

---

## 🔄 Rollback Plan

If migration fails, you can quickly rollback:

### Option 1: Keep Old Backends Running
```bash
# Terminal 1: Old general backend
cd backend
uvicorn main:app --port 8000

# Terminal 2: Old AI backend
cd python-backend
uvicorn main:app --port 8001
```

### Option 2: Use Git Branches
```bash
# Create backup branch before migration
git checkout -b backup-pre-migration
git checkout main

# If migration fails, rollback
git checkout backup-pre-migration
```

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] Backup both `/backend` and `/python-backend`
- [ ] Install Redis locally
- [ ] Test Celery workers locally
- [ ] Update frontend to support task polling

### Backend Migration
- [ ] Copy all route files to `api/v1/routes/`
- [ ] Copy all services to `modules/general/services/`
- [ ] Copy all ML models to `modules/ai/models/`
- [ ] Create Celery tasks for all 8 ML models
- [ ] Update all imports to new structure
- [ ] Test Firebase initialization
- [ ] Test Redis connection
- [ ] Test Celery workers

### Frontend Migration
- [ ] Update API base URL
- [ ] Implement task polling utility
- [ ] Update all AI service calls
- [ ] Add loading states for async tasks
- [ ] Test all user flows

### Testing
- [ ] All general API endpoints work
- [ ] All AI endpoints return task_id
- [ ] Task polling works correctly
- [ ] WebSockets still functional
- [ ] Frontend can submit and retrieve AI tasks
- [ ] Load testing passes

### Deployment
- [ ] Deploy unified backend to Railway/Render
- [ ] Configure Redis in production
- [ ] Start Celery workers in production
- [ ] Update frontend API_BASE_URL
- [ ] Monitor logs and errors

### Post-Migration
- [ ] Monitor Celery task queue
- [ ] Check Redis memory usage
- [ ] Verify all features work in production
- [ ] Archive old `/backend` and `/python-backend`

---

## 🐛 Common Migration Issues

### Issue: Import errors after migration

**Fix:**
```bash
# Ensure all __init__.py files exist
find . -type d -exec touch {}/__init__.py \;
```

### Issue: Celery can't find tasks

**Fix:**
```python
# In celery_app.py, ensure all tasks are included
include=[
    'modules.ai.tasks.career_tasks',  # Must match actual file path
    'modules.ai.tasks.content_tasks',
    # ...
]
```

### Issue: Firebase initializes twice

**Fix:**
```python
# In core/config.py
_firebase_initialized = False  # Global flag to prevent double init
```

### Issue: Frontend gets CORS errors

**Fix:**
```python
# In main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📞 Support During Migration

**Migration Timeline: Week 3 (7 days)**
- Day 1-2: Setup + General API
- Day 3-4: AI/ML + Celery
- Day 5: Testing
- Day 6-7: Deployment

**Need Help?**
- Check logs: `tail -f /var/log/backend.log`
- Test Celery: `celery -A modules.ai.celery_app inspect active`
- Health check: `curl http://localhost:8000/health`

---

Good luck with the migration! 🚀
