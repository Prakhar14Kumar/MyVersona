import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { getUserProfile } from '../lib/firestoreService';

interface AppState {
  // Auth state
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  
  // Theme state
  theme: 'light' | 'dark';
  
  // Network state
  isOnline: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsOnline: (isOnline: boolean) => void;
  
  // Complex Actions
  toggleTheme: () => void;
  initTheme: () => void;
  refreshUserProfile: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  theme: 'light',
  isOnline: navigator.onLine,
  
  setUser: (user) => set({ user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsOnline: (isOnline) => set({ isOnline }),
  
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('versona_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    set({ theme: newTheme });
  },
  
  initTheme: () => {
    const savedTheme = localStorage.getItem('versona_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      set({ theme: savedTheme });
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  },
  
  refreshUserProfile: async () => {
    const { user } = get();
    if (user) {
      const profile = await getUserProfile(user.uid);
      set({ userProfile: profile });
    }
  }
}));
