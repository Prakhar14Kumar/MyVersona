# VerSona Unified Backend - Architecture Documentation

Comprehensive architecture documentation for the unified monolithic-modular backend.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                          │
│                    http://localhost:5173                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     UNIFIED BACKEND (FastAPI)                       │
│                     http://localhost:8000                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    API LAYER (main.py)                     │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  - CORS Middleware                                         │   │
│  │  - Rate Limiting                                           │   │
│  │  - Authentication                                          │   │
│  │  - Exception Handling                                      │   │
│  │  - Request Logging                                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────┐         ┌─────────────────────────┐     │
│  │  GENERAL ROUTES      │         │   AI/ML ROUTES          │     │
│  │  /api/v1/            │         │   /api/v1/ai/           │     │
│  ├──────────────────────┤         ├─────────────────────────┤     │
│  │ • auth               │         │ • career                │     │
│  │ • posts              │         │ • content               │     │
│  │ • users              │         │ • resume                │     │
│  │ • chat               │         │ • mentor                │     │
│  │ • notifications      │         │ • moderation            │     │
│  │ • search             │         │ • feed                  │     │
│  │ • moderation         │         │ • search (semantic)     │     │
│  │                      │         │ • recommendations       │     │
│  │ [Synchronous]        │         │ [Asynchronous]          │     │
│  │ Returns immediately  │         │ Returns task_id         │     │
│  └──────────┬───────────┘         └────────┬────────────────┘     │
│             │                              │                       │
│             ▼                              ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              SHARED CORE SERVICES                           │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ • Firebase Admin SDK (Firestore, Auth, Storage)            │  │
│  │ • Redis Cache                                              │  │
│  │ • JWT Authentication                                        │  │
│  │ • WebSocket Manager                                         │  │
│  │ • File Validators                                           │  │
│  │ • Sanitizers                                                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────────┐
          │         REDIS (Broker)           │
          │     localhost:6379               │
          ├──────────────────────────────────┤
          │ • Caching                        │
          │ • Celery Message Queue           │
          │ • Task Results Storage           │
          └──────────────┬───────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CELERY WORKERS (Background Processing)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Worker 1   │  │   Worker 2   │  │   Worker 3   │             │
│  │ High Priority│  │Med Priority  │  │ Low Priority │             │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤             │
│  │ • Moderation │  │ • Feed Rank  │  │ • Career Rec │             │
│  │ • Search     │  │ • Content Rec│  │ • Resume     │             │
│  │              │  │ • Recommends │  │ • Learning   │             │
│  │ Concurrency:2│  │ Concurrency:4│  │ Concurrency:4│             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┴─────────────────┘                      │
│                           │                                        │
│                           ▼                                        │
│         ┌─────────────────────────────────────────┐               │
│         │         AI/ML MODELS MODULE             │               │
│         ├─────────────────────────────────────────┤               │
│         │ 1. Career Recommender                   │               │
│         │ 2. Content Recommender                  │               │
│         │ 3. Resume Analyzer                      │               │
│         │ 4. Text Classifier                      │               │
│         │ 5. College Matcher                      │               │
│         │ 6. Connection Recommender               │               │
│         │ 7. Gemini AI Service                    │               │
│         │ 8. Advanced Features                    │               │
│         │                                         │               │
│         │ Tech: PyTorch, Transformers, spaCy,     │               │
│         │       scikit-learn, Google Gemini       │               │
│         └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────────┐
          │         FIREBASE                 │
          ├──────────────────────────────────┤
          │ • Firestore (Database)           │
          │ • Authentication                 │
          │ • Cloud Storage                  │
          └──────────────────────────────────┘
```

## 📁 Detailed Folder Structure

```
backend-unified/
│
├── main.py                          # FastAPI application entry point
│
├── core/                            # Shared core functionality
│   ├── config.py                    # Global config + Firebase initialization
│   ├── middleware.py                # Custom middlewares
│   ├── exceptions.py                # Exception handlers
│   ├── cache.py                     # Redis cache utilities
│   │
│   ├── auth/                        # Authentication module
│   │   ├── __init__.py
│   │   ├── decorators.py            # @require_auth, @require_role
│   │   ├── jwt_handler.py           # JWT token management
│   │   └── firebase_auth.py         # Firebase Auth wrapper
│   │
│   └── websocket/                   # WebSocket handlers
│       ├── __init__.py
│       ├── connection_manager.py    # WebSocket connection pool
│       ├── chat_handler.py          # Real-time chat
│       ├── notification_handler.py  # Real-time notifications
│       └── presence_handler.py      # User online/offline status
│
├── api/                             # API routes (versioned)
│   └── v1/
│       └── routes/
│           ├── __init__.py
│           │
│           ├── auth.py              # POST /login, /signup, /logout
│           ├── posts.py             # CRUD for posts
│           ├── users.py             # User management
│           ├── chat.py              # Chat endpoints
│           ├── notifications.py     # Notifications
│           ├── search.py            # General search
│           ├── moderation.py        # Content moderation
│           │
│           └── ai/                  # AI/ML routes (async)
│               ├── __init__.py
│               ├── ai_career.py     # Career recommendations
│               ├── ai_content.py    # Content recommendations
│               ├── ai_resume.py     # Resume analysis
│               ├── ai_mentor.py     # AI career mentor
│               ├── ai_moderation.py # AI content moderation
│               ├── ai_feed.py       # Feed ranking algorithm
│               ├── ai_search.py     # Semantic search
│               ├── ai_recommendations.py  # General AI recs
│               └── ai_advanced.py   # Advanced AI features
│
├── modules/                         # Business logic modules
│   │
│   ├── ai/                          # AI/ML Module
│   │   ├── __init__.py
│   │   │
│   │   ├── celery_app.py            # Celery configuration
│   │   │
│   │   ├── tasks/                   # Celery tasks (async)
│   │   │   ├── __init__.py
│   │   │   ├── career_tasks.py      # Career AI tasks
│   │   │   ├── content_tasks.py     # Content AI tasks
│   │   │   ├── resume_tasks.py      # Resume AI tasks
│   │   │   ├── moderation_tasks.py  # Moderation AI tasks
│   │   │   ├── feed_tasks.py        # Feed ranking tasks
│   │   │   ├── search_tasks.py      # Search AI tasks
│   │   │   ├── recommendation_tasks.py
│   │   │   └── advanced_tasks.py
│   │   │
│   │   ├── models/                  # ML Model implementations
│   │   │   ├── __init__.py
│   │   │   ├── career_recommender.py
│   │   │   ├── content_recommender.py
│   │   │   ├── resume_analyzer.py
│   │   │   ├── text_classifier.py
│   │   │   ├── college_matcher.py
│   │   │   ├── connection_recommender.py
│   │   │   └── ...
│   │   │
│   │   ├── services/                # AI services
│   │   │   ├── __init__.py
│   │   │   ├── gemini_service.py    # Google Gemini AI
│   │   │   ├── openai_service.py    # OpenAI (optional)
│   │   │   └── model_loader.py      # Model loading utilities
│   │   │
│   │   └── trained_models/          # Pre-trained model files
│   │       ├── career_model.pkl
│   │       ├── content_model.pkl
│   │       └── ...
│   │
│   └── general/                     # General business logic
│       ├── __init__.py
│       │
│       ├── services/                # Shared services
│       │   ├── __init__.py
│       │   ├── firebase_service.py  # Firestore operations
│       │   ├── storage_service.py   # Firebase Storage
│       │   ├── notification_service.py
│       │   └── file_validator.py
│       │
│       └── utils/
│           ├── __init__.py
│           ├── sanitizer.py         # Input sanitization
│           └── validators.py        # Data validation
│
├── schemas/                         # Pydantic models
│   ├── __init__.py
│   ├── auth_schemas.py              # Auth request/response models
│   ├── post_schemas.py              # Post models
│   ├── user_schemas.py              # User models
│   └── ai_schemas.py                # AI request/response models
│
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
├── .gitignore
│
├── README.md                        # Main documentation
├── ARCHITECTURE.md                  # This file
├── DEPLOYMENT_GUIDE.md              # Production deployment
└── MIGRATION_GUIDE.md               # Migration from old backend
```

## 🔄 Request Flow Diagrams

### Synchronous Request (General API)

```
┌────────┐    1. POST /api/v1/posts     ┌─────────┐
│ Client │─────────────────────────────▶│ FastAPI │
└────────┘                               └────┬────┘
                                              │
                                         2. Validate
                                              │
                                              ▼
                                        ┌──────────┐
                                        │ Firebase │
                                        │ Firestore│
                                        └─────┬────┘
                                              │
     ┌────────┐   3. Return result      ┌────▼────┐
     │ Client │◀─────────────────────────│ FastAPI │
     └────────┘   (200 OK, ~50ms)        └─────────┘
```

**Timeline:**
- 0ms: Client sends request
- 10ms: Validation complete
- 40ms: Firebase write complete
- 50ms: Response returned to client

**Characteristics:**
- ✅ Fast (< 100ms)
- ✅ Simple (request → response)
- ✅ No polling needed

---

### Asynchronous Request (AI/ML API)

```
Phase 1: Submit Task
┌────────┐ 1. POST /api/v1/ai/career/recs ┌─────────┐
│ Client │────────────────────────────────▶│ FastAPI │
└────────┘                                  └────┬────┘
                                                 │
                                            2. Create
                                             Celery Task
                                                 │
                                                 ▼
     ┌────────┐  3. Return task_id        ┌─────────┐
     │ Client │◀───────────────────────────│ FastAPI │
     └────────┘  (202 Accepted, ~10ms)     └─────────┘
          │
          │                                 ┌─────────┐
          │                                 │  Redis  │
          │                          ┌──────│ (Queue) │
          │                          │      └─────────┘
          │                          │
          │                          ▼
          │                     ┌─────────┐
          │                     │ Celery  │
          │                     │ Worker  │
          │                     └────┬────┘
          │                          │
          │                     4. Process
          │                      ML Model
          │                      (1-5 sec)
          │                          │
          │                          ▼
          │                     ┌─────────┐
          │                     │  Redis  │
          │                     │(Result) │
          │                     └─────────┘

Phase 2: Poll for Result
     │
     │    5. GET /api/v1/tasks/{task_id}
     └──────────────────────────────────▶┌─────────┐
                                         │ FastAPI │
                                         └────┬────┘
                                              │
                                         6. Check
                                          Redis
                                              │
     ┌────────┐  7. Return result       ┌────▼────┐
     │ Client │◀─────────────────────────│ FastAPI │
     └────────┘  (200 OK with data)      └─────────┘
```

**Timeline:**
- 0ms: Client submits task
- 10ms: Task_id returned (202 Accepted)
- 10-5000ms: ML model processes in background
- Client polls every 1 second
- 5000ms: Result available

**Characteristics:**
- ✅ Non-blocking (API responds in 10ms)
- ✅ Scalable (workers can be scaled independently)
- ⚠️  Requires polling from client
- ⚠️  More complex frontend logic

---

## 🔐 Authentication Flow

```
┌────────┐  1. Login Request              ┌─────────┐
│ Client │───────────────────────────────▶│ FastAPI │
└────────┘  {email, password}              └────┬────┘
                                                │
                                           2. Verify
                                                │
                                                ▼
                                          ┌──────────┐
                                          │ Firebase │
                                          │   Auth   │
                                          └─────┬────┘
                                                │
                                           3. Generate
                                              JWT Token
                                                │
     ┌────────┐  4. Return token          ┌────▼────┐
     │ Client │◀───────────────────────────│ FastAPI │
     └────┬───┘  {token, user}             └─────────┘
          │
          │  5. Subsequent requests
          │     with Authorization header
          │
          ▼
     ┌─────────┐
     │  Redis  │
     │ (Cache) │  Token cached for fast validation
     └─────────┘
```

## 🎯 Celery Task Queue Architecture

### Task Priority Routing

```
                         ┌─────────────────────┐
                         │   Redis (Broker)    │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  High Priority   │  │ Medium Priority  │  │  Low Priority    │
    │     Queue        │  │     Queue        │  │     Queue        │
    ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
    │ • Moderation     │  │ • Feed Ranking   │  │ • Career Recs    │
    │ • Search         │  │ • Content Recs   │  │ • Resume Analyze │
    │                  │  │ • Recommendations│  │ • Learning Path  │
    │ Concurrency: 2   │  │ Concurrency: 4   │  │ Concurrency: 4   │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
          SLA: <1s            SLA: 1-3s            SLA: 3-10s
```

### Task Lifecycle

```
1. PENDING    → Task submitted to Redis queue
2. STARTED    → Worker picked up task
3. RETRY      → Task failed, retrying (up to 3 times)
4. SUCCESS    → Task completed successfully
5. FAILURE    → Task failed after all retries
```

## 🔥 Firebase Integration

### Single Global Initialization

```python
# core/config.py
_firebase_initialized = False

def initialize_firebase():
    global _firebase_initialized
    
    if not _firebase_initialized:
        firebase_admin.initialize_app(cred, {...})
        _firebase_initialized = True
```

### Shared Across All Modules

```
┌─────────────────────────────────────────┐
│   Firebase Admin SDK (Initialized Once) │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │  Firestore  │  │    Auth     │      │
│  │             │  │             │      │
│  │ • users     │  │ • verify    │      │
│  │ • posts     │  │ • create    │      │
│  │ • chats     │  │ • delete    │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  ┌─────────────┐                        │
│  │   Storage   │                        │
│  │             │                        │
│  │ • images    │                        │
│  │ • videos    │                        │
│  │ • files     │                        │
│  └─────────────┘                        │
└─────────────────────────────────────────┘
         │                    │
    ┌────▼────┐        ┌──────▼──────┐
    │ General │        │  AI/ML      │
    │  API    │        │  Celery     │
    │ Routes  │        │  Tasks      │
    └─────────┘        └─────────────┘
```

## 📊 Scalability Model

### Vertical Scaling (Single Server)

```
┌────────────────────────────────────┐
│      Single Server (8 CPU, 16GB)   │
├────────────────────────────────────┤
│                                    │
│  FastAPI (4 workers)               │
│  └─ Each handles 100 req/sec       │
│                                    │
│  Celery Workers (10 workers)       │
│  ├─ High Priority: 2 workers       │
│  ├─ Medium Priority: 4 workers     │
│  └─ Low Priority: 4 workers        │
│                                    │
│  Redis (2GB memory)                │
│  └─ Caching + Message Queue        │
│                                    │
└────────────────────────────────────┘

Capacity: ~400 req/sec API + 50 AI tasks/sec
```

### Horizontal Scaling (Multiple Servers)

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
     │  API    │       │  API    │       │  API    │
     │ Server 1│       │ Server 2│       │ Server 3│
     │ 4 workers       │ 4 workers       │ 4 workers
     └─────────┘       └─────────┘       └─────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                    ┌───────▼──────┐
                    │ Redis Cluster│
                    │  (Sentinel)  │
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
     │ Celery  │       │ Celery  │       │ Celery  │
     │Worker #1│       │Worker #2│       │Worker #3│
     │10 tasks │       │10 tasks │       │10 tasks │
     └─────────┘       └─────────┘       └─────────┘

Capacity: ~1200 req/sec API + 150 AI tasks/sec
```

## 🛡️ Security Architecture

### Defense in Depth

```
Layer 1: Network
├─ HTTPS/TLS encryption
├─ CORS policy
└─ Rate limiting (60 req/min per IP)

Layer 2: Authentication
├─ Firebase Auth tokens
├─ JWT validation
└─ Token expiration (7 days)

Layer 3: Authorization
├─ Role-based access control (RBAC)
├─ Resource ownership checks
└─ API route protection (@require_auth)

Layer 4: Data Validation
├─ Pydantic schemas
├─ Input sanitization (bleach)
└─ File type validation

Layer 5: Firestore Security Rules
├─ User can only read/write own data
├─ Admins have elevated permissions
└─ Public content has read-only access
```

## 📈 Performance Optimizations

### 1. Redis Caching Strategy

```python
# Cache frequently accessed data
@cache(ttl=3600)  # 1 hour
def get_user_profile(user_id):
    return firestore.collection('users').document(user_id).get()

# Cache ML model results
@cache(ttl=86400)  # 24 hours
def get_career_recommendations(user_id, skills):
    return career_model.predict(user_id, skills)
```

### 2. Database Query Optimization

```python
# ❌ Bad: N+1 queries
for post in posts:
    user = db.collection('users').document(post.user_id).get()

# ✅ Good: Batch query
user_ids = [post.user_id for post in posts]
users = db.collection('users').where('id', 'in', user_ids).get()
```

### 3. Celery Task Optimization

```python
# Process tasks in parallel
from celery import group

# Submit 10 tasks at once
job = group([
    analyze_resume.s(resume_1),
    analyze_resume.s(resume_2),
    # ...
])
result = job.apply_async()
```

## 🧪 Testing Strategy

### Unit Tests
- Test individual functions
- Mock external dependencies (Firebase, Redis)
- Fast execution (< 1 second per test)

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Verify Celery tasks complete

### Load Tests
- Apache Bench, Locust, or k6
- Target: 400 req/sec sustained
- Monitor response times and error rates

## 📝 Summary

**Key Architectural Decisions:**

1. ✅ **Monolithic-Modular** - Single codebase, separate modules
2. ✅ **Async AI with Celery** - Non-blocking ML inference
3. ✅ **Global Firebase** - Single initialization, shared across all modules
4. ✅ **Priority Queues** - Critical tasks processed first
5. ✅ **Redis for Everything** - Caching + message queue + results
6. ✅ **Comprehensive Auth** - Firebase Auth + JWT + RBAC
7. ✅ **WebSockets** - Real-time chat, notifications, presence

**Benefits:**

- 🚀 **Performance**: < 100ms for general API, async AI doesn't block
- 📈 **Scalability**: Scale API and AI workers independently
- 🛡️ **Security**: Multiple layers of protection
- 🔧 **Maintainability**: Clear separation of concerns
- 🚢 **Deployability**: Single deployment, easy to manage

---

Built with ❤️ by the VerSona team
