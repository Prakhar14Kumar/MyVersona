# MyVerSona Error Handling System

## Overview
Comprehensive error handling system designed to ensure maximum stability for real users while providing detailed error logs for debugging.

## Architecture

### 1. Global Error Boundary
**Location:** `/components/ErrorBoundary.tsx`

- **Purpose:** Catch React component errors that would otherwise crash the app
- **Features:**
  - User-friendly error UI with retry options
  - Automatic error logging to Firestore
  - Technical details visible in development mode only
  - Includes userId for tracking user-specific issues

**Usage:**
```tsx
<ErrorBoundary userId={user?.uid}>
  <YourApp />
</ErrorBoundary>
```

### 2. Error Logger Service
**Location:** `/lib/errorLogger.ts`

Central error handling service with multiple utilities:

#### Core Functions:

##### `handleError(error, options)`
Main error handler that logs to Firestore and shows user-friendly toasts.

**Options:**
- `userId` - User ID for tracking
- `context` - Where the error occurred
- `showToast` - Show toast notification (default: true)
- `severity` - Error severity level (low/medium/high/critical)
- `customMessage` - Custom user-facing message

**Example:**
```tsx
try {
  await riskyOperation();
} catch (error) {
  handleError(error, {
    userId: user.uid,
    context: 'CreatePost',
    severity: 'medium',
    customMessage: 'Failed to create post. Please try again',
  });
}
```

##### `withErrorHandling(operation, options)`
Async wrapper that automatically catches and handles errors.

**Example:**
```tsx
const data = await withErrorHandling(
  () => fetchUserData(userId),
  {
    userId,
    context: 'FetchUserData',
    showToast: true,
    fallbackValue: null,
  }
);
```

##### `apiCallWithRetry(apiCall, options)`
API call wrapper with automatic retry logic.

**Features:**
- Configurable retry attempts (default: 2)
- Exponential backoff
- Smart error handling (doesn't retry auth errors)

**Example:**
```tsx
const posts = await apiCallWithRetry(
  () => backendService.getPosts(),
  {
    userId: user.uid,
    context: 'LoadPosts',
    retries: 3,
    retryDelay: 1000,
  }
);
```

##### `setupGlobalErrorHandlers(userId)`
Sets up window-level error handlers for unhandled errors and promise rejections.

**Auto-initialized in App.tsx**

### 3. Error Logging to Firestore

**Collection:** `error_logs/{errorId}`

**Schema:**
```typescript
{
  userId: string,           // User ID or 'anonymous'
  errorMessage: string,     // Error message
  stack: string,           // Stack trace
  page: string,            // Current page/context
  url: string,             // Full URL
  userAgent: string,       // Browser user agent
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: object,         // Additional context
  createdAt: timestamp     // Server timestamp
}
```

### 4. Safe Utility Functions

#### Safe JSON Parse
```tsx
const data = safeJsonParse(jsonString, fallbackValue);
```

#### Safe localStorage
```tsx
safeLocalStorage.getItem(key, fallback);
safeLocalStorage.setItem(key, value);
safeLocalStorage.removeItem(key);
```

## Error Severity Levels

1. **Low** - Minor issues that don't affect user experience
2. **Medium** - Errors that affect functionality but have workarounds
3. **High** - Critical functionality failures
4. **Critical** - App-breaking errors caught by ErrorBoundary

## User-Friendly Error Messages

The system automatically converts technical errors to user-friendly messages:

- Firebase Auth errors → "No account found with this email"
- Network errors → "Network error. Please check your connection"
- Firestore permission errors → "You don't have permission to perform this action"
- Timeout errors → "Request timed out. Please try again"

## Best Practices

### 1. Always Wrap Async Operations
```tsx
try {
  const result = await asyncOperation();
} catch (error) {
  handleError(error, {
    userId: user?.uid,
    context: 'ComponentName',
    severity: 'medium',
  });
}
```

### 2. Use Fire-and-Forget for Non-Critical Operations
```tsx
// Don't await or throw for non-critical operations
trackAnalytics(data).catch(err => console.error('Analytics error:', err));
```

### 3. Provide Context
Always include context to make debugging easier:
```tsx
handleError(error, {
  userId: user.uid,
  context: 'CreatePost/UploadImage',
  severity: 'high',
});
```

### 4. Silent Fail for Error Logging
Never let error logging crash the app:
```tsx
logErrorToFirestore(errorData).catch(err => {
  console.error('Failed to log error:', err);
});
```

### 5. Show Custom Messages for User Actions
```tsx
handleError(error, {
  userId: user.uid,
  context: 'SaveProfile',
  customMessage: 'Failed to save profile. Please try again',
});
```

## Integration Examples

### React Component
```tsx
import { handleError } from '../lib/errorLogger';

function MyComponent() {
  const { user } = useAuth();
  
  const handleAction = async () => {
    setLoading(true);
    try {
      await performAction();
      toast.success('Success!');
    } catch (error) {
      handleError(error, {
        userId: user?.uid,
        context: 'MyComponent/handleAction',
        severity: 'medium',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return <button onClick={handleAction}>Do Action</button>;
}
```

### Service Layer
```tsx
import { withErrorHandling } from '../lib/errorLogger';

export const fetchData = async (userId: string) => {
  return withErrorHandling(
    async () => {
      const response = await api.get('/data');
      return response.data;
    },
    {
      userId,
      context: 'DataService/fetchData',
      fallbackValue: [],
    }
  );
};
```

## Monitoring & Analytics

### View Error Logs
Query Firestore collection `error_logs` to:
- Track error frequency
- Identify problematic users or pages
- Monitor error severity distribution
- Detect patterns in error messages

### Common Queries
```javascript
// Errors in last 24 hours
db.collection('error_logs')
  .where('createdAt', '>', yesterday)
  .get();

// Critical errors by user
db.collection('error_logs')
  .where('severity', '==', 'critical')
  .where('userId', '==', userId)
  .get();

// Errors by page
db.collection('error_logs')
  .where('page', '==', 'CreatePost')
  .orderBy('createdAt', 'desc')
  .limit(100)
  .get();
```

## Testing Error Handling

### Simulate Errors
```tsx
// In development, test error boundary
const TestError = () => {
  throw new Error('Test error boundary');
};

// Test async error handling
const testAsyncError = async () => {
  throw new Error('Test async error');
};
```

## Zero-Bug Prevention System Compliance

✅ **Rule 1:** No versioned imports - Uses standard imports
✅ **Rule 2:** No undefined Firestore writes - All writes are sanitized
✅ **Rule 3:** Proper export/import patterns - ES6 exports used
✅ **Rule 4:** Proper responsive design - Error UI is responsive
✅ **Rule 5:** Try/catch everywhere - All async operations wrapped
✅ **Rule 6:** Silent failures for non-critical ops - Fire-and-forget logging
✅ **Rule 7:** User-friendly messages - Technical errors converted
✅ **Rule 8:** Context tracking - All errors include context
✅ **Rule 9:** No app crashes - ErrorBoundary + global handlers

## Summary

The error handling system ensures:
1. ✅ **No crashes** - ErrorBoundary catches all React errors
2. ✅ **Detailed logging** - All errors logged to Firestore
3. ✅ **User-friendly** - Technical errors converted to readable messages
4. ✅ **Context-aware** - All errors include userId, page, and context
5. ✅ **Automatic retries** - Network errors retry automatically
6. ✅ **Silent failures** - Non-critical operations fail silently
7. ✅ **Monitoring ready** - Firestore collection for analysis

**The app is now stable for real users! 🚀**
