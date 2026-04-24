from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, List
import logging
import io
import re
from PyPDF2 import PdfReader
import docx

from ..core.auth.decorators import get_current_user
from ..core.dependencies import get_current_user_id as auth_get_current_user_id


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/career", tags=["career"])


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")


def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from DOCX")


def extract_text_from_doc(file_content: bytes) -> str:
    """Extract text from DOC file - basic approach"""
    # Note: DOC format is complex and requires python-docx or other libraries
    # For simplicity, we'll try to extract as plain text
    try:
        text = file_content.decode('utf-8', errors='ignore')
        # Remove non-printable characters
        text = ''.join(char for char in text if char.isprintable() or char.isspace())
        return text.strip()
    except Exception as e:
        logger.error(f"DOC extraction error: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from DOC. Please use PDF or DOCX format.")


def extract_skills(text: str) -> List[str]:
    """Extract skills from resume text using keyword matching"""
    # Common tech and professional skills
    skill_keywords = [
        "python", "java", "javascript", "typescript", "react", "node.js", "angular",
        "vue", "sql", "mongodb", "postgresql", "aws", "azure", "gcp", "docker",
        "kubernetes", "git", "machine learning", "ai", "deep learning", "tensorflow",
        "pytorch", "data analysis", "excel", "powerpoint", "communication", "leadership",
        "project management", "agile", "scrum", "html", "css", "c++", "c#", "php",
        "ruby", "go", "rust", "swift", "kotlin", "flutter", "django", "flask",
        "spring", "laravel", "express", "fastapi", "devops", "ci/cd", "jenkins",
        "linux", "bash", "api", "rest", "graphql", "microservices", "firebase",
        "figma", "photoshop", "illustrator", "ui/ux", "design", "problem solving",
        "teamwork", "analytical", "critical thinking"
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in skill_keywords:
        # Use word boundary to avoid partial matches
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            # Capitalize properly
            found_skills.append(skill.title())
    
    # Remove duplicates and limit to 15 skills
    found_skills = list(dict.fromkeys(found_skills))[:15]
    return found_skills


def calculate_ats_score(text: str, skills: List[str]) -> int:
    """Calculate ATS (Applicant Tracking System) score"""
    score = 0
    text_lower = text.lower()
    
    # Check for key sections (5 points each)
    sections = ["experience", "education", "skills", "projects"]
    for section in sections:
        if section in text_lower:
            score += 5
    
    # Check for contact information (10 points)
    if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text):  # Email
        score += 5
    if re.search(r'\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', text):  # Phone
        score += 5
    
    # Skills count (up to 30 points)
    score += min(len(skills) * 2, 30)
    
    # Check for action verbs (up to 20 points)
    action_verbs = ["developed", "created", "designed", "implemented", "managed",
                    "led", "built", "improved", "increased", "decreased", "achieved"]
    verb_count = sum(1 for verb in action_verbs if verb in text_lower)
    score += min(verb_count * 2, 20)
    
    # Quantifiable achievements (10 points)
    if re.search(r'\d+%|\d+\s*(users|customers|projects|revenue|sales)', text_lower):
        score += 10
    
    # Professional formatting indicators (10 points)
    word_count = len(text.split())
    if 300 <= word_count <= 1000:
        score += 10
    
    # Cap at 100
    return min(score, 100)


def generate_suggestions(text: str, score: int, skills: List[str]) -> List[str]:
    """Generate improvement suggestions based on resume analysis"""
    suggestions = []
    text_lower = text.lower()
    
    # Check for missing sections
    if "experience" not in text_lower and "work" not in text_lower:
        suggestions.append("Add a clear 'Work Experience' or 'Professional Experience' section with your employment history")
    
    if "education" not in text_lower:
        suggestions.append("Include an 'Education' section with your degrees, institutions, and graduation dates")
    
    if "skills" not in text_lower and len(skills) < 5:
        suggestions.append("Create a dedicated 'Skills' section listing your technical and soft skills")
    
    # Check for quantifiable achievements
    if not re.search(r'\d+%|\d+\s*(users|customers|projects|revenue)', text_lower):
        suggestions.append("Add quantifiable achievements (e.g., 'Increased sales by 25%' or 'Managed team of 10 people')")
    
    # Check for action verbs
    action_verbs = ["developed", "created", "designed", "implemented", "managed"]
    if sum(1 for verb in action_verbs if verb in text_lower) < 3:
        suggestions.append("Use more action verbs to describe your responsibilities (e.g., 'Developed', 'Implemented', 'Led')")
    
    # Check for contact info
    if not re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text):
        suggestions.append("Include your professional email address at the top of your resume")
    
    # Check word count
    word_count = len(text.split())
    if word_count < 300:
        suggestions.append("Your resume seems too brief. Expand on your experiences, achievements, and responsibilities")
    elif word_count > 1000:
        suggestions.append("Your resume is quite long. Try to be more concise and focus on the most relevant information")
    
    # Check for projects (for students/recent grads)
    if "student" in text_lower or "graduate" in text_lower:
        if "project" not in text_lower:
            suggestions.append("Include relevant projects or coursework to showcase your practical skills")
    
    # LinkedIn/Portfolio
    if "linkedin" not in text_lower and "github" not in text_lower and "portfolio" not in text_lower:
        suggestions.append("Add links to your LinkedIn, GitHub, or portfolio to provide additional context about your work")
    
    # Generic low score suggestion
    if score < 60:
        suggestions.append("Consider using a simple, ATS-friendly format with clear section headings and bullet points")
    
    # Return top 3 suggestions
    return suggestions[:3]


@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
) -> Dict:
    """
    Upload and analyze resume
    
    - Accepts PDF, DOC, DOCX files (max 5MB)
    - Extracts text content
    - Calculates ATS score
    - Extracts skills
    - Generates improvement suggestions
    """
    try:
        # Validate file type
        allowed_types = ["application/pdf", "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        
        if file.content_type not in allowed_types:
            # Check file extension as fallback
            filename_lower = file.filename.lower()
            if not (filename_lower.endswith('.pdf') or 
                   filename_lower.endswith('.doc') or 
                   filename_lower.endswith('.docx')):
                raise HTTPException(
                    status_code=400,
                    detail="Only PDF, DOC, and DOCX files are supported"
                )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 5MB"
            )
        
        # Extract text based on file type
        filename_lower = file.filename.lower()
        
        if filename_lower.endswith('.pdf'):
            text = extract_text_from_pdf(file_content)
        elif filename_lower.endswith('.docx'):
            text = extract_text_from_docx(file_content)
        elif filename_lower.endswith('.doc'):
            text = extract_text_from_doc(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from the file. Please ensure your resume contains readable text."
            )
        
        # Analyze resume
        skills = extract_skills(text)
        ats_score = calculate_ats_score(text, skills)
        suggestions = generate_suggestions(text, ats_score, skills)
        
        logger.info(f"Resume analyzed for user {current_user.get('uid')}: Score={ats_score}, Skills={len(skills)}")
        
        return {
            "ats_score": ats_score,
            "skills": skills,
            "suggestions": suggestions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze resume. Please try again."
        )
