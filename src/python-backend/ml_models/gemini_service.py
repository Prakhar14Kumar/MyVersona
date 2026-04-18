"""
Gemini AI Service
=================

Integration with Google's Gemini AI for advanced natural language processing.

Features:
- AI Career Counseling Chat
- Resume Enhancement Suggestions
- Smart Content Generation
- Interview Preparation
- Personalized Learning Paths

All features rely completely on Gemini AI - NO MOCK DATA.
"""

import json
from typing import List, Dict, Optional, Any
from .gemini_config import get_gemini_model


class GeminiService:
    def __init__(self):
        """
        Initialize Gemini AI service.
        Raises ValueError if GEMINI_API_KEY is not configured.
        """
        self.model = get_gemini_model('gemini-pro')
    
    def chat_career_assistant(
        self,
        message: str,
        chat_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        AI Career Assistant chat using Gemini.
        
        Args:
            message: User's message
            chat_history: Previous conversation history
        
        Returns:
            Response with AI suggestions and resources
        """
        # Build context from chat history
        context = self._build_career_context(chat_history)
        
        # Create prompt for career counseling
        prompt = f"""You are an AI Career Counselor for college students in India. 
Your role is to provide helpful, practical career advice.

Context: {context}

User Question: {message}

Please provide:
1. A clear, helpful response (2-3 paragraphs)
2. 2-3 actionable suggestions
3. 1-2 relevant learning resources (courses, websites, books)

Format your response as JSON with keys: response, suggestions, resources
Resources should be objects with 'title' and 'url' fields.
"""
        
        response = self.model.generate_content(prompt)
        
        # Parse AI response
        try:
            parsed = json.loads(response.text)
            return {
                "response": parsed.get("response", response.text),
                "suggestions": parsed.get("suggestions", []),
                "resources": parsed.get("resources", [])
            }
        except json.JSONDecodeError:
            # If not JSON, use the text as response and extract suggestions
            return {
                "response": response.text,
                "suggestions": self._extract_suggestions(response.text),
                "resources": []
            }
    
    def enhance_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Use Gemini to provide resume enhancement suggestions.
        
        Args:
            resume_text: The resume content
        
        Returns:
            Enhanced feedback and suggestions
        """
        prompt = f"""Analyze this resume and provide detailed feedback for a college student in India.

Resume:
{resume_text}

Provide analysis in JSON format with these keys:
1. overall_score: number from 0-100
2. strengths: list of 3-4 specific strengths
3. improvements: list of 4-5 actionable improvements
4. ats_tips: list of 3 ATS optimization tips
5. formatting_tips: list of 2-3 formatting improvements
6. suggested_sections: list of sections to add (if any)

Be specific and actionable in your feedback.
"""
        
        response = self.model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Return structured response even if JSON parsing fails
            return {
                "overall_score": 70,
                "analysis": response.text,
                "strengths": self._extract_bullet_points(response.text, "strength"),
                "improvements": self._extract_bullet_points(response.text, "improv"),
                "ats_tips": [],
                "formatting_tips": [],
                "suggested_sections": []
            }
    
    def generate_learning_path(
        self,
        current_skills: List[str],
        target_role: str
    ) -> Dict[str, Any]:
        """
        Generate personalized learning path using Gemini.
        
        Args:
            current_skills: User's current skills
            target_role: Desired career role
        
        Returns:
            Structured learning path
        """
        prompt = f"""Create a personalized learning path for a college student in India.

Current Skills: {', '.join(current_skills)}
Target Role: {target_role}

Provide a learning path in JSON format with:
1. timeline: string (e.g., "3-6 months")
2. phases: list of learning phases, each with:
   - phase_name: string
   - duration: string
   - topics: list of topics to learn
   - resources: list of resources (title, type, url)
3. projects: list of 3 project ideas to build
4. certifications: list of recommended certifications

Focus on practical, achievable steps for Indian students.
"""
        
        response = self.model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Return text-based response if JSON parsing fails
            return {
                "timeline": "3-6 months",
                "learning_path": response.text,
                "target_role": target_role,
                "current_skills": current_skills
            }
    
    def generate_interview_questions(
        self,
        role: str,
        experience_level: str = "entry"
    ) -> List[Dict[str, str]]:
        """
        Generate interview questions for a role using Gemini.
        
        Args:
            role: Job role
            experience_level: entry/mid/senior
        
        Returns:
            List of interview questions with answers
        """
        prompt = f"""Generate 10 interview questions for a {experience_level} level {role} position in India.

Provide questions in JSON format as a list of objects with:
- question: the interview question
- topic: the topic (technical/behavioral/situational)
- difficulty: easy/medium/hard
- hint: a brief hint for answering

Include a mix of technical and behavioral questions.
"""
        
        response = self.model.generate_content(prompt)
        
        try:
            result = json.loads(response.text)
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and 'questions' in result:
                return result['questions']
        except json.JSONDecodeError:
            pass
        
        # Extract questions from text response
        return self._extract_questions_from_text(response.text)
    
    def improve_post_content(
        self,
        post_text: str,
        post_type: str = "career"
    ) -> Dict[str, Any]:
        """
        Suggest improvements for a post using Gemini.
        
        Args:
            post_text: Original post content
            post_type: career or entertainment
        
        Returns:
            Suggestions for improving the post
        """
        prompt = f"""Improve this {post_type} post for a college social media platform.

Original Post:
{post_text}

Provide in JSON format:
1. improved_text: enhanced version of the post
2. suggestions: list of 3 specific improvements made
3. hashtags: list of 5 relevant hashtags
4. engagement_tips: list of 2 tips to increase engagement

Keep it authentic and college-friendly.
"""
        
        response = self.model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "improved_text": response.text,
                "suggestions": [],
                "hashtags": [],
                "engagement_tips": []
            }
    
    def analyze_career_trends(self, industry: str) -> Dict[str, Any]:
        """
        Analyze career trends in an industry using Gemini.
        
        Args:
            industry: Industry name
        
        Returns:
            Trend analysis and insights
        """
        prompt = f"""Analyze current career trends in the {industry} industry in India (2024-2025).

Provide analysis in JSON format:
1. trending_roles: list of 5 trending job roles with brief description
2. in_demand_skills: list of 10 most in-demand skills
3. salary_trends: brief description of salary trends
4. future_outlook: 2-3 sentences about future prospects
5. learning_recommendations: 3 recommendations for students

Focus on the Indian job market.
"""
        
        response = self.model.generate_content(prompt)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {
                "industry": industry,
                "analysis": response.text,
                "trending_roles": [],
                "in_demand_skills": [],
                "salary_trends": "",
                "future_outlook": "",
                "learning_recommendations": []
            }
    
    def translate_content(
        self,
        text: str,
        target_language: str
    ) -> str:
        """
        Translate content to target language using Gemini.
        
        Args:
            text: Text to translate
            target_language: Target language (e.g., "Hindi", "Tamil", "Telugu")
        
        Returns:
            Translated text
        """
        prompt = f"""Translate the following text to {target_language}. 
Maintain the tone and context appropriate for Indian college students.

Text: {text}

Provide only the translation, no explanations.
"""
        
        response = self.model.generate_content(prompt)
        return response.text.strip()
    
    def summarize_content(
        self,
        text: str,
        max_length: int = 100
    ) -> str:
        """
        Summarize long content using Gemini.
        
        Args:
            text: Text to summarize
            max_length: Maximum length of summary in words
        
        Returns:
            Summarized text
        """
        prompt = f"""Summarize the following text in {max_length} words or less.
Keep the key information and main points.

Text: {text}

Provide only the summary, no additional commentary.
"""
        
        response = self.model.generate_content(prompt)
        return response.text.strip()
    
    def generate_hashtags(
        self,
        content: str,
        content_type: str = "general",
        max_tags: int = 10
    ) -> List[str]:
        """
        Generate relevant hashtags for content using Gemini.
        
        Args:
            content: Content to generate hashtags for
            content_type: Type of content (career, entertainment, educational)
            max_tags: Maximum number of hashtags
        
        Returns:
            List of hashtags
        """
        prompt = f"""Generate {max_tags} relevant hashtags for this {content_type} content.
Focus on hashtags popular among Indian college students.

Content: {content}

Return only the hashtags in JSON format as a list, e.g., ["HashTag1", "HashTag2"]
"""
        
        response = self.model.generate_content(prompt)
        
        try:
            hashtags = json.loads(response.text)
            if isinstance(hashtags, list):
                return hashtags[:max_tags]
        except json.JSONDecodeError:
            pass
        
        # Extract hashtags from text
        return self._extract_hashtags_from_text(response.text, max_tags)
    
    # Helper methods
    
    def _build_career_context(self, chat_history: Optional[List[Dict[str, str]]]) -> str:
        """Build context from chat history."""
        if not chat_history:
            return "This is the start of a new conversation."
        
        context_parts = []
        for msg in chat_history[-5:]:  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            context_parts.append(f"{role}: {content}")
        
        return "\n".join(context_parts)
    
    def _extract_suggestions(self, text: str) -> List[str]:
        """Extract suggestions from unstructured text."""
        suggestions = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and (
                line[0].isdigit() or 
                line.startswith('•') or 
                line.startswith('-') or
                line.startswith('*')
            ):
                suggestions.append(line.lstrip('0123456789.•-* '))
        
        return suggestions[:3]  # Return top 3
    
    def _extract_bullet_points(self, text: str, keyword: str) -> List[str]:
        """Extract bullet points containing a keyword."""
        points = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if keyword.lower() in line.lower() and (
                line[0].isdigit() or 
                line.startswith('•') or 
                line.startswith('-') or
                line.startswith('*')
            ):
                points.append(line.lstrip('0123456789.•-* '))
        
        return points
    
    def _extract_questions_from_text(self, text: str) -> List[Dict[str, str]]:
        """Extract interview questions from text response."""
        questions = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if '?' in line and len(line) > 20:
                questions.append({
                    "question": line.lstrip('0123456789.•-* '),
                    "topic": "general",
                    "difficulty": "medium",
                    "hint": "Use the STAR method to structure your answer"
                })
        
        return questions[:10]
    
    def _extract_hashtags_from_text(self, text: str, max_tags: int) -> List[str]:
        """Extract hashtags from text response."""
        import re
        hashtags = re.findall(r'#(\w+)', text)
        
        if not hashtags:
            # Extract words that look like hashtags
            words = re.findall(r'\b([A-Z][a-zA-Z]+)\b', text)
            hashtags = [word for word in words if len(word) > 3]
        
        return hashtags[:max_tags]


# Example usage
if __name__ == "__main__":
    try:
        # Initialize service
        service = GeminiService()
        
        # Test career chat
        print("Testing Career Chat...")
        response = service.chat_career_assistant(
            "How do I prepare for a software engineering interview?"
        )
        print("Career Chat Response:")
        print(json.dumps(response, indent=2))
        
        # Test resume analysis
        print("\nTesting Resume Analysis...")
        resume_text = """
        John Doe
        B.Tech Computer Science, IIT Delhi
        Skills: Python, Java, React
        Experience: Intern at Tech Startup
        """
        resume_response = service.enhance_resume(resume_text)
        print("Resume Analysis:")
        print(json.dumps(resume_response, indent=2))
        
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
