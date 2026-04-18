import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseInitialized } from '../lib/firebase';
import { UserProfile } from '../types';
import { getUserProfile, updateUserPresence, ensureUserProfile } from '../lib/firestoreService';
import { UPDATE_INTERVALS } from '../constants';
import { useOnlineStatus, offlineQueue } from '../utils/offline';

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isOnline = useOnlineStatus(); // Use hook properly

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('versona_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('versona_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  // Auth state listener
  useEffect(() => {
    // If Firebase is not initialized, skip auth listener
    if (!firebaseInitialized || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // SAFE: Ensure user profile exists with sanitized data
          await ensureUserProfile(firebaseUser.uid, {
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || null,
          });
          
          // Load user profile
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          // Update user presence to online (with error handling)
          try {
            await updateUserPresence(firebaseUser.uid, true);
          } catch (presenceError) {
            console.error('Failed to update presence:', presenceError);
            // Non-critical error, don't block user
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Still try to update presence even if profile loading fails
          try {
            await updateUserPresence(firebaseUser.uid, true);
          } catch (presenceError) {
            console.error('Failed to update presence after profile error:', presenceError);
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update presence periodically
  useEffect(() => {
    if (!user || !firebaseInitialized) return;

    const intervalId = setInterval(async () => {
      await updateUserPresence(user.uid, true);
    }, UPDATE_INTERVALS.PRESENCE);

    // Update presence to offline on unmount
    return () => {
      clearInterval(intervalId);
      updateUserPresence(user.uid, false);
    };
  }, [user]);

  // Handle visibility change (tab active/inactive)
  useEffect(() => {
    if (!user || !firebaseInitialized) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      updateUserPresence(user.uid, isVisible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const value = {
    user,
    userProfile,
    isLoading,
    isOnline,
    theme,
    toggleTheme,
    refreshUserProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}