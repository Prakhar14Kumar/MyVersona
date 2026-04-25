// App Configuration
export const APP_NAME = 'MyVerSona';
export const APP_TAGLINE = 'Where College Life Meets Career Growth';

// Brand Colors - MyVerSona Gradient Palette
export const COLORS = {
  gradient: {
    start: '#FFB88C',
    mid: '#FF6F91',
    end: '#6DE7C5',
  },
  accent: {
    yellow: '#FFD166',
  },
  text: {
    dark: '#1E1E1E',
  },
  background: {
    light: '#F9FAFB',
  },
} as const;

// Feed Types
export const FEED_TYPES = {
  ENTERTAINMENT: 'entertainment',
  CAREER: 'career',
} as const;

// Routes
export const ROUTES = {
  LANDING: '/',
  SIGNUP: '/signup',
  LOGIN: '/login',
  FEED: '/feed',
  EXPLORE: '/explore',
  COLLEGE: '/college',
  CAREER: '/career',
  CHAT: '/chat',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  BOOKMARKS: '/bookmarks',
} as const;

// Post Limits
export const POST_LIMITS = {
  MAX_CONTENT_LENGTH: 2000,
  MAX_HASHTAGS: 10,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  POSTS_PER_PAGE: 20,
} as const;

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  BOOKMARKS: 'bookmarks',
  FOLLOWERS: 'followers',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  STORIES: 'stories',
} as const;

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ALUMNI: 'alumni',
  RECRUITER: 'recruiter',
  MENTOR: 'mentor',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  MESSAGE: 'message',
  POST_SHARED: 'post_shared',
} as const;

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Debounce/Throttle Delays (ms)
export const DELAYS = {
  SEARCH_DEBOUNCE: 300,
  SCROLL_THROTTLE: 100,
  AUTO_SAVE: 2000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'versona_auth_token',
  USER_PREFERENCES: 'versona_user_preferences',
  THEME: 'versona_theme',
  DRAFT_POST: 'versona_draft_post',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  UPLOAD_ERROR: 'Upload failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  FILE_TOO_LARGE: 'File is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a different file.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
} as const;

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HASHTAG: /#[a-zA-Z0-9_]+/g,
  MENTION: /@[a-zA-Z0-9_]+/g,
  URL: /(https?:\/\/[^\s]+)/g,
} as const;

// Supported File Types
export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Indian Colleges (Sample Data)
export const INDIAN_COLLEGES = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'BITS Pilani', 'NIT Trichy',
  'NIT Warangal', 'NIT Surathkal', 'VIT Vellore', 'VIT Chennai', 'IIIT Hyderabad',
  'DTU Delhi', 'NSUT Delhi', 'Jadavpur University', 'Anna University', 'BHU Varanasi',
] as const;

// Career Categories
export const CAREER_CATEGORIES = [
  'Software Engineering',
  'Data Science',
  'Product Management',
  'Design',
  'Marketing',
  'Finance',
  'Consulting',
  'Business Development',
  'Operations',
  'Human Resources',
] as const;

// Story Duration (24 hours in milliseconds)
export const STORY_DURATION = 24 * 60 * 60 * 1000;

// Real-time Update Intervals (ms)
export const UPDATE_INTERVALS = {
  PRESENCE: 30000, // 30 seconds
  NOTIFICATIONS: 60000, // 1 minute
  FEED: 120000, // 2 minutes
} as const;
