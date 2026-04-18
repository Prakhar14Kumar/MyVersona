/**
 * Core AI Utilities
 * Shared mathematical and text processing functions for all AI algorithms
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Tokenize text into words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Remove common stop words
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'this'
]);

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter(token => !STOP_WORDS.has(token) && token.length > 2);
}

/**
 * Calculate Term Frequency (TF)
 */
export function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const totalTokens = tokens.length;
  
  if (totalTokens === 0) return tf;
  
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  
  // Normalize by total tokens
  for (const [term, count] of tf.entries()) {
    tf.set(term, count / totalTokens);
  }
  
  return tf;
}

/**
 * Calculate Inverse Document Frequency (IDF)
 */
export function calculateIDF(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = documents.length;
  
  if (totalDocs === 0) return idf;
  
  // Count document frequency for each term
  const docFreq = new Map<string, number>();
  for (const doc of documents) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }
  
  // Calculate IDF
  for (const [term, freq] of docFreq.entries()) {
    idf.set(term, Math.log(totalDocs / freq));
  }
  
  return idf;
}

/**
 * Create TF-IDF vector from text
 */
export function createTFIDFVector(
  text: string,
  idf: Map<string, number>,
  vocabulary: string[]
): number[] {
  const tokens = removeStopWords(tokenize(text));
  const tf = calculateTF(tokens);
  
  return vocabulary.map(term => {
    const tfValue = tf.get(term) || 0;
    const idfValue = idf.get(term) || 0;
    return tfValue * idfValue;
  });
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(val => val / magnitude);
}

/**
 * Calculate weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  let sum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
    totalWeight += weights[i];
  }
  
  return totalWeight === 0 ? 0 : sum / totalWeight;
}

/**
 * Simple hash function for strings (for feature hashing)
 */
export function simpleHash(str: string, numBuckets: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % numBuckets;
}

/**
 * Extract n-grams from tokens
 */
export function extractNGrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Sigmoid activation function
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Softmax function
 */
export function softmax(values: number[]): number[] {
  const maxVal = Math.max(...values);
  const expValues = values.map(v => Math.exp(v - maxVal));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  return expValues.map(v => v / sumExp);
}
