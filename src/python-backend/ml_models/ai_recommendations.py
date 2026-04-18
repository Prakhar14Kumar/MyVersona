"""
AI Recommendation Systems for VerSona
====================================
Suggests creators, skills, internships, communities, hashtags, and trends.
Uses collaborative filtering, content-based filtering, and hybrid approaches.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from collections import defaultdict, Counter


class AIRecommendationEngine:
    """Comprehensive AI recommendation system."""
    
    def __init__(self):
        """Initialize recommendation engine."""
        self.user_item_matrix = {}
        self.item_similarity_cache = {}
    
    def recommend_creators(
        self,
        user_id: str,
        user_profile: Dict[str, Any],
        user_interactions: Optional[List[Dict[str, Any]]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend creators/users to follow.
        
        Args:
            user_id: Current user ID
            user_profile: User's profile data
            user_interactions: User's past interactions
            limit: Maximum recommendations
            
        Returns:
            List of recommended creators with scores
        """
        recommendations = []
        
        # Get user's interests and college
        user_college = user_profile.get('college', '')
        user_interests = set(user_profile.get('interests', []))
        user_skills = set(user_profile.get('skills', []))
        following = set(user_profile.get('following', []))
        
        # Mock creator database
        creators = self._get_mock_creators()
        
        for creator in creators:
            # Skip if already following
            if creator['id'] in following or creator['id'] == user_id:
                continue
            
            # Calculate match score
            score = 0.0
            
            # College match
            if creator['college'] == user_college:
                score += 0.3
            
            # Interest overlap
            creator_topics = set(creator.get('topics', []))
            interest_overlap = len(user_interests & creator_topics)
            score += min(interest_overlap * 0.15, 0.4)
            
            # Skill overlap
            creator_skills = set(creator.get('skills', []))
            skill_overlap = len(user_skills & creator_skills)
            score += min(skill_overlap * 0.1, 0.2)
            
            # Popularity boost
            follower_score = min(np.log(creator['followers'] + 1) / 15, 0.1)
            score += follower_score
            
            # Engagement rate
            if creator['avg_engagement'] > 0.05:
                score += 0.1
            
            recommendations.append({
                **creator,
                'match_score': round(score, 3),
                'match_reason': self._get_match_reason(
                    user_college == creator['college'],
                    interest_overlap,
                    skill_overlap
                )
            })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:limit]
    
    def recommend_skills(
        self,
        user_profile: Dict[str, Any],
        career_goal: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend skills to learn based on profile and goals.
        
        Args:
            user_profile: User's profile
            career_goal: Target career/role
            limit: Maximum recommendations
            
        Returns:
            List of recommended skills with learning paths
        """
        current_skills = set(user_profile.get('skills', []))
        interests = user_profile.get('interests', [])
        
        # Skill recommendation database
        all_skills = self._get_skill_recommendations()
        
        recommendations = []
        for skill_data in all_skills:
            skill = skill_data['skill']
            
            # Skip if already have this skill
            if skill in current_skills:
                continue
            
            # Calculate relevance
            score = 0.0
            
            # Interest match
            if any(interest in skill_data['related_to'] for interest in interests):
                score += 0.4
            
            # Career goal match
            if career_goal and career_goal.lower() in [r.lower() for r in skill_data['useful_for']]:
                score += 0.5
            
            # Market demand
            score += skill_data['demand_score'] * 0.3
            
            # Difficulty match (prefer skills at appropriate level)
            difficulty_match = self._match_difficulty(
                current_skills,
                skill_data['prerequisites'],
                skill_data['difficulty']
            )
            score += difficulty_match * 0.2
            
            recommendations.append({
                **skill_data,
                'relevance_score': round(score, 3)
            })
        
        # Sort by relevance
        recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return recommendations[:limit]
    
    def recommend_internships(
        self,
        user_profile: Dict[str, Any],
        preferences: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend relevant internships.
        
        Args:
            user_profile: User's profile
            preferences: User preferences (location, stipend, etc.)
            limit: Maximum recommendations
            
        Returns:
            List of recommended internships
        """
        user_skills = set(user_profile.get('skills', []))
        user_interests = set(user_profile.get('interests', []))
        user_college = user_profile.get('college', '')
        
        # Get internship listings
        internships = self._get_mock_internships()
        
        recommendations = []
        for internship in internships:
            # Calculate match score
            score = 0.0
            
            # Skill match
            required_skills = set(internship['required_skills'])
            skill_match = len(user_skills & required_skills) / max(len(required_skills), 1)
            score += skill_match * 0.5
            
            # Interest alignment
            if internship['domain'] in user_interests:
                score += 0.2
            
            # College tier match
            if 'iit' in user_college.lower() or 'nit' in user_college.lower():
                score += 0.1
            
            # Location preference
            if preferences and preferences.get('location'):
                if internship['location'].lower() == preferences['location'].lower():
                    score += 0.1
            
            # Remote preference
            if preferences and preferences.get('remote_only') and internship['remote']:
                score += 0.15
            
            recommendations.append({
                **internship,
                'match_score': round(score, 3),
                'skill_match_percentage': round(skill_match * 100, 1),
                'missing_skills': list(required_skills - user_skills)
            })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:limit]
    
    def recommend_communities(
        self,
        user_profile: Dict[str, Any],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend communities/groups to join.
        
        Args:
            user_profile: User's profile
            limit: Maximum recommendations
            
        Returns:
            List of recommended communities
        """
        user_interests = set(user_profile.get('interests', []))
        user_college = user_profile.get('college', '')
        joined_communities = set(user_profile.get('communities', []))
        
        # Get available communities
        communities = self._get_mock_communities()
        
        recommendations = []
        for community in communities:
            # Skip if already joined
            if community['id'] in joined_communities:
                continue
            
            score = 0.0
            
            # Interest match
            community_topics = set(community['topics'])
            interest_match = len(user_interests & community_topics) / max(len(user_interests), 1)
            score += interest_match * 0.5
            
            # College-specific boost
            if community.get('college') == user_college:
                score += 0.3
            
            # Activity level (more active = better)
            activity_score = min(community['daily_posts'] / 50, 0.1)
            score += activity_score
            
            # Size (not too small, not too large)
            optimal_size = 500
            size_score = 1 - abs(community['members'] - optimal_size) / 1000
            score += max(size_score, 0) * 0.1
            
            recommendations.append({
                **community,
                'match_score': round(score, 3)
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:limit]
    
    def recommend_hashtags(
        self,
        content: str,
        content_type: str = "post",
        user_profile: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend hashtags for content.
        
        Args:
            content: Post/content text
            content_type: Type of content
            user_profile: User's profile for personalization
            limit: Maximum recommendations
            
        Returns:
            List of recommended hashtags
        """
        content_lower = content.lower()
        
        # Extract key topics
        keywords = self._extract_keywords(content)
        
        # Get trending hashtags
        trending = self._get_trending_hashtags()
        
        recommendations = []
        
        # Match hashtags to content
        all_hashtags = self._get_hashtag_database()
        
        for hashtag_data in all_hashtags:
            score = 0.0
            
            # Keyword match
            if any(kw in hashtag_data['related_keywords'] for kw in keywords):
                score += 0.5
            
            # Trending boost
            if hashtag_data['tag'] in [t['tag'] for t in trending]:
                score += 0.3
            
            # Popularity (but not too popular)
            popularity_score = min(hashtag_data['usage_count'] / 10000, 0.2)
            score += popularity_score
            
            if score > 0.2:  # Only include relevant hashtags
                recommendations.append({
                    **hashtag_data,
                    'relevance_score': round(score, 3)
                })
        
        # Sort by relevance
        recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Always include college hashtag if available
        if user_profile and user_profile.get('college'):
            college_tag = f"#{user_profile['college'].replace(' ', '')}"
            if not any(h['tag'] == college_tag for h in recommendations):
                recommendations.insert(0, {
                    'tag': college_tag,
                    'usage_count': 1000,
                    'relevance_score': 1.0,
                    'category': 'college'
                })
        
        return recommendations[:limit]
    
    def recommend_trending_content(
        self,
        user_profile: Dict[str, Any],
        category: str = "all",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Recommend trending content personalized for user.
        
        Args:
            user_profile: User's profile
            category: Content category filter
            limit: Maximum recommendations
            
        Returns:
            List of trending content
        """
        # Get trending content
        trending = self._get_trending_content()
        
        user_interests = set(user_profile.get('interests', []))
        
        # Personalize trending content
        recommendations = []
        for item in trending:
            # Base trending score
            score = item['trending_score']
            
            # Boost if matches interests
            if any(interest in item.get('tags', []) for interest in user_interests):
                score *= 1.3
            
            # Filter by category
            if category != "all" and item['category'] != category:
                continue
            
            recommendations.append({
                **item,
                'personalized_score': round(score, 3)
            })
        
        # Sort by personalized score
        recommendations.sort(key=lambda x: x['personalized_score'], reverse=True)
        
        return recommendations[:limit]
    
    # Helper methods and mock data
    
    def _get_mock_creators(self) -> List[Dict[str, Any]]:
        """Get mock creator data."""
        return [
            {
                'id': 'creator1',
                'name': 'Rahul Tech',
                'username': '@rahul_tech',
                'college': 'IIT Delhi',
                'followers': 12500,
                'topics': ['coding', 'placements', 'interview prep'],
                'skills': ['Python', 'DSA', 'System Design'],
                'avg_engagement': 0.08,
                'verified': True
            },
            {
                'id': 'creator2',
                'name': 'Priya AI',
                'username': '@priya_ai',
                'college': 'BITS Pilani',
                'followers': 8900,
                'topics': ['ai', 'ml', 'internships'],
                'skills': ['Machine Learning', 'Python', 'Deep Learning'],
                'avg_engagement': 0.06,
                'verified': True
            },
            {
                'id': 'creator3',
                'name': 'College Events',
                'username': '@college_events',
                'college': 'NIT Trichy',
                'followers': 15600,
                'topics': ['events', 'fests', 'competitions'],
                'skills': ['Event Management', 'Marketing'],
                'avg_engagement': 0.09,
                'verified': False
            }
        ]
    
    def _get_skill_recommendations(self) -> List[Dict[str, Any]]:
        """Get skill recommendation database."""
        return [
            {
                'skill': 'Machine Learning',
                'related_to': ['ai', 'data science', 'python'],
                'useful_for': ['Data Scientist', 'ML Engineer', 'AI Researcher'],
                'demand_score': 0.9,
                'difficulty': 'intermediate',
                'prerequisites': ['Python', 'Statistics'],
                'learning_time_weeks': 12,
                'top_resources': ['Coursera ML', 'Fast.ai', 'Kaggle']
            },
            {
                'skill': 'React.js',
                'related_to': ['web development', 'frontend', 'javascript'],
                'useful_for': ['Frontend Developer', 'Full Stack Developer'],
                'demand_score': 0.95,
                'difficulty': 'intermediate',
                'prerequisites': ['JavaScript', 'HTML', 'CSS'],
                'learning_time_weeks': 8,
                'top_resources': ['React Docs', 'Scrimba', 'Udemy']
            },
            {
                'skill': 'System Design',
                'related_to': ['backend', 'architecture', 'scalability'],
                'useful_for': ['Backend Developer', 'Software Architect', 'SDE'],
                'demand_score': 0.85,
                'difficulty': 'advanced',
                'prerequisites': ['Data Structures', 'Databases', 'Networking'],
                'learning_time_weeks': 16,
                'top_resources': ['Grokking System Design', 'System Design Primer']
            },
            {
                'skill': 'Data Structures & Algorithms',
                'related_to': ['coding', 'programming', 'interviews'],
                'useful_for': ['Software Developer', 'SDE', 'any tech role'],
                'demand_score': 1.0,
                'difficulty': 'intermediate',
                'prerequisites': ['Programming basics'],
                'learning_time_weeks': 12,
                'top_resources': ['LeetCode', 'GeeksforGeeks', 'Striver Sheet']
            }
        ]
    
    def _get_mock_internships(self) -> List[Dict[str, Any]]:
        """Get mock internship data."""
        return [
            {
                'id': 'intern1',
                'title': 'Software Development Intern',
                'company': 'Google India',
                'location': 'Bangalore',
                'remote': False,
                'domain': 'software development',
                'required_skills': ['Python', 'DSA', 'System Design'],
                'stipend': 100000,
                'duration_weeks': 10,
                'deadline': '2024-12-10'
            },
            {
                'id': 'intern2',
                'title': 'ML Research Intern',
                'company': 'Microsoft Research',
                'location': 'Hyderabad',
                'remote': True,
                'domain': 'machine learning',
                'required_skills': ['Machine Learning', 'Python', 'Research'],
                'stipend': 80000,
                'duration_weeks': 12,
                'deadline': '2024-12-05'
            }
        ]
    
    def _get_mock_communities(self) -> List[Dict[str, Any]]:
        """Get mock community data."""
        return [
            {
                'id': 'comm1',
                'name': 'IIT Delhi Placements 2025',
                'college': 'IIT Delhi',
                'topics': ['placements', 'interview prep', 'career'],
                'members': 3500,
                'daily_posts': 45,
                'category': 'career'
            },
            {
                'id': 'comm2',
                'name': 'AI/ML Enthusiasts India',
                'college': None,
                'topics': ['ai', 'ml', 'data science'],
                'members': 12000,
                'daily_posts': 120,
                'category': 'learning'
            },
            {
                'id': 'comm3',
                'name': 'College Fest Organizers',
                'college': None,
                'topics': ['events', 'fests', 'management'],
                'members': 5600,
                'daily_posts': 30,
                'category': 'entertainment'
            }
        ]
    
    def _get_hashtag_database(self) -> List[Dict[str, Any]]:
        """Get hashtag recommendation database."""
        return [
            {'tag': '#PlacementSeason', 'related_keywords': ['placement', 'job', 'interview', 'career'], 'usage_count': 15000, 'category': 'career'},
            {'tag': '#Internship2025', 'related_keywords': ['internship', 'intern', 'summer'], 'usage_count': 8900, 'category': 'career'},
            {'tag': '#CollegeFest', 'related_keywords': ['fest', 'event', 'college', 'competition'], 'usage_count': 12000, 'category': 'entertainment'},
            {'tag': '#CodingLife', 'related_keywords': ['coding', 'programming', 'development'], 'usage_count': 9500, 'category': 'tech'},
            {'tag': '#AIMLJobs', 'related_keywords': ['ai', 'ml', 'machine learning', 'artificial intelligence'], 'usage_count': 7800, 'category': 'career'},
            {'tag': '#CampusLife', 'related_keywords': ['campus', 'college', 'student'], 'usage_count': 18000, 'category': 'entertainment'},
        ]
    
    def _get_trending_hashtags(self) -> List[Dict[str, str]]:
        """Get currently trending hashtags."""
        return [
            {'tag': '#PlacementSeason', 'growth_rate': 2.3},
            {'tag': '#AIMLJobs', 'growth_rate': 3.1},
            {'tag': '#CollegeFest', 'growth_rate': 1.8}
        ]
    
    def _get_trending_content(self) -> List[Dict[str, Any]]:
        """Get trending content."""
        return [
            {
                'id': 'trend1',
                'title': 'Google Interview Experience',
                'category': 'career',
                'tags': ['interview', 'google', 'placements'],
                'trending_score': 0.95,
                'views': 45000,
                'engagement': 0.12
            },
            {
                'id': 'trend2',
                'title': 'IIT Bombay TechFest Highlights',
                'category': 'entertainment',
                'tags': ['fest', 'iit', 'events'],
                'trending_score': 0.88,
                'views': 32000,
                'engagement': 0.09
            }
        ]
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text."""
        # Simple keyword extraction
        words = text.lower().split()
        
        # Common tech/career keywords
        important_words = [
            'coding', 'programming', 'developer', 'engineer', 'internship',
            'placement', 'job', 'career', 'interview', 'fest', 'event',
            'college', 'campus', 'ai', 'ml', 'python', 'java'
        ]
        
        keywords = [w for w in words if w in important_words]
        return keywords
    
    def _match_difficulty(
        self,
        current_skills: set,
        prerequisites: List[str],
        difficulty: str
    ) -> float:
        """Match skill difficulty to user level."""
        # Check if user has prerequisites
        has_prereqs = all(p in current_skills for p in prerequisites)
        
        if not has_prereqs:
            return 0.3  # Might be too advanced
        
        # Match difficulty to experience level
        skill_count = len(current_skills)
        
        if difficulty == 'beginner' and skill_count > 10:
            return 0.5  # Too easy
        elif difficulty == 'intermediate' and 5 <= skill_count <= 15:
            return 1.0  # Perfect match
        elif difficulty == 'advanced' and skill_count > 10:
            return 1.0  # Good match
        
        return 0.7
    
    def _get_match_reason(
        self,
        same_college: bool,
        interest_overlap: int,
        skill_overlap: int
    ) -> str:
        """Generate match reason explanation."""
        reasons = []
        
        if same_college:
            reasons.append("from your college")
        if interest_overlap > 2:
            reasons.append(f"shares {interest_overlap} interests")
        if skill_overlap > 1:
            reasons.append(f"{skill_overlap} common skills")
        
        if not reasons:
            return "Popular creator in your field"
        
        return ", ".join(reasons)
