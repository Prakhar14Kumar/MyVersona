# 🏗️ VerSona AI Architecture - Phase 3

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER LAYER                                 │
│  Components (Unchanged)                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ CareerPage   │  │  FeedPage    │  │  ChatPage    │  etc...     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          │  ← Same API      │  ← Same API      │  ← Same API
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                                  │
│  /lib/mlService.ts (Modified)                                        │
│                                                                       │
│  getCareerRecommendations()    categorizePost()                     │
│  getContentRecommendations()   suggestHashtags()                    │
│  analyzeResume()               ...                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PHASE 3 LOGIC (NEW)                                        │   │
│  │                                                              │   │
│  │  1. Generate mock result ────► User sees this (instant)     │   │
│  │  2. Trigger shadow test ─┐                                  │   │
│  │  3. Return mock result   │                                  │   │
│  └──────────────────────────┼───────────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────────┘
                               │ (Async - user doesn't wait)
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       AI LAYER (NEW)                                 │
│  /lib/ai/ (7 files - all production-ready)                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  shadowMode.ts - Testing Framework                          │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  ShadowModeTest                                       │  │   │
│  │  │  ├─ testCareerRecommendations()                       │  │   │
│  │  │  ├─ testContentRanking()                              │  │   │
│  │  │  ├─ testPostClassification()                          │  │   │
│  │  │  ├─ testHashtagSuggestions()                          │  │   │
│  │  │  └─ testResumeAnalysis()                              │  │   │
│  │  │                                                         │  │   │
│  │  │  Calls ↓                                               │  │   │
│  │  └─────┼─────────────────────────────────────────────────┘  │   │
│  └────────┼────────────────────────────────────────────────────┘   │
│           ↓                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Real AI Algorithms                                         │   │
│  │                                                              │   │
│  │  careerEngine.ts                                            │   │
│  │  ├─ CareerRecommendationEngine                             │   │
│  │  │  └─ recommend() → Skill-based matching                  │   │
│  │                                                              │   │
│  │  contentEngine.ts                                           │   │
│  │  ├─ ContentRecommendationEngine                            │   │
│  │  │  └─ rankPosts() → Hybrid filtering                      │   │
│  │                                                              │   │
│  │  textClassifier.ts                                          │   │
│  │  ├─ TextClassifier (Naive Bayes)                           │   │
│  │  │  └─ predict() → Category + confidence                   │   │
│  │                                                              │   │
│  │  hashtagEngine.ts                                           │   │
│  │  ├─ HashtagEngine                                           │   │
│  │  │  └─ suggest() → TF-IDF + extraction                     │   │
│  │                                                              │   │
│  │  resumeAnalyzer.ts                                          │   │
│  │  ├─ ResumeAnalyzer                                          │   │
│  │  │  └─ analyze() → ATS score + skills                      │   │
│  │                                                              │   │
│  │  utils.ts                                                    │   │
│  │  └─ 15+ ML utility functions                                │   │
│  │     ├─ cosineSimilarity()                                   │   │
│  │     ├─ jaccardSimilarity()                                  │   │
│  │     ├─ calculateTF(), calculateIDF()                        │   │
│  │     └─ ...                                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Results ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ShadowModeLogger                                           │   │
│  │  ├─ Compare old vs new results                             │   │
│  │  ├─ Calculate similarity score                             │   │
│  │  ├─ Log to console (dev)                                   │   │
│  │  ├─ Track statistics                                       │   │
│  │  └─ Export for analysis                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Career Recommendations

```
USER ACTION:
  User visits Career Page
    ↓

COMPONENT:
  <CareerPage>
    ↓
  useEffect(() => {
    loadRecommendations()  ← Triggers on mount
  })
    ↓

SERVICE LAYER:
  mlService.getCareerRecommendations({
    skills: ["Python", "React"],
    interests: ["AI", "Web Dev"]
  })
    ↓
  ┌───────────────────────────────────────────┐
  │ 1. Generate mock result (instant)         │
  │    [AI/ML Engineer, Full Stack Dev, ...]  │
  │    ↓                                       │
  │ 2. Return to user ← USER GETS THIS NOW   │
  └───────────────────────────────────────────┘
    ↓
  ┌───────────────────────────────────────────┐
  │ 3. Trigger shadow test (async)            │
  │    ShadowModeTest                          │
  │      .testCareerRecommendations()          │
  └───────────────────────────────────────────┘
         ↓

AI LAYER (Background - user doesn't wait):
  ┌───────────────────────────────────────────┐
  │ 4. Run real AI                            │
  │    CareerRecommendationEngine.recommend() │
  │    ├─ Calculate skill overlap             │
  │    ├─ Match required skills               │
  │    ├─ Consider market demand              │
  │    └─ Rank by score                       │
  │    → [Data Scientist, ML Engineer, ...]   │
  └───────────────────────────────────────────┘
         ↓
  ┌───────────────────────────────────────────┐
  │ 5. Compare results                        │
  │    Old: [AI/ML, Full Stack, Data Sci, PM] │
  │    New: [Data Sci, ML Eng, DevOps, ...]   │
  │    Overlap: 50% similar                   │
  └───────────────────────────────────────────┘
         ↓
  ┌───────────────────────────────────────────┐
  │ 6. Log comparison                         │
  │    🧪 Shadow Mode: Career Recommendations │
  │    📊 Old Result: [...]                    │
  │    ✨ New Result: [...]                    │
  │    📈 Similarity: 50.0%                    │
  │    (Visible in console - dev only)        │
  └───────────────────────────────────────────┘
         ↓
  DONE (user unaffected)
```

**Time Analysis:**
- User wait time: ~800ms (mock generation + API delay)
- Shadow test time: ~50ms (runs after response sent)
- Total user time: ~800ms (same as before)
- User impact: **ZERO**

---

## Phase 3 vs Future Phase 4

### Phase 3 (CURRENT - Shadow Mode)

```
User Request
    ↓
Mock AI (Primary) ──────► User sees this ✅
    ║
    ║ (Parallel)
    ↓
Real AI (Shadow) ──────► Logged (hidden) 📊
```

**User gets:** Mock results  
**Real AI:** Testing only  
**Purpose:** Validate before switching

---

### Phase 4 (FUTURE - Production AI)

```
User Request
    ↓
Feature Flag Check
    ↓
  ┌─────┴─────┐
  │           │
  ↓           ↓
Mock AI   Real AI ──────► User sees this ✅
(backup)  (primary)
```

**User gets:** Real AI results  
**Mock AI:** Fallback only  
**Purpose:** Production use

---

## Component Integration (Unchanged)

### Career Page Example

```typescript
// /components/CareerPage.tsx
// ❌ NO CHANGES TO THIS FILE

import { getCareerRecommendations } from '../lib/mlService';

export function CareerPage() {
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    const load = async () => {
      // Same function call (unchanged)
      const recs = await getCareerRecommendations(userProfile);
      setRecommendations(recs);
    };
    load();
  }, []);
  
  return (
    <div>
      {recommendations.map(rec => (
        <RecommendationCard key={rec.title} {...rec} />
      ))}
    </div>
  );
}
```

**Changes:** ❌ ZERO  
**Still works:** ✅ YES  
**User impact:** ❌ NONE

---

## AI Algorithm Details

### Career Engine Architecture

```
CareerRecommendationEngine
  ├─ Database: 12 career paths
  │  ├─ AI/ML Engineer
  │  ├─ Full Stack Developer
  │  ├─ Data Scientist
  │  └─ ...
  │
  ├─ Scoring Algorithm:
  │  ├─ 40%: Skill overlap (Jaccard)
  │  ├─ 30%: Required skills match
  │  ├─ 20%: Market demand
  │  └─ 10%: Experience alignment
  │
  └─ Output: Top 4 ranked careers
```

### Content Engine Architecture

```
ContentRecommendationEngine
  ├─ Signals (6 total):
  │  ├─ 25%: Category match
  │  ├─ 20%: Interest/hashtag overlap
  │  ├─ 20%: Social proof (engagement)
  │  ├─ 15%: Recency (time decay)
  │  ├─ 10%: Connection (followed users)
  │  └─ 10%: History similarity
  │
  └─ Output: Ranked posts by relevance
```

### Text Classifier Architecture

```
TextClassifier (Naive Bayes)
  ├─ Training: 30 labeled examples
  │  ├─ 15 career posts
  │  └─ 15 entertainment posts
  │
  ├─ Features:
  │  ├─ Tokenization
  │  ├─ Stop word removal
  │  ├─ Term frequency calculation
  │  └─ Laplace smoothing
  │
  ├─ Fallback: Keyword matching
  │
  └─ Output: Category + confidence
```

---

## Feature Flags Control

```typescript
// /lib/ai/shadowMode.ts

export const AI_FEATURE_FLAGS = {
  // Master control
  ENABLE_SHADOW_MODE: true,        // ← Turn off to disable all
  
  // Individual features
  TEST_CAREER_RECOMMENDATIONS: true,
  TEST_CONTENT_RANKING: true,
  TEST_POST_CLASSIFICATION: true,
  TEST_HASHTAG_SUGGESTIONS: true,
  TEST_RESUME_ANALYSIS: true,
  
  // Logging
  LOG_TO_CONSOLE: true,            // Dev: true, Prod: false
  LOG_TO_ANALYTICS: false,         // Dev: false, Prod: true
  
  // Performance
  SAMPLE_RATE: 1.0                 // 1.0 = 100%, 0.1 = 10%
};
```

**Production Recommendation:**
```typescript
{
  ENABLE_SHADOW_MODE: true,
  LOG_TO_CONSOLE: false,
  LOG_TO_ANALYTICS: true,
  SAMPLE_RATE: 0.1  // Test 10% of requests
}
```

---

## Statistics Dashboard (Future)

```typescript
import { getShadowModeStats } from './lib/ai/shadowMode';

const stats = getShadowModeStats();

// Output:
{
  totalTests: 1,247,
  byFeature: {
    "Career Recommendations": 312,
    "Post Classification": 456,
    "Hashtag Suggestions": 479
  },
  avgSimilarity: 0.68,
  
  // Future additions:
  accuracyRate: 0.85,
  performanceMs: 45,
  errorRate: 0.02
}
```

---

## Safety Mechanisms

### 1. Silent Failures
```typescript
ShadowModeTest.testCareerRecommendations(...)
  .catch(() => {
    // Silent fail - don't affect user
  });
```

### 2. Async Execution
```typescript
// User gets response immediately
return mockResult;

// Shadow test runs after
ShadowModeTest.test...();
```

### 3. Sample Rate Control
```typescript
if (Math.random() > AI_FEATURE_FLAGS.SAMPLE_RATE) {
  return; // Skip this request
}
```

### 4. Feature Flags
```typescript
if (!AI_FEATURE_FLAGS.ENABLE_SHADOW_MODE) {
  return; // All testing disabled
}
```

### 5. Error Logging
```typescript
try {
  // Test new AI
} catch (error) {
  console.error('Shadow mode error:', error);
  // User unaffected
}
```

---

## Deployment Checklist

### Development
- [x] Shadow mode enabled
- [x] Console logging active
- [x] 100% sample rate
- [x] All features tested

### Staging
- [ ] Shadow mode enabled
- [ ] Console logging disabled
- [ ] Analytics enabled
- [ ] 50% sample rate
- [ ] Monitor for 1 week

### Production
- [ ] Shadow mode enabled
- [ ] Console logging disabled
- [ ] Analytics enabled
- [ ] 10% sample rate
- [ ] Monitor continuously

---

## Success Criteria

### Phase 3 (Current)
- ✅ All AI algorithms implemented
- ✅ Shadow mode system working
- ✅ Zero user impact
- ✅ Comparison logging active
- ✅ Statistics tracking working

### Phase 4 (Next)
- [ ] 1000+ shadow tests collected
- [ ] Similarity scores analyzed
- [ ] Performance validated
- [ ] Error rate acceptable (<1%)
- [ ] Team approval received

---

## Rollback Plan

### If Issues Arise

**Option 1: Disable Shadow Mode**
```typescript
ENABLE_SHADOW_MODE: false
```

**Option 2: Reduce Sample Rate**
```typescript
SAMPLE_RATE: 0.01  // 1% only
```

**Option 3: Disable Specific Feature**
```typescript
TEST_CAREER_RECOMMENDATIONS: false
```

**Option 4: Complete Rollback**
```typescript
// Comment out shadow test calls in mlService.ts
// ShadowModeTest.testCareerRecommendations(...).catch(() => {});
```

**Impact:** Instant (no deployment needed)

---

**Phase:** 3 - Shadow Mode Testing  
**Status:** ✅ Complete & Active  
**User Impact:** 🟢 Zero  
**Next Phase:** 4 - Safe Switch (when validated)
