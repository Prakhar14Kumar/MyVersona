# MyVerSona Backend - Architecture Diagrams

## 🏗️ Layered Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
│                     (HTTP/JSON/WebSocket)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes: /users, /posts, /chat                           │  │
│  │  - Handle HTTP requests/responses                        │  │
│  │  - Route to appropriate domain service                   │  │
│  │  - Transform HTTP to domain objects                      │  │
│  │  - Handle errors and status codes                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dependencies: Authentication, Validation                │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services: UserService, PostService, ChatService         │  │
│  │  - Business logic and rules                              │  │
│  │  - Validation and authorization                          │  │
│  │  - Orchestrate multiple repositories                     │  │
│  │  - Transform data between layers                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Validators: User rules, Post rules                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Exceptions: Domain-specific errors                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Interfaces: IUserRepo, IPostRepo, IChatRepo             │  │
│  │  - Define data access contract (abstract)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Implementations: FirestoreUserRepo, etc.                │  │
│  │  - Actual database operations                            │  │
│  │  - Query building and execution                          │  │
│  │  - Data mapping                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                           │
│                     (Database Layer)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        CORE LAYER                               │
│  (Shared utilities, config, constants - used by all layers)    │
│  - Database connection                                          │
│  - Configuration management                                     │
│  - Utility functions                                            │
│  - Common types                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

### Example: Get User Profile

```
1. Client Request
   │
   │  GET /users/me
   │  Authorization: Bearer <token>
   │
   ▼
┌─────────────────────────────────────────┐
│  API Layer: users.py                    │
│  @router.get("/me")                     │
│  async def get_my_profile(              │
│      user_id: str = Depends(get_auth),  │
│      user_service: UserService = Depends()│
│  )                                      │
└───────────────┬─────────────────────────┘
                │
                │ user_id = "abc123"
                │
                ▼
┌─────────────────────────────────────────┐
│  Domain Layer: user_service.py          │
│  async def get_user_by_id(user_id):     │
│    - Validate user_id format            │
│    - Check authorization                │
│    - Call repository                    │
│    - Apply business rules               │
└───────────────┬─────────────────────────┘
                │
                │ user_id = "abc123"
                │
                ▼
┌─────────────────────────────────────────┐
│  Repository Layer: firestore_user_repo  │
│  async def find_by_id(uid):             │
│    - Build Firestore query              │
│    - Execute query                      │
│    - Map data to UserProfile            │
└───────────────┬─────────────────────────┘
                │
                │ SELECT from users where uid = "abc123"
                │
                ▼
┌─────────────────────────────────────────┐
│  Firestore Database                     │
│  Collection: users                      │
│  Document: abc123                       │
└───────────────┬─────────────────────────┘
                │
                │ Return user data
                │
                ▼
┌─────────────────────────────────────────┐
│  Repository: Map to UserProfile         │
│  return UserProfile(**data)             │
└───────────────┬─────────────────────────┘
                │
                │ UserProfile object
                │
                ▼
┌─────────────────────────────────────────┐
│  Domain Service: Apply transformations  │
│  - Hide sensitive data                  │
│  - Add computed fields                  │
│  - Return domain object                 │
└───────────────┬─────────────────────────┘
                │
                │ UserProfile object
                │
                ▼
┌─────────────────────────────────────────┐
│  API Route: Return HTTP response        │
│  return user (FastAPI auto-serializes)  │
└───────────────┬─────────────────────────┘
                │
                │ HTTP 200 OK
                │ {
                │   "uid": "abc123",
                │   "username": "john",
                │   "email": "john@example.com"
                │ }
                │
                ▼
   Client receives response
```

---

## 🔀 Comparison: Before vs After

### BEFORE (Direct Database Access)

```
Client Request
      │
      ▼
┌─────────────────┐
│  Route Handler  │
│  /users/me      │
└────────┬────────┘
         │
         │ Direct call
         │
         ▼
┌─────────────────┐
│ FirebaseService │  ← Mixed concerns
│  .get_user()    │  ← Business logic + DB access
└────────┬────────┘
         │
         │ Direct query
         │
         ▼
┌─────────────────┐
│   Firestore     │
└─────────────────┘

Problems:
❌ Route knows about database
❌ Business logic in service layer
❌ Hard to test
❌ Hard to change database
❌ Tight coupling
```

### AFTER (Clean Architecture)

```
Client Request
      │
      ▼
┌─────────────────┐
│  API Layer      │  ✅ HTTP concerns only
│  /users/me      │
└────────┬────────┘
         │
         │ Calls domain service
         │
         ▼
┌─────────────────┐
│  Domain Layer   │  ✅ Business logic only
│  UserService    │
└────────┬────────┘
         │
         │ Uses repository interface
         │
         ▼
┌─────────────────┐
│  Repository     │  ✅ Data access only
│  Interface      │
└────────┬────────┘
         │
         │ Implemented by
         │
         ▼
┌─────────────────┐
│  Firestore      │  ✅ Database specific
│  Implementation │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Firestore     │
└─────────────────┘

Benefits:
✅ Clear separation of concerns
✅ Easy to test each layer
✅ Easy to swap database
✅ Loose coupling
✅ Business rules explicit
```

---

## 🧩 Dependency Flow

### Dependency Rule: Inner layers don't know about outer layers

```
                    ┌────────────────┐
                    │   API Layer    │ ◄─── Depends on Domain
                    │   (Outer)      │
                    └────────┬───────┘
                             │
                    ┌────────▼───────┐
                    │  Domain Layer  │ ◄─── Depends on Repository Interface
                    │   (Middle)     │      (but not implementation)
                    └────────┬───────┘
                             │
                    ┌────────▼───────┐
                    │   Repository   │ ◄─── Implements Interface
                    │     (Inner)    │
                    └────────┬───────┘
                             │
                    ┌────────▼───────┐
                    │    Database    │
                    │   (External)   │
                    └────────────────┘

Key Points:
- API Layer imports Domain Layer
- Domain Layer imports Repository Interfaces (not implementations)
- Repository implementations import Domain entities
- Database is external dependency
```

---

## 🏛️ Module Structure

### Users Module Example

```
users/
├── API Layer
│   └── routes/users.py
│       ├── get_my_profile()      → HTTP handler
│       ├── update_profile()      → HTTP handler
│       └── follow_user()         → HTTP handler
│
├── Domain Layer
│   ├── services/user_service.py
│   │   ├── get_user_by_id()      → Business logic
│   │   ├── update_user_profile() → Business logic + validation
│   │   └── follow_user()         → Business logic + rules
│   │
│   └── validators/user_validator.py
│       ├── validate_username()   → Validation rules
│       └── validate_bio()        → Validation rules
│
├── Repository Layer
│   ├── interfaces/user_repository.py
│   │   └── IUserRepository       → Interface (abstract)
│   │       ├── find_by_id()
│   │       ├── update()
│   │       └── follow()
│   │
│   └── implementations/firestore_user_repo.py
│       └── FirestoreUserRepository  → Concrete implementation
│           ├── find_by_id()      → Firestore query
│           ├── update()          → Firestore update
│           └── follow()          → Firestore transaction
│
└── Models
    └── user.py
        ├── UserProfile           → Pydantic model
        └── UserUpdate            → Pydantic model
```

---

## 🎯 Dependency Injection Pattern

```
┌────────────────────────────────────────────────────────┐
│                    FastAPI App                         │
│  (Dependency Injection Container)                      │
└───────────┬────────────────────────────────────────────┘
            │
            │ Provides dependencies
            │
            ▼
┌────────────────────────────────────────────────────────┐
│  Route Function                                        │
│                                                        │
│  @router.get("/me")                                    │
│  async def get_profile(                                │
│      user_id: str = Depends(get_current_user_id),    │ ← Injected
│      user_service: UserService = Depends()           │ ← Injected
│  ):                                                    │
│      return await user_service.get_user(user_id)      │
│                                                        │
└────────────────────────────────────────────────────────┘

Benefits:
✅ Easy to test (inject mocks)
✅ Loose coupling
✅ Flexible configuration
✅ Clear dependencies
```

---

## 🧪 Testing Strategy

### Unit Testing (Domain Layer)

```python
# Test business logic without database or HTTP

def test_follow_user_cannot_follow_self():
    # Arrange
    mock_repo = MockUserRepository()
    user_service = UserService(user_repo=mock_repo)
    
    # Act & Assert
    with pytest.raises(ValueError, match="Cannot follow yourself"):
        await user_service.follow_user("user123", "user123")
```

### Integration Testing (Repository Layer)

```python
# Test database operations

@pytest.mark.integration
async def test_firestore_user_repository():
    # Arrange
    repo = FirestoreUserRepository()
    
    # Act
    user = await repo.create("test123", {"username": "test"})
    found_user = await repo.find_by_id("test123")
    
    # Assert
    assert found_user.username == "test"
    
    # Cleanup
    await repo.delete("test123")
```

### E2E Testing (Full Stack)

```python
# Test through HTTP API

async def test_get_user_profile_endpoint():
    # Arrange
    client = TestClient(app)
    token = get_test_token()
    
    # Act
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Assert
    assert response.status_code == 200
    assert "username" in response.json()
```

---

## 🔄 Data Flow Example: Follow User

```
1. Client: POST /users/abc123/follow
   Authorization: Bearer <token>
   
   ↓

2. API Route (users.py)
   - Extract token → user_id = "xyz789"
   - Extract path param → target_id = "abc123"
   - Call domain service
   
   ↓

3. Domain Service (user_service.py)
   async def follow_user(follower_id, following_id):
   
   Step 1: Validate
   ├─ if follower_id == following_id:
   │    raise ValueError("Cannot follow yourself")
   
   Step 2: Check target exists
   ├─ target = await user_repo.find_by_id(following_id)
   ├─ if not target:
   │    raise UserNotFoundError()
   
   Step 3: Check not already following
   ├─ is_following = await user_repo.is_following(...)
   ├─ if is_following:
   │    raise ValueError("Already following")
   
   Step 4: Execute follow
   └─ await user_repo.follow(follower_id, following_id)
   
   ↓

4. Repository (firestore_user_repo.py)
   async def follow(follower_id, following_id):
   
   Step 1: Add to followers subcollection
   ├─ db.collection("users").document(following_id)
   │    .collection("followers").document(follower_id).set(...)
   
   Step 2: Update follower count
   ├─ db.collection("users").document(follower_id)
   │    .update({"following_count": Increment(1)})
   
   Step 3: Update following count
   └─ db.collection("users").document(following_id)
        .update({"followers_count": Increment(1)})
   
   ↓

5. Firestore Database
   - Transaction executed
   - Data persisted
   - Return success
   
   ↓

6. Return through layers
   Repository → Domain Service → API Route → Client
   
   ↓

7. Client receives: HTTP 200 OK
   {"message": "User followed successfully"}
```

---

## 📊 Layer Responsibilities Matrix

| Layer | Knows About | Responsibilities | Don't Do |
|-------|-------------|------------------|----------|
| **API** | HTTP, Domain Services | - Route requests<br>- Parse/validate HTTP input<br>- Format HTTP responses<br>- Handle HTTP errors | - Business logic<br>- Database queries<br>- Data transformations |
| **Domain** | Business Rules, Repository Interfaces | - Business logic<br>- Validation<br>- Authorization<br>- Orchestration | - HTTP concerns<br>- Database implementation<br>- Concrete repositories |
| **Repository** | Database, Domain Entities | - Database queries<br>- Data mapping<br>- Transactions | - Business logic<br>- HTTP concerns<br>- Validation |
| **Core** | Nothing | - Shared utilities<br>- Configuration<br>- Constants | - Business logic<br>- HTTP concerns<br>- Database queries |

---

## 🎓 Key Principles

1. **Dependency Inversion**
   - High-level modules don't depend on low-level modules
   - Both depend on abstractions (interfaces)

2. **Single Responsibility**
   - Each layer/class has one reason to change
   - Clear, focused responsibilities

3. **Open/Closed**
   - Open for extension (new implementations)
   - Closed for modification (existing code)

4. **Interface Segregation**
   - Small, focused interfaces
   - Clients don't depend on unused methods

5. **Don't Repeat Yourself (DRY)**
   - Shared logic in core layer
   - Reusable across all layers

---

This architecture provides a solid foundation for scaling MyVerSona to millions of users while keeping the codebase maintainable and testable! 🚀
