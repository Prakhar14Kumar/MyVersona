// Offline Detection and Handling for MyVerSona
// Provides graceful degradation when network is unavailable

import { useEffect, useState } from 'react';

/**
 * Custom hook for detecting online/offline status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('⚠️ Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Retry failed operations when connection is restored
 */
export class OfflineQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  /**
   * Add operation to queue
   */
  add(operation: () => Promise<any>): void {
    this.queue.push(operation);
    console.log(`📥 Operation queued (${this.queue.length} in queue)`);
  }

  /**
   * Process all queued operations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.queue.length} queued operations...`);

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
          console.log('✅ Operation completed');
        } catch (error) {
          console.error('❌ Operation failed:', error);
          // Re-queue failed operation
          this.queue.push(operation);
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ Queue processing complete');
  }

  /**
   * Clear all queued operations
   */
  clear(): void {
    this.queue = [];
    console.log('🗑️ Queue cleared');
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }
}

// Global offline queue instance
export const offlineQueue = new OfflineQueue();

/**
 * Safe wrapper for async operations that handles offline state
 */
export async function withOfflineHandling<T>(
  operation: () => Promise<T>,
  options?: {
    queueOnOffline?: boolean;
    fallbackValue?: T;
    onOffline?: () => void;
  }
): Promise<T | undefined> {
  const { queueOnOffline = true, fallbackValue, onOffline } = options || {};

  // Check if online
  if (!navigator.onLine) {
    console.warn('⚠️ Operation attempted while offline');
    
    if (onOffline) {
      onOffline();
    }

    if (queueOnOffline) {
      offlineQueue.add(operation);
    }

    return fallbackValue;
  }

  try {
    return await operation();
  } catch (error: any) {
    // Check if error is network-related
    const isNetworkError = 
      error.message?.includes('network') ||
      error.message?.includes('fetch') ||
      error.code === 'unavailable';

    if (isNetworkError && queueOnOffline) {
      console.warn('⚠️ Network error detected, queueing operation');
      offlineQueue.add(operation);
    }

    throw error;
  }
};

/**
 * Check if Firebase error is due to offline status
 */
export const isOfflineError = (error: any): boolean => {
  if (!error) return false;

  const offlineIndicators = [
    'unavailable',
    'network',
    'offline',
    'fetch failed',
    'failed to fetch',
  ];

  const errorString = (error.message || error.code || '').toLowerCase();
  return offlineIndicators.some(indicator => errorString.includes(indicator));
};

/**
 * Format offline error message for user display
 */
export const getOfflineErrorMessage = (): string => {
  return 'You appear to be offline. Please check your internet connection and try again.';
};

/**
 * Service to monitor connection quality
 */
export class ConnectionMonitor {
  private pingInterval: number | null = null;
  private listeners: Array<(quality: 'good' | 'poor' | 'offline') => void> = [];
  private currentQuality: 'good' | 'poor' | 'offline' = 'good';

  /**
   * Start monitoring connection quality
   */
  start(intervalMs: number = 30000): void {
    if (this.pingInterval !== null) return;

    this.checkConnection();

    this.pingInterval = window.setInterval(() => {
      this.checkConnection();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Check connection quality
   */
  private async checkConnection(): Promise<void> {
    if (!navigator.onLine) {
      this.updateQuality('offline');
      return;
    }

    try {
      const startTime = Date.now();
      
      // Ping a small resource to check connection
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        // Good connection: < 500ms
        // Poor connection: >= 500ms
        this.updateQuality(latency < 500 ? 'good' : 'poor');
      } else {
        this.updateQuality('poor');
      }
    } catch {
      this.updateQuality('offline');
    }
  }

  /**
   * Update connection quality and notify listeners
   */
  private updateQuality(quality: 'good' | 'poor' | 'offline'): void {
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      this.listeners.forEach(listener => listener(quality));
    }
  }

  /**
   * Subscribe to connection quality changes
   */
  onChange(listener: (quality: 'good' | 'poor' | 'offline') => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current connection quality
   */
  getQuality(): 'good' | 'poor' | 'offline' {
    return this.currentQuality;
  }
}

// Global connection monitor instance
export const connectionMonitor = new ConnectionMonitor();