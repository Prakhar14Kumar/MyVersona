/**
 * Resume Analyzer
 * Skill extraction, ATS scoring, and improvement suggestions
 */

import { tokenize, removeStopWords } from './utils';

export interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  extracted_skills: string[];
  experience_years: number;
  suggested_roles: string[];
}

/**
 * Resume Analyzer
 */
export class ResumeAnalyzer {
  private static readonly TECH_SKILLS = new Set([
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'php', 'ruby',
    'react', 'angular', 'vue', 'svelte', 'next.js', 'node.js', 'express', 'django', 'flask',
    'spring', 'laravel', 'rails', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'git', 'github',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas',
    'numpy', 'sql', 'nosql', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'ci/cd',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'babel', 'testing', 'jest',
    'linux', 'bash', 'data structures', 'algorithms', 'oop', 'functional programming',
    'firebase', 'supabase', 'netlify', 'vercel', 'heroku', 'digital ocean'
  ]);

  private static readonly SOFT_SKILLS = new Set([
    'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
    'time management', 'creativity', 'adaptability', 'collaboration', 'presentation',
    'negotiation', 'conflict resolution', 'mentoring', 'project management'
  ]);

  private static readonly ACTION_VERBS = new Set([
    'achieved', 'implemented', 'developed', 'created', 'designed', 'built', 'led', 'managed',
    'improved', 'optimized', 'increased', 'reduced', 'launched', 'delivered', 'collaborated',
    'spearheaded', 'initiated', 'coordinated', 'executed', 'established', 'streamlined'
  ]);

  /**
   * Analyze resume and provide comprehensive feedback
   */
  static analyze(resumeText: string): ResumeAnalysis {
    const normalizedText = resumeText.toLowerCase();
    const tokens = tokenize(resumeText);

    // Extract skills
    const extractedSkills = this.extractSkills(normalizedText, tokens);

    // Calculate experience years
    const experienceYears = this.extractExperience(normalizedText);

    // Calculate ATS score
    const score = this.calculateATSScore(normalizedText, tokens, extractedSkills);

    // Identify strengths
    const strengths = this.identifyStrengths(normalizedText, tokens, extractedSkills);

    // Generate improvements
    const improvements = this.generateImprovements(normalizedText, tokens, extractedSkills);

    // Suggest roles
    const suggestedRoles = this.suggestRoles(extractedSkills, experienceYears);

    return {
      score,
      strengths,
      improvements,
      extracted_skills: extractedSkills,
      experience_years: experienceYears,
      suggested_roles: suggestedRoles
    };
  }

  /**
   * Extract technical and soft skills
   */
  private static extractSkills(text: string, tokens: string[]): string[] {
    const foundSkills = new Set<string>();

    // Check for tech skills
    for (const skill of this.TECH_SKILLS) {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.add(this.capitalizeSkill(skill));
      }
    }

    // Check for soft skills
    for (const skill of this.SOFT_SKILLS) {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.add(this.capitalizeSkill(skill));
      }
    }

    // Check for skill section explicitly
    const skillSectionMatch = text.match(/skills?:([^\n]+)/i);
    if (skillSectionMatch) {
      const skillSection = skillSectionMatch[1].toLowerCase();
      const potentialSkills = skillSection.split(/[,;\|]/);
      
      for (const skill of potentialSkills) {
        const cleaned = skill.trim();
        if (cleaned.length > 2) {
          foundSkills.add(this.capitalizeSkill(cleaned));
        }
      }
    }

    return Array.from(foundSkills).slice(0, 15); // Limit to top 15
  }

  /**
   * Extract years of experience
   */
  private static extractExperience(text: string): number {
    // Look for patterns like "2 years", "3+ years", "5-7 years"
    const patterns = [
      /(\d+)\+?\s*years?/i,
      /(\d+)-(\d+)\s*years?/i,
      /experience:\s*(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Count number of job entries as fallback
    const jobIndicators = text.match(/\b(internship|intern|job|position|role|engineer|developer|analyst)\b/gi);
    return jobIndicators ? Math.min(Math.floor(jobIndicators.length / 3), 10) : 0;
  }

  /**
   * Calculate ATS (Applicant Tracking System) score
   */
  private static calculateATSScore(text: string, tokens: string[], skills: string[]): number {
    let score = 0;
    const maxScore = 100;

    // 1. Skills coverage (30 points)
    const skillScore = Math.min(30, skills.length * 3);
    score += skillScore;

    // 2. Action verbs (15 points)
    const actionVerbCount = tokens.filter(t => this.ACTION_VERBS.has(t.toLowerCase())).length;
    score += Math.min(15, actionVerbCount * 2);

    // 3. Quantifiable achievements (20 points)
    const numbers = text.match(/\b\d+%?\b/g);
    const quantificationScore = numbers ? Math.min(20, numbers.length * 2) : 0;
    score += quantificationScore;

    // 4. Proper sections (15 points)
    const sections = ['experience', 'education', 'skills', 'projects'];
    const sectionScore = sections.filter(s => text.includes(s.toLowerCase())).length * 3.75;
    score += sectionScore;

    // 5. Length appropriateness (10 points)
    const wordCount = tokens.length;
    const lengthScore = (wordCount >= 200 && wordCount <= 800) ? 10 : 5;
    score += lengthScore;

    // 6. Contact information (10 points)
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
    const hasPhone = /\b\d{10}\b|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text);
    score += hasEmail ? 5 : 0;
    score += hasPhone ? 5 : 0;

    return Math.min(maxScore, Math.round(score));
  }

  /**
   * Identify resume strengths
   */
  private static identifyStrengths(text: string, tokens: string[], skills: string[]): string[] {
    const strengths: string[] = [];

    // Check for diverse skills
    if (skills.length >= 8) {
      strengths.push('Diverse technical skill set');
    }

    // Check for action verbs
    const actionVerbCount = tokens.filter(t => this.ACTION_VERBS.has(t.toLowerCase())).length;
    if (actionVerbCount >= 5) {
      strengths.push('Strong use of action verbs');
    }

    // Check for quantification
    const numbers = text.match(/\b\d+%?\b/g);
    if (numbers && numbers.length >= 5) {
      strengths.push('Good quantification of achievements');
    }

    // Check for projects
    if (text.toLowerCase().includes('project')) {
      strengths.push('Includes relevant projects');
    }

    // Check for certifications
    if (text.toLowerCase().includes('certif')) {
      strengths.push('Professional certifications mentioned');
    }

    // Check for proper structure
    const sections = ['experience', 'education', 'skills'];
    if (sections.every(s => text.toLowerCase().includes(s))) {
      strengths.push('Well-structured with clear sections');
    }

    // Default strength
    if (strengths.length === 0) {
      strengths.push('Basic resume structure present');
    }

    return strengths.slice(0, 5);
  }

  /**
   * Generate improvement suggestions
   */
  private static generateImprovements(text: string, tokens: string[], skills: string[]): string[] {
    const improvements: string[] = [];

    // Check action verbs
    const actionVerbCount = tokens.filter(t => this.ACTION_VERBS.has(t.toLowerCase())).length;
    if (actionVerbCount < 5) {
      improvements.push('Add more action verbs (achieved, implemented, led, etc.)');
    }

    // Check quantification
    const numbers = text.match(/\b\d+%?\b/g);
    if (!numbers || numbers.length < 3) {
      improvements.push('Include metrics and numbers to quantify achievements');
    }

    // Check skills
    if (skills.length < 6) {
      improvements.push('Add more relevant technical skills');
    }

    // Check for summary
    if (!text.toLowerCase().includes('summary') && !text.toLowerCase().includes('objective')) {
      improvements.push('Consider adding a professional summary section');
    }

    // Check for certifications
    if (!text.toLowerCase().includes('certif')) {
      improvements.push('Include relevant certifications if available');
    }

    // Check length
    const wordCount = tokens.length;
    if (wordCount < 200) {
      improvements.push('Resume seems short - add more details about your experience');
    } else if (wordCount > 800) {
      improvements.push('Resume may be too long - focus on most relevant information');
    }

    // Check contact info
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
    if (!hasEmail) {
      improvements.push('Include professional email address');
    }

    return improvements.slice(0, 5);
  }

  /**
   * Suggest suitable roles based on skills
   */
  private static suggestRoles(skills: string[], experienceYears: number): string[] {
    const skillSet = new Set(skills.map(s => s.toLowerCase()));
    const roles: Array<{ role: string; score: number }> = [];

    // Define role requirements
    const roleRequirements: Record<string, string[]> = {
      'Full Stack Developer': ['javascript', 'react', 'node.js', 'html', 'css'],
      'Frontend Developer': ['react', 'javascript', 'html', 'css', 'typescript'],
      'Backend Developer': ['node.js', 'python', 'java', 'sql', 'api'],
      'Data Scientist': ['python', 'machine learning', 'sql', 'statistics'],
      'ML Engineer': ['python', 'tensorflow', 'pytorch', 'machine learning'],
      'DevOps Engineer': ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux'],
      'Mobile Developer': ['react native', 'flutter', 'swift', 'kotlin'],
      'Software Engineer': ['programming', 'algorithms', 'data structures']
    };

    // Score each role
    for (const [role, requirements] of Object.entries(roleRequirements)) {
      const matchCount = requirements.filter(req => 
        Array.from(skillSet).some(skill => skill.includes(req.toLowerCase()))
      ).length;
      
      const score = matchCount / requirements.length;
      
      if (score > 0.3) { // At least 30% match
        roles.push({ role, score });
      }
    }

    // Sort by score and return top 3
    return roles
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.role);
  }

  /**
   * Capitalize skill name
   */
  private static capitalizeSkill(skill: string): string {
    const specialCases: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'nosql': 'NoSQL',
      'api': 'API',
      'rest': 'REST',
      'graphql': 'GraphQL',
      'aws': 'AWS',
      'gcp': 'GCP',
      'ci/cd': 'CI/CD',
      'oop': 'OOP',
      'node.js': 'Node.js',
      'next.js': 'Next.js',
      'react': 'React',
      'vue': 'Vue',
      'angular': 'Angular',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'firebase': 'Firebase',
      'git': 'Git',
      'github': 'GitHub',
      'python': 'Python',
      'java': 'Java'
    };

    const lower = skill.toLowerCase().trim();
    if (specialCases[lower]) {
      return specialCases[lower];
    }

    return skill.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
