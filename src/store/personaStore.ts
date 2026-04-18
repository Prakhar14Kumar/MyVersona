/**
 * Global Persona State Management (Zustand)
 * Extremely fast, non-blocking state to flip between 'social' and 'career' modes flawlessly.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PersonaState = 'social' | 'career';

interface PersonaStore {
  persona: PersonaState;
  togglePersona: () => void;
  setPersona: (mode: PersonaState) => void;
}

export const usePersonaStore = create<PersonaStore>()(
  persist(
    (set) => ({
      persona: 'social', // Default to casual mode
      
      togglePersona: () => set((state) => {
        const nextMode = state.persona === 'social' ? 'career' : 'social';
        // Immediately mutate the DOM for instant Tailwind/CSS inheritance
        document.documentElement.setAttribute('data-persona', nextMode);
        return { persona: nextMode };
      }),
      
      setPersona: (mode) => set(() => {
        document.documentElement.setAttribute('data-persona', mode);
        return { persona: mode };
      }),
    }),
    {
      name: 'versona-persona-storage',
    }
  )
);
