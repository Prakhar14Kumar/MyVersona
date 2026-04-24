import React, { useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseInitialized } from '../lib/firebase';
import { getUserProfile, updateUserPresence, ensureUserProfile } from '../lib/firestoreService';
import { UPDATE_INTERVALS } from '../constants';
import { useOnlineStatus } from '../utils/offline';
import { useAppStore } from '../store/appStore';

export function AppProvider({ children }: { children: ReactNode }) {
  const setUser = useAppStore(state => state.setUser);
  const setUserProfile = useAppStore(state => state.setUserProfile);
  const setIsLoading = useAppStore(state => state.setIsLoading);
  const setIsOnline = useAppStore(state => state.setIsOnline);
  const initTheme = useAppStore(state => state.initTheme);
  const user = useAppStore(state => state.user);
  
  const isOnline = useOnlineStatus();

  // Sync online status
  useEffect(() => {
    setIsOnline(isOnline);
  }, [isOnline, setIsOnline]);

  // Initialize theme
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Auth state listener
  useEffect(() => {
    if (!firebaseInitialized || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          await ensureUserProfile(firebaseUser.uid, {
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || null,
          });
          
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          try {
            await updateUserPresence(firebaseUser.uid, true);
          } catch (e) {
            console.error('Failed to update presence:', e);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          try {
            await updateUserPresence(firebaseUser.uid, true);
          } catch (e) {}
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setIsLoading]);

  // Update presence periodically
  useEffect(() => {
    if (!user || !firebaseInitialized) return;

    const intervalId = setInterval(async () => {
      await updateUserPresence(user.uid, true);
    }, UPDATE_INTERVALS.PRESENCE);

    return () => {
      clearInterval(intervalId);
      updateUserPresence(user.uid, false);
    };
  }, [user]);

  // Handle visibility change
  useEffect(() => {
    if (!user || !firebaseInitialized) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      updateUserPresence(user.uid, isVisible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return <>{children}</>;
}

// Legacy proxy for backward compatibility. 
// For new features, use useAppStore directly with granular selectors.
export function useApp() {
  const store = useAppStore();
  return store;
}