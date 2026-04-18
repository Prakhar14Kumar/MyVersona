/**
 * Career Recommendation Engine
 * Uses skill-based matching and collaborative filtering
 */

import { cosineSimilarity, jaccardSimilarity, weightedAverage, tokenize, removeStopWords } from './utils';

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  growth_potential: 'Very High' | 'High' | 'Medium' | 'Low';
  avg_salary_range: string;
  demand_score: number; // 0-1
  entry_barrier: 'Low' | 'Medium' | 'High';
}

export interface UserProfile {
  skills?: string[];
  interests?: string[];
  education?: string;
  experience?: string;
}

export interface CareerRecommendation {
  title: string;
  match_score: number;
  description: string;
  skills_required: string[];
  growth_potential: string;
  avg_salary: string;
}

/**
 * Career database (Indian market focused)
 */
const CAREER_DATABASE: CareerPath[] = [
  {
    id: 'ai_ml_engineer',
    title: 'AI/ML Engineer',
    description: 'Build and deploy machine learning models for production systems',
    required_skills: ['python', 'machine learning', 'statistics', 'mathematics'],
    preferred_skills: ['tensorflow', 'pytorch', 'mlops', 'deep learning', 'data science'],
    growth_potential: 'Very High',
    avg_salary_range: '₹12-25 LPA',
    demand_score: 0.95,
    entry_barrier: 'High'
  },
  {
    id: 'full_stack_dev',
    title: 'Full Stack Developer',
    description: 'Design and develop end-to-end web applications',
    required_skills: ['javascript', 'html', 'css', 'backend'],
    preferred_skills: ['react', 'node.js', 'typescript', 'postgresql', 'mongodb', 'express'],
    growth_potential: 'High',
    avg_salary_range: '₹8-18 LPA',
    demand_score: 0.92,
    entry_barrier: 'Medium'
  },
  {
    id: 'data_scientist',
    title: 'Data Scientist',
    description: 'Extract insights from data and build predictive models',
    required_skills: ['python', 'statistics', 'sql', 'data analysis'],
    preferred_skills: ['pandas', 'numpy', 'tableau', 'machine learning', 'visualization'],
    growth_potential: 'Very High',
    avg_salary_range: '₹10-20 LPA',
    demand_score: 0.90,
    entry_barrier: 'High'
  },
  {
    id: 'frontend_engineer',
    title: 'Frontend Engineer',
    description: 'Create beautiful and responsive user interfaces',
    required_skills: ['javascript', 'html', 'css', 'react'],
    preferred_skills: ['typescript', 'next.js', 'tailwind', 'ui/ux', 'responsive design'],
    growth_potential: 'High',
    avg_salary_range: '₹7-15 LPA',
    demand_score: 0.88,
    entry_barrier: 'Low'
  },
  {
    id: 'backend_engineer',
    title: 'Backend Engineer',
    description: 'Build scalable server-side applications and APIs',
    required_skills: ['backend', 'database', 'api', 'server'],
    preferred_skills: ['node.js', 'python', 'java', 'postgresql', 'redis', 'microservices'],
    growth_potential: 'High',
    avg_salary_range: '₹8-16 LPA',
    demand_score: 0.87,
    entry_barrier: 'Medium'
  },
  {
    id: 'product_manager',
    title: 'Product Manager',
    description: 'Define product strategy and work with cross-functional teams',
    required_skills: ['product strategy', 'user research', 'agile'],
    preferred_skills: ['analytics', 'roadmap planning', 'stakeholder management', 'wireframing'],
    growth_potential: 'High',
    avg_salary_range: '₹15-30 LPA',
    demand_score: 0.85,
    entry_barrier: 'High'
  },
  {
    id: 'devops_engineer',
    title: 'DevOps Engineer',
    description: 'Automate deployment and manage cloud infrastructure',
    required_skills: ['linux', 'cloud', 'automation', 'ci/cd'],
    preferred_skills: ['docker', 'kubernetes', 'aws', 'terraform', 'jenkins', 'monitoring'],
    growth_potential: 'Very High',
    avg_salary_range: '₹10-22 LPA',
    demand_score: 0.89,
    entry_barrier: 'Medium'
  },
  {
    id: 'mobile_dev',
    title: 'Mobile App Developer',
    description: 'Build native and cross-platform mobile applications',
    required_skills: ['mobile development', 'ui/ux'],
    preferred_skills: ['react native', 'flutter', 'swift', 'kotlin', 'firebase'],
    growth_potential: 'High',
    avg_salary_range: '₹7-16 LPA',
    demand_score: 0.84,
    entry_barrier: 'Medium'
  },
  {
    id: 'ui_ux_designer',
    title: 'UI/UX Designer',
    description: 'Design user experiences and create visual interfaces',
    required_skills: ['ui/ux', 'design', 'user research'],
    preferred_skills: ['figma', 'adobe xd', 'prototyping', 'user testing', 'wireframing'],
    growth_potential: 'High',
    avg_salary_range: '₹6-14 LPA',
    demand_score: 0.82,
    entry_barrier: 'Low'
  },
  {
    id: 'data_engineer',
    title: 'Data Engineer',
    description: 'Build data pipelines and infrastructure for analytics',
    required_skills: ['sql', 'python', 'etl', 'data warehousing'],
    preferred_skills: ['spark', 'airflow', 'kafka', 'big data', 'cloud'],
    growth_potential: 'Very High',
    avg_salary_range: '₹9-19 LPA',
    demand_score: 0.86,
    entry_barrier: 'Medium'
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Specialist',
    description: 'Protect systems and networks from security threats',
    required_skills: ['security', 'networking', 'cryptography'],
    preferred_skills: ['penetration testing', 'ethical hacking', 'compliance', 'incident response'],
    growth_potential: 'Very High',
    avg_salary_range: '₹8-18 LPA',
    demand_score: 0.83,
    entry_barrier: 'High'
  },
  {
    id: 'blockchain_dev',
    title: 'Blockchain Developer',
    description: 'Develop decentralized applications and smart contracts',
    required_skills: ['blockchain', 'smart contracts', 'cryptography'],
    preferred_skills: ['solidity', 'ethereum', 'web3', 'defi'],
    growth_potential: 'Very High',
    avg_salary_range: '₹10-25 LPA',
    demand_score: 0.78,
    entry_barrier: 'High'
  }
];

/**
 * Career Recommendation Engine
 */
export class CareerRecommendationEngine {
  /**
   * Get personalized career recommendations
   */
  static recommend(userProfile: UserProfile, topN: number = 4): CareerRecommendation[] {
    const userSkills = this.normalizeSkills([
      ...(userProfile.skills || []),
      ...(userProfile.interests || [])
    ]);

    const scoredCareers = CAREER_DATABASE.map(career => {
      const score = this.calculateMatchScore(userProfile, career, userSkills);
      return {
        career,
        score
      };
    });

    // Sort by score and return top N
    const topCareers = scoredCareers
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return topCareers.map(item => ({
      title: item.career.title,
      match_score: Math.round(item.score * 100) / 100,
      description: item.career.description,
      skills_required: item.career.required_skills.slice(0, 4).map(s => this.capitalizeSkill(s)),
      growth_potential: item.career.growth_potential,
      avg_salary: item.career.avg_salary_range
    }));
  }

  /**
   * Calculate match score between user and career
   */
  private static calculateMatchScore(
    userProfile: UserProfile,
    career: CareerPath,
    userSkills: Set<string>
  ): number {
    const careerSkills = new Set([
      ...career.required_skills,
      ...career.preferred_skills
    ]);

    // 1. Skill overlap score (40% weight)
    const skillScore = jaccardSimilarity(userSkills, careerSkills);

    // 2. Required skills match (30% weight)
    const requiredSkillsSet = new Set(career.required_skills);
    const requiredMatchCount = [...userSkills].filter(s => requiredSkillsSet.has(s)).length;
    const requiredScore = requiredSkillsSet.size === 0 
      ? 0 
      : requiredMatchCount / requiredSkillsSet.size;

    // 3. Market demand score (20% weight)
    const demandScore = career.demand_score;

    // 4. Experience alignment (10% weight)
    const experienceScore = this.getExperienceScore(userProfile.experience, career);

    // Weighted average
    const finalScore = weightedAverage(
      [skillScore, requiredScore, demandScore, experienceScore],
      [0.4, 0.3, 0.2, 0.1]
    );

    return finalScore;
  }

  /**
   * Normalize skills to lowercase and standardize
   */
  private static normalizeSkills(skills: string[]): Set<string> {
    const normalized = new Set<string>();
    
    for (const skill of skills) {
      const tokens = tokenize(skill);
      for (const token of tokens) {
        if (token.length > 2) {
          normalized.add(token);
        }
      }
    }
    
    return normalized;
  }

  /**
   * Get experience alignment score
   */
  private static getExperienceScore(experience: string | undefined, career: CareerPath): number {
    if (!experience) return 0.5; // Neutral for no experience data

    const expLower = experience.toLowerCase();
    
    // Extract years of experience
    const yearsMatch = expLower.match(/(\d+)\s*(year|yr)/);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;

    // Freshers (0-1 years)
    if (years <= 1) {
      return career.entry_barrier === 'Low' ? 0.9 : 
             career.entry_barrier === 'Medium' ? 0.6 : 0.3;
    }
    
    // Intermediate (2-4 years)
    if (years <= 4) {
      return career.entry_barrier === 'High' ? 0.9 :
             career.entry_barrier === 'Medium' ? 0.8 : 0.7;
    }
    
    // Experienced (5+ years)
    return 0.8;
  }

  /**
   * Capitalize skill name for display
   */
  private static capitalizeSkill(skill: string): string {
    const specialCases: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'api': 'API',
      'ui/ux': 'UI/UX',
      'ci/cd': 'CI/CD',
      'etl': 'ETL',
      'aws': 'AWS',
      'mlops': 'MLOps',
      'defi': 'DeFi',
      'ai': 'AI',
      'ml': 'ML'
    };

    const lower = skill.toLowerCase();
    if (specialCases[lower]) {
      return specialCases[lower];
    }

    return skill.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
