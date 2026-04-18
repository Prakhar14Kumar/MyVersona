/**
 * Performance Optimization Utilities for VerSona
 * Provides caching, memoization, and performance monitoring helpers
 */

// Cache with TTL (Time To Live)
class CacheWithTTL<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttlMs: number = 300000) { // Default 5 minutes
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Global caches
export const apiCache = new CacheWithTTL<any>();
export const imageCache = new CacheWithTTL<string>();
export const userProfileCache = new CacheWithTTL<any>();
export const postCache = new CacheWithTTL<any>();

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Image preloader
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });
  
  return Promise.all(promises);
}

// Lazy load images with Intersection Observer
export function createLazyImageObserver(
  callback: (img: HTMLImageElement) => void
): IntersectionObserver {
  const options = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
  };
  
  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        callback(img);
        observer.unobserve(img);
      }
    });
  }, options);
}

// Batch API calls
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => Promise<R[]>;
  private batchSize: number;
  private waitTime: number;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    waitTime: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.waitTime = waitTime;
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      if (this.queue.length >= this.batchSize) {
        this.flush().then(resolve).catch(reject);
      } else {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.flush().then(resolve).catch(reject);
        }, this.waitTime);
      }
    });
  }

  private async flush(): Promise<R> {
    if (this.queue.length === 0) return Promise.reject(new Error('No items to process'));
    
    const items = this.queue.splice(0, this.batchSize);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const results = await this.processor(items);
    return results[0]; // Return first result for the caller
  }
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export async function dedupedRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if request is already in progress
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  // Start new request
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

// Local storage with expiry
export const storage = {
  set(key: string, value: any, expiryMs?: number) {
    const item = {
      value,
      expiry: expiryMs ? Date.now() + expiryMs : null,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get<T>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value as T;
    } catch {
      return null;
    }
  },
  
  remove(key: string) {
    localStorage.removeItem(key);
  },
  
  clear() {
    localStorage.clear();
  },
};

// Performance metrics
export class PerformanceTracker {
  private marks = new Map<string, number>();
  
  start(label: string) {
    this.marks.set(label, performance.now());
  }
  
  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for: ${label}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    if (duration > 1000) {
      console.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  measure(label: string, fn: () => any): any {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

export const perfTracker = new PerformanceTracker();

// Virtualization helper for lists
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  
  return { start, end };
}

// Memory cleanup
export function cleanupOldCacheEntries() {
  apiCache.clear();
  imageCache.clear();
  
  // Clean up old items from localStorage
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) continue;
      
      const item = JSON.parse(itemStr);
      if (item.expiry && now > item.expiry) {
        keysToRemove.push(key);
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Run cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupOldCacheEntries, 600000);
}

// Image optimization helper
export function getOptimizedImageUrl(
  url: string,
  width: number,
  quality: number = 80
): string {
  // For Unsplash images
  if (url.includes('unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&auto=format`;
  }
  
  // For other CDNs, return as is
  return url;
}

// Retry failed requests with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
