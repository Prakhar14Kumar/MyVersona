/**
 * Content Recommendation Engine
 * Hybrid filtering for feed personalization
 */

import { cosineSimilarity, jaccardSimilarity, weightedAverage } from './utils';

export interface Post {
  id: string;
  userId: string;
  content: string;
  category?: 'entertainment' | 'career';
  hashtags?: string[];
  likes?: number;
  comments?: number;
  timestamp?: number;
}

export interface UserInteraction {
  postId: string;
  type: 'view' | 'like' | 'comment' | 'share';
  timestamp: number;
  durationSeconds?: number;
}

export interface ContentRecommendation {
  post_id: string;
  relevance_score: number;
  category: 'entertainment' | 'career';
  reason: string;
}

/**
 * Content Recommendation Engine
 */
export class ContentRecommendationEngine {
  /**
   * Rank posts for user feed
   */
  static rankPosts(
    posts: Post[],
    userId: string,
    userInteractions: UserInteraction[],
    userProfile: {
      interests?: string[];
      followedUsers?: string[];
      preferredCategory?: 'entertainment' | 'career';
    },
    feedType: 'entertainment' | 'career'
  ): ContentRecommendation[] {
    const scoredPosts = posts.map(post => {
      const score = this.calculateRelevanceScore(
        post,
        userId,
        userInteractions,
        userProfile,
        feedType
      );
      
      const reason = this.generateReason(post, userProfile, userInteractions);
      
      return {
        post_id: post.id,
        relevance_score: Math.round(score * 100) / 100,
        category: (post.category || feedType) as 'entertainment' | 'career',
        reason
      };
    });

    // Sort by relevance
    return scoredPosts.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Calculate relevance score for a post
   */
  private static calculateRelevanceScore(
    post: Post,
    userId: string,
    userInteractions: UserInteraction[],
    userProfile: any,
    feedType: 'entertainment' | 'career'
  ): number {
    const scores: number[] = [];
    const weights: number[] = [];

    // 1. Category match (25% weight)
    const categoryScore = post.category === feedType ? 1.0 : 0.3;
    scores.push(categoryScore);
    weights.push(0.25);

    // 2. Interest/hashtag match (20% weight)
    const interestScore = this.calculateInterestScore(post, userProfile.interests || []);
    scores.push(interestScore);
    weights.push(0.20);

    // 3. Social proof - engagement (20% weight)
    const engagementScore = this.calculateEngagementScore(post);
    scores.push(engagementScore);
    weights.push(0.20);

    // 4. Recency (15% weight)
    const recencyScore = this.calculateRecencyScore(post.timestamp);
    scores.push(recencyScore);
    weights.push(0.15);

    // 5. Connection to followed users (10% weight)
    const connectionScore = userProfile.followedUsers?.includes(post.userId) ? 1.0 : 0.3;
    scores.push(connectionScore);
    weights.push(0.10);

    // 6. User interaction history similarity (10% weight)
    const historyScore = this.calculateHistoryScore(post, userInteractions);
    scores.push(historyScore);
    weights.push(0.10);

    return weightedAverage(scores, weights);
  }

  /**
   * Calculate interest/hashtag match score
   */
  private static calculateInterestScore(post: Post, userInterests: string[]): number {
    if (userInterests.length === 0) return 0.5; // Neutral

    const postHashtags = post.hashtags || [];
    if (postHashtags.length === 0) return 0.5;

    const userSet = new Set(userInterests.map(i => i.toLowerCase()));
    const postSet = new Set(postHashtags.map(h => h.toLowerCase().replace('#', '')));

    const similarity = jaccardSimilarity(userSet, postSet);
    return Math.max(0.3, similarity); // Minimum 0.3 to allow discovery
  }

  /**
   * Calculate engagement score (social proof)
   */
  private static calculateEngagementScore(post: Post): number {
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    
    // Engagement = likes + (comments * 2) - comments are more valuable
    const totalEngagement = likes + (comments * 2);
    
    // Normalize using logarithmic scale (to handle viral posts)
    const normalizedScore = Math.log(totalEngagement + 1) / Math.log(100);
    
    return Math.min(1.0, normalizedScore);
  }

  /**
   * Calculate recency score (time decay)
   */
  private static calculateRecencyScore(timestamp: number | undefined): number {
    if (!timestamp) return 0.5;

    const now = Date.now();
    const ageHours = (now - timestamp) / (1000 * 60 * 60);

    // Exponential decay: score = e^(-age/24)
    // Posts lose half relevance every 24 hours
    const score = Math.exp(-ageHours / 24);
    
    return score;
  }

  /**
   * Calculate history-based score
   */
  private static calculateHistoryScore(post: Post, userInteractions: UserInteraction[]): number {
    if (userInteractions.length === 0) return 0.5;

    // Check if user interacted with posts from same author
    const authorInteractions = userInteractions.filter(
      interaction => {
        // Would need to look up post author, simplified here
        return interaction.type === 'like' || interaction.type === 'comment';
      }
    );

    // Simple heuristic: if user is active, boost score slightly
    const activityScore = Math.min(1.0, authorInteractions.length / 10);
    
    return Math.max(0.3, activityScore);
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private static generateReason(
    post: Post,
    userProfile: any,
    userInteractions: UserInteraction[]
  ): string {
    const reasons: string[] = [];

    // Check category match
    if (userProfile.preferredCategory && post.category === userProfile.preferredCategory) {
      reasons.push('Matches your preferences');
    }

    // Check hashtag overlap
    if (post.hashtags && userProfile.interests) {
      const overlap = post.hashtags.filter(h => 
        userProfile.interests.some((i: string) => 
          h.toLowerCase().includes(i.toLowerCase())
        )
      );
      if (overlap.length > 0) {
        reasons.push('Matches your interests');
      }
    }

    // Check engagement
    const totalEngagement = (post.likes || 0) + (post.comments || 0);
    if (totalEngagement > 20) {
      reasons.push('Popular in community');
    }

    // Check connection
    if (userProfile.followedUsers?.includes(post.userId)) {
      reasons.push('From people you follow');
    }

    // Check recency
    if (post.timestamp && (Date.now() - post.timestamp) < 3600000) {
      reasons.push('Fresh content');
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }

    return reasons[0]; // Return most relevant reason
  }

  /**
   * Get trending posts (for discovery)
   */
  static getTrendingPosts(
    posts: Post[],
    feedType: 'entertainment' | 'career',
    hoursWindow: number = 24
  ): Post[] {
    const now = Date.now();
    const cutoff = now - (hoursWindow * 60 * 60 * 1000);

    // Filter recent posts
    const recentPosts = posts.filter(p => 
      (p.timestamp || 0) > cutoff && 
      p.category === feedType
    );

    // Score by engagement velocity
    const scoredPosts = recentPosts.map(post => {
      const ageHours = (now - (post.timestamp || now)) / (1000 * 60 * 60);
      const engagement = (post.likes || 0) + (post.comments || 0) * 2;
      
      // Velocity = engagement / age (with minimum age of 1 hour)
      const velocity = engagement / Math.max(1, ageHours);
      
      return { post, velocity };
    });

    // Sort by velocity and return top posts
    return scoredPosts
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 10)
      .map(item => item.post);
  }
}
