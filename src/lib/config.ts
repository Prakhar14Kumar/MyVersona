/**
 * VerSona Configuration
 * Centralized configuration for API endpoints and environment variables
 */

// Helper function to safely access environment variables
const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    return import.meta?.env?.[key] || fallback;
  } catch {
    return fallback;
  }
};

// API Configuration
export const API_CONFIG = {
  // Backend API URL
  BACKEND_URL: getEnvVar('VITE_BACKEND_URL', 'http://localhost:8000'),
  
  // AI Backend URL
  AI_BACKEND_URL: getEnvVar('VITE_AI_BACKEND_URL', 'http://localhost:8001'),
  
  // Legacy support for VITE_API_URL
  API_URL: getEnvVar('VITE_API_URL', getEnvVar('VITE_BACKEND_URL', 'http://localhost:8000')),
  
  // Legacy support for VITE_AI_API_URL
  AI_API_URL: getEnvVar('VITE_AI_API_URL', getEnvVar('VITE_AI_BACKEND_URL', 'http://localhost:8001')),
  
  // WebSocket URL (without protocol)
  WEBSOCKET_URL: getEnvVar('VITE_WEBSOCKET_URL', 'ws://localhost:8000/ws'),
  
  // App URL
  APP_URL: getEnvVar('VITE_APP_URL', window.location.origin),
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  // Extract host from WebSocket URL or fallback to localhost
  getWebSocketHost: (): string => {
    const wsUrl = API_CONFIG.WEBSOCKET_URL;
    try {
      // Remove protocol if present
      const urlWithoutProtocol = wsUrl.replace(/^(ws|wss):\/\//, '');
      // Remove path if present
      const host = urlWithoutProtocol.split('/')[0];
      return host || 'localhost:8000';
    } catch {
      return 'localhost:8000';
    }
  },
  
  // Get full WebSocket URL with protocol
  getWebSocketUrl: (endpoint: string, userId: string): string => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = WS_CONFIG.getWebSocketHost();
      const url = `${protocol}//${host}/ws/${endpoint}/${userId}`;
      console.log(`🔌 WebSocket URL for ${endpoint}:`, url);
      return url;
    } catch (error) {
      console.error('Error constructing WebSocket URL:', error);
      return `ws://localhost:8000/ws/${endpoint}/${userId}`;
    }
  },
  
  // Reconnection settings
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,
} as const;

// Firebase Configuration
export const FIREBASE_CONFIG = {
  API_KEY: getEnvVar('VITE_FIREBASE_API_KEY'),
  AUTH_DOMAIN: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  PROJECT_ID: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  STORAGE_BUCKET: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  MESSAGING_SENDER_ID: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  APP_ID: getEnvVar('VITE_FIREBASE_APP_ID'),
  MEASUREMENT_ID: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_FEATURES: getEnvVar('VITE_ENABLE_AI_FEATURES', 'true') === 'true',
  ENABLE_VIDEO_UPLOAD: getEnvVar('VITE_ENABLE_VIDEO_UPLOAD', 'true') === 'true',
  ENABLE_STORIES: getEnvVar('VITE_ENABLE_STORIES', 'true') === 'true',
  ENABLE_WEBSOCKET: getEnvVar('VITE_ENABLE_WEBSOCKET', 'false') === 'true', // Disabled by default - enable when backend is running
} as const;

// Environment
export const ENVIRONMENT = {
  NODE_ENV: getEnvVar('VITE_ENVIRONMENT', getEnvVar('NODE_ENV', 'development')),
  IS_DEVELOPMENT: getEnvVar('VITE_ENVIRONMENT', getEnvVar('NODE_ENV', 'development')) === 'development',
  IS_PRODUCTION: getEnvVar('VITE_ENVIRONMENT', getEnvVar('NODE_ENV', 'development')) === 'production',
} as const;

// Export all configuration
export const CONFIG = {
  ...API_CONFIG,
  ...WS_CONFIG,
  FIREBASE: FIREBASE_CONFIG,
  FEATURES: FEATURE_FLAGS,
  ENV: ENVIRONMENT,
} as const;

export default CONFIG;