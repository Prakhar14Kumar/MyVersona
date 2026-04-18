"""
AI Content Creation Tools for VerSona
====================================
Auto-generates captions, hashtags, meme ideas, thumbnails suggestions.
Helps users create engaging content.

100% powered by Gemini AI - NO MOCK DATA.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from .gemini_config import get_gemini_model


class AIContentTools:
    """AI tools for content creation assistance."""
    
    def __init__(self):
        """Initialize AI content tools with Gemini."""
        self.model = get_gemini_model('gemini-pro')
    
    def generate_caption(
        self,
        image_description: Optional[str] = None,
        content_type: str = "post",
        tone: str = "casual",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate engaging captions for posts.
        
        Args:
            image_description: Description of image/video
            content_type: Type of content (post, story, reel)
            tone: Desired tone (casual, professional, funny, motivational)
            context: Additional context
            
        Returns:
            Generated caption with variations
        """
        context_text = ""
        if context:
            context_text = f"\nContext: {context.get('details', '')}"
        
        image_text = f"Image/Video: {image_description}" if image_description else "No specific image description"
        
        prompt = f"""Generate an engaging {tone} caption for a {content_type} on an Indian college social media platform.

{image_text}
{context_text}

Please provide:
1. A main caption (2-3 sentences)
2. 3 alternative caption variations
3. 5 relevant emojis to use
4. Suggested call-to-action

Make it authentic and relatable for Indian college students."""

        response = self.model.generate_content(prompt)
        
        # Parse response or return as is
        caption_text = response.text
        
        return {
            'main_caption': self._extract_main_caption(caption_text),
            'alternatives': self._extract_alternatives(caption_text),
            'emojis': self._extract_emojis(caption_text),
            'cta': self._extract_cta(caption_text),
            'full_response': caption_text,
            'tone': tone,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_hashtags(
        self,
        content: str,
        category: str = "general",
        count: int = 10
    ) -> Dict[str, Any]:
        """
        Generate relevant hashtags for content using Gemini AI.
        
        Args:
            content: Post content/description
            category: Content category
            count: Number of hashtags to generate
            
        Returns:
            List of hashtags with relevance information
        """
        prompt = f"""Generate {count} relevant hashtags for this {category} content on an Indian college social media platform.

Content: {content}

Requirements:
1. Mix of specific and general hashtags
2. Include trending hashtags relevant to Indian college students
3. Use hashtags that increase discoverability
4. Consider both English and Hinglish style

Provide hashtags in a list format, one per line, starting with #"""

        response = self.model.generate_content(prompt)
        
        # Extract hashtags from response
        hashtags = self._extract_hashtags_from_text(response.text)
        
        return {
            'hashtags': hashtags[:count],
            'recommended_count': min(count, 10),
            'category': category,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def suggest_post_improvements(
        self,
        content: str,
        post_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Suggest improvements to make a post more engaging.
        
        Args:
            content: Original post content
            post_type: Type of post (career, entertainment, educational)
            
        Returns:
            Improvement suggestions
        """
        prompt = f"""Analyze this {post_type} post and suggest improvements:

Original Post:
{content}

Please provide:
1. Improved version of the post
2. 3 specific improvements made
3. Engagement tips
4. Optimal posting time suggestion
5. Content structure feedback

Focus on making it more engaging for Indian college students."""

        response = self.model.generate_content(prompt)
        
        return {
            'suggestions': response.text,
            'original_content': content,
            'post_type': post_type,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_poll_options(
        self,
        topic: str,
        num_options: int = 4
    ) -> Dict[str, Any]:
        """
        Generate poll options for a given topic.
        
        Args:
            topic: Poll topic
            num_options: Number of options to generate
            
        Returns:
            Poll options with descriptions
        """
        prompt = f"""Create a poll about: {topic}

Generate {num_options} poll options that are:
1. Distinct and clear
2. Relevant to Indian college students
3. Balanced and fair
4. Engaging and thought-provoking

For each option provide:
- Option text (keep it concise)
- Brief reasoning why it's included

Also suggest:
- Poll question (if not clear from topic)
- Expected insights from results"""

        response = self.model.generate_content(prompt)
        
        return {
            'poll_data': response.text,
            'topic': topic,
            'num_options': num_options,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_thread_ideas(
        self,
        main_topic: str,
        thread_length: int = 5
    ) -> Dict[str, Any]:
        """
        Generate a content thread/series on a topic.
        
        Args:
            main_topic: Main topic for the thread
            thread_length: Number of posts in thread
            
        Returns:
            Thread outline with post ideas
        """
        prompt = f"""Create a {thread_length}-post thread about: {main_topic}

For Indian college students, create an engaging thread where:
1. Each post builds on the previous
2. Content is informative and valuable
3. Posts are concise and shareable
4. Includes hooks to keep audience engaged

For each post provide:
- Main message
- Key points (2-3 bullets)
- Hook/engaging element
- Visual suggestion (if any)"""

        response = self.model.generate_content(prompt)
        
        return {
            'thread_outline': response.text,
            'main_topic': main_topic,
            'thread_length': thread_length,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_meme_ideas(
        self,
        context: str,
        meme_style: str = "relatable"
    ) -> Dict[str, Any]:
        """
        Generate meme ideas based on context.
        
        Args:
            context: Context or situation for meme
            meme_style: Style of meme (relatable, funny, sarcastic, motivational)
            
        Returns:
            Meme ideas with template suggestions
        """
        prompt = f"""Generate 5 {meme_style} meme ideas for Indian college students about: {context}

For each meme idea provide:
1. Meme concept/setup
2. Suggested popular meme template to use
3. Text overlay suggestions (top and bottom text if applicable)
4. Why it would resonate with college students

Make them authentic and relevant to Indian college culture."""

        response = self.model.generate_content(prompt)
        
        return {
            'meme_ideas': response.text,
            'context': context,
            'style': meme_style,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def suggest_content_calendar(
        self,
        profile_type: str,
        duration_days: int = 7
    ) -> Dict[str, Any]:
        """
        Create a content calendar for consistent posting.
        
        Args:
            profile_type: Type of profile (student, creator, college_club, career_coach)
            duration_days: Duration for calendar
            
        Returns:
            Content calendar with post ideas
        """
        prompt = f"""Create a {duration_days}-day content calendar for a {profile_type} on VerSona (Indian college social platform).

For each day provide:
1. Post type (image, video, poll, text, etc.)
2. Topic/theme
3. Content idea
4. Best time to post
5. Expected engagement goal
6. Hashtag suggestions

Balance between:
- Educational/valuable content
- Entertaining content
- Engagement-focused content
- Community building

Make it practical and achievable for Indian college context."""

        response = self.model.generate_content(prompt)
        
        return {
            'calendar': response.text,
            'profile_type': profile_type,
            'duration_days': duration_days,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def analyze_content_performance(
        self,
        post_content: str,
        engagement_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze why content performed well or poorly.
        
        Args:
            post_content: The post content
            engagement_metrics: Engagement data (likes, comments, shares, views)
            
        Returns:
            Performance analysis and insights
        """
        metrics_text = f"""
        - Likes: {engagement_metrics.get('likes', 0)}
        - Comments: {engagement_metrics.get('comments', 0)}
        - Shares: {engagement_metrics.get('shares', 0)}
        - Views: {engagement_metrics.get('views', 0)}
        """
        
        prompt = f"""Analyze the performance of this post:

Post Content:
{post_content}

Engagement Metrics:
{metrics_text}

Please provide:
1. Performance assessment (excellent/good/average/poor)
2. What worked well (3 points)
3. What could be improved (3 points)
4. Specific recommendations for future posts
5. Optimal posting strategy based on this data

Context: Indian college social media platform"""

        response = self.model.generate_content(prompt)
        
        return {
            'analysis': response.text,
            'metrics': engagement_metrics,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_bio(
        self,
        profile_info: Dict[str, Any],
        bio_style: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate engaging profile bio.
        
        Args:
            profile_info: User's profile information
            bio_style: Style of bio (professional, casual, creative, minimal)
            
        Returns:
            Generated bio variations
        """
        info_text = "\n".join([f"- {k}: {v}" for k, v in profile_info.items()])
        
        prompt = f"""Create a {bio_style} bio for a profile on VerSona (Indian college platform):

Profile Information:
{info_text}

Generate:
1. Main bio (150 characters max)
2. 2 alternative bio variations
3. Emoji suggestions
4. Link suggestions (if applicable)

Make it:
- Authentic and relatable
- Memorable
- Clear about what the profile is about
- Optimized for Indian college audience"""

        response = self.model.generate_content(prompt)
        
        return {
            'bio_suggestions': response.text,
            'style': bio_style,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    # Helper methods for parsing AI responses
    
    def _extract_main_caption(self, text: str) -> str:
        """Extract main caption from AI response."""
        lines = text.split('\n')
        for line in lines:
            if line.strip() and not line.startswith(('#', '-', '*', '1.', '2.', '3.')):
                return line.strip()
        return text.split('\n')[0] if text else ""
    
    def _extract_alternatives(self, text: str) -> List[str]:
        """Extract alternative captions."""
        alternatives = []
        in_alternatives_section = False
        
        for line in text.split('\n'):
            line = line.strip()
            if 'alternative' in line.lower() or 'variation' in line.lower():
                in_alternatives_section = True
                continue
            
            if in_alternatives_section and line and (line.startswith(('-', '*', '•')) or line[0].isdigit()):
                cleaned = re.sub(r'^[\d\-\*\•\.\)]+\s*', '', line)
                if cleaned:
                    alternatives.append(cleaned)
        
        return alternatives[:3]
    
    def _extract_emojis(self, text: str) -> List[str]:
        """Extract emoji suggestions."""
        emoji_pattern = r'[😀-🙏🌀-🗿🚀-🛿]'
        emojis = re.findall(emoji_pattern, text)
        return list(set(emojis))[:5]
    
    def _extract_cta(self, text: str) -> str:
        """Extract call-to-action."""
        for line in text.split('\n'):
            if 'call-to-action' in line.lower() or 'cta' in line.lower():
                # Get the next line
                idx = text.split('\n').index(line)
                if idx + 1 < len(text.split('\n')):
                    return text.split('\n')[idx + 1].strip()
        return ""
    
    def _extract_hashtags_from_text(self, text: str) -> List[str]:
        """Extract hashtags from text response."""
        hashtags = []
        
        # Find lines with hashtags
        for line in text.split('\n'):
            line = line.strip()
            # Match hashtags
            found_tags = re.findall(r'#[\w]+', line)
            hashtags.extend(found_tags)
            
            # Also check for words that should be hashtags
            if line.startswith(('-', '*', '•', '1', '2', '3', '4', '5', '6', '7', '8', '9')):
                words = re.sub(r'^[\d\-\*\•\.\)]+\s*', '', line).strip()
                if words and not words.startswith('#'):
                    # Convert to hashtag
                    hashtag = '#' + words.replace(' ', '').replace(',', '')
                    if hashtag not in hashtags and len(hashtag) > 2:
                        hashtags.append(hashtag)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_hashtags = []
        for tag in hashtags:
            if tag.lower() not in seen:
                seen.add(tag.lower())
                unique_hashtags.append(tag)
        
        return unique_hashtags


# Example usage and testing
if __name__ == "__main__":
    try:
        tools = AIContentTools()
        
        # Test caption generation
        print("Testing Caption Generation...")
        caption = tools.generate_caption(
            image_description="Group photo at college fest",
            tone="fun",
            context={"details": "Annual cultural fest"}
        )
        print(f"Main Caption: {caption['main_caption']}")
        
        # Test hashtag generation
        print("\nTesting Hashtag Generation...")
        hashtags = tools.generate_hashtags(
            content="Just got placed at a great company! Dream come true 🎉",
            category="career",
            count=8
        )
        print(f"Generated Hashtags: {hashtags['hashtags']}")
        
        print("\n✅ AI Content Tools are working with Gemini AI!")
        
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
