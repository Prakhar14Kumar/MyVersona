"""
Career Recommender Model
========================

Recommends career paths based on user skills, interests, and education.

Approach:
1. Skill-based matching using TF-IDF and cosine similarity
2. Interest alignment scoring
3. Job market trend analysis
4. Education requirement matching

For production:
- Train collaborative filtering model on user-career interaction data
- Fine-tune BERT on job descriptions for semantic matching
- Integrate real-time job market data APIs
"""

import numpy as np
from typing import List, Dict, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json


class CareerRecommender:
    def __init__(self):
        """Initialize the career recommender with career database."""
        
        # Career database - In production, load from database or file
        self.careers = [
            {
                "title": "AI/ML Engineer",
                "skills": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "MLOps"],
                "interests": ["AI/ML", "Data Science", "Technology", "Research"],
                "education": ["Computer Science", "Data Science", "Engineering"],
                "description": "Build and deploy machine learning models for production systems",
                "growth_potential": "Very High",
                "avg_salary": "₹12-25 LPA",
                "experience_level": "Entry to Senior"
            },
            {
                "title": "Full Stack Developer",
                "skills": ["React", "Node.js", "TypeScript", "JavaScript", "PostgreSQL", "MongoDB"],
                "interests": ["Web Development", "Technology", "Product Building"],
                "education": ["Computer Science", "Engineering", "Information Technology"],
                "description": "Design and develop end-to-end web applications",
                "growth_potential": "High",
                "avg_salary": "₹8-18 LPA",
                "experience_level": "Entry to Mid"
            },
            {
                "title": "Data Scientist",
                "skills": ["Python", "Statistics", "SQL", "Pandas", "Scikit-learn", "Tableau"],
                "interests": ["Data Science", "Analytics", "Statistics", "Research"],
                "education": ["Computer Science", "Statistics", "Mathematics", "Engineering"],
                "description": "Extract insights from data and build predictive models",
                "growth_potential": "Very High",
                "avg_salary": "₹10-20 LPA",
                "experience_level": "Entry to Senior"
            },
            {
                "title": "Product Manager",
                "skills": ["Product Strategy", "User Research", "Agile", "Analytics", "Communication"],
                "interests": ["Product Management", "Business", "Strategy", "Technology"],
                "education": ["Any degree", "MBA preferred"],
                "description": "Define product strategy and work with cross-functional teams",
                "growth_potential": "High",
                "avg_salary": "₹15-30 LPA",
                "experience_level": "Mid to Senior"
            },
            {
                "title": "Frontend Developer",
                "skills": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind"],
                "interests": ["Web Development", "UI/UX", "Design"],
                "education": ["Computer Science", "Engineering", "Self-taught"],
                "description": "Create beautiful and responsive user interfaces",
                "growth_potential": "High",
                "avg_salary": "₹6-15 LPA",
                "experience_level": "Entry to Mid"
            },
            {
                "title": "Backend Developer",
                "skills": ["Node.js", "Python", "Java", "PostgreSQL", "MongoDB", "API Design"],
                "interests": ["Backend Development", "System Design", "Databases"],
                "education": ["Computer Science", "Engineering"],
                "description": "Build scalable server-side applications and APIs",
                "growth_potential": "High",
                "avg_salary": "₹7-16 LPA",
                "experience_level": "Entry to Mid"
            },
            {
                "title": "DevOps Engineer",
                "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
                "interests": ["Infrastructure", "Automation", "Cloud Computing"],
                "education": ["Computer Science", "Engineering"],
                "description": "Manage infrastructure and automate deployment pipelines",
                "growth_potential": "Very High",
                "avg_salary": "₹9-20 LPA",
                "experience_level": "Mid to Senior"
            },
            {
                "title": "UI/UX Designer",
                "skills": ["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems"],
                "interests": ["Design", "User Experience", "Visual Design"],
                "education": ["Design", "HCI", "Self-taught"],
                "description": "Design intuitive and beautiful user experiences",
                "growth_potential": "High",
                "avg_salary": "₹6-15 LPA",
                "experience_level": "Entry to Mid"
            },
            {
                "title": "Cybersecurity Analyst",
                "skills": ["Security", "Networking", "Penetration Testing", "Python", "Linux"],
                "interests": ["Cybersecurity", "Ethical Hacking", "Network Security"],
                "education": ["Computer Science", "Cybersecurity", "Engineering"],
                "description": "Protect systems and networks from cyber threats",
                "growth_potential": "Very High",
                "avg_salary": "₹8-18 LPA",
                "experience_level": "Entry to Senior"
            },
            {
                "title": "Mobile App Developer",
                "skills": ["React Native", "Flutter", "Swift", "Kotlin", "Mobile UI"],
                "interests": ["Mobile Development", "App Development", "Technology"],
                "education": ["Computer Science", "Engineering"],
                "description": "Build native and cross-platform mobile applications",
                "growth_potential": "High",
                "avg_salary": "₹7-16 LPA",
                "experience_level": "Entry to Mid"
            }
        ]
        
        self.vectorizer = TfidfVectorizer()
        self._prepare_career_vectors()
    
    def _prepare_career_vectors(self):
        """Prepare TF-IDF vectors for careers."""
        # Combine skills and interests for each career
        career_texts = [
            " ".join(career["skills"] + career["interests"])
            for career in self.careers
        ]
        self.career_vectors = self.vectorizer.fit_transform(career_texts)
    
    def _calculate_skill_match(self, user_skills: List[str], career_skills: List[str]) -> float:
        """Calculate skill match score (0-1)."""
        if not user_skills:
            return 0.3  # Base score
        
        user_skills_lower = [s.lower() for s in user_skills]
        career_skills_lower = [s.lower() for s in career_skills]
        
        # Count matching skills
        matches = sum(1 for skill in user_skills_lower if skill in career_skills_lower)
        
        # Calculate score (weighted by importance)
        if matches == 0:
            return 0.2
        
        match_percentage = matches / len(career_skills_lower)
        return min(0.3 + (match_percentage * 0.7), 1.0)
    
    def _calculate_interest_match(self, user_interests: List[str], career_interests: List[str]) -> float:
        """Calculate interest alignment score (0-1)."""
        if not user_interests:
            return 0.5  # Neutral score
        
        user_interests_lower = [i.lower() for i in user_interests]
        career_interests_lower = [i.lower() for i in career_interests]
        
        # Check for matches
        matches = sum(1 for interest in user_interests_lower if interest in career_interests_lower)
        
        if matches == 0:
            return 0.3
        
        return min(0.5 + (matches * 0.2), 1.0)
    
    def _calculate_education_match(self, user_education: Optional[str], career_education: List[str]) -> float:
        """Calculate education match score (0-1)."""
        if not user_education:
            return 0.5
        
        user_ed_lower = user_education.lower()
        
        # Check if user's education matches any career requirement
        for edu in career_education:
            if edu.lower() in user_ed_lower or "any" in edu.lower():
                return 1.0
        
        # Partial match for related fields
        if "computer" in user_ed_lower or "engineering" in user_ed_lower:
            return 0.7
        
        return 0.4
    
    def recommend(
        self,
        skills: Optional[List[str]] = None,
        interests: Optional[List[str]] = None,
        education: Optional[str] = None,
        experience: Optional[str] = None,
        top_n: int = 5
    ) -> List[Dict]:
        """
        Generate career recommendations.
        
        Args:
            skills: List of user skills
            interests: List of user interests
            education: User's education background
            experience: Years of experience
            top_n: Number of recommendations to return
        
        Returns:
            List of career recommendations with match scores
        """
        recommendations = []
        
        for career in self.careers:
            # Calculate component scores
            skill_score = self._calculate_skill_match(
                skills or [],
                career["skills"]
            )
            
            interest_score = self._calculate_interest_match(
                interests or [],
                career["interests"]
            )
            
            education_score = self._calculate_education_match(
                education,
                career["education"]
            )
            
            # Calculate weighted final score
            # Weights: Skills (50%), Interests (30%), Education (20%)
            final_score = (
                skill_score * 0.5 +
                interest_score * 0.3 +
                education_score * 0.2
            )
            
            # Add some randomness to avoid identical scores
            final_score += np.random.uniform(-0.02, 0.02)
            final_score = max(0, min(1, final_score))  # Clamp to [0, 1]
            
            recommendations.append({
                "title": career["title"],
                "match_score": round(final_score, 2),
                "description": career["description"],
                "skills_required": career["skills"],
                "growth_potential": career["growth_potential"],
                "avg_salary": career["avg_salary"]
            })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        return recommendations[:top_n]


# Example usage
if __name__ == "__main__":
    recommender = CareerRecommender()
    
    # Test recommendation
    results = recommender.recommend(
        skills=["Python", "React", "TypeScript"],
        interests=["Web Development", "AI/ML"],
        education="Computer Science Engineering",
        experience="2 years"
    )
    
    print("Career Recommendations:")
    for i, rec in enumerate(results, 1):
        print(f"\n{i}. {rec['title']} - Match: {rec['match_score']*100}%")
        print(f"   {rec['description']}")
        print(f"   Salary: {rec['avg_salary']}")
