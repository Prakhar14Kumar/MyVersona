import { apiService } from "./apiService";
import { Post, Comment, getAllPosts, getPostsByType, searchUsers, searchPosts } from "./firestoreService";
import { toast } from "sonner";

// Backend specific types
export interface BackendPost {
  post_id: string;
  user_id: string;
  username: string;
  full_name?: string;
  user_avatar?: string;
  content: string;
  type: "entertainment" | "career";
  media_urls?: string[];
  media_type?: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares_count: number;
  bookmarks_count: number;
  is_verified_user: boolean;
  createdAt: string;
  updatedAt: string;
  liked_by_me?: boolean;
}

export interface BackendComment {
  comment_id: string;
  post_id: string;
  user_id: string;
  username: string;
  full_name?: string;
  user_avatar?: string;
  content: string;
  likes: number;
  createdAt: string;
}

// Mapper functions
const mapBackendPostToPost = (bp: BackendPost): Post => ({
  id: bp.post_id,
  userId: bp.user_id,
  userName: bp.full_name || bp.username,
  userAvatar: bp.user_avatar || "",
  userCollege: bp.is_verified_user ? "Verified User" : "",
  content: bp.content,
  type: bp.type,
  likes: bp.likes,
  comments: bp.comments,
  likedBy: [],
  createdAt: new Date(bp.createdAt),
  updatedAt: new Date(bp.updatedAt),
  image: bp.media_urls && bp.media_urls.length > 0 ? bp.media_urls[0] : undefined,
});

const mapBackendCommentToComment = (bc: BackendComment): Comment => ({
  id: bc.comment_id,
  postId: bc.post_id,
  userId: bc.user_id,
  userName: bc.full_name || bc.username,
  userAvatar: bc.user_avatar || "",
  content: bc.content,
  createdAt: new Date(bc.createdAt),
});

export const backendService = {
  // Feed - Use real backend API only
  getFeed: async (feedType: "entertainment" | "career", limit: number = 20, lastPostId?: string): Promise<{ posts: Post[], lastPostId?: string }> => {
    try {
      let url = `/posts/feed/${feedType}?limit=${limit}`;
      if (lastPostId) {
        url += `&last_post_id=${lastPostId}`;
      }

      const response = await apiService.get<BackendPost[]>(url);
      const posts = response.data.map(mapBackendPostToPost);

      const newLastPostId = posts.length > 0 ? posts[posts.length - 1].id : undefined;

      return { posts, lastPostId: newLastPostId };
    } catch (error) {
      console.error('Failed to load feed from backend API:', error);
      toast.error('Failed to load feed. Please check your connection.');
      return { posts: [] };
    }
  },

  // Create Post
  createPost: async (content: string, feedType: "entertainment" | "career", hashtags: string[] = [], mediaUrl?: string, mediaType: "image" | "video" | "none" = "none"): Promise<Post> => {
    try {
      const response = await apiService.post<BackendPost>("/posts", {
        content,
        type: feedType,
        hashtags,
        media_urls: mediaUrl ? [mediaUrl] : [],
        media_type: mediaType
      });
      return mapBackendPostToPost(response.data);
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post. Please try again.');
      throw error;
    }
  },

  // Get Single Post
  getPost: async (postId: string): Promise<Post | null> => {
    try {
      const response = await apiService.get<BackendPost>(`/posts/${postId}`);
      return mapBackendPostToPost(response.data);
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  },

  // Like
  likePost: async (postId: string): Promise<void> => {
    try {
      await apiService.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  },

  // Unlike
  unlikePost: async (postId: string): Promise<void> => {
    try {
      await apiService.delete(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  },

  // Comments
  getComments: async (postId: string, limit: number = 20, cursor?: string): Promise<{ comments: Comment[], nextCursor?: string, hasMore: boolean }> => {
    try {
      let url = `/posts/${postId}/comments?limit=${limit}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      const response = await apiService.get<{ comments: BackendComment[], next_cursor: string | null, has_more: boolean }>(url);

      return {
        comments: response.data.comments.map(mapBackendCommentToComment),
        nextCursor: response.data.next_cursor || undefined,
        hasMore: response.data.has_more
      };
    } catch (error) {
      console.error('Failed to get comments:', error);
      return { comments: [], nextCursor: undefined, hasMore: false };
    }
  },

  createComment: async (postId: string, content: string): Promise<Comment> => {
    try {
      const response = await apiService.post<BackendComment>(`/posts/${postId}/comments`, { content });
      return mapBackendCommentToComment(response.data);
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to post comment. Please try again.');
      throw error;
    }
  },

  // Notifications
  getNotifications: async (limit: number = 20, cursor?: string): Promise<{ notifications: any[], nextCursor?: string }> => {
    try {
      let url = `/notifications?limit=${limit}`;
      if (cursor) url += `&cursor=${cursor}`;
      const response = await apiService.get<any>(url);
      return {
        notifications: response.data.notifications || [],
        nextCursor: response.data.next_cursor || undefined
      };
    } catch (error: any) {
      // Backend unavailable – fall back to Firestore notifications
      // Check for network errors, circuit breaker errors, or timeout errors
      const isBackendUnavailable =
        error.status === 0 ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        (error.message && error.message.includes('Circuit breaker'));

      if (isBackendUnavailable) {
        try {
          const { auth } = await import('./firebase');
          const currentUser = auth.currentUser;
          if (currentUser) {
            const { getNotificationsForUser } = await import('./firestoreService');
            const notifications = await getNotificationsForUser(currentUser.uid, limit);
            return { notifications };
          }
        } catch (fsError) {
          console.error('Firestore notifications fallback failed:', fsError);
        }
        return { notifications: [] };
      }
      console.error('Failed to get notifications:', error);
      return { notifications: [] };
    }
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      if (error.status === 0 || error.code === 'NETWORK_ERROR') {
        const { markNotificationAsRead } = await import('./firestoreService');
        await markNotificationAsRead(notificationId);
        return;
      }
      console.error('Failed to mark notification read:', error);
    }
  },

  markAllNotificationsRead: async (): Promise<void> => {
    try {
      await apiService.put(`/notifications/read-all`);
    } catch (error: any) {
      if (error.status === 0 || error.code === 'NETWORK_ERROR') {
        const { auth } = await import('./firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          const { markAllNotificationsAsRead } = await import('./firestoreService');
          await markAllNotificationsAsRead(currentUser.uid);
        }
        return;
      }
      console.error('Failed to mark all notifications read:', error);
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await apiService.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      if (error.status === 0 || error.code === 'NETWORK_ERROR') {
        const { deleteNotificationById } = await import('./firestoreService');
        await deleteNotificationById(notificationId);
        return;
      }
      console.error('Failed to delete notification:', error);
    }
  },

  // Search
  searchUsers: async (query: string, limit: number = 10): Promise<any[]> => {
    try {
      const response = await apiService.get<any[]>(`/search/users?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  },

  searchPosts: async (query: string, limit: number = 10): Promise<Post[]> => {
    try {
      const response = await apiService.get<BackendPost[]>(`/search/posts?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.map(mapBackendPostToPost);
    } catch (error) {
      console.error('Failed to search posts:', error);
      return [];
    }
  },

  combinedSearch: async (query: string): Promise<{ users: any[], posts: Post[] }> => {
    try {
      const response = await apiService.get<any>(`/search?q=${encodeURIComponent(query)}`);
      return {
        users: response.data.users || [],
        posts: (response.data.posts || []).map(mapBackendPostToPost)
      };
    } catch (error: any) {
      // Check if backend is unavailable (network errors, circuit breaker, timeout)
      const isBackendUnavailable =
        error.status === 0 ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        (error.message && error.message.includes('Circuit breaker'));

      if (isBackendUnavailable) {
        // Backend unavailable – fall back to Firestore search (expected behavior, not an error)
        try {
          console.log('Backend unavailable, using Firestore fallback for search');
          const [firestoreUsers, firestorePosts] = await Promise.all([
            searchUsers(query, 10),
            searchPosts(query, 10)
          ]);

          return {
            users: firestoreUsers,
            posts: firestorePosts
          };
        } catch (fsError) {
          console.error('Firestore search fallback failed:', fsError);
        }
      } else {
        // Unexpected error (not backend unavailability)
        console.error('Failed to perform combined search:', error);
      }

      return { users: [], posts: [] };
    }
  },

  // Chat
  getConversations: async (limit: number = 20, lastConversationId?: string): Promise<any[]> => {
    try {
      let url = `/chat/conversations?limit=${limit}`;
      if (lastConversationId) url += `&last_conversation_id=${lastConversationId}`;
      const response = await apiService.get<any[]>(url);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  },

  getMessages: async (conversationId: string, limit: number = 50, lastMessageId?: string): Promise<any[]> => {
    try {
      let url = `/chat/conversations/${conversationId}/messages?limit=${limit}`;
      if (lastMessageId) url += `&last_message_id=${lastMessageId}`;
      const response = await apiService.get<any[]>(url);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  },

  // Content Moderation
  checkContent: async (content: string): Promise<{ is_safe: boolean, reason?: string, confidence: number }> => {
    try {
      const response = await apiService.post<any>("/moderation/check", { content });
      return {
        is_safe: response.data.is_appropriate,
        reason: response.data.reason,
        confidence: response.data.confidence === 'high' ? 1.0 : response.data.confidence === 'medium' ? 0.5 : 0.0
      };
    } catch (error) {
      // Default to safe if moderation fails
      return { is_safe: true, confidence: 1.0 };
    }
  },

  // Trending
  getTrending: async (category: "people" | "colleges" | "posts"): Promise<any[]> => {
    try {
      const response = await apiService.get<{ success: boolean, data: any[] }>(`/explore/trending?category=${category}`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch trending ${category}:`, error);
      return [];
    }
  }
};