import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce onboarding completion for protected routes (except the onboarding page itself)
  // userProfile might be null if it's still loading from Firestore, so we only redirect if it's explicitly false
  if (userProfile && userProfile.profileCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
