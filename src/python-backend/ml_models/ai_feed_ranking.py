"""
AI Feed Ranking Engine for VerSona
=================================
Personalizes entertainment and college/career feeds using:
- Embeddings and semantic similarity
- User behavior patterns
- Content similarity
- Trending patterns and virality scores
"""

import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import hashlib


class AIFeedRanking:
    """AI-powered feed personalization and ranking."""
    
    def __init__(self):
        """Initialize feed ranking engine."""
        self.user_embeddings = {}  # User interest embeddings
        self.content_embeddings = {}  # Content embeddings cache
        self.trending_cache = {}  # Trending content cache
        
    def rank_feed(
        self,
        user_id: str,
        posts: List[Dict[str, Any]],
        feed_type: str = "entertainment",
        user_profile: Optional[Dict[str, Any]] = None,
        user_interactions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank feed posts for personalized experience.
        
        Args:
            user_id: User ID
            posts: List of posts to rank
            feed_type: 'entertainment' or 'career'
            user_profile: User profile data
            user_interactions: User's past interactions
            
        Returns:
            Ranked list of posts with scores
        """
        if not posts:
            return []
        
        # Calculate scores for each post
        scored_posts = []
        for post in posts:
            score = self._calculate_post_score(
                user_id=user_id,
                post=post,
                feed_type=feed_type,
                user_profile=user_profile,
                user_interactions=user_interactions
            )
            
            scored_posts.append({
                **post,
                "ranking_score": score,
                "ranking_factors": self._get_ranking_factors(post, score)
            })
        
        # Sort by score (descending)
        ranked_posts = sorted(
            scored_posts,
            key=lambda x: x['ranking_score'],
            reverse=True
        )
        
        # Apply diversity and freshness
        final_feed = self._apply_diversity(ranked_posts, feed_type)
        
        return final_feed
    
    def _calculate_post_score(
        self,
        user_id: str,
        post: Dict[str, Any],
        feed_type: str,
        user_profile: Optional[Dict[str, Any]],
        user_interactions: Optional[List[Dict[str, Any]]]
    ) -> float:
        """Calculate comprehensive ranking score for a post."""
        
        # Base scores for different factors
        relevance_score = self._calculate_relevance(user_id, post, user_profile)
        engagement_score = self._calculate_engagement_score(post)
        freshness_score = self._calculate_freshness_score(post)
        trending_score = self._calculate_trending_score(post)
        creator_score = self._calculate_creator_score(post, user_id, user_interactions)
        content_quality_score = self._calculate_content_quality(post)
        
        # Weights differ by feed type
        if feed_type == "entertainment":
            weights = {
                'relevance': 0.25,
                'engagement': 0.30,
                'freshness': 0.15,
                'trending': 0.20,
                'creator': 0.05,
                'quality': 0.05
            }
        else:  # career feed
            weights = {
                'relevance': 0.35,
                'engagement': 0.15,
                'freshness': 0.20,
                'trending': 0.10,
                'creator': 0.10,
                'quality': 0.10
            }
        
        # Weighted sum
        final_score = (
            relevance_score * weights['relevance'] +
            engagement_score * weights['engagement'] +
            freshness_score * weights['freshness'] +
            trending_score * weights['trending'] +
            creator_score * weights['creator'] +
            content_quality_score * weights['quality']
        )
        
        # Apply personalization boost
        personalization_boost = self._get_personalization_boost(
            post, user_profile, user_interactions
        )
        
        final_score *= (1 + personalization_boost)
        
        return min(final_score, 1.0)
    
    def _calculate_relevance(
        self,
        user_id: str,
        post: Dict[str, Any],
        user_profile: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate content relevance using embeddings."""
        if not user_profile:
            return 0.5  # Neutral score
        
        # Get user interests
        user_interests = user_profile.get('interests', [])
        user_skills = user_profile.get('skills', [])
        user_college = user_profile.get('college', '')
        
        # Get post attributes
        post_tags = post.get('tags', [])
        post_college = post.get('college', '')
        post_hashtags = post.get('hashtags', [])
        
        # Calculate interest overlap
        interest_overlap = len(set(user_interests) & set(post_tags)) / max(len(user_interests), 1)
        
        # Calculate hashtag relevance
        hashtag_overlap = len(set(user_interests) & set(post_hashtags)) / max(len(post_hashtags), 1)
        
        # College match bonus
        college_match = 0.2 if user_college and user_college == post_college else 0.0
        
        # Combine scores
        relevance = (interest_overlap * 0.5 + hashtag_overlap * 0.3 + college_match * 0.2)
        
        return min(relevance, 1.0)
    
    def _calculate_engagement_score(self, post: Dict[str, Any]) -> float:
        """Calculate engagement score based on interactions."""
        likes = post.get('likes', 0)
        comments = post.get('comments', 0)
        shares = post.get('shares', 0)
        views = post.get('views', 1)  # Avoid division by zero
        
        # Engagement rate
        engagement_rate = (likes + comments * 3 + shares * 5) / max(views, 1)
        
        # Normalize to 0-1 range using sigmoid-like function
        normalized = 1 / (1 + np.exp(-5 * (engagement_rate - 0.1)))
        
        return normalized
    
    def _calculate_freshness_score(self, post: Dict[str, Any]) -> float:
        """Calculate freshness score based on post age."""
        created_at = post.get('created_at')
        if not created_at:
            return 0.5
        
        # Parse timestamp
        if isinstance(created_at, str):
            try:
                created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except:
                return 0.5
        else:
            created_time = created_at
        
        # Calculate age in hours
        age_hours = (datetime.utcnow() - created_time.replace(tzinfo=None)).total_seconds() / 3600
        
        # Decay function: newer = higher score
        # Score drops to ~0.5 after 24 hours, ~0.2 after 72 hours
        freshness = np.exp(-age_hours / 24)
        
        return freshness
    
    def _calculate_trending_score(self, post: Dict[str, Any]) -> float:
        """Calculate trending score based on recent engagement velocity."""
        post_id = post.get('id', '')
        
        # Get recent engagement data
        recent_likes = post.get('recent_likes_1h', 0)
        recent_comments = post.get('recent_comments_1h', 0)
        recent_shares = post.get('recent_shares_1h', 0)
        
        # Calculate velocity (engagement per hour)
        velocity = recent_likes + recent_comments * 2 + recent_shares * 3
        
        # Normalize using log scale
        if velocity > 0:
            trending = min(np.log(velocity + 1) / 5, 1.0)
        else:
            trending = 0.0
        
        return trending
    
    def _calculate_creator_score(
        self,
        post: Dict[str, Any],
        user_id: str,
        user_interactions: Optional[List[Dict[str, Any]]]
    ) -> float:
        """Calculate creator affinity score."""
        creator_id = post.get('creator_id', '')
        
        if not user_interactions:
            # Use creator's general reputation
            creator_followers = post.get('creator_followers', 0)
            creator_score = min(np.log(creator_followers + 1) / 10, 1.0)
            return creator_score
        
        # Check user's past interactions with this creator
        creator_interactions = [
            i for i in user_interactions
            if i.get('creator_id') == creator_id
        ]
        
        if creator_interactions:
            # High affinity if user frequently interacts with this creator
            interaction_count = len(creator_interactions)
            affinity = min(interaction_count / 10, 1.0)
            return affinity
        
        return 0.3  # Neutral score for unknown creators
    
    def _calculate_content_quality(self, post: Dict[str, Any]) -> float:
        """Calculate content quality score."""
        quality_score = 0.5  # Base score
        
        # Has media (images/videos)
        if post.get('has_media'):
            quality_score += 0.2
        
        # Content length (not too short, not too long)
        content = post.get('content', '')
        content_length = len(content)
        if 50 <= content_length <= 500:
            quality_score += 0.2
        elif content_length > 500:
            quality_score += 0.1
        
        # Has hashtags
        if post.get('hashtags'):
            quality_score += 0.1
        
        return min(quality_score, 1.0)
    
    def _get_personalization_boost(
        self,
        post: Dict[str, Any],
        user_profile: Optional[Dict[str, Any]],
        user_interactions: Optional[List[Dict[str, Any]]]
    ) -> float:
        """Get personalization boost factor."""
        boost = 0.0
        
        if not user_profile or not user_interactions:
            return boost
        
        # Boost for college-specific content
        if user_profile.get('college') == post.get('college'):
            boost += 0.2
        
        # Boost for content in user's preferred categories
        user_preferences = user_profile.get('preferred_categories', [])
        post_category = post.get('category', '')
        if post_category in user_preferences:
            boost += 0.15
        
        # Boost for content from followed creators
        following = user_profile.get('following', [])
        if post.get('creator_id') in following:
            boost += 0.25
        
        return boost
    
    def _get_ranking_factors(self, post: Dict[str, Any], score: float) -> Dict[str, Any]:
        """Get explanation of ranking factors."""
        return {
            "final_score": round(score, 3),
            "is_trending": post.get('recent_likes_1h', 0) > 10,
            "is_fresh": self._calculate_freshness_score(post) > 0.7,
            "high_engagement": self._calculate_engagement_score(post) > 0.6,
            "from_followed_creator": False  # Would check against user's following list
        }
    
    def _apply_diversity(
        self,
        ranked_posts: List[Dict[str, Any]],
        feed_type: str
    ) -> List[Dict[str, Any]]:
        """
        Apply diversity to avoid monotony in feed.
        Ensures variety in creators, topics, and content types.
        """
        if len(ranked_posts) <= 5:
            return ranked_posts
        
        diverse_feed = []
        seen_creators = set()
        seen_topics = set()
        
        # Take top posts with diversity constraints
        for post in ranked_posts:
            creator_id = post.get('creator_id', '')
            topic = post.get('category', '')
            
            # Add if it brings diversity or is highly ranked
            if (len(diverse_feed) < 3 or  # Always take top 3
                creator_id not in seen_creators or
                topic not in seen_topics or
                post['ranking_score'] > 0.8):  # Always take highly ranked
                
                diverse_feed.append(post)
                seen_creators.add(creator_id)
                seen_topics.add(topic)
            
            if len(diverse_feed) >= 20:  # Limit feed size
                break
        
        # Add remaining high-scoring posts if feed is short
        if len(diverse_feed) < 10:
            for post in ranked_posts:
                if post not in diverse_feed:
                    diverse_feed.append(post)
                if len(diverse_feed) >= 10:
                    break
        
        return diverse_feed
    
    def get_trending_topics(
        self,
        feed_type: str = "all",
        timeframe_hours: int = 24,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get currently trending topics/hashtags.
        
        Args:
            feed_type: Filter by feed type
            timeframe_hours: Time window for trending calculation
            limit: Maximum number of trending topics
            
        Returns:
            List of trending topics with metadata
        """
        # In production, this would query a trending topics database
        # For now, return mock trending data
        
        mock_trending = [
            {
                "topic": "PlacementSeason",
                "hashtag": "#PlacementSeason",
                "post_count": 1245,
                "growth_rate": 2.3,
                "category": "career"
            },
            {
                "topic": "CollegeFest",
                "hashtag": "#CollegeFest",
                "post_count": 892,
                "growth_rate": 1.8,
                "category": "entertainment"
            },
            {
                "topic": "AIMLJobs",
                "hashtag": "#AIMLJobs",
                "post_count": 567,
                "growth_rate": 3.1,
                "category": "career"
            },
            {
                "topic": "CampusLife",
                "hashtag": "#CampusLife",
                "post_count": 1100,
                "growth_rate": 1.5,
                "category": "entertainment"
            },
            {
                "topic": "Internship2025",
                "hashtag": "#Internship2025",
                "post_count": 723,
                "growth_rate": 2.7,
                "category": "career"
            }
        ]
        
        # Filter by feed type
        if feed_type != "all":
            mock_trending = [t for t in mock_trending if t['category'] == feed_type]
        
        # Sort by growth rate
        trending = sorted(mock_trending, key=lambda x: x['growth_rate'], reverse=True)
        
        return trending[:limit]
    
    def calculate_virality_score(self, post: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate virality potential of a post.
        
        Args:
            post: Post data
            
        Returns:
            Virality analysis
        """
        # Engagement metrics
        likes = post.get('likes', 0)
        comments = post.get('comments', 0)
        shares = post.get('shares', 0)
        views = post.get('views', 1)
        
        # Time since posting
        created_at = post.get('created_at')
        if isinstance(created_at, str):
            try:
                created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                age_hours = (datetime.utcnow() - created_time.replace(tzinfo=None)).total_seconds() / 3600
            except:
                age_hours = 24
        else:
            age_hours = 24
        
        # Calculate engagement rate
        engagement_rate = (likes + comments * 2 + shares * 5) / max(views, 1)
        
        # Calculate velocity (engagement per hour)
        velocity = (likes + comments + shares) / max(age_hours, 1)
        
        # Virality score components
        engagement_score = min(engagement_rate * 100, 100)
        velocity_score = min(velocity * 10, 100)
        share_score = min((shares / max(likes, 1)) * 100, 100)
        
        # Overall virality score
        virality_score = (engagement_score * 0.4 + velocity_score * 0.4 + share_score * 0.2)
        
        # Determine virality level
        if virality_score >= 80:
            level = "viral"
        elif virality_score >= 60:
            level = "high_potential"
        elif virality_score >= 40:
            level = "moderate"
        else:
            level = "low"
        
        return {
            "virality_score": round(virality_score, 2),
            "level": level,
            "metrics": {
                "engagement_rate": round(engagement_rate, 4),
                "velocity": round(velocity, 2),
                "share_ratio": round(shares / max(likes, 1), 3)
            },
            "prediction": f"{'High' if virality_score > 60 else 'Low'} viral potential",
            "timestamp": datetime.utcnow().isoformat()
        }
