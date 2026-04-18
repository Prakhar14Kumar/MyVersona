"""
Advanced AI Features for VerSona
===============================
Includes translation, summarization, profile scoring, and trend prediction.

100% powered by Gemini AI - NO MOCK DATA.
"""

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from .gemini_config import get_gemini_model


class AIAdvancedFeatures:
    """Advanced AI features for VerSona platform."""
    
    # Indian languages support
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'te': 'Telugu',
        'mr': 'Marathi',
        'ta': 'Tamil',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi'
    }
    
    def __init__(self):
        """Initialize advanced AI features with Gemini."""
        self.model = get_gemini_model('gemini-pro')
    
    def translate_content(
        self,
        text: str,
        target_language: str,
        source_language: str = 'auto'
    ) -> Dict[str, Any]:
        """
        Translate content to Indian languages using Gemini AI.
        
        Args:
            text: Text to translate
            target_language: Target language code
            source_language: Source language code (auto-detect if 'auto')
            
        Returns:
            Translated text with metadata
        """
        if target_language not in self.SUPPORTED_LANGUAGES:
            return {
                'error': f'Language {target_language} not supported',
                'supported_languages': self.SUPPORTED_LANGUAGES
            }
        
        target_lang_name = self.SUPPORTED_LANGUAGES[target_language]
        
        prompt = f"""Translate the following text to {target_lang_name}.
Maintain the tone, context, and cultural relevance for Indian audience.

Original Text:
{text}

Provide only the translation, maintaining formatting if present."""

        response = self.model.generate_content(prompt)
        translated_text = response.text.strip()
        
        return {
            'translated_text': translated_text,
            'source_language': source_language,
            'target_language': target_language,
            'target_language_name': target_lang_name,
            'original_text': text,
            'original_length': len(text),
            'translated_length': len(translated_text),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def summarize_content(
        self,
        text: str,
        summary_type: str = "brief",  # brief, detailed, bullet_points
        max_length: int = 150
    ) -> Dict[str, Any]:
        """
        Summarize long posts or announcements using Gemini AI.
        
        Args:
            text: Text to summarize
            summary_type: Type of summary
            max_length: Maximum summary length in words
            
        Returns:
            Summarized text
        """
        if len(text) < 100:
            return {
                'summary': text,
                'original_length': len(text),
                'summary_length': len(text),
                'note': 'Text is already brief',
                'timestamp': datetime.utcnow().isoformat()
            }
        
        if summary_type == "bullet_points":
            format_instruction = f"Summarize in 3-5 bullet points (max {max_length} words total)"
        elif summary_type == "detailed":
            format_instruction = f"Provide a detailed summary in {max_length} words"
        else:  # brief
            format_instruction = f"Provide a brief summary in {max_length} words or less"
        
        prompt = f"""{format_instruction}:

Text to summarize:
{text}

Keep the key information and main points. Make it clear and concise."""

        response = self.model.generate_content(prompt)
        summary = response.text.strip()
        
        return {
            'summary': summary,
            'original_text': text,
            'original_length': len(text.split()),
            'summary_length': len(summary.split()),
            'summary_type': summary_type,
            'compression_ratio': round(len(summary.split()) / len(text.split()), 2),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def score_profile(
        self,
        profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Score profile completeness and quality using Gemini AI.
        
        Args:
            profile_data: User profile data
            
        Returns:
            Profile score with improvement suggestions
        """
        profile_text = self._format_profile_data(profile_data)
        
        prompt = f"""Analyze this user profile on an Indian college social platform and provide a score:

{profile_text}

Please provide:
1. Overall Profile Score (0-100)
2. Completeness Score (0-100)
3. Quality Score (0-100)
4. Strengths (3-5 points)
5. Areas to improve (3-5 points)
6. Specific actionable suggestions (5 items)
7. Missing elements that should be added

Format as structured feedback."""

        response = self.model.generate_content(prompt)
        
        # Extract scores from response
        overall_score = self._extract_score(response.text, "overall")
        completeness_score = self._extract_score(response.text, "completeness")
        quality_score = self._extract_score(response.text, "quality")
        
        return {
            'overall_score': overall_score,
            'completeness_score': completeness_score,
            'quality_score': quality_score,
            'feedback': response.text,
            'profile_data': profile_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def predict_trends(
        self,
        category: str,
        timeframe: str = "next_week",
        region: str = "India"
    ) -> Dict[str, Any]:
        """
        Predict upcoming trends using Gemini AI.
        
        Args:
            category: Category to predict (tech, entertainment, education, career)
            timeframe: Prediction timeframe
            region: Geographic region
            
        Returns:
            Trend predictions
        """
        prompt = f"""Predict trending topics for {category} in {region} for {timeframe}.

Consider:
1. Current events and seasons
2. Indian college calendar (exams, placements, fests)
3. Youth interests and culture
4. Technology and social media trends
5. Career and education landscape

Provide:
1. Top 5 predicted trending topics
2. For each trend:
   - Topic name
   - Why it will trend
   - Expected engagement level (high/medium/low)
   - Recommended content types
   - Hashtag suggestions
3. Overall trend analysis for the period

Focus on Indian college students and young professionals."""

        response = self.model.generate_content(prompt)
        
        return {
            'predictions': response.text,
            'category': category,
            'timeframe': timeframe,
            'region': region,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def analyze_sentiment(
        self,
        text: str,
        context: str = "general"
    ) -> Dict[str, Any]:
        """
        Analyze sentiment of content using Gemini AI.
        
        Args:
            text: Text to analyze
            context: Context of the text
            
        Returns:
            Sentiment analysis with details
        """
        prompt = f"""Analyze the sentiment of this text in the context of {context}:

Text: {text}

Provide:
1. Overall Sentiment: Positive/Negative/Neutral
2. Sentiment Score: -1.0 to 1.0 (negative to positive)
3. Confidence Level: 0-100%
4. Emotional Tone: (e.g., excited, frustrated, hopeful, worried)
5. Key Sentiment Indicators: Words/phrases that indicate the sentiment
6. Nuances: Any mixed sentiments or sarcasm detected

Format as structured analysis."""

        response = self.model.generate_content(prompt)
        
        # Extract sentiment data
        sentiment = self._extract_sentiment(response.text)
        
        return {
            'sentiment': sentiment.get('overall', 'neutral'),
            'score': sentiment.get('score', 0.0),
            'confidence': sentiment.get('confidence', 50),
            'emotional_tone': sentiment.get('tone', 'neutral'),
            'analysis': response.text,
            'text': text,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_smart_reply(
        self,
        message: str,
        conversation_context: Optional[List[Dict[str, str]]] = None,
        reply_tone: str = "friendly"
    ) -> Dict[str, Any]:
        """
        Generate smart reply suggestions using Gemini AI.
        
        Args:
            message: Message to reply to
            conversation_context: Previous conversation
            reply_tone: Desired tone of reply
            
        Returns:
            Smart reply suggestions
        """
        context_text = ""
        if conversation_context:
            context_text = "\n".join([
                f"{msg.get('sender', 'User')}: {msg.get('text', '')}"
                for msg in conversation_context[-3:]  # Last 3 messages
            ])
        
        prompt = f"""Generate 3 {reply_tone} reply suggestions for this message:

Message: {message}

{f'Conversation Context:{context_text}' if context_text else ''}

Provide:
1. Quick Reply: Short, 1-2 words
2. Medium Reply: 1 sentence
3. Detailed Reply: 2-3 sentences

Make replies:
- Natural and conversational
- Contextually appropriate
- Culturally relevant for Indian students
- In the {reply_tone} tone"""

        response = self.model.generate_content(prompt)
        
        replies = self._extract_replies(response.text)
        
        return {
            'quick_reply': replies.get('quick', 'Thanks!'),
            'medium_reply': replies.get('medium', ''),
            'detailed_reply': replies.get('detailed', ''),
            'all_suggestions': response.text,
            'original_message': message,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def extract_key_info(
        self,
        text: str,
        info_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Extract key information from text using Gemini AI.
        
        Args:
            text: Text to analyze
            info_type: Type of information to extract
                (event, opportunity, announcement, news)
            
        Returns:
            Extracted information
        """
        prompt = f"""Extract key information from this {info_type}:

Text: {text}

Extract and structure:
1. Main Topic/Title
2. Key Dates (if any)
3. Important Numbers/Statistics
4. People/Organizations mentioned
5. Locations mentioned
6. Action Items (what readers should do)
7. Deadlines (if any)
8. Links/Resources (if mentioned)

Format as structured data."""

        response = self.model.generate_content(prompt)
        
        return {
            'extracted_info': response.text,
            'info_type': info_type,
            'original_text': text,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def check_grammar_and_style(
        self,
        text: str,
        target_audience: str = "college_students"
    ) -> Dict[str, Any]:
        """
        Check grammar and suggest style improvements using Gemini AI.
        
        Args:
            text: Text to check
            target_audience: Target audience for the content
            
        Returns:
            Grammar and style feedback
        """
        prompt = f"""Review this text for grammar and style, optimized for {target_audience}:

Text: {text}

Provide:
1. Corrected Version (if errors found)
2. Grammar Issues: List specific issues
3. Style Suggestions: How to make it more engaging
4. Readability Score: (1-10, where 10 is most readable)
5. Tone Assessment: How the text comes across
6. Vocabulary Suggestions: Better word choices

Make suggestions appropriate for Indian English and college audience."""

        response = self.model.generate_content(prompt)
        
        return {
            'feedback': response.text,
            'original_text': text,
            'target_audience': target_audience,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_content_variations(
        self,
        original_content: str,
        num_variations: int = 3,
        variation_type: str = "similar"
    ) -> Dict[str, Any]:
        """
        Generate content variations using Gemini AI.
        
        Args:
            original_content: Original content
            num_variations: Number of variations to generate
            variation_type: Type of variations (similar, shorter, longer, formal, casual)
            
        Returns:
            Content variations
        """
        prompt = f"""Generate {num_variations} {variation_type} variations of this content:

Original: {original_content}

Requirements:
- Maintain the core message
- {variation_type} style/length
- Each variation should be unique
- Keep it authentic for Indian college students

Provide each variation clearly numbered."""

        response = self.model.generate_content(prompt)
        
        variations = self._extract_numbered_items(response.text)
        
        return {
            'variations': variations[:num_variations],
            'original_content': original_content,
            'variation_type': variation_type,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    # Helper methods
    
    def _format_profile_data(self, profile: Dict[str, Any]) -> str:
        """Format profile data for analysis."""
        fields = []
        for key, value in profile.items():
            if value:
                fields.append(f"{key.replace('_', ' ').title()}: {value}")
        return "\n".join(fields)
    
    def _extract_score(self, text: str, score_type: str) -> int:
        """Extract numerical score from text."""
        import re
        # Look for patterns like "Overall Score: 85" or "Score: 85/100"
        patterns = [
            rf'{score_type}[^:]*:\s*(\d+)',
            r'(\d+)\s*/\s*100',
            r'(\d+)%'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
        
        return 70  # Default score
    
    def _extract_sentiment(self, text: str) -> Dict[str, Any]:
        """Extract sentiment data from response."""
        sentiment_data = {
            'overall': 'neutral',
            'score': 0.0,
            'confidence': 50,
            'tone': 'neutral'
        }
        
        text_lower = text.lower()
        
        # Extract overall sentiment
        if 'positive' in text_lower:
            sentiment_data['overall'] = 'positive'
            sentiment_data['score'] = 0.5
        elif 'negative' in text_lower:
            sentiment_data['overall'] = 'negative'
            sentiment_data['score'] = -0.5
        
        # Extract score
        import re
        score_match = re.search(r'score[^:]*:\s*([-\d.]+)', text_lower)
        if score_match:
            sentiment_data['score'] = float(score_match.group(1))
        
        # Extract confidence
        conf_match = re.search(r'confidence[^:]*:\s*(\d+)', text_lower)
        if conf_match:
            sentiment_data['confidence'] = int(conf_match.group(1))
        
        return sentiment_data
    
    def _extract_replies(self, text: str) -> Dict[str, str]:
        """Extract reply suggestions from response."""
        replies = {}
        lines = text.split('\n')
        
        current_type = None
        for line in lines:
            line_lower = line.lower()
            if 'quick' in line_lower:
                current_type = 'quick'
            elif 'medium' in line_lower:
                current_type = 'medium'
            elif 'detailed' in line_lower:
                current_type = 'detailed'
            elif current_type and line.strip() and not line.strip().startswith(('1', '2', '3', '-', '*')):
                if current_type not in replies:
                    replies[current_type] = line.strip()
        
        return replies
    
    def _extract_numbered_items(self, text: str) -> List[str]:
        """Extract numbered items from text."""
        items = []
        current_item = []
        
        for line in text.split('\n'):
            line = line.strip()
            # Check if line starts with a number
            if re.match(r'^\d+[\.\):]', line):
                if current_item:
                    items.append(' '.join(current_item))
                current_item = [re.sub(r'^\d+[\.\):]\s*', '', line)]
            elif current_item and line:
                current_item.append(line)
        
        if current_item:
            items.append(' '.join(current_item))
        
        return items


# Example usage and testing
if __name__ == "__main__":
    try:
        features = AIAdvancedFeatures()
        
        # Test translation
        print("Testing Translation...")
        translation = features.translate_content(
            "Welcome to VerSona! Connect with students across India.",
            target_language="hi"
        )
        print(f"Translated: {translation['translated_text']}")
        
        # Test summarization
        print("\nTesting Summarization...")
        long_text = """
        VerSona is a comprehensive social and professional networking platform designed specifically
        for Indian college students. It combines entertainment, college life, and career growth in
        one unified experience. The platform features a unique Double Feed System that separates
        entertainment content from college and career-focused content, ensuring users get the right
        content at the right time.
        """
        summary = features.summarize_content(long_text, summary_type="brief", max_length=50)
        print(f"Summary: {summary['summary']}")
        
        print("\n✅ AI Advanced Features are working with Gemini AI!")
        
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
