import { liteClient as algoliasearch } from 'algoliasearch/lite';
import aa from 'search-insights';

// Environment Variables
const appId = import.meta.env.VITE_ALGOLIA_APP_ID || '';
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '';

// Initialize Algolia Client
export const searchClient = algoliasearch(appId, searchKey);

// Initialize Algolia Search Insights
aa('init', {
  appId,
  apiKey: searchKey,
  useCookie: true,
});

// Export Insights
export const searchInsights = aa;

// =========================
// Search Helper Functions
// =========================

// Search Users
export const searchUsers = async (query: string) => {
  try {
    const response = await searchClient.search([
      {
        indexName: 'users',
        query,
      },
    ]);

    return response.results[0];
  } catch (error) {
    console.error('Users search error:', error);
    return null;
  }
};

// Search Posts
export const searchPosts = async (query: string) => {
  try {
    const response = await searchClient.search([
      {
        indexName: 'posts',
        query,
      },
    ]);

    return response.results[0];
  } catch (error) {
    console.error('Posts search error:', error);
    return null;
  }
};

// Search Hashtags
export const searchHashtags = async (query: string) => {
  try {
    const response = await searchClient.search([
      {
        indexName: 'hashtags',
        query,
      },
    ]);

    return response.results[0];
  } catch (error) {
    console.error('Hashtags search error:', error);
    return null;
  }
};