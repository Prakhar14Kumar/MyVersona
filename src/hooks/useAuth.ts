import { useAppStore } from '../store/appStore';

export const useAuth = () => {
  const user = useAppStore(state => state.user);
  const userProfile = useAppStore(state => state.userProfile);
  const loading = useAppStore(state => state.isLoading);

  return { user, userProfile, loading };
};
