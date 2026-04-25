// Error Logging Service for MyVerSona
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { toast } from "sonner@2.0.3";

export interface ErrorLog {
  userId?: string;
  errorMessage: string;
  stack?: string;
  page: string;
  url: string;
  userAgent: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

// Get current page/route
const getCurrentPage = (): string => {
  try {
    return window.location.pathname + window.location.search;
  } catch {
    return 'unknown';
  }
};

// Log error to Firestore (fire-and-forget)
export const logErrorToFirestore = async (errorLog: Partial<ErrorLog>): Promise<void> => {
  try {
    // Strip all undefined / non-serialisable values so Firestore never rejects the write
    const stripUndefined = (obj: Record<string, any>): Record<string, any> =>
      Object.fromEntries(
        Object.entries(obj)
          .filter(([, v]) => v !== undefined && typeof v !== 'function' && typeof v !== 'symbol')
          .map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? stripUndefined(v) : v])
      );

    const errorData = stripUndefined({
      userId: errorLog.userId || 'anonymous',
      errorMessage: errorLog.errorMessage || 'Unknown error',
      stack: errorLog.stack || '',
      page: errorLog.page || getCurrentPage(),
      url: errorLog.url || window.location.href,
      userAgent: errorLog.userAgent || navigator.userAgent,
      severity: errorLog.severity || 'medium',
      context: stripUndefined({
        ...(errorLog.context || {}),
      }),
      createdAt: serverTimestamp(),
    });

    // Fire-and-forget: don't await to prevent blocking
    addDoc(collection(db, 'error_logs'), errorData).catch(err => {
      // Silent fail - don't want error logging to crash the app
      console.error('Failed to log error to Firestore:', err);
    });
  } catch (err) {
    // Silent fail - error logging should never crash the app
    console.error('Error in error logger:', err);
  }
};

// Main error handler
export const handleError = (
  error: any,
  options: {
    userId?: string;
    context?: string;
    showToast?: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    customMessage?: string;
  } = {}
): void => {
  const {
    userId,
    context = 'Unknown context',
    showToast = true,
    severity = 'medium',
    customMessage,
  } = options;

  // Extract error details
  const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
  const stack = error?.stack || '';

  // Log to console for development
  console.error(`[${severity.toUpperCase()}] Error in ${context}:`, error);

  // Build context — only include defined, serialisable scalar values
  const contextPayload: Record<string, any> = {
    errorType: error?.name || 'Error',
  };
  // Only add code if it's defined and serializable
  if (error?.code !== undefined && error?.code !== null) {
    contextPayload.code = String(error.code);
  }

  // Log to Firestore
  logErrorToFirestore({
    userId,
    errorMessage,
    stack,
    page: context,
    severity,
    context: contextPayload,
  });

  // Show user-friendly toast
  if (showToast) {
    const userMessage = customMessage || getUserFriendlyMessage(error);
    toast.error(userMessage);
  }
};

// Convert technical errors to user-friendly messages
const getUserFriendlyMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Firebase Auth errors
  if (errorCode.startsWith('auth/')) {
    const authErrors: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'This email is already registered',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/popup-closed-by-user': 'Sign-in cancelled',
    };
    return authErrors[errorCode] || 'Authentication error. Please try again';
  }

  // Firestore errors
  if (errorCode.startsWith('firestore/')) {
    const firestoreErrors: Record<string, string> = {
      'firestore/permission-denied': 'You don\'t have permission to perform this action',
      'firestore/unavailable': 'Service temporarily unavailable. Please try again',
      'firestore/not-found': 'Data not found',
      'firestore/already-exists': 'This item already exists',
    };
    return firestoreErrors[errorCode] || 'Database error. Please try again';
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection';
  }

  // Timeout errors
  if (errorMessage.includes('timeout')) {
    return 'Request timed out. Please try again';
  }

  // Default message
  return 'Something went wrong. Please try again';
};

// Async operation wrapper with error handling
export async function withErrorHandling(
  operation: () => Promise<any>,
  options: {
    userId?: string;
    context: string;
    showToast?: boolean;
    fallbackValue?: any;
    onError?: (error: any) => void;
  }
): Promise<any> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, {
      userId: options.userId,
      context: options.context,
      showToast: options.showToast,
    });

    if (options.onError) {
      try {
        options.onError(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }

    return options.fallbackValue;
  }
};

// API call wrapper with retry logic
export async function apiCallWithRetry(
  apiCall: () => Promise<any>,
  options: {
    userId?: string;
    context: string;
    retries?: number;
    retryDelay?: number;
    showToast?: boolean;
  }
): Promise<any> {
  const { userId, context, retries = 2, retryDelay = 1000, showToast = true } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors or validation errors
      const errorCode = (error as any)?.code || '';
      if (errorCode.startsWith('auth/') || errorCode.includes('validation')) {
        break;
      }
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  // All retries failed
  handleError(lastError, {
    userId,
    context: `${context} (after ${retries + 1} attempts)`,
    showToast,
    severity: 'high',
  });
  
  return null;
};

// Safe JSON parse
export const safeJsonParse = (json: string, fallback: any): any => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback;
  }
};

// Safe localStorage operations
export const safeLocalStorage = {
  getItem: (key: string, fallback: string = ''): string => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      console.warn('localStorage.getItem error:', error);
      return fallback;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage.setItem error:', error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage.removeItem error:', error);
      return false;
    }
  },
};

// Window event error handler
export const setupGlobalErrorHandlers = (userId?: string): void => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, {
      userId,
      context: 'Unhandled Promise Rejection',
      severity: 'high',
      showToast: false, // Don't spam user with technical errors
    });
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    handleError(event.error || event.message, {
      userId,
      context: 'Global Error',
      severity: 'high',
      showToast: false,
    });
  });
};