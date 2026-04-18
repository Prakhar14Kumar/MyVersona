"""
AI Chat Mentor for VerSona
=========================
Provides career guidance, resume improvement, interview preparation,
skill roadmaps, and project suggestions using Google Gemini.

100% powered by Gemini AI - NO MOCK DATA.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from .gemini_config import get_gemini_model


class AIChatMentor:
    """AI-powered career mentor and guidance system."""
    
    def __init__(self):
        """Initialize Gemini AI with API key."""
        self.model = get_gemini_model('gemini-pro')
    
    def chat_career_guidance(
        self, 
        message: str, 
        user_profile: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Provide career guidance through conversational AI.
        
        Args:
            message: User's question or message
            user_profile: User's profile data (skills, education, interests)
            chat_history: Previous conversation history
            
        Returns:
            Response with AI-generated career guidance
        """
        # Build context from user profile
        context = self._build_context(user_profile)
        
        # Build conversation history
        history_text = self._format_history(chat_history) if chat_history else ""
        
        prompt = f"""You are a professional career mentor for Indian college students and young professionals.
Your role is to provide helpful, actionable career advice.

Context about the user:
{context}

Previous conversation:
{history_text}

User's question: {message}

Please provide a helpful, encouraging response with specific advice. Keep it conversational and friendly.
Focus on Indian job market, colleges, and career opportunities."""

        response = self.model.generate_content(prompt)
        
        return {
            "message": response.text,
            "timestamp": datetime.utcnow().isoformat(),
            "type": "career_guidance"
        }
    
    def get_resume_improvement_tips(self, resume_text: str) -> Dict[str, Any]:
        """
        Analyze resume and provide improvement suggestions.
        
        Args:
            resume_text: Current resume content
            
        Returns:
            Detailed improvement suggestions
        """
        prompt = f"""Analyze this resume and provide specific, actionable improvement tips:

Resume:
{resume_text}

Please provide:
1. Overall assessment (score out of 10)
2. Strengths (3-5 points)
3. Areas to improve (3-5 points)
4. Specific action items (5-7 items)
5. ATS optimization tips
6. Keywords to add

Format the response in a structured, easy-to-read way."""

        response = self.model.generate_content(prompt)
        
        return {
            "analysis": response.text,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def generate_interview_prep(
        self, 
        role: str, 
        experience_level: str = "entry",
        company_type: str = "startup"
    ) -> Dict[str, Any]:
        """
        Generate personalized interview preparation material.
        
        Args:
            role: Target job role
            experience_level: entry/mid/senior
            company_type: startup/corporate/mnc
            
        Returns:
            Interview questions, tips, and preparation guide
        """
        prompt = f"""Generate comprehensive interview preparation material for:
Role: {role}
Experience Level: {experience_level}
Company Type: {company_type}
Location: India

Please provide:
1. Common interview questions (10-15 questions)
   - Technical questions
   - Behavioral questions
   - Situational questions
2. Key topics to prepare
3. Sample answers framework
4. Tips for success
5. Common mistakes to avoid

Format in a clear, actionable way."""

        response = self.model.generate_content(prompt)
        
        return {
            "prep_guide": response.text,
            "role": role,
            "level": experience_level,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def create_skill_roadmap(
        self, 
        current_skills: List[str],
        target_role: str,
        timeline_months: int = 6
    ) -> Dict[str, Any]:
        """
        Create a personalized learning roadmap.
        
        Args:
            current_skills: List of skills user already has
            target_role: Desired job role
            timeline_months: Time available for learning
            
        Returns:
            Structured learning roadmap with phases and resources
        """
        skills_text = ", ".join(current_skills) if current_skills else "beginner"
        
        prompt = f"""Create a detailed {timeline_months}-month learning roadmap:

Current Skills: {skills_text}
Target Role: {target_role}
Timeline: {timeline_months} months

Please create a structured roadmap with:
1. Skill gap analysis
2. Month-by-month learning plan
3. For each month:
   - Skills to learn
   - Recommended resources (courses, books, projects)
   - Practice projects
   - Milestones to achieve
4. Key certifications to pursue
5. Portfolio project ideas
6. Tips for staying motivated

Make it specific to the Indian context and job market."""

        response = self.model.generate_content(prompt)
        
        return {
            "roadmap": response.text,
            "target_role": target_role,
            "duration_months": timeline_months,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def suggest_projects(
        self,
        skills: List[str],
        difficulty: str = "intermediate",
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Suggest relevant projects to build portfolio.
        
        Args:
            skills: User's current skills
            difficulty: beginner/intermediate/advanced
            domain: Specific domain (web, mobile, ml, etc.)
            
        Returns:
            List of project ideas with descriptions
        """
        skills_text = ", ".join(skills) if skills else "web development"
        domain_text = f"in {domain}" if domain else ""
        
        prompt = f"""Suggest 5-7 portfolio project ideas:

Skills: {skills_text}
Difficulty: {difficulty}
Domain: {domain_text}

For each project provide:
1. Project name and brief description
2. Key features to implement
3. Technologies to use
4. Estimated time to complete
5. Learning outcomes
6. How it helps in job search
7. Unique twist to make it stand out

Make projects relevant to Indian job market and industry needs."""

        response = self.model.generate_content(prompt)
        
        return {
            "projects": response.text,
            "difficulty": difficulty,
            "skills_used": skills,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_motivational_support(self, user_mood: str, context: str = "") -> Dict[str, Any]:
        """
        Provide motivational support and encouragement.
        
        Args:
            user_mood: Current user mood/situation
            context: Additional context
            
        Returns:
            Personalized motivational message
        """
        prompt = f"""Act as a supportive career mentor. The user is feeling: {user_mood}
Context: {context}

Provide encouraging, actionable advice to help them move forward.
Keep it genuine, specific, and motivating. Share relevant examples if helpful."""

        response = self.model.generate_content(prompt)
        
        return {
            "message": response.text,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def analyze_career_path(
        self,
        current_position: str,
        interests: List[str],
        time_horizon: str = "5 years"
    ) -> Dict[str, Any]:
        """
        Analyze and suggest career paths based on current position and interests.
        
        Args:
            current_position: User's current role/position
            interests: List of career interests
            time_horizon: Time period for career planning
            
        Returns:
            Career path analysis and recommendations
        """
        interests_text = ", ".join(interests) if interests else "general career growth"
        
        prompt = f"""Analyze career paths for an Indian professional:

Current Position: {current_position}
Interests: {interests_text}
Planning Horizon: {time_horizon}

Please provide:
1. 3-4 potential career paths
2. For each path:
   - Career progression steps
   - Skills needed at each step
   - Typical timeline
   - Expected salary ranges in India
   - Companies/industries to target
3. Pros and cons of each path
4. Recommendations for next steps

Focus on realistic opportunities in the Indian job market."""

        response = self.model.generate_content(prompt)
        
        return {
            "analysis": response.text,
            "current_position": current_position,
            "interests": interests,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_salary_insights(
        self,
        role: str,
        location: str = "India",
        experience_years: int = 0
    ) -> Dict[str, Any]:
        """
        Get salary insights for a specific role.
        
        Args:
            role: Job role
            location: Location (city or "India")
            experience_years: Years of experience
            
        Returns:
            Salary insights and negotiation tips
        """
        prompt = f"""Provide salary insights for:

Role: {role}
Location: {location}
Experience: {experience_years} years

Please include:
1. Typical salary range (in INR)
2. Factors affecting salary (company type, skills, etc.)
3. Salary growth trajectory
4. Negotiation tips
5. Total compensation components (base, bonus, equity, etc.)
6. Comparison with similar roles

Provide accurate, current data for the Indian job market."""

        response = self.model.generate_content(prompt)
        
        return {
            "insights": response.text,
            "role": role,
            "location": location,
            "experience_years": experience_years,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def suggest_networking_strategies(
        self,
        target_industry: str,
        current_level: str = "student"
    ) -> Dict[str, Any]:
        """
        Suggest networking strategies for career growth.
        
        Args:
            target_industry: Industry of interest
            current_level: student/entry/mid/senior
            
        Returns:
            Networking strategies and tips
        """
        prompt = f"""Suggest networking strategies for:

Target Industry: {target_industry}
Current Level: {current_level}
Context: Indian professional/student

Please provide:
1. Networking strategies specific to this industry
2. Online platforms to use (LinkedIn, Twitter, etc.)
3. Offline opportunities (events, meetups, conferences)
4. How to approach professionals for informational interviews
5. Common networking mistakes to avoid
6. Follow-up best practices
7. Building and maintaining professional relationships

Make recommendations practical for Indian context."""

        response = self.model.generate_content(prompt)
        
        return {
            "strategies": response.text,
            "target_industry": target_industry,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Helper methods
    
    def _build_context(self, profile: Optional[Dict[str, Any]]) -> str:
        """Build context string from user profile."""
        if not profile:
            return "No profile information available."
        
        context_parts = []
        if profile.get('skills'):
            context_parts.append(f"Skills: {', '.join(profile['skills'])}")
        if profile.get('education'):
            context_parts.append(f"Education: {profile['education']}")
        if profile.get('interests'):
            context_parts.append(f"Interests: {', '.join(profile['interests'])}")
        if profile.get('college'):
            context_parts.append(f"College: {profile['college']}")
        if profile.get('year'):
            context_parts.append(f"Year: {profile['year']}")
        
        return "\n".join(context_parts) if context_parts else "Limited profile information."
    
    def _format_history(self, history: List[Dict[str, str]]) -> str:
        """Format chat history for context."""
        if not history:
            return ""
        
        formatted = []
        for msg in history[-5:]:  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            formatted.append(f"{role.capitalize()}: {content}")
        
        return "\n".join(formatted)


# Example usage and testing
if __name__ == "__main__":
    try:
        mentor = AIChatMentor()
        
        # Test career guidance
        print("Testing Career Guidance...")
        response = mentor.chat_career_guidance(
            "I'm interested in data science. How should I start?",
            user_profile={
                "skills": ["Python", "Statistics"],
                "education": "B.Tech Computer Science",
                "college": "IIT Delhi"
            }
        )
        print(f"Response: {response['message'][:200]}...")
        
        # Test skill roadmap
        print("\nTesting Skill Roadmap...")
        roadmap = mentor.create_skill_roadmap(
            current_skills=["Python", "SQL"],
            target_role="Data Scientist",
            timeline_months=6
        )
        print(f"Roadmap: {roadmap['roadmap'][:200]}...")
        
        print("\n✅ AI Chat Mentor is working with Gemini AI!")
        
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
