"""
Resume Analyzer
===============

Analyzes resumes to extract skills, experience, and provide feedback.

Uses:
- spaCy for NER (Named Entity Recognition)
- Custom skill extraction
- ATS (Applicant Tracking System) scoring
- PDF/DOCX parsing

For production:
- Train custom NER model on resume data
- Add industry-specific skill databases
- Implement ATS keyword optimization
"""

import re
from typing import Dict, List, Tuple
import PyPDF2
import docx
from io import BytesIO


class ResumeAnalyzer:
    def __init__(self):
        """Initialize resume analyzer."""
        
        # Skill database (expand this with comprehensive list)
        self.skill_keywords = {
            "programming": [
                "python", "javascript", "java", "c++", "c#", "ruby", "go", "rust",
                "typescript", "php", "swift", "kotlin", "scala", "r"
            ],
            "web": [
                "react", "angular", "vue", "node.js", "express", "django", "flask",
                "fastapi", "next.js", "html", "css", "tailwind", "bootstrap"
            ],
            "database": [
                "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
                "dynamodb", "cassandra", "firebase", "supabase"
            ],
            "cloud": [
                "aws", "azure", "gcp", "google cloud", "docker", "kubernetes",
                "terraform", "ansible", "jenkins", "ci/cd"
            ],
            "ml_ai": [
                "machine learning", "deep learning", "tensorflow", "pytorch",
                "scikit-learn", "keras", "nlp", "computer vision", "bert", "gpt"
            ],
            "mobile": [
                "react native", "flutter", "ios", "android", "swift", "kotlin"
            ],
            "tools": [
                "git", "github", "gitlab", "jira", "figma", "postman", "vscode"
            ]
        }
        
        # Action verbs for strong resumes
        self.strong_action_verbs = [
            "achieved", "implemented", "led", "developed", "designed", "built",
            "created", "improved", "increased", "reduced", "optimized", "managed",
            "launched", "delivered", "architected", "spearheaded", "initiated"
        ]
        
        # Try to import spaCy (optional)
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
            self.spacy_available = True
        except:
            self.nlp = None
            self.spacy_available = False
            print("Warning: spaCy not available. Install with: python -m spacy download en_core_web_sm")
    
    def extract_text_from_file(self, file_content: bytes, filename: str) -> str:
        """
        Extract text from PDF or DOCX file.
        
        Args:
            file_content: Binary file content
            filename: Name of the file (to determine type)
        
        Returns:
            Extracted text
        """
        try:
            if filename.lower().endswith('.pdf'):
                return self._extract_from_pdf(file_content)
            elif filename.lower().endswith('.docx'):
                return self._extract_from_docx(file_content)
            else:
                raise ValueError("Unsupported file format. Use PDF or DOCX.")
        except Exception as e:
            raise Exception(f"Error extracting text: {str(e)}")
    
    def _extract_from_pdf(self, content: bytes) -> str:
        """Extract text from PDF."""
        text = ""
        pdf_file = BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text
    
    def _extract_from_docx(self, content: bytes) -> str:
        """Extract text from DOCX."""
        doc_file = BytesIO(content)
        doc = docx.Document(doc_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract skills from resume text.
        
        Args:
            text: Resume text
        
        Returns:
            List of extracted skills
        """
        text_lower = text.lower()
        found_skills = []
        
        # Search for skills from database
        for category, skills in self.skill_keywords.items():
            for skill in skills:
                # Use word boundaries to avoid partial matches
                pattern = r'\b' + re.escape(skill) + r'\b'
                if re.search(pattern, text_lower):
                    # Capitalize properly
                    found_skills.append(skill.title())
        
        # Remove duplicates while preserving order
        seen = set()
        unique_skills = []
        for skill in found_skills:
            if skill.lower() not in seen:
                seen.add(skill.lower())
                unique_skills.append(skill)
        
        return unique_skills
    
    def calculate_ats_score(self, text: str, skills: List[str]) -> int:
        """
        Calculate ATS (Applicant Tracking System) score.
        
        Scoring criteria:
        - Skills mentioned: 30 points
        - Action verbs used: 20 points
        - Quantifiable results: 20 points
        - Proper formatting: 15 points
        - Length (optimal 400-800 words): 15 points
        
        Returns:
            Score out of 100
        """
        score = 0
        text_lower = text.lower()
        
        # 1. Skills (30 points max)
        skills_score = min(len(skills) * 3, 30)
        score += skills_score
        
        # 2. Action verbs (20 points max)
        action_verb_count = sum(
            1 for verb in self.strong_action_verbs
            if verb in text_lower
        )
        action_score = min(action_verb_count * 2, 20)
        score += action_score
        
        # 3. Quantifiable results (20 points max)
        # Look for numbers/percentages
        numbers_count = len(re.findall(r'\d+%|\d+\+|increased|decreased|improved', text_lower))
        quant_score = min(numbers_count * 2, 20)
        score += quant_score
        
        # 4. Formatting (15 points max)
        format_score = 0
        # Check for sections
        if any(section in text_lower for section in ['experience', 'education', 'skills']):
            format_score += 5
        # Check for bullet points or dashes
        if '•' in text or '-' in text:
            format_score += 5
        # Check for email
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
            format_score += 5
        score += format_score
        
        # 5. Length (15 points max)
        word_count = len(text.split())
        if 400 <= word_count <= 800:
            length_score = 15
        elif 300 <= word_count < 400 or 800 < word_count <= 1000:
            length_score = 10
        elif 200 <= word_count < 300 or 1000 < word_count <= 1200:
            length_score = 5
        else:
            length_score = 0
        score += length_score
        
        return min(score, 100)
    
    def extract_experience_years(self, text: str) -> int:
        """
        Estimate years of experience from resume.
        
        Args:
            text: Resume text
        
        Returns:
            Estimated years of experience
        """
        # Look for patterns like "2 years", "3+ years", "2019-2023"
        text_lower = text.lower()
        
        # Pattern 1: X years
        years_match = re.findall(r'(\d+)\+?\s*years?', text_lower)
        if years_match:
            return max(int(y) for y in years_match)
        
        # Pattern 2: Date ranges (YYYY-YYYY)
        date_ranges = re.findall(r'(20\d{2})\s*[-–]\s*(20\d{2}|present)', text_lower)
        if date_ranges:
            total_years = 0
            for start, end in date_ranges:
                end_year = 2024 if 'present' in end else int(end)
                start_year = int(start)
                total_years += (end_year - start_year)
            return min(total_years, 20)  # Cap at 20 years
        
        return 0
    
    def generate_strengths(self, text: str, skills: List[str], score: int) -> List[str]:
        """Generate list of resume strengths."""
        strengths = []
        
        if score >= 70:
            strengths.append("Well-structured resume with clear sections")
        
        if len(skills) >= 8:
            strengths.append("Diverse technical skill set")
        
        text_lower = text.lower()
        
        if any(verb in text_lower for verb in self.strong_action_verbs[:5]):
            strengths.append("Uses strong action verbs effectively")
        
        if re.search(r'\d+%|\d+x|increased|improved', text_lower):
            strengths.append("Includes quantifiable achievements")
        
        if 'project' in text_lower:
            strengths.append("Demonstrates hands-on project experience")
        
        if not strengths:
            strengths.append("Resume has basic structure in place")
        
        return strengths[:4]
    
    def generate_improvements(self, text: str, skills: List[str], score: int) -> List[str]:
        """Generate list of resume improvement suggestions."""
        improvements = []
        text_lower = text.lower()
        
        if score < 70:
            improvements.append("Improve overall structure and formatting")
        
        if len(skills) < 6:
            improvements.append("Add more relevant technical skills")
        
        action_verb_count = sum(1 for verb in self.strong_action_verbs if verb in text_lower)
        if action_verb_count < 3:
            improvements.append("Use more action verbs (achieved, implemented, led)")
        
        if not re.search(r'\d+%|\d+x|increased', text_lower):
            improvements.append("Quantify achievements with metrics and numbers")
        
        if 'summary' not in text_lower and 'objective' not in text_lower:
            improvements.append("Add a professional summary section")
        
        if 'certification' not in text_lower and 'certificate' not in text_lower:
            improvements.append("Include relevant certifications if available")
        
        word_count = len(text.split())
        if word_count < 300:
            improvements.append("Expand resume with more details and achievements")
        elif word_count > 1000:
            improvements.append("Reduce length - aim for concise, impactful content")
        
        return improvements[:5]
    
    def suggest_roles(self, skills: List[str]) -> List[str]:
        """Suggest suitable roles based on skills."""
        roles = []
        skills_lower = [s.lower() for s in skills]
        
        # Check for role matches
        if any(skill in skills_lower for skill in ['react', 'angular', 'vue', 'html', 'css']):
            roles.append("Frontend Developer")
        
        if any(skill in skills_lower for skill in ['node.js', 'express', 'django', 'flask', 'fastapi']):
            roles.append("Backend Developer")
        
        if any(skill in skills_lower for skill in ['react', 'node.js']) and \
           any(skill in skills_lower for skill in ['mongodb', 'postgresql', 'mysql']):
            roles.append("Full Stack Developer")
        
        if any(skill in skills_lower for skill in ['tensorflow', 'pytorch', 'machine learning', 'deep learning']):
            roles.append("AI/ML Engineer")
        
        if any(skill in skills_lower for skill in ['python', 'sql', 'pandas', 'scikit-learn']):
            roles.append("Data Scientist")
        
        if any(skill in skills_lower for skill in ['docker', 'kubernetes', 'aws', 'terraform']):
            roles.append("DevOps Engineer")
        
        if any(skill in skills_lower for skill in ['react native', 'flutter', 'swift', 'kotlin']):
            roles.append("Mobile App Developer")
        
        if not roles:
            roles.append("Software Engineer")
        
        return roles[:3]
    
    def analyze_text(self, resume_text: str) -> Dict:
        """
        Analyze resume text and return comprehensive feedback.
        
        Args:
            resume_text: The text content of the resume
        
        Returns:
            Dictionary containing analysis results
        """
        # Extract skills
        skills = self.extract_skills(resume_text)
        
        # Calculate ATS score
        score = self.calculate_ats_score(resume_text, skills)
        
        # Extract experience
        experience_years = self.extract_experience_years(resume_text)
        
        # Generate feedback
        strengths = self.generate_strengths(resume_text, skills, score)
        improvements = self.generate_improvements(resume_text, skills, score)
        
        # Suggest roles
        suggested_roles = self.suggest_roles(skills)
        
        return {
            "score": score,
            "strengths": strengths,
            "improvements": improvements,
            "extracted_skills": skills,
            "experience_years": experience_years,
            "suggested_roles": suggested_roles,
            "word_count": len(resume_text.split()),
            "skill_categories": self._categorize_skills(skills)
        }
    
    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize skills by type."""
        categories = {
            "programming": [],
            "web": [],
            "database": [],
            "cloud": [],
            "ml_ai": [],
            "mobile": [],
            "tools": []
        }
        
        skills_lower = [s.lower() for s in skills]
        
        for category, keywords in self.skill_keywords.items():
            for skill in skills:
                if skill.lower() in keywords:
                    categories[category].append(skill)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}


# Example usage
if __name__ == "__main__":
    analyzer = ResumeAnalyzer()
    
    # Test with sample resume text
    sample_resume = """
    John Doe
    john.doe@email.com | +91-9876543210
    
    EXPERIENCE
    Software Engineer at Tech Corp (2021-Present)
    - Developed and implemented React-based web applications, improving user engagement by 35%
    - Built RESTful APIs using Node.js and Express, reducing response time by 40%
    - Managed PostgreSQL databases and optimized queries for better performance
    
    SKILLS
    Programming: Python, JavaScript, TypeScript
    Web: React, Node.js, Express, HTML, CSS
    Database: PostgreSQL, MongoDB
    Tools: Git, Docker, AWS
    
    PROJECTS
    E-commerce Platform: Built a full-stack application using MERN stack
    """
    
    result = analyzer.analyze_text(sample_resume)
    
    print(f"ATS Score: {result['score']}/100")
    print(f"\nSkills Found: {', '.join(result['extracted_skills'])}")
    print(f"\nExperience: {result['experience_years']} years")
    print(f"\nSuggested Roles: {', '.join(result['suggested_roles'])}")
    print(f"\nStrengths:")
    for s in result['strengths']:
        print(f"  - {s}")
    print(f"\nImprovements:")
    for i in result['improvements']:
        print(f"  - {i}")
