/**
 * Text Classifier
 * Naive Bayes classifier for categorizing posts into entertainment/career
 */

import { tokenize, removeStopWords, calculateTF } from './utils';

interface ClassifierModel {
  classes: string[];
  vocabulary: Set<string>;
  classPriors: Map<string, number>;
  featureLikelihoods: Map<string, Map<string, number>>;
  totalDocs: number;
}

/**
 * Naive Bayes Text Classifier
 */
export class TextClassifier {
  private model: ClassifierModel | null = null;

  /**
   * Train the classifier with labeled examples
   */
  train(documents: Array<{ text: string; label: string }>): void {
    const classes = [...new Set(documents.map(d => d.label))];
    const vocabulary = new Set<string>();
    const classCounts = new Map<string, number>();
    const featureCounts = new Map<string, Map<string, number>>();

    // Initialize
    for (const className of classes) {
      classCounts.set(className, 0);
      featureCounts.set(className, new Map());
    }

    // Count features per class
    for (const doc of documents) {
      const tokens = removeStopWords(tokenize(doc.text));
      const className = doc.label;

      classCounts.set(className, (classCounts.get(className) || 0) + 1);

      const classFeatures = featureCounts.get(className)!;
      for (const token of tokens) {
        vocabulary.add(token);
        classFeatures.set(token, (classFeatures.get(token) || 0) + 1);
      }
    }

    // Calculate priors
    const classPriors = new Map<string, number>();
    const totalDocs = documents.length;
    for (const [className, count] of classCounts.entries()) {
      classPriors.set(className, count / totalDocs);
    }

    // Calculate likelihoods with Laplace smoothing
    const featureLikelihoods = new Map<string, Map<string, number>>();
    const vocabSize = vocabulary.size;

    for (const className of classes) {
      const classFeatures = featureCounts.get(className)!;
      const totalWords = Array.from(classFeatures.values()).reduce((a, b) => a + b, 0);
      const likelihoods = new Map<string, number>();

      for (const word of vocabulary) {
        const wordCount = classFeatures.get(word) || 0;
        // Laplace smoothing
        likelihoods.set(word, (wordCount + 1) / (totalWords + vocabSize));
      }

      featureLikelihoods.set(className, likelihoods);
    }

    this.model = {
      classes,
      vocabulary,
      classPriors,
      featureLikelihoods,
      totalDocs
    };
  }

  /**
   * Predict class for new text
   */
  predict(text: string): { class: string; confidence: number; probabilities: Map<string, number> } {
    if (!this.model) {
      // Fallback to keyword-based classification
      return this.keywordFallback(text);
    }

    const tokens = removeStopWords(tokenize(text));
    const classScores = new Map<string, number>();

    // Calculate log probabilities for each class
    for (const className of this.model.classes) {
      let logProb = Math.log(this.model.classPriors.get(className) || 0.5);
      const likelihoods = this.model.featureLikelihoods.get(className)!;

      for (const token of tokens) {
        if (this.model.vocabulary.has(token)) {
          logProb += Math.log(likelihoods.get(token) || 1e-10);
        }
      }

      classScores.set(className, logProb);
    }

    // Convert to probabilities
    const maxScore = Math.max(...Array.from(classScores.values()));
    const expScores = new Map<string, number>();
    let sumExp = 0;

    for (const [className, score] of classScores.entries()) {
      const expScore = Math.exp(score - maxScore);
      expScores.set(className, expScore);
      sumExp += expScore;
    }

    const probabilities = new Map<string, number>();
    for (const [className, expScore] of expScores.entries()) {
      probabilities.set(className, expScore / sumExp);
    }

    // Get best class
    const sortedClasses = Array.from(probabilities.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      class: sortedClasses[0][0],
      confidence: sortedClasses[0][1],
      probabilities
    };
  }

  /**
   * Keyword-based fallback (when model not trained)
   */
  private keywordFallback(text: string): { class: string; confidence: number; probabilities: Map<string, number> } {
    const careerKeywords = ['job', 'career', 'internship', 'placement', 'interview', 'resume', 'hiring', 'skills', 'salary', 'company'];
    const entertainmentKeywords = ['fun', 'party', 'event', 'fest', 'movie', 'music', 'game', 'meme', 'celebrate', 'enjoy'];

    const lowerText = text.toLowerCase();
    const careerScore = careerKeywords.filter(kw => lowerText.includes(kw)).length;
    const entertainmentScore = entertainmentKeywords.filter(kw => lowerText.includes(kw)).length;

    const total = careerScore + entertainmentScore;
    const isCareer = careerScore > entertainmentScore;

    const confidence = total === 0 ? 0.5 : (isCareer ? careerScore / total : entertainmentScore / total);

    const probabilities = new Map<string, number>();
    probabilities.set('career', total === 0 ? 0.5 : careerScore / total);
    probabilities.set('entertainment', total === 0 ? 0.5 : entertainmentScore / total);

    return {
      class: isCareer ? 'career' : 'entertainment',
      confidence: Math.max(0.5, confidence),
      probabilities
    };
  }
}

/**
 * Pre-trained classifier instance with Indian college context
 */
export const postClassifier = new TextClassifier();

// Train with representative examples
const trainingData = [
  // Career posts
  { text: "Looking for internship opportunities in software development", label: "career" },
  { text: "Anyone preparing for placement season? Need interview tips", label: "career" },
  { text: "Just got an offer from Google! Here's my preparation strategy", label: "career" },
  { text: "Resume review needed. Graduating next year", label: "career" },
  { text: "Career guidance needed for ML engineering path", label: "career" },
  { text: "Off-campus placement drives happening this month", label: "career" },
  { text: "Data science internship at startup - should I take it?", label: "career" },
  { text: "Salary negotiation tips for freshers", label: "career" },
  { text: "Company culture at TCS vs Infosys?", label: "career" },
  { text: "LinkedIn profile optimization for job hunting", label: "career" },
  
  // Entertainment posts
  { text: "College fest this weekend! Who's performing?", label: "entertainment" },
  { text: "Best memes from today's lecture lol", label: "entertainment" },
  { text: "Movie night at hostel. Suggestions?", label: "entertainment" },
  { text: "Gaming tournament happening tomorrow!", label: "entertainment" },
  { text: "Campus food review: New cafe is amazing", label: "entertainment" },
  { text: "Party at the rooftop tonight after exams", label: "entertainment" },
  { text: "Music fest lineup announced - so excited!", label: "entertainment" },
  { text: "Anyone up for cricket match this evening?", label: "entertainment" },
  { text: "Celebrating friend's birthday with surprise party", label: "entertainment" },
  { text: "Binge-watching recommendations for semester break", label: "entertainment" },
  
  // More career
  { text: "Coding interview patterns and common questions", label: "career" },
  { text: "How to build a strong GitHub profile", label: "career" },
  { text: "Product management vs software engineering career", label: "career" },
  { text: "Freelancing opportunities for college students", label: "career" },
  { text: "Networking tips for professionals", label: "career" },
  
  // More entertainment
  { text: "Weekend trip to Goa - who's in?", label: "entertainment" },
  { text: "New web series everyone is talking about", label: "entertainment" },
  { text: "College annual day performances registration open", label: "entertainment" },
  { text: "Hostel life hacks and funny moments", label: "entertainment" },
  { text: "Late night study group turned into meme session", label: "entertainment" }
];

postClassifier.train(trainingData);
