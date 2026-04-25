/**
 * MyVerSona API Service
 * Centralized API client with retry logic, circuit breaker, and network optimization
 */

import { API_CONFIG } from './config';
import { NETWORK_CONFIG, NetworkQuality } from './networkConfig';
import { circuitBreaker } from './circuitBreaker';
import { networkMonitor } from './networkMonitor';

// Request configuration
interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  useCircuitBreaker?: boolean;
  cacheResponse?: boolean;
  cacheTTL?: number;
}

// Response wrapper
interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  cached?: boolean;
}

// Error response
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Cache entry
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class ApiService {
  private baseUrl: string;
  private aiBaseUrl: string;
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.baseUrl = API_CONFIG.BACKEND_URL;
    this.aiBaseUrl = API_CONFIG.AI_BACKEND_URL;
    
    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file(s)
   */
  async upload<T = any>(
    endpoint: string,
    files: File | File[],
    additionalData?: Record<string, any>,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    
    // Add files
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
    } else {
      formData.append('file', files);
    }
    
    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      timeout: NETWORK_CONFIG.TIMEOUT.API_UPLOAD_TIMEOUT,
      // Don't set Content-Type header - browser will set it with boundary
      headers: {
        ...config.headers,
      },
    });
  }

  /**
   * Download file
   */
  async download(
    endpoint: string,
    filename: string,
    config: RequestConfig = {}
  ): Promise<void> {
    const response = await this.request<Blob>(endpoint, {
      ...config,
      timeout: NETWORK_CONFIG.TIMEOUT.API_DOWNLOAD_TIMEOUT,
    });

    // Create download link
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Core request method with retry, circuit breaker, and caching
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const {
      timeout = NETWORK_CONFIG.TIMEOUT.API_REQUEST_TIMEOUT,
      retries = NETWORK_CONFIG.RETRY.MAX_RETRIES,
      useCircuitBreaker = true,
      cacheResponse = false,
      cacheTTL = NETWORK_CONFIG.CACHE.API_CACHE_TTL.FEED,
      ...fetchConfig
    } = config;

    // Build full URL
    const url = this.buildUrl(endpoint);
    const cacheKey = this.getCacheKey(url, fetchConfig.method || 'GET');

    // Check rate limit
    this.checkRateLimit(endpoint);

    // Check cache for GET requests
    if (fetchConfig.method === 'GET' && cacheResponse) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          data: cached,
          status: 200,
          headers: new Headers(),
          cached: true,
        };
      }
    }

    // Deduplicate identical in-flight requests
    if (fetchConfig.method === 'GET') {
      const inFlight = this.requestQueue.get(cacheKey);
      if (inFlight) {
        return inFlight;
      }
    }

    // Execute request with retry and circuit breaker
    const requestPromise = (async () => {
      try {
        let lastError: any;

        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            // Use circuit breaker if enabled
            const response = useCircuitBreaker
              ? await circuitBreaker.execute(() => this.executeRequest<T>(url, fetchConfig, timeout))
              : await this.executeRequest<T>(url, fetchConfig, timeout);

            // Cache successful GET responses
            if (fetchConfig.method === 'GET' && cacheResponse) {
              this.setCache(cacheKey, response.data, cacheTTL);
            }

            return response;
          } catch (error: any) {
            lastError = error;

            // Don't retry on circuit breaker errors - service is known to be down
            if (error.message && error.message.includes('Circuit breaker')) {
              throw error;
            }

            // Don't retry on network errors (backend unreachable - retrying is futile)
            if (error.status === 0 || error.code === 'NETWORK_ERROR') {
              throw error;
            }

            // Don't retry on client errors (4xx)
            if (error.status >= 400 && error.status < 500 && error.status !== 429) {
              throw error;
            }

            // Don't retry if no more attempts
            if (attempt >= retries) {
              throw error;
            }

            // Calculate backoff delay
            const delay = this.calculateBackoff(attempt);
            console.warn(
              `Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms:`,
              error.message
            );

            await this.sleep(delay);
          }
        }

        throw lastError;
      } finally {
        // Remove from queue
        this.requestQueue.delete(cacheKey);
      }
    })();

    // Store in queue for deduplication
    if (fetchConfig.method === 'GET') {
      this.requestQueue.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  /**
   * Execute actual fetch request with timeout
   */
  private async executeRequest<T>(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<ApiResponse<T>> {
    // Record request start
    const startTime = Date.now();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Get auth token
      const token = await this.getAuthToken();

      // Build headers
      const headers = new Headers(config.headers);
      if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add network quality header
      const networkQuality = networkMonitor.getNetworkQuality();
      headers.set('X-Network-Quality', networkQuality);

      // Execute fetch
      const response = await fetch(url, {
        ...config,
        headers,
        signal: controller.signal,
      });

      // Record metrics
      const duration = Date.now() - startTime;
      networkMonitor.trackRequest(url, response.status, duration);

      // Handle non-OK responses
      if (!response.ok) {
        const error = await this.handleErrorResponse(response);
        throw error;
      }

      // Parse response
      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error: any) {
      // Record error
      const duration = Date.now() - startTime;
      networkMonitor.trackRequest(url, 0, duration);

      // Handle timeout
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          status: 408,
          code: 'TIMEOUT',
        } as ApiError;
      }

      // Handle network errors
      if (error.message === 'Failed to fetch') {
        throw {
          message: 'Network error - please check your connection',
          status: 0,
          code: 'NETWORK_ERROR',
        } as ApiError;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    if (contentType?.includes('text/')) {
      return response.text() as any;
    }

    if (contentType?.includes('application/octet-stream')) {
      return response.blob() as any;
    }

    // Default to JSON
    try {
      return response.json();
    } catch {
      return response.text() as any;
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<ApiError> {
    let message = `Request failed with status ${response.status}`;
    let details: any;

    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
      details = errorData.details || errorData;
    } catch {
      // Couldn't parse error response
    }

    return {
      message,
      status: response.status,
      code: response.statusText,
      details,
    };
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    // Return as-is if already absolute
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Remove leading slash
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Determine base URL (AI endpoints go to AI backend)
    const baseUrl = path.startsWith('ai/') ? this.aiBaseUrl : this.baseUrl;

    return `${baseUrl}/${path}`;
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Try to get Firebase auth token
      const { auth } = await import('./firebase');
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return null;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = NETWORK_CONFIG.RETRY.BASE_DELAY;
    const maxDelay = NETWORK_CONFIG.RETRY.MAX_DELAY;
    const multiplier = NETWORK_CONFIG.RETRY.BACKOFF_MULTIPLIER;
    const jitter = NETWORK_CONFIG.RETRY.JITTER;

    // Exponential backoff
    const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);

    // Add jitter
    const jitterAmount = delay * jitter * Math.random();
    return Math.floor(delay + jitterAmount);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get cache key
   */
  private getCacheKey(url: string, method: string): string {
    return `${method}:${url}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const keys = Array.from(this.cache.keys());
      keys.forEach((key) => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());
      
      entries.forEach(([key, entry]) => {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      });
    }, 60000); // Cleanup every minute
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(endpoint: string): void {
    const now = Date.now();
    const limit = this.rateLimiters.get(endpoint);

    if (!limit) {
      this.rateLimiters.set(endpoint, {
        count: 1,
        resetTime: now + NETWORK_CONFIG.RATE_LIMIT.API.STANDARD.window,
      });
      return;
    }

    // Reset if window expired
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + NETWORK_CONFIG.RATE_LIMIT.API.STANDARD.window;
      return;
    }

    // Check if exceeded
    if (limit.count >= NETWORK_CONFIG.RATE_LIMIT.API.STANDARD.requests) {
      throw {
        message: 'Rate limit exceeded',
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      } as ApiError;
    }

    limit.count++;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type { RequestConfig, ApiResponse, ApiError };