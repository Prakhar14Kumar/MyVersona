import { useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Auto-refresh authentication token
 * Refreshes every 6 days (before 7-day expiry)
 */
export function useTokenRefresh() {
  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('⏭️ No token to refresh');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        console.log('✅ Token refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      // If refresh fails, user needs to log in again
      localStorage.removeItem('authToken');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
  }, []);
  
  useEffect(() => {
    // Refresh token every 6 days (518400000 ms)
    // This ensures the token is refreshed before the 7-day expiry
    const REFRESH_INTERVAL = 6 * 24 * 60 * 60 * 1000; // 6 days in milliseconds
    
    // Refresh immediately if token exists (on app load)
    const token = localStorage.getItem('authToken');
    if (token) {
      // Don't refresh immediately on first load to avoid rate limiting
      // Instead, set up the interval to start after the first period
      console.log('🔄 Token auto-refresh enabled (every 6 days)');
    }
    
    // Set up interval for automatic refresh
    const interval = setInterval(refreshToken, REFRESH_INTERVAL);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [refreshToken]);
}

/**
 * Manual token refresh
 * Can be called on user action or before making critical requests
 */
export async function refreshTokenManually(): Promise<boolean> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    if (data.access_token) {
      localStorage.setItem('authToken', data.access_token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
}
