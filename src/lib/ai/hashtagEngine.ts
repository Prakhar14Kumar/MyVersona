/**
 * Hashtag Suggestion Engine
 * TF-IDF based hashtag extraction and trending analysis
 */

import { tokenize, removeStopWords, calculateTF, extractNGrams } from './utils';

/**
 * Hashtag Engine
 */
export class HashtagEngine {
  private static readonly POPULAR_HASHTAGS: Record<string, string[]> = {
    career: [
      '#CareerGoals', '#JobHunt', '#Placement', '#Internship', '#StudentLife',
      '#CollegeToCareer', '#FreshersJobs', '#CareerGrowth', '#JobSearch',
      '#SkillDevelopment', '#TechCareers', '#CareerAdvice'
    ],
    entertainment: [
      '#CollegeLife', '#CampusFun', '#StudentVibes', '#CollegeDiaries',
      '#CampusLife', '#FunTimes', '#CollegeFest', '#StudentCommunity',
      '#CampusEvents', '#CollegeDays', '#HostelLife', '#CampusCulture'
    ],
    tech: [
      '#TechLife', '#Coding', '#Programming', '#DevLife', '#TechStudent',
      '#LearnToCode', '#WebDev', '#AppDev', '#TechSkills', '#Innovation'
    ],
    events: [
      '#Events', '#CampusEvents', '#CollegeFest', '#TechFest', '#CulturalFest',
      '#Workshop', '#Hackathon', '#Competition', '#Seminar', '#Conference'
    ],
    academic: [
      '#Academics', '#StudyTime', '#Exams', '#Learning', '#Education',
      '#StudyMotivation', '#StudentSuccess', '#AcademicGoals', '#Grades'
    ]
  };

  private static readonly KEYWORD_TO_HASHTAGS: Record<string, string[]> = {
    // Career keywords
    'job': ['#JobHunt', '#CareerGoals', '#Placement'],
    'internship': ['#Internship', '#CareerGrowth', '#LearningOpportunity'],
    'placement': ['#Placement', '#JobOffer', '#CareerSuccess'],
    'interview': ['#Interview', '#InterviewTips', '#CareerPrep'],
    'resume': ['#Resume', '#CVTips', '#CareerDevelopment'],
    'career': ['#CareerGoals', '#CareerAdvice', '#ProfessionalGrowth'],
    
    // Tech keywords
    'coding': ['#Coding', '#Programming', '#DevLife'],
    'code': ['#Code', '#Developer', '#TechLife'],
    'developer': ['#Developer', '#WebDev', '#SoftwareEngineering'],
    'programming': ['#Programming', '#LearnToCode', '#TechStudent'],
    'project': ['#Project', '#BuildInPublic', '#DevProject'],
    'hackathon': ['#Hackathon', '#CodingCompetition', '#Innovation'],
    
    // Event keywords
    'fest': ['#Fest', '#CollegeFest', '#CampusEvents'],
    'event': ['#Events', '#CampusLife', '#CollegeEvents'],
    'workshop': ['#Workshop', '#LearningSession', '#SkillBuilding'],
    'competition': ['#Competition', '#Contest', '#Challenge'],
    
    // Entertainment keywords
    'fun': ['#Fun', '#GoodTimes', '#CollegeFun'],
    'party': ['#Party', '#Celebration', '#CampusLife'],
    'music': ['#Music', '#MusicLover', '#CampusCulture'],
    'movie': ['#Movies', '#FilmBuff', '#Entertainment'],
    'game': ['#Gaming', '#Games', '#FunTime'],
    'meme': ['#Memes', '#Funny', '#Humor'],
    
    // Academic keywords
    'study': ['#Study', '#StudyTime', '#Academics'],
    'exam': ['#Exams', '#ExamPrep', '#StudyMotivation'],
    'learn': ['#Learning', '#Education', '#Knowledge'],
    'project': ['#Project', '#AcademicProject', '#Research']
  };

  /**
   * Suggest hashtags for post content
   */
  static suggest(postText: string, category?: 'entertainment' | 'career'): string[] {
    const suggestions = new Set<string>();
    const lowerText = postText.toLowerCase();
    const tokens = removeStopWords(tokenize(postText));

    // 1. Extract hashtags based on keywords
    for (const [keyword, hashtags] of Object.entries(this.KEYWORD_TO_HASHTAGS)) {
      if (lowerText.includes(keyword)) {
        hashtags.forEach(tag => suggestions.add(tag));
      }
    }

    // 2. Add category-specific popular hashtags
    if (category) {
      const categoryTags = this.POPULAR_HASHTAGS[category] || [];
      categoryTags.slice(0, 3).forEach(tag => suggestions.add(tag));
    }

    // 3. Add general popular hashtags
    this.POPULAR_HASHTAGS.entertainment.slice(0, 2).forEach(tag => suggestions.add(tag));

    // 4. Extract potential hashtags from n-grams
    const bigrams = extractNGrams(tokens, 2);
    for (const bigram of bigrams.slice(0, 3)) {
      const hashtagText = bigram
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      if (hashtagText.length >= 6 && hashtagText.length <= 20) {
        suggestions.add('#' + hashtagText);
      }
    }

    // 5. Convert important single words to hashtags
    const importantTokens = tokens
      .filter(t => t.length > 4 && !this.isCommonWord(t))
      .slice(0, 2);
    
    for (const token of importantTokens) {
      const capitalized = token.charAt(0).toUpperCase() + token.slice(1);
      suggestions.add('#' + capitalized);
    }

    // Return top 6 hashtags
    return Array.from(suggestions).slice(0, 6);
  }

  /**
   * Get trending hashtags for category
   */
  static getTrending(category: 'entertainment' | 'career' | 'all' = 'all'): string[] {
    if (category === 'all') {
      return [
        ...this.POPULAR_HASHTAGS.entertainment.slice(0, 3),
        ...this.POPULAR_HASHTAGS.career.slice(0, 3)
      ];
    }
    
    return this.POPULAR_HASHTAGS[category] || [];
  }

  /**
   * Check if word is too common for hashtag
   */
  private static isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'have', 'been', 'were', 'their', 'would', 'there', 'could',
      'people', 'time', 'year', 'work', 'make', 'know', 'think',
      'want', 'need', 'feel', 'come', 'good', 'new', 'first'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }

  /**
   * Validate hashtag format
   */
  static isValidHashtag(hashtag: string): boolean {
    // Must start with #, contain only alphanumeric and underscores, 3-30 chars
    const pattern = /^#[a-zA-Z0-9_]{2,29}$/;
    return pattern.test(hashtag);
  }

  /**
   * Clean and format hashtag
   */
  static formatHashtag(text: string): string {
    // Remove # if present, clean special chars, add # back
    let cleaned = text.replace(/^#/, '').replace(/[^a-zA-Z0-9_]/g, '');
    
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    return '#' + cleaned;
  }
}
