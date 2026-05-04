import google.generativeai as genai
from typing import Optional, List
from config import settings
import os
import lightgbm as lgb

class AIService:
    """AI service for career assistance, content moderation, and recommendations"""
    
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None
            
        # Load LightGBM connection ranker model
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "connection_ranker.txt")
        try:
            self.lgb_ranker = lgb.Booster(model_file=model_path)
        except Exception as e:
            print(f"Failed to load LightGBM model: {e}")
            self.lgb_ranker = None
    
    async def get_career_advice(self, query: str, user_context: Optional[dict] = None) -> str:
        """Get career advice from AI"""
        if not self.model:
            return "AI service is not configured. Please add GEMINI_API_KEY to your environment."
        
        try:
            context = ""
            if user_context:
                context = f"""
User Context:
- College: {user_context.get('college_name', 'N/A')}
- Branch: {user_context.get('branch', 'N/A')}
- Year: {user_context.get('year', 'N/A')}
- Skills: {', '.join(user_context.get('skills', []))}
- Interests: {', '.join(user_context.get('interests', []))}
"""
            
            prompt = f"""You are a career counselor and mentor for college students in India. 
Provide helpful, practical, and encouraging advice.

{context}

Student Query: {query}

Please provide a detailed and actionable response."""
            
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"AI service error: {e}")
            return "Sorry, I'm having trouble processing your request right now. Please try again later."
    
    async def moderate_content(self, content: str) -> dict:
        """Moderate content for spam, hate speech, etc."""
        if not self.model:
            return {"is_appropriate": True, "reason": None, "category": None, "confidence": None, "flagged": False}
        
        try:
            prompt = f"""Analyze the following content for policy violations:

Content Moderation Rules:
1. Hate speech, racism, or discrimination
2. Spam or promotional content
3. NSFW or sexually explicit content
4. Violence or threats
5. Personal information (PII)
6. Scams or fraud

Content: {content}

Respond in this EXACT format:
SAFE: yes/no
CATEGORY: hate/spam/nsfw/violence/pii/fraud/none
CONFIDENCE: high/medium/low
REASON: brief explanation (or "none" if safe)"""
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            lines = [line.strip() for line in result_text.split("\n") if line.strip()]
            
            # Safe defaults
            is_safe = True
            category = "none"
            confidence = "low"
            reason = None

            # Defensive parsing
            for line in lines:
                lower_line = line.lower()
                if lower_line.startswith("safe:"):
                    is_safe = "yes" in lower_line
                elif lower_line.startswith("category:"):
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        category = parts[1].strip().lower()
                elif lower_line.startswith("confidence:"):
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        confidence = parts[1].strip().lower()
                elif lower_line.startswith("reason:"):
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        reason = parts[1].strip()
                        if reason.lower() == "none":
                            reason = None
            
            return {
                "is_appropriate": is_safe,
                "reason": reason if not is_safe else None,
                "category": category if not is_safe else None,
                "confidence": confidence,
                "flagged": not is_safe
            }
        except Exception as e:
            print(f"Content moderation error: {e}")
            # Fallback: allow content completely without undocumented error keys
            return {
                "is_appropriate": True,
                "reason": None,
                "category": None,
                "confidence": None,
                "flagged": False
            }
    
    async def generate_hashtags(self, content: str, max_tags: int = 5) -> List[str]:
        """Generate relevant hashtags for content"""
        if not self.model:
            return []
        
        try:
            prompt = f"""Generate {max_tags} relevant hashtags for this post.
Focus on Indian college students, trending topics, and career-related keywords.

Content: {content}

Return only the hashtags, one per line, starting with #"""
            
            response = self.model.generate_content(prompt)
            hashtags = [line.strip() for line in response.text.strip().split("\n") if line.strip().startswith("#")]
            
            return hashtags[:max_tags]
        except Exception as e:
            print(f"Hashtag generation error: {e}")
            return []
    
    async def parse_resume(self, resume_text: str) -> dict:
        """Parse resume and extract key information"""
        if not self.model:
            return {}
        
        try:
            prompt = f"""Extract the following information from this resume:
- Skills (list)
- Education (degree, college, year)
- Experience (company, role, duration)
- Projects (name, description)

Resume:
{resume_text}

Format the response as JSON."""
            
            response = self.model.generate_content(prompt)
            # In production, parse the JSON response properly
            return {"raw_response": response.text}
        except Exception as e:
            print(f"Resume parsing error: {e}")
            return {}
    
    async def recommend_connections(self, user_profile: dict, potential_connections: List[dict]) -> List[str]:
        """Recommend connections based on user profile using LightGBM ranker"""
        if not potential_connections:
            return []
            
        if not getattr(self, 'lgb_ranker', None):
            # Fallback if model isn't loaded
            return [conn["uid"] for conn in potential_connections[:5]]
            
        try:
            user_college = user_profile.get('college_name', '')
            user_branch = user_profile.get('branch', '')
            user_skills = set(user_profile.get('skills', []))
            user_interests = set(user_profile.get('interests', []))
            
            features = []
            for conn in potential_connections:
                same_college = 1 if user_college and user_college == conn.get('college_name', '') else 0
                same_branch = 1 if user_branch and user_branch == conn.get('branch', '') else 0
                shared_skills = len(user_skills & set(conn.get('skills', [])))
                shared_interests = len(user_interests & set(conn.get('interests', [])))
                features.append([same_college, same_branch, shared_skills, shared_interests])
                
            # Predict scores using LightGBM
            scores = self.lgb_ranker.predict(features)
            
            # Pair connections with scores and sort descending
            scored_connections = list(zip(potential_connections, scores))
            scored_connections.sort(key=lambda x: x[1], reverse=True)
            
            # Return top 5 UIDs
            top_connections = [conn[0]["uid"] for conn in scored_connections[:5]]
            return top_connections
            
        except Exception as e:
            print(f"Connection recommendation error (LightGBM): {e}")
            return [conn["uid"] for conn in potential_connections[:5]]

    async def rewrite_professional(self, content: str) -> str:
        """Rewrite a message in a formal and professional tone"""
        if not self.model:
            return content
        try:
            prompt = f"Rewrite the following message in a formal, polite, and highly professional tone suitable for a professional networking setting or mentor chat. Do not add conversational filler like 'Here is the rewrite', just return the rewritten text directly:\n\n{content}"
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Rewrite error: {e}")
            return content

    async def improve_message(self, content: str) -> str:
        """Improve message grammar and clarity"""
        if not self.model:
            return content
        try:
            prompt = f"Fix any grammatical errors, clear up ambiguities, and improve the general flow of the following message while keeping the original casual or professional tone intact. Return only the improved text:\n\n{content}"
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Improve error: {e}")
            return content

    async def ask_ai_assistant(self, query: str) -> str:
        """Ask the AI assistant a general question or career/resume help"""
        if not self.model:
            return "AI service is not configured. Please add GEMINI_API_KEY to your environment."
        try:
            prompt = f"You are a helpful AI assistant built into VerSona, an Indian college student social network. Help the student with their query, providing actionable career, resume, or networking advice if applicable, or general chat assistance:\n\nQuery: {query}"
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"AI Assistant error: {e}")
            return "Sorry, I couldn't process your request right now."

    async def generate_smart_responses(self, context: str) -> List[str]:
        """Generate 3 short smart replies based on context"""
        if not self.model:
            return []
        try:
            prompt = f"Based on this conversation context: '{context}', suggest 3 distinct, short, conversational follow-up replies that the user can pick from. Format each as a new line starting with a bullet point. No extra text."
            response = self.model.generate_content(prompt)
            replies = []
            for line in response.text.strip().split('\n'):
                if line.strip():
                    clean_reply = line.replace('*', '').replace('-', '').strip()
                    if clean_reply:
                        replies.append(clean_reply)
            return replies[:3]
        except Exception as e:
            print(f"Smart reply error: {e}")
            return []

# Singleton instance
ai_service = AIService()