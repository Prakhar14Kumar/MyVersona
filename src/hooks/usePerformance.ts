import { useEffect, useCallback, useRef } from 'react';
import { debounce, throttle, perfTracker } from '../lib/performanceUtils';

/**
 * Hook for performance-optimized debounced callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  );
}

/**
 * Hook for performance-optimized throttled callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    throttle((...args: Parameters<T>) => callbackRef.current(...args), limit),
    [limit]
  );
}

/**
 * Hook for tracking component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    if (renderTime > 16) { // Slower than 60fps
      console.warn(
        `[Performance] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`
      );
    }
    
    startTime.current = performance.now();
  });
  
  return renderCount.current;
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useLazyLoad<T extends HTMLElement>(
  callback: (element: T) => void,
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<T>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback(entry.target as T);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: options.root || null,
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.01,
      }
    );
    
    observer.observe(elementRef.current);
    
    return () => observer.disconnect();
  }, [callback, options]);
  
  return elementRef;
}

/**
 * Hook for prefetching data on hover
 */
export function usePrefetch<T>(
  prefetchFn: () => Promise<T>,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasPrefetched = useRef(false);
  
  const handleMouseEnter = useCallback(() => {
    if (hasPrefetched.current) return;
    
    timeoutRef.current = setTimeout(() => {
      prefetchFn().then(() => {
        hasPrefetched.current = true;
      });
    }, delay);
  }, [prefetchFn, delay]);
  
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave };
}

/**
 * Hook for measuring async operation performance
 */
export function useAsyncPerformance() {
  return useCallback(
    async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
      return perfTracker.measureAsync(label, fn);
    },
    []
  );
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold, rootMargin }
    );
    
    const currentElement = elementRef.current;
    if (currentElement) {
      observerRef.current.observe(currentElement);
    }
    
    return () => {
      if (observerRef.current && currentElement) {
        observerRef.current.unobserve(currentElement);
      }
    };
  }, [callback, threshold, rootMargin, enabled]);
  
  return elementRef;
}

/**
 * Hook for managing component visibility
 */
export function useVisibility(threshold: number = 0.5) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0].isIntersecting);
      },
      { threshold }
    );
    
    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }
    
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold]);
  
  return { ref: elementRef, isVisible };
}

/**
 * Hook for batch updates
 */
export function useBatchUpdate<T>(
  processFn: (items: T[]) => Promise<void>,
  options: {
    batchSize?: number;
    delay?: number;
  } = {}
) {
  const { batchSize = 10, delay = 100 } = options;
  const queueRef = useRef<T[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  
  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    
    const items = queueRef.current.splice(0, batchSize);
    await processFn(items);
  }, [processFn, batchSize]);
  
  const add = useCallback(
    (item: T) => {
      queueRef.current.push(item);
      
      if (queueRef.current.length >= batchSize) {
        flush();
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, delay);
      }
    },
    [batchSize, delay, flush]
  );
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  
  return { add, flush };
}

// Missing import
import { useState } from 'react';
