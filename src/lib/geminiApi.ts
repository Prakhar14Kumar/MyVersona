/**
 * Gemini AI Feature Service
 * Integrates cleanly with the new secure apiClient.
 */

import { apiClient } from './apiClient';

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const GeminApiService = {
  /**
   * Generates a tailored learning path.
   * Path: /api/gemini/learning-path (PROTECTED)
   */
  async getLearningPath(currentSkills: string[], targetRole: string) {
    // The apiClient cleanly handles Token extraction and Bearer Injection automatically.
    return await apiClient.post<APIResponse<any>>('/api/gemini/learning-path', {
      current_skills: currentSkills,
      target_role: targetRole,
    });
  },

  /**
   * Enhances a raw resume string securely.
   * Path: /api/gemini/resume/enhance (PROTECTED)
   */
  async enhanceResume(resumeText: string) {
    return await apiClient.post<APIResponse<any>>('/api/gemini/resume/enhance', {
      resume_text: resumeText,
    });
  },

  /**
   * Generates AI Interview questions securely.
   * Path: /api/gemini/interview-questions (PROTECTED)
   */
  async generateInterviewQuestions(role: string, experienceLevel: 'entry' | 'intermediate' | 'senior' = 'entry') {
    return await apiClient.post<APIResponse<any>>('/api/gemini/interview-questions', {
      role,
      experience_level: experienceLevel
    });
  }
};
