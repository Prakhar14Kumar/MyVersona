import { Timestamp } from 'firebase/firestore';

// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  college?: string;
  graduationYear?: number;
  role: 'student' | 'alumni' | 'recruiter' | 'mentor';
  skills?: string[];
  interests?: string[];
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  isOnline?: boolean;
  lastSeen?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Post Types
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userCollege?: string;
  content: string;
  type: 'entertainment' | 'career';
  media?: PostMedia[];
  hashtags: string[];
  mentions?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bookmarksCount?: number;
  isLikedByCurrentUser?: boolean;
  isBookmarkedByCurrentUser?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number; // for videos
}

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likesCount: number;
  repliesCount?: number;
  parentCommentId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Story Types
export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  caption?: string;
  viewsCount: number;
  viewers?: string[]; // Array of user IDs
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string; // Recipient
  actorId: string; // Person who triggered the notification
  actorName: string;
  actorAvatar?: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'post_shared';
  postId?: string;
  commentId?: string;
  message?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// Message Types
export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  lastMessageSenderId?: string;
  unreadCount?: Record<string, number>; // Per user
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  media?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
  }[];
  isRead: boolean;
  readBy?: string[]; // Array of user IDs
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Connection Types
export interface Connection {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Timestamp;
}

// Career Types
export interface JobListing {
  id: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  description: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  postedBy: string;
  applicantsCount?: number;
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  content: {
    summary?: string;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startYear: number;
      endYear: number;
      gpa?: number;
    }>;
    experience: Array<{
      company: string;
      title: string;
      location: string;
      startDate: string;
      endDate?: string;
      description: string;
      current: boolean;
    }>;
    skills: string[];
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
      url?: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }>;
  };
  fileUrl?: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ML Service Types
export interface MLRecommendation {
  itemId: string;
  score: number;
  reason?: string;
}

export interface CareerRecommendation {
  career: string;
  matchScore: number;
  reasons: string[];
  requiredSkills: string[];
  averageSalary?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp: number;
}

// Form Types
export interface SignupFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  college: string;
  graduationYear: number;
  role: 'student' | 'alumni';
  agreeToTerms: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ProfileUpdateFormData {
  displayName?: string;
  bio?: string;
  college?: string;
  graduationYear?: number;
  skills?: string[];
  interests?: string[];
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

// UI State Types
export interface UIState {
  isLoading: boolean;
  error?: string | null;
  success?: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
  total?: number;
}

// Utility Types
export type FeedType = 'entertainment' | 'career';
export type UserRole = 'student' | 'alumni' | 'recruiter' | 'mentor';
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'post_shared';
export type MediaType = 'image' | 'video' | 'file';
export type JobType = 'full-time' | 'part-time' | 'internship' | 'contract';

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';

// Export grouped types
export type * from './index';
