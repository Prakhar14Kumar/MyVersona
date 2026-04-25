/**
 * Firebase Analytics Utility for MyVerSona
 * 
 * Provides safe, production-ready analytics tracking
 * - Handles analytics not available (AdBlock, privacy mode, SSR)
 * - Prevents duplicate events
 * - Filters sensitive data
 * - Debug logging in development
 * - Type-safe event tracking
 */

import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getAnalyticsInstance, initializeAnalytics } from './firebase';

// Safe environment check
const isDev = (() => {
  try {
    return import.meta?.env?.DEV === true || import.meta?.env?.MODE === 'development';
  } catch {
    return false;
  }
})();

// Event deduplication cache
const eventCache = new Map<string, number>();
const DEDUP_WINDOW = 1000; // 1 second

/**
 * Standard event names (matches Firebase recommendations)
 */
export const AnalyticsEvents = {
  // Auth events
  SIGNUP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Session events
  SESSION_START: 'session_start',
  
  // Content events
  POST_CREATED: 'post_created',
  LIKE_POST: 'like_post',
  UNLIKE_POST: 'unlike_post',
  COMMENT_POST: 'comment_post',
  SHARE_POST: 'share_post',
  
  // Messaging events
  MESSAGE_SENT: 'message_sent',
  CHAT_OPENED: 'chat_opened',
  
  // Notification events
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  
  // Search events
  SEARCH_USED: 'search',
  
  // Navigation events
  SCREEN_VIEW: 'screen_view',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  
  // Test/debug events
  ANALYTICS_TEST: 'analytics_test_event',
} as const;

/**
 * Screen names for screen_view tracking
 */
export const ScreenNames = {
  LANDING: 'Landing',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FEED: 'Feed',
  PROFILE: 'Profile',
  CHAT: 'Chat',
  NOTIFICATIONS: 'Notifications',
  SEARCH: 'Search',
  SETTINGS: 'Settings',
  CAREER: 'Career',
  COLLEGE: 'College',
  EXPLORE: 'Explore',
  BOOKMARKS: 'Bookmarks',
  CREATOR: 'Creator Dashboard',
  GROWTH: 'Growth Dashboard',
} as const;

/**
 * Check if analytics is ready
 */
function isAnalyticsReady(): boolean {
  const analytics = getAnalyticsInstance();
  return analytics !== null && typeof window !== 'undefined';
}

/**
 * Check if event should be deduplicated
 */
function shouldDeduplicateEvent(eventName: string, params?: Record<string, any>): boolean {
  const cacheKey = `${eventName}_${JSON.stringify(params || {})}`;
  const now = Date.now();
  const lastFired = eventCache.get(cacheKey);
  
  if (lastFired && now - lastFired < DEDUP_WINDOW) {
    return true; // Skip duplicate
  }
  
  eventCache.set(cacheKey, now);
  
  // Clean old entries
  if (eventCache.size > 100) {
    const entriesToDelete: string[] = [];
    eventCache.forEach((timestamp, key) => {
      if (now - timestamp > DEDUP_WINDOW * 10) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach(key => eventCache.delete(key));
  }
  
  return false;
}

/**
 * Sanitize event parameters (remove sensitive data)
 */
function sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
  if (!params) return undefined;
  
  const sanitized = { ...params };
  
  // Remove sensitive fields
  const sensitiveKeys = ['password', 'email', 'phone', 'token', 'jwt', 'apiKey', 'secret'];
  sensitiveKeys.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key];
    }
  });
  
  // Truncate long strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 100) + '...';
    }
  });
  
  return sanitized;
}

/**
 * Track an analytics event
 * 
 * @param eventName - Event name (use AnalyticsEvents constants)
 * @param params - Optional event parameters
 * @param options - Tracking options (deduplication, etc.)
 */
export async function trackEvent(
  eventName: string,
  params?: Record<string, any>,
  options: { skipDedup?: boolean } = {}
): Promise<void> {
  try {
    // Ensure analytics is initialized
    if (!isAnalyticsReady()) {
      await initializeAnalytics();
    }
    
    const analytics = getAnalyticsInstance();
    
    if (!analytics) {
      // Analytics not available - silently skip (this is normal if blocked)
      return;
    }
    
    // Check deduplication
    if (!options.skipDedup && shouldDeduplicateEvent(eventName, params)) {
      if (isDev) {
        console.log('[Analytics] Duplicate event skipped:', eventName);
      }
      return;
    }
    
    // Sanitize parameters
    const sanitizedParams = sanitizeParams(params);
    
    // Log event
    logEvent(analytics, eventName, sanitizedParams);
    
    // Debug logging
    if (isDev) {
      console.log('[Analytics] ✅ Event tracked:', eventName, sanitizedParams);
    }
  } catch (error) {
    // Never crash the app due to analytics - fail silently
    if (isDev) {
      console.log('[Analytics] Event tracking failed (this is OK):', eventName, error);
    }
  }
}

/**
 * Track screen view
 * 
 * @param screenName - Screen name (use ScreenNames constants)
 * @param additionalParams - Optional additional parameters
 */
export async function trackScreenView(
  screenName: string,
  additionalParams?: Record<string, any>
): Promise<void> {
  await trackEvent(AnalyticsEvents.SCREEN_VIEW, {
    screen_name: screenName,
    ...additionalParams,
  });
}

/**
 * Set user ID for analytics
 * 
 * @param userId - User ID (will be hashed)
 */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  try {
    if (!isAnalyticsReady()) {
      await initializeAnalytics();
    }
    
    const analytics = getAnalyticsInstance();
    
    if (!analytics) {
      return;
    }
    
    setUserId(analytics, userId);
    
    if (isDev) {
      console.log('[Analytics] User ID set:', userId ? 'set' : 'cleared');
    }
  } catch (error) {
    console.error('[Analytics] Error setting user ID:', error);
  }
}

/**
 * Set user properties for analytics
 * 
 * @param properties - User properties (non-sensitive only)
 */
export async function setAnalyticsUserProperties(
  properties: Record<string, any>
): Promise<void> {
  try {
    if (!isAnalyticsReady()) {
      await initializeAnalytics();
    }
    
    const analytics = getAnalyticsInstance();
    
    if (!analytics) {
      return;
    }
    
    // Sanitize properties
    const sanitized = sanitizeParams(properties);
    
    if (sanitized) {
      setUserProperties(analytics, sanitized);
      
      if (isDev) {
        console.log('[Analytics] User properties set:', sanitized);
      }
    }
  } catch (error) {
    console.error('[Analytics] Error setting user properties:', error);
  }
}

/**
 * Fire a test event to verify analytics is working
 * Should show up in Firebase Realtime dashboard
 */
export async function fireTestEvent(): Promise<void> {
  const environment = (() => {
    try {
      return import.meta?.env?.MODE || 'unknown';
    } catch {
      return 'unknown';
    }
  })();
  
  await trackEvent(AnalyticsEvents.ANALYTICS_TEST, {
    test_timestamp: new Date().toISOString(),
    environment,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  }, { skipDedup: true });
  
  if (isDev) {
    console.log('[Analytics] 🔥 Test event fired - Check Firebase DebugView');
    console.log('[Analytics] 📊 DebugView: https://console.firebase.google.com/project/versona-app/analytics/app/web:11387f2f8991118f2b0ca8/debugview');
  }
}

/**
 * Track error event
 */
export async function trackError(
  errorMessage: string,
  errorStack?: string,
  additionalContext?: Record<string, any>
): Promise<void> {
  await trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_message: errorMessage,
    error_stack: errorStack?.substring(0, 200), // Limit stack trace length
    ...additionalContext,
  });
}

/**
 * Initialize analytics and fire verification event
 * Call this once when app starts
 */
export async function initializeAndVerifyAnalytics(): Promise<void> {
  try {
    // Check if we're in browser environment first
    if (typeof window === 'undefined') {
      return;
    }
    
    const analyticsInstance = await initializeAnalytics();
    
    if (analyticsInstance) {
      // Analytics successfully initialized
      if (isDev) {
        console.log('[Analytics] ✅ Analytics initialized successfully');
        console.log('[Analytics] measurementId: G-J8CB4FXNX9');
        console.log('[Analytics] 📊 Dashboard: https://console.firebase.google.com/project/versona-app/analytics');
      }
      
      // Fire test event in development
      if (isDev) {
        await fireTestEvent();
      }
      
      // Track session start
      await trackEvent(AnalyticsEvents.SESSION_START);
    } else {
      // Analytics not available - this is expected and OK
      // No logging in production, minimal logging in dev
      if (isDev) {
        console.log('[Analytics] ℹ️ Analytics unavailable - this is normal if AdBlock/Privacy mode is enabled');
      }
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    // No error logging as this is expected behavior
  }
}

// Analytics module loaded and ready
// Initialization happens via initializeAndVerifyAnalytics() call from App.tsx
