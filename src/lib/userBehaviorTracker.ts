/**
 * User Behavior Tracker for MyVerSona
 * 
 * Tracks user events and stores them in Firestore for analytics.
 * 
 * Rules:
 * - Do not block UI
 * - Fire-and-forget async calls
 * - Silent try/catch
 * - Batch writes to reduce Firestore costs
 * 
 * Collection: analytics_events/{eventId}
 */

import { collection, addDoc, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Event types we track
 */
export type BehaviorEventType =
  | 'app_open'
  | 'post_created'
  | 'post_liked'
  | 'post_bookmarked'
  | 'college_joined'
  | 'profile_viewed';

/**
 * Event metadata structure
 */
export interface BehaviorEventMetadata {
  postId?: string;
  postType?: 'entertainment' | 'career';
  collegeId?: string;
  collegeName?: string;
  profileUserId?: string;
  [key: string]: any;
}

/**
 * Behavior event structure
 */
export interface BehaviorEvent {
  userId: string;
  eventType: BehaviorEventType;
  metadata: BehaviorEventMetadata;
  createdAt: Timestamp;
}

/**
 * Local event queue for batching
 */
interface QueuedEvent {
  userId: string;
  eventType: BehaviorEventType;
  metadata: BehaviorEventMetadata;
  timestamp: number;
}

const eventQueue: QueuedEvent[] = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Track a user behavior event
 * 
 * Fire-and-forget: Does not block UI, errors are caught silently
 * 
 * @param userId - User ID
 * @param eventType - Type of event
 * @param metadata - Additional event data
 */
export function trackBehaviorEvent(
  userId: string,
  eventType: BehaviorEventType,
  metadata: BehaviorEventMetadata = {}
): void {
  // Don't track if no user ID
  if (!userId) return;

  try {
    // Add to queue
    eventQueue.push({
      userId,
      eventType,
      metadata,
      timestamp: Date.now(),
    });

    // If queue is full, flush immediately
    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    } else {
      // Schedule flush if not already scheduled
      scheduleFlush();
    }
  } catch (error) {
    // Silent fail - don't block UI or log errors
  }
}

/**
 * Schedule a flush of the event queue
 */
function scheduleFlush(): void {
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flushEvents();
  }, FLUSH_INTERVAL);
}

/**
 * Flush all queued events to Firestore
 * 
 * Uses batch writes for efficiency
 */
async function flushEvents(): Promise<void> {
  // Clear timer
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Nothing to flush
  if (eventQueue.length === 0) return;

  // Get events to flush
  const eventsToFlush = eventQueue.splice(0, BATCH_SIZE);

  try {
    // Use batch write for efficiency
    const batch = writeBatch(db);
    const eventsCollection = collection(db, 'analytics_events');

    eventsToFlush.forEach((event) => {
      const eventDoc = doc(eventsCollection);
      batch.set(eventDoc, {
        userId: event.userId,
        eventType: event.eventType,
        metadata: event.metadata,
        createdAt: Timestamp.fromMillis(event.timestamp),
      });
    });

    // Fire and forget - don't await
    batch.commit().catch(() => {
      // Silent fail
    });
  } catch (error) {
    // Silent fail - don't block or log
  }

  // If there are more events, schedule another flush
  if (eventQueue.length > 0) {
    scheduleFlush();
  }
}

/**
 * Force flush all pending events
 * 
 * Useful for app shutdown or page unload
 */
export function flushPendingEvents(): void {
  try {
    flushEvents();
  } catch (error) {
    // Silent fail
  }
}

/**
 * Convenience functions for specific events
 */

export function trackAppOpen(userId: string): void {
  trackBehaviorEvent(userId, 'app_open', {
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  });
}

export function trackPostCreated(
  userId: string,
  postId: string,
  postType: 'entertainment' | 'career'
): void {
  trackBehaviorEvent(userId, 'post_created', {
    postId,
    postType,
  });
}

export function trackPostLiked(
  userId: string,
  postId: string,
  postType?: 'entertainment' | 'career'
): void {
  trackBehaviorEvent(userId, 'post_liked', {
    postId,
    postType,
  });
}

export function trackPostBookmarked(
  userId: string,
  postId: string,
  postType?: 'entertainment' | 'career'
): void {
  trackBehaviorEvent(userId, 'post_bookmarked', {
    postId,
    postType,
  });
}

export function trackCollegeJoined(
  userId: string,
  collegeId: string,
  collegeName: string
): void {
  trackBehaviorEvent(userId, 'college_joined', {
    collegeId,
    collegeName,
  });
}

export function trackProfileViewed(
  userId: string,
  profileUserId: string
): void {
  trackBehaviorEvent(userId, 'profile_viewed', {
    profileUserId,
  });
}

/**
 * Initialize tracker
 * 
 * Sets up cleanup on page unload
 */
export function initBehaviorTracker(): void {
  if (typeof window === 'undefined') return;

  // Flush pending events on page unload
  window.addEventListener('beforeunload', () => {
    flushPendingEvents();
  });

  // Flush periodically even if queue isn't full
  setInterval(() => {
    if (eventQueue.length > 0) {
      flushEvents();
    }
  }, FLUSH_INTERVAL * 2); // Flush every 10 seconds
}
