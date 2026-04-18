"""
AI Semantic Search for VerSona
=============================
Natural language search for posts, creators, colleges, events, and internships.
Uses embeddings and semantic similarity for intelligent search results.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np


class AISemanticSearch:
    """AI-powered semantic search engine."""
    
    def __init__(self):
        """Initialize semantic search engine."""
        self.search_cache = {}
        
        # Common synonyms and expansions for Indian context
        self.synonyms = {
            'job': ['job', 'career', 'position', 'role', 'opportunity'],
            'internship': ['internship', 'intern', 'training', 'summer program'],
            'college': ['college', 'university', 'institute', 'institution'],
            'event': ['event', 'fest', 'workshop', 'seminar', 'competition'],
            'skill': ['skill', 'technology', 'tool', 'expertise'],
        }
    
    def search(
        self,
        query: str,
        search_type: str = "all",  # all, posts, creators, colleges, events, internships
        user_context: Optional[Dict[str, Any]] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Perform semantic search across platform content.
        
        Args:
            query: Natural language search query
            search_type: Type of content to search
            user_context: User context for personalization
            limit: Maximum results to return
            
        Returns:
            Search results with relevance scores
        """
        # Clean and expand query
        processed_query = self._process_query(query)
        expanded_keywords = self._expand_keywords(processed_query)
        
        results = {
            "query": query,
            "processed_query": processed_query,
            "expanded_keywords": expanded_keywords,
            "results": [],
            "total_results": 0,
            "search_type": search_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Perform search based on type
        if search_type == "all":
            results["results"] = {
                "posts": self._search_posts(expanded_keywords, user_context, limit),
                "creators": self._search_creators(expanded_keywords, user_context, min(limit, 10)),
                "colleges": self._search_colleges(expanded_keywords, limit=10),
                "events": self._search_events(expanded_keywords, user_context, limit=10),
                "internships": self._search_internships(expanded_keywords, user_context, limit=10)
            }
        elif search_type == "posts":
            results["results"] = self._search_posts(expanded_keywords, user_context, limit)
        elif search_type == "creators":
            results["results"] = self._search_creators(expanded_keywords, user_context, limit)
        elif search_type == "colleges":
            results["results"] = self._search_colleges(expanded_keywords, limit)
        elif search_type == "events":
            results["results"] = self._search_events(expanded_keywords, user_context, limit)
        elif search_type == "internships":
            results["results"] = self._search_internships(expanded_keywords, user_context, limit)
        
        return results
    
    def search_posts(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search posts with advanced filtering.
        
        Args:
            query: Search query
            filters: Additional filters (date range, college, category, etc.)
            user_context: User context for personalization
            limit: Maximum results
            
        Returns:
            Ranked list of matching posts
        """
        processed_query = self._process_query(query)
        expanded_keywords = self._expand_keywords(processed_query)
        
        return self._search_posts(expanded_keywords, user_context, limit, filters)
    
    def search_creators(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search for creators/users."""
        processed_query = self._process_query(query)
        expanded_keywords = self._expand_keywords(processed_query)
        
        return self._search_creators(expanded_keywords, filters, limit)
    
    def autocomplete(
        self,
        partial_query: str,
        search_type: str = "all",
        limit: int = 10
    ) -> List[str]:
        """
        Provide autocomplete suggestions.
        
        Args:
            partial_query: Partial search query
            search_type: Type of search
            limit: Maximum suggestions
            
        Returns:
            List of suggested completions
        """
        partial_lower = partial_query.lower().strip()
        
        # Common search patterns in VerSona
        common_searches = [
            "internship opportunities",
            "placement preparation",
            "college fest events",
            "coding competitions",
            "resume tips",
            "interview preparation",
            "ai ml jobs",
            "web development internship",
            "campus placements",
            "college events near me",
            "career guidance",
            "skill development courses",
            "hackathons",
            "startup internships",
            "remote jobs",
            "iit colleges",
            "engineering colleges",
            "btech computer science",
            "mba colleges india",
            "study abroad opportunities"
        ]
        
        # Filter suggestions that match partial query
        suggestions = [
            s for s in common_searches
            if s.startswith(partial_lower) or partial_lower in s
        ]
        
        return suggestions[:limit]
    
    def get_trending_searches(
        self,
        timeframe_hours: int = 24,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get trending search queries.
        
        Args:
            timeframe_hours: Time window
            limit: Maximum results
            
        Returns:
            Trending searches with metadata
        """
        # In production, this would analyze actual search logs
        trending = [
            {
                "query": "placement season 2025",
                "search_count": 1245,
                "growth_rate": 3.2,
                "category": "career"
            },
            {
                "query": "summer internship",
                "search_count": 892,
                "growth_rate": 2.1,
                "category": "career"
            },
            {
                "query": "college fest",
                "search_count": 756,
                "growth_rate": 1.8,
                "category": "entertainment"
            },
            {
                "query": "ai ml roadmap",
                "search_count": 634,
                "growth_rate": 2.7,
                "category": "learning"
            },
            {
                "query": "resume review",
                "search_count": 521,
                "growth_rate": 1.5,
                "category": "career"
            }
        ]
        
        return trending[:limit]
    
    # Internal search methods
    
    def _search_posts(
        self,
        keywords: List[str],
        user_context: Optional[Dict[str, Any]],
        limit: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search posts (mock implementation)."""
        # In production, this would query Firestore/Elasticsearch
        mock_posts = [
            {
                "id": "post1",
                "content": "Amazing placement season! Got offer from Google. Here's my journey and tips for interview preparation.",
                "creator": "Rahul Sharma",
                "creator_id": "user123",
                "college": "IIT Delhi",
                "likes": 1234,
                "comments": 89,
                "tags": ["placement", "interview", "career", "google"],
                "created_at": "2024-11-20T10:30:00Z",
                "relevance_score": 0.95
            },
            {
                "id": "post2",
                "content": "Check out this amazing AI ML internship opportunity at a top startup! Remote work, great stipend.",
                "creator": "Priya Patel",
                "creator_id": "user456",
                "college": "BITS Pilani",
                "likes": 567,
                "comments": 34,
                "tags": ["internship", "ai", "ml", "remote"],
                "created_at": "2024-11-22T15:20:00Z",
                "relevance_score": 0.88
            },
            {
                "id": "post3",
                "content": "Our college tech fest is happening next week! Amazing speakers, workshops, and competitions. Don't miss it!",
                "creator": "Amit Kumar",
                "creator_id": "user789",
                "college": "NIT Trichy",
                "likes": 345,
                "comments": 23,
                "tags": ["event", "fest", "college", "competition"],
                "created_at": "2024-11-23T09:15:00Z",
                "relevance_score": 0.82
            }
        ]
        
        # Filter and rank
        filtered_posts = self._filter_and_rank(mock_posts, keywords, filters)
        
        return filtered_posts[:limit]
    
    def _search_creators(
        self,
        keywords: List[str],
        user_context: Optional[Dict[str, Any]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search creators/users (mock implementation)."""
        mock_creators = [
            {
                "id": "user123",
                "name": "Rahul Sharma",
                "username": "@rahul_tech",
                "bio": "SDE at Google | IIT Delhi '23 | Helping students with placement prep",
                "college": "IIT Delhi",
                "followers": 12500,
                "verified": True,
                "skills": ["Python", "System Design", "DSA"],
                "relevance_score": 0.92
            },
            {
                "id": "user456",
                "name": "Priya Patel",
                "username": "@priya_ai",
                "bio": "AI/ML Enthusiast | BITS Pilani | Sharing internship opportunities",
                "college": "BITS Pilani",
                "followers": 8900,
                "verified": True,
                "skills": ["Machine Learning", "Deep Learning", "Python"],
                "relevance_score": 0.87
            },
            {
                "id": "user789",
                "name": "Amit Kumar",
                "username": "@amit_events",
                "bio": "Event organizer | College fest coordinator | NIT Trichy",
                "college": "NIT Trichy",
                "followers": 5600,
                "verified": False,
                "skills": ["Event Management", "Marketing"],
                "relevance_score": 0.75
            }
        ]
        
        # Filter and rank
        filtered_creators = [
            c for c in mock_creators
            if any(kw.lower() in c['bio'].lower() or kw.lower() in c['name'].lower()
                   for kw in keywords)
        ]
        
        # Sort by relevance
        filtered_creators.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return filtered_creators[:limit]
    
    def _search_colleges(
        self,
        keywords: List[str],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search colleges (mock implementation)."""
        mock_colleges = [
            {
                "id": "college1",
                "name": "Indian Institute of Technology Delhi",
                "short_name": "IIT Delhi",
                "location": "New Delhi",
                "type": "Engineering",
                "ranking": 1,
                "students_on_versona": 5600,
                "relevance_score": 0.95
            },
            {
                "id": "college2",
                "name": "BITS Pilani",
                "short_name": "BITS Pilani",
                "location": "Pilani, Rajasthan",
                "type": "Engineering",
                "ranking": 5,
                "students_on_versona": 4200,
                "relevance_score": 0.88
            },
            {
                "id": "college3",
                "name": "National Institute of Technology Trichy",
                "short_name": "NIT Trichy",
                "location": "Tiruchirappalli, Tamil Nadu",
                "type": "Engineering",
                "ranking": 8,
                "students_on_versona": 3800,
                "relevance_score": 0.82
            }
        ]
        
        # Filter
        filtered_colleges = [
            c for c in mock_colleges
            if any(kw.lower() in c['name'].lower() or kw.lower() in c['short_name'].lower()
                   for kw in keywords)
        ]
        
        if not filtered_colleges:
            filtered_colleges = mock_colleges  # Return all if no match
        
        return filtered_colleges[:limit]
    
    def _search_events(
        self,
        keywords: List[str],
        user_context: Optional[Dict[str, Any]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search events (mock implementation)."""
        mock_events = [
            {
                "id": "event1",
                "title": "TechFest 2024 - IIT Bombay",
                "description": "Asia's largest science and technology festival",
                "college": "IIT Bombay",
                "date": "2024-12-15",
                "type": "Technical Fest",
                "registrations": 15000,
                "online": False,
                "relevance_score": 0.93
            },
            {
                "id": "event2",
                "title": "Hack the Future - National Hackathon",
                "description": "48-hour coding hackathon with amazing prizes",
                "organizer": "VerSona",
                "date": "2024-12-01",
                "type": "Hackathon",
                "registrations": 5000,
                "online": True,
                "relevance_score": 0.89
            },
            {
                "id": "event3",
                "title": "Career Guidance Workshop",
                "description": "Learn from industry experts about career paths in tech",
                "college": "Multiple Colleges",
                "date": "2024-11-28",
                "type": "Workshop",
                "registrations": 2000,
                "online": True,
                "relevance_score": 0.85
            }
        ]
        
        # Filter
        filtered_events = [
            e for e in mock_events
            if any(kw.lower() in e['title'].lower() or kw.lower() in e['description'].lower()
                   for kw in keywords)
        ]
        
        if not filtered_events:
            filtered_events = mock_events
        
        return filtered_events[:limit]
    
    def _search_internships(
        self,
        keywords: List[str],
        user_context: Optional[Dict[str, Any]],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search internships (mock implementation)."""
        mock_internships = [
            {
                "id": "intern1",
                "title": "Software Development Intern",
                "company": "Google India",
                "location": "Bangalore",
                "duration": "10 weeks",
                "stipend": "₹1,00,000/month",
                "skills": ["Python", "DSA", "System Design"],
                "deadline": "2024-12-10",
                "relevance_score": 0.96
            },
            {
                "id": "intern2",
                "title": "AI/ML Research Intern",
                "company": "Microsoft Research",
                "location": "Hyderabad",
                "duration": "12 weeks",
                "stipend": "₹80,000/month",
                "skills": ["Machine Learning", "Python", "Research"],
                "deadline": "2024-12-05",
                "relevance_score": 0.91
            },
            {
                "id": "intern3",
                "title": "Product Management Intern",
                "company": "Flipkart",
                "location": "Bangalore",
                "duration": "8 weeks",
                "stipend": "₹50,000/month",
                "skills": ["Product Management", "Analytics"],
                "deadline": "2024-11-30",
                "relevance_score": 0.84
            }
        ]
        
        # Filter and personalize
        filtered_internships = [
            i for i in mock_internships
            if any(kw.lower() in i['title'].lower() or 
                   kw.lower() in i['company'].lower() or
                   any(kw.lower() in skill.lower() for skill in i['skills'])
                   for kw in keywords)
        ]
        
        if not filtered_internships:
            filtered_internships = mock_internships
        
        # Personalize if user context available
        if user_context and user_context.get('skills'):
            user_skills = set(s.lower() for s in user_context['skills'])
            for internship in filtered_internships:
                internship_skills = set(s.lower() for s in internship['skills'])
                skill_match = len(user_skills & internship_skills) / len(internship_skills)
                internship['relevance_score'] *= (1 + skill_match * 0.3)
        
        # Sort by relevance
        filtered_internships.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return filtered_internships[:limit]
    
    # Helper methods
    
    def _process_query(self, query: str) -> str:
        """Clean and process search query."""
        # Convert to lowercase
        processed = query.lower().strip()
        
        # Remove special characters except spaces and hyphens
        processed = re.sub(r'[^\w\s-]', '', processed)
        
        # Remove extra whitespace
        processed = re.sub(r'\s+', ' ', processed)
        
        return processed
    
    def _expand_keywords(self, query: str) -> List[str]:
        """Expand query with synonyms and related terms."""
        words = query.split()
        expanded = set(words)
        
        for word in words:
            # Add synonyms
            for key, synonyms in self.synonyms.items():
                if word in synonyms:
                    expanded.update(synonyms)
        
        return list(expanded)
    
    def _filter_and_rank(
        self,
        items: List[Dict[str, Any]],
        keywords: List[str],
        filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter and rank items based on keywords and filters."""
        # Calculate relevance for each item
        for item in items:
            score = self._calculate_relevance(item, keywords)
            item['search_relevance'] = score
        
        # Sort by relevance
        items.sort(key=lambda x: x.get('search_relevance', 0), reverse=True)
        
        return items
    
    def _calculate_relevance(self, item: Dict[str, Any], keywords: List[str]) -> float:
        """Calculate relevance score for an item."""
        score = 0.0
        
        # Check title/content
        content = str(item.get('content', '')) + str(item.get('title', ''))
        content_lower = content.lower()
        
        for keyword in keywords:
            if keyword.lower() in content_lower:
                score += 0.3
        
        # Boost for exact phrase match
        query_phrase = ' '.join(keywords)
        if query_phrase.lower() in content_lower:
            score += 0.5
        
        # Factor in existing relevance score
        if 'relevance_score' in item:
            score *= item['relevance_score']
        
        return min(score, 1.0)
