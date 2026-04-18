/**
 * VerSona Production API Client
 * Clean, centralized fetch wrapper with automatic Firebase JWT injection
 * and global 401/403 error interception.
 */

import { auth } from './firebase';
import { toast } from 'sonner@2.0.3';
import { API_CONFIG } from './config';

// Define base URL for all local backend calls
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? API_CONFIG.BACKEND_URL 
  : 'http://localhost:8000';

class ApiClient {
  private cache: Map<string, { token: string, expiry: number }> = new Map();

  /**
   * Safely retrieves and aggressively caches the Firebase JWT Token.
   * Firebase SDK natively caches tokens for 1 hour, but calling getIdToken()
   * quickly triggers SDK checks.
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      // Passing `false` tells Firebase to use its fast, native cache unless expired.
      const token = await user.getIdToken(false);
      return token;
    } catch (error) {
      console.warn('Failed to retrieve Firebase token:', error);
      return null;
    }
  }

  /**
   * The core fetch executor that injects headers and intercepts security responses.
   */
  private async execute<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 1. Build Absolute URL
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    // 2. Attach Authorization & JSON Headers dynamically
    const token = await this.getAuthToken();
    const headers = new Headers(options.headers || {});
    
    // Default to JSON if not uploading FormData
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Auto-inject our JWT precisely here
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn(`[API] Triggering protected route ${endpoint} without an active user session.`);
    }

    // 3. Fire the Request
    try {
      const response = await fetch(url, { ...options, headers });

      // 4. Global Error Interception
      if (!response.ok) {
        return this.handleError(response);
      }

      // Handle 204 No Content
      if (response.status === 204) return null as T;

      // 5. Parse Data Safely (Bulletproof against Nginx HTML 502 pages)
      const text = await response.text();
      try {
          return text ? JSON.parse(text) : null;
      } catch (e) {
          console.error('[API JSON PARSE ERROR]', text);
          toast.error("Versona is catching its breath. Let's try that again.");
          throw new Error('Invalid JSON response from server.');
      }
    } catch (error: any) {
      // Offline or DNS failure trap
      if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
        toast.error('Network failure. You might be offline.');
      }
      throw error;
    }
  }

  /**
   * Centralized 401, 403, & 5xx Response Interceptor
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    
    // Safely attempt to read the body - might be HTML if Nginx 502 Bad Gateway
    try {
      const text = await response.text();
      const errorData = JSON.parse(text);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // If it isn't JSON, we fall back to generic but clean messages
      if (response.status >= 500) {
          errorMessage = "Service temporarily unavailable. Our engineers are on it!";
      }
    }

    // Highly Critical: If Python rejects our token seamlessly force a safe logout
    if (response.status === 401) {
      console.error('[SECURITY] 401 Unauthorized - Token Expired or Invalid.');
      toast.error('Session expired. Please log in again.');
      
      // Forcefully clear the stale Firebase session
      await auth.signOut();
      
      // Redirect. Note: use React Router in components usually, but inside 
      // a vanilla JS service, window.location is foolproof for a hard reset.
      if (window.location.pathname !== '/login') {
         window.location.href = '/login?expired=true';
      }
    }

    if (response.status === 403) {
      console.error('[SECURITY] 403 Forbidden - Permission Denied.');
      toast.error('You do not have permission to perform this action.');
    }

    throw new Error(errorMessage);
  }

  // --- Clean Reusable Methods ---

  public async get<T>(endpoint: string, options?: Omit<RequestInit, 'method'>): Promise<T> {
    return this.execute<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.execute<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.execute<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options?: Omit<RequestInit, 'method'>): Promise<T> {
    return this.execute<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
