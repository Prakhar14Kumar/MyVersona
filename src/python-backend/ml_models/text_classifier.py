"""
Text Classifier
===============

Classifies posts as entertainment or career content.
Also provides sentiment analysis and hashtag suggestions.

For production:
- Fine-tune BERT on labeled college social media posts
- Implement multi-label classification
- Add trending hashtag detection
"""

from typing import Dict, List
import re


class TextClassifier:
    def __init__(self):
        """Initialize text classifier."""
        
        self.career_keywords = [
            'job', 'career', 'internship', 'placement', 'interview', 'resume',
            'hiring', 'skills', 'linkedin', 'salary', 'professional', 'portfolio',
            'networking', 'mentor', 'workshop', 'certification', 'training'
        ]
        
        self.entertainment_keywords = [
            'fun', 'party', 'event', 'fest', 'movie', 'music', 'game', 'meme',
            'concert', 'show', 'performance', 'competition', 'sports', 'club',
            'hangout', 'weekend', 'celebrate', 'enjoy', 'social'
        ]
        
        self.hashtag_templates = {
            'career': [
                '#CareerGoals', '#JobHunt', '#Placement', '#Internship',
                '#SkillDevelopment', '#Professional', '#CareerTips'
            ],
            'entertainment': [
                '#CollegeFest', '#CampusLife', '#StudentLife', '#Fun',
                '#CollegeEvents', '#Entertainment', '#CampusDiaries'
            ],
            'general': [
                '#College', '#Student', '#Campus', '#Education', '#University'
            ]
        }
    
    def categorize(self, text: str) -> Dict:
        """
        Categorize text as entertainment or career.
        
        Args:
            text: Post text
        
        Returns:
            Dictionary with category, confidence, and keywords
        """
        text_lower = text.lower()
        
        # Count keyword matches
        career_score = sum(1 for kw in self.career_keywords if kw in text_lower)
        entertainment_score = sum(1 for kw in self.entertainment_keywords if kw in text_lower)
        
        # Determine category
        if career_score > entertainment_score:
            category = 'career'
            confidence = min(0.6 + (career_score * 0.08), 0.95)
            keywords = [kw for kw in self.career_keywords if kw in text_lower]
        elif entertainment_score > career_score:
            category = 'entertainment'
            confidence = min(0.6 + (entertainment_score * 0.08), 0.95)
            keywords = [kw for kw in self.entertainment_keywords if kw in text_lower]
        else:
            # Default to entertainment with lower confidence
            category = 'entertainment'
            confidence = 0.5
            keywords = []
        
        return {
            'category': category,
            'confidence': round(confidence, 2),
            'keywords': keywords[:5]
        }
    
    def suggest_hashtags(self, text: str) -> List[str]:
        """
        Suggest relevant hashtags for a post.
        
        Args:
            text: Post text
        
        Returns:
            List of suggested hashtags
        """
        # Categorize the post first
        category_result = self.categorize(text)
        category = category_result['category']
        
        # Start with category-specific hashtags
        suggestions = self.hashtag_templates[category][:3].copy()
        
        # Add general hashtags
        suggestions.extend(self.hashtag_templates['general'][:2])
        
        # Add context-specific hashtags based on keywords
        text_lower = text.lower()
        
        if 'coding' in text_lower or 'programming' in text_lower:
            suggestions.append('#Coding')
        if 'placement' in text_lower:
            suggestions.append('#Placements2024')
        if 'tech' in text_lower:
            suggestions.append('#TechLife')
        if 'fest' in text_lower or 'festival' in text_lower:
            suggestions.append('#CollegeFest')
        if 'exam' in text_lower:
            suggestions.append('#ExamSeason')
        if 'startup' in text_lower:
            suggestions.append('#Entrepreneurship')
        
        # Remove duplicates and limit to 6
        seen = set()
        unique_suggestions = []
        for tag in suggestions:
            if tag not in seen:
                seen.add(tag)
                unique_suggestions.append(tag)
        
        return unique_suggestions[:6]
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment of text.
        
        For production: Use BERT-based sentiment model
        
        Args:
            text: Text to analyze
        
        Returns:
            Dictionary with sentiment and score
        """
        text_lower = text.lower()
        
        # Simple keyword-based sentiment (replace with ML model)
        positive_words = [
            'great', 'awesome', 'excellent', 'amazing', 'love', 'best',
            'happy', 'excited', 'wonderful', 'fantastic', 'perfect'
        ]
        
        negative_words = [
            'bad', 'terrible', 'worst', 'hate', 'awful', 'horrible',
            'disappointed', 'poor', 'sad', 'angry', 'frustrated'
        ]
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = 'positive'
            score = min(0.6 + (positive_count * 0.1), 0.95)
        elif negative_count > positive_count:
            sentiment = 'negative'
            score = min(0.6 + (negative_count * 0.1), 0.95)
        else:
            sentiment = 'neutral'
            score = 0.5
        
        # Detect emotions
        emotions = []
        if any(word in text_lower for word in ['excited', 'happy', 'joy']):
            emotions.append('joy')
        if any(word in text_lower for word in ['nervous', 'anxious', 'worried']):
            emotions.append('anxiety')
        if any(word in text_lower for word in ['motivated', 'inspired', 'determined']):
            emotions.append('motivation')
        
        return {
            'sentiment': sentiment,
            'score': round(score, 2),
            'emotions': emotions if emotions else None
        }


# Example usage
if __name__ == "__main__":
    classifier = TextClassifier()
    
    # Test categorization
    career_post = "Just got selected for a software engineering internship at Google! Tips for interview prep?"
    entertainment_post = "College fest this weekend! Who's excited for the concert? 🎵"
    
    print("Career Post:")
    print(classifier.categorize(career_post))
    print("Hashtags:", classifier.suggest_hashtags(career_post))
    print()
    
    print("Entertainment Post:")
    print(classifier.categorize(entertainment_post))
    print("Hashtags:", classifier.suggest_hashtags(entertainment_post))
