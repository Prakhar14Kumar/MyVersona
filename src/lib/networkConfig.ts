/**
 * VerSona Network Configuration
 * Complete network layer configuration optimized for Indian network conditions
 */

// Network Quality Detection
export const NETWORK_QUALITY = {
  EXCELLENT: 'excellent',  // >10 Mbps
  GOOD: 'good',            // 2-10 Mbps
  MODERATE: 'moderate',    // 500 Kbps - 2 Mbps
  POOR: 'poor',            // <500 Kbps
  OFFLINE: 'offline',
} as const;

export type NetworkQuality = typeof NETWORK_QUALITY[keyof typeof NETWORK_QUALITY];

// API Versioning
export const API_VERSION = {
  V1: 'v1',
  V2: 'v2',
  CURRENT: 'v1',
} as const;

// Request Timeouts (optimized for Indian networks)
export const TIMEOUT_CONFIG = {
  // API timeouts
  API_REQUEST_TIMEOUT: 30000,           // 30s for standard requests
  API_UPLOAD_TIMEOUT: 120000,           // 2min for uploads
  API_DOWNLOAD_TIMEOUT: 60000,          // 1min for downloads
  
  // WebSocket timeouts
  WS_CONNECTION_TIMEOUT: 10000,         // 10s to establish connection
  WS_RECONNECT_TIMEOUT: 5000,           // 5s between reconnection attempts
  WS_HEARTBEAT_INTERVAL: 30000,         // 30s heartbeat
  WS_MESSAGE_TIMEOUT: 5000,             // 5s for message acknowledgment
  
  // GraphQL/Aggregated API
  GRAPHQL_TIMEOUT: 45000,               // 45s for complex queries
  
  // CDN/Static assets
  STATIC_ASSET_TIMEOUT: 15000,          // 15s for images/scripts
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // Per endpoint rate limits
  AUTH: {
    LOGIN: { requests: 5, window: 60000 },          // 5 requests per minute
    SIGNUP: { requests: 3, window: 60000 },         // 3 requests per minute
    PASSWORD_RESET: { requests: 3, window: 300000 }, // 3 requests per 5 minutes
  },
  
  API: {
    STANDARD: { requests: 100, window: 60000 },     // 100 requests per minute
    UPLOAD: { requests: 10, window: 60000 },        // 10 uploads per minute
    SEARCH: { requests: 30, window: 60000 },        // 30 searches per minute
  },
  
  WEBSOCKET: {
    MESSAGE: { requests: 60, window: 60000 },       // 60 messages per minute
    TYPING: { requests: 20, window: 60000 },        // 20 typing events per minute
  },
  
  AI: {
    QUERY: { requests: 20, window: 60000 },         // 20 AI queries per minute
    GENERATION: { requests: 10, window: 60000 },    // 10 generations per minute
  },
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  // Exponential backoff parameters
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,           // 1s initial delay
  MAX_DELAY: 10000,           // 10s maximum delay
  BACKOFF_MULTIPLIER: 2,      // Exponential multiplier
  JITTER: 0.1,                // 10% random jitter
  
  // Retry-able HTTP status codes
  RETRYABLE_CODES: [408, 429, 500, 502, 503, 504],
  
  // Retry-able error types
  RETRYABLE_ERRORS: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
  ],
} as const;

// Circuit Breaker Configuration
export const CIRCUIT_BREAKER_CONFIG = {
  FAILURE_THRESHOLD: 5,          // Open after 5 consecutive failures
  SUCCESS_THRESHOLD: 2,          // Close after 2 consecutive successes in half-open
  TIMEOUT: 30000,                // 30s timeout before attempting half-open
  VOLUME_THRESHOLD: 10,          // Minimum requests before evaluating
  ERROR_RATE_THRESHOLD: 0.5,     // Open if error rate > 50%
  WINDOW_SIZE: 60000,            // 1 minute rolling window
} as const;

// Compression Configuration
export const COMPRESSION_CONFIG = {
  ENABLED: true,
  THRESHOLD: 1024,               // Compress responses > 1KB
  LEVEL: 6,                      // Compression level (1-9)
  BROTLI_ENABLED: true,          // Enable Brotli compression
  GZIP_ENABLED: true,            // Enable GZIP compression
  ACCEPTABLE_ENCODINGS: ['br', 'gzip', 'deflate'],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  // API response caching
  API_CACHE_TTL: {
    PROFILE: 300000,             // 5 minutes
    FEED: 60000,                 // 1 minute
    STATIC: 3600000,             // 1 hour
    SEARCH: 180000,              // 3 minutes
  },
  
  // CDN caching
  CDN_CACHE_CONTROL: {
    IMAGES: 'public, max-age=31536000, immutable',     // 1 year
    VIDEOS: 'public, max-age=31536000, immutable',     // 1 year
    SCRIPTS: 'public, max-age=31536000, immutable',    // 1 year
    HTML: 'public, max-age=300, must-revalidate',      // 5 minutes
    API: 'private, no-cache, no-store, must-revalidate', // No caching
  },
  
  // Service Worker cache
  SW_CACHE_NAME: 'versona-v1',
  SW_CACHE_URLS: [
    '/',
    '/offline.html',
    '/styles/globals.css',
  ],
} as const;

// CDN Configuration
export const CDN_CONFIG = {
  ENABLED: true,
  // CDN URLs (placeholder - replace with actual CDN)
  IMAGE_CDN: 'https://cdn.versona.app/images',
  VIDEO_CDN: 'https://cdn.versona.app/videos',
  STATIC_CDN: 'https://cdn.versona.app/static',
  
  // Optimization parameters
  IMAGE_QUALITY: {
    HIGH: 90,
    MEDIUM: 75,
    LOW: 50,
    THUMBNAIL: 30,
  },
  
  // Responsive image widths
  IMAGE_BREAKPOINTS: [320, 640, 768, 1024, 1280, 1920],
  
  // Video streaming
  VIDEO_QUALITY: {
    AUTO: 'auto',
    HD: '1080p',
    SD: '720p',
    LOW: '480p',
    MOBILE: '360p',
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  // CORS
  CORS_ALLOWED_ORIGINS: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://versona.app',
    'https://*.versona.app',
  ],
  
  // Headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },
  
  // CSP (Content Security Policy)
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://apis.google.com', 'wss:', 'ws:'],
    'media-src': ["'self'", 'blob:'],
  },
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60000,      // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,  // 100 requests per window
  
  // DDoS protection
  DDOS_THRESHOLD: 1000,          // requests per second
  DDOS_BAN_DURATION: 3600000,    // 1 hour ban
} as const;

// Geographic Configuration (India-first)
export const GEO_CONFIG = {
  PRIMARY_REGION: 'ap-south-1',  // Mumbai
  SECONDARY_REGIONS: [
    'ap-south-2',                 // Hyderabad
    'ap-southeast-1',             // Singapore (fallback)
  ],
  
  // Latency thresholds by tier
  LATENCY_TARGETS: {
    TIER_1: 50,                   // Metro cities (ms)
    TIER_2: 100,                  // Major cities (ms)
    TIER_3: 200,                  // Small cities (ms)
    RURAL: 500,                   // Rural areas (ms)
  },
  
  // CDN edge locations preference
  CDN_EDGE_PREFERENCE: [
    'mumbai',
    'delhi',
    'bangalore',
    'hyderabad',
    'chennai',
    'singapore',
  ],
} as const;

// Monitoring Configuration
export const MONITORING_CONFIG = {
  // Metrics collection intervals
  METRICS_INTERVAL: 30000,       // 30s
  HEALTH_CHECK_INTERVAL: 60000,  // 1 minute
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    API_LATENCY_WARNING: 1000,   // 1s
    API_LATENCY_CRITICAL: 3000,  // 3s
    ERROR_RATE_WARNING: 0.05,    // 5%
    ERROR_RATE_CRITICAL: 0.1,    // 10%
    CPU_WARNING: 70,             // 70%
    CPU_CRITICAL: 90,            // 90%
    MEMORY_WARNING: 80,          // 80%
    MEMORY_CRITICAL: 95,         // 95%
  },
  
  // Alert channels
  ALERT_ENDPOINTS: {
    SLACK: '', // Configure in backend/server environment
    EMAIL: 'alerts@versona.app',
    SMS: '', // Configure in backend/server environment
  },
  
  // Logging levels
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4,
  },
} as const;

// Load Balancing Configuration
export const LOAD_BALANCER_CONFIG = {
  STRATEGY: 'least_connections', // round_robin, least_connections, ip_hash
  HEALTH_CHECK_PATH: '/health',
  HEALTH_CHECK_INTERVAL: 30000,  // 30s
  HEALTH_CHECK_TIMEOUT: 5000,    // 5s
  MAX_FAILS: 3,                  // Mark as down after 3 failures
  FAIL_TIMEOUT: 60000,           // 1 minute before retry
  
  // Sticky sessions
  STICKY_SESSIONS: true,
  SESSION_COOKIE_NAME: 'versona_session',
  
  // Connection limits
  MAX_CONNECTIONS: 10000,
  MAX_CONNECTIONS_PER_IP: 100,
} as const;

// Network Quality Adaptation
export const NETWORK_ADAPTATION = {
  // Adjust settings based on network quality
  QUALITY_SETTINGS: {
    excellent: {
      imageQuality: 'HIGH',
      videoQuality: 'HD',
      prefetchEnabled: true,
      lazyLoadThreshold: 2000,
      batchSize: 20,
    },
    good: {
      imageQuality: 'MEDIUM',
      videoQuality: 'SD',
      prefetchEnabled: true,
      lazyLoadThreshold: 1500,
      batchSize: 15,
    },
    moderate: {
      imageQuality: 'MEDIUM',
      videoQuality: 'LOW',
      prefetchEnabled: false,
      lazyLoadThreshold: 1000,
      batchSize: 10,
    },
    poor: {
      imageQuality: 'LOW',
      videoQuality: 'MOBILE',
      prefetchEnabled: false,
      lazyLoadThreshold: 500,
      batchSize: 5,
    },
    offline: {
      imageQuality: 'THUMBNAIL',
      videoQuality: 'MOBILE',
      prefetchEnabled: false,
      lazyLoadThreshold: 0,
      batchSize: 0,
    },
  },
} as const;

// WebSocket Fallback Configuration
export const WS_FALLBACK_CONFIG = {
  // Fallback to polling if WebSocket fails
  ENABLE_POLLING: true,
  POLLING_INTERVAL: 5000,        // 5s
  POLLING_TIMEOUT: 10000,        // 10s
  MAX_POLLING_RETRIES: 3,
  
  // Long polling
  ENABLE_LONG_POLLING: true,
  LONG_POLLING_TIMEOUT: 30000,   // 30s
} as const;

// Network Quality Detection Configuration
export const NETWORK_DETECTION = {
  // Test endpoints
  TEST_ENDPOINTS: [
    '/api/ping',
    'https://www.google.com/favicon.ico',
  ],
  
  // Detection interval
  DETECTION_INTERVAL: 60000,     // 1 minute
  
  // Thresholds
  DOWNLOAD_SPEED_THRESHOLDS: {
    EXCELLENT: 10000000,         // 10 Mbps
    GOOD: 2000000,               // 2 Mbps
    MODERATE: 500000,            // 500 Kbps
    POOR: 100000,                // 100 Kbps
  },
  
  // RTT thresholds
  RTT_THRESHOLDS: {
    EXCELLENT: 50,               // <50ms
    GOOD: 150,                   // 50-150ms
    MODERATE: 300,               // 150-300ms
    POOR: 500,                   // 300-500ms
  },
} as const;

// Export all configurations
export const NETWORK_CONFIG = {
  QUALITY: NETWORK_QUALITY,
  VERSION: API_VERSION,
  TIMEOUT: TIMEOUT_CONFIG,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  RETRY: RETRY_CONFIG,
  CIRCUIT_BREAKER: CIRCUIT_BREAKER_CONFIG,
  COMPRESSION: COMPRESSION_CONFIG,
  CACHE: CACHE_CONFIG,
  CDN: CDN_CONFIG,
  SECURITY: SECURITY_CONFIG,
  GEO: GEO_CONFIG,
  MONITORING: MONITORING_CONFIG,
  LOAD_BALANCER: LOAD_BALANCER_CONFIG,
  ADAPTATION: NETWORK_ADAPTATION,
  WS_FALLBACK: WS_FALLBACK_CONFIG,
  DETECTION: NETWORK_DETECTION,
} as const;

export default NETWORK_CONFIG;