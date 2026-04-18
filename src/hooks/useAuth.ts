import { useApp } from '../contexts/AppContext';

export const useAuth = () => {
  const { user, userProfile, isLoading: loading } = useApp();

  return { user, userProfile, loading };
};
