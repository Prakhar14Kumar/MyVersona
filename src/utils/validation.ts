// Validation Utilities for VerSona
// Prevents XSS, validates inputs, enforces security policies

/**
 * Password validation with strength requirements
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Required validations
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Strength calculation
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 10) {
      strength = 'medium';
    } else {
      strength = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Email validation with pattern matching
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos in Indian email domains
  const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && domain.includes('gmial')) {
    return { isValid: false, error: 'Did you mean gmail.com?' };
  }

  return { isValid: true };
};

/**
 * Name validation (no special characters, XSS prevention)
 */
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  // Allow letters, spaces, hyphens, apostrophes (for international names)
  // But prevent XSS attempts
  const namePattern = /^[a-zA-Z\s'-]+$/;
  if (!namePattern.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  // Check for XSS patterns
  const xssPatterns = [/<script/i, /javascript:/i, /onerror=/i, /onclick=/i];
  if (xssPatterns.some(pattern => pattern.test(name))) {
    return { isValid: false, error: 'Invalid characters detected' };
  }

  return { isValid: true };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
};

/**
 * College name validation
 */
export const validateCollege = (college: string): { isValid: boolean; error?: string } => {
  if (!college || college.trim().length === 0) {
    return { isValid: false, error: 'College name is required' };
  }

  if (college.trim().length < 3) {
    return { isValid: false, error: 'College name must be at least 3 characters' };
  }

  if (college.length > 100) {
    return { isValid: false, error: 'College name is too long' };
  }

  // Allow letters, numbers, spaces, hyphens, periods, parentheses
  const collegePattern = /^[a-zA-Z0-9\s\-.()'&,]+$/;
  if (!collegePattern.test(college)) {
    return { isValid: false, error: 'College name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Hashtag validation (for college hashtags)
 */
export const validateHashtag = (hashtag: string): { isValid: boolean; error?: string } => {
  if (!hashtag || hashtag.trim().length === 0) {
    return { isValid: false, error: 'Hashtag is required' };
  }

  // Remove # if user typed it
  const cleanHashtag = hashtag.replace(/^#+/, '');

  if (cleanHashtag.length < 3) {
    return { isValid: false, error: 'Hashtag must be at least 3 characters' };
  }

  if (cleanHashtag.length > 30) {
    return { isValid: false, error: 'Hashtag must be less than 30 characters' };
  }

  // Only alphanumeric and underscores
  const hashtagPattern = /^[a-zA-Z0-9_]+$/;
  if (!hashtagPattern.test(cleanHashtag)) {
    return { isValid: false, error: 'Hashtag can only contain letters, numbers, and underscores' };
  }

  return { isValid: true };
};

/**
 * URL validation (for profile links)
 */
export const validateURL = (url: string): { isValid: boolean; error?: string } => {
  if (!url || url.trim().length === 0) {
    return { isValid: true }; // URL is optional
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must start with http:// or https://' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

/**
 * Bio/description validation
 */
export const validateBio = (bio: string): { isValid: boolean; error?: string } => {
  if (!bio || bio.trim().length === 0) {
    return { isValid: true }; // Bio is optional
  }

  if (bio.length > 500) {
    return { isValid: false, error: 'Bio must be less than 500 characters' };
  }

  // Check for XSS patterns
  const xssPatterns = [/<script/i, /javascript:/i, /onerror=/i, /onclick=/i, /<iframe/i];
  if (xssPatterns.some(pattern => pattern.test(bio))) {
    return { isValid: false, error: 'Bio contains invalid content' };
  }

  return { isValid: true };
};

/**
 * File validation (for uploads)
 */
export interface FileValidation {
  isValid: boolean;
  error?: string;
}

export const validateImageFile = (file: File, maxSizeMB: number = 5): FileValidation => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Only JPEG, PNG, and WebP images are allowed' 
    };
  }

  return { isValid: true };
};

export const validateVideoFile = (file: File, maxSizeMB: number = 100): FileValidation => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `Video size must be less than ${maxSizeMB}MB` 
    };
  }

  // Check file type
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Only MP4, WebM, and MOV videos are allowed' 
    };
  }

  return { isValid: true };
};

/**
 * Content validation (for posts, comments)
 */
export const validatePostContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Post content cannot be empty' };
  }

  if (content.length > 5000) {
    return { isValid: false, error: 'Post must be less than 5000 characters' };
  }

  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (10+ times)
    /https?:\/\/.*https?:\/\/.*https?:\/\//i, // Multiple URLs
  ];
  
  if (spamPatterns.some(pattern => pattern.test(content))) {
    return { isValid: false, error: 'Content appears to be spam' };
  }

  return { isValid: true };
};

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  /**
   * Check if action is allowed based on rate limit
   * @param key - Unique identifier for the action (e.g., 'login:user@email.com')
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts outside the time window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  /**
   * Get remaining time until next attempt is allowed
   */
  getRemainingTime(key: string, windowMs: number = 60000): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const timeElapsed = Date.now() - oldestAttempt;
    const remaining = Math.max(0, windowMs - timeElapsed);
    
    return Math.ceil(remaining / 1000); // Return in seconds
  }
  
  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();
