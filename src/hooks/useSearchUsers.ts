import { useState, useEffect, useCallback } from 'react';
import { searchUsers } from '../lib/firestoreService';
import type { UserProfile } from '../lib/firebaseAuth';
import { debounce } from '../utils/debounce';

/**
 * Custom hook for searching users with debounce.
 * This prevents spamming Firestore reads on every keystroke.
 */
export function useSearchUsers(delayMs: number = 300) {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // The actual search function that hits Firestore
  const performSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const searchResults = await searchUsers(query);
      setResults(searchResults);
    } catch (err: any) {
      console.error('Error in useSearchUsers:', err);
      setError(err.message || 'An error occurred during search');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Memoize the debounced version so it's stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), delayMs),
    [delayMs]
  );

  return {
    results,
    isSearching,
    error,
    search: debouncedSearch,
    clearResults: () => setResults([]),
  };
}