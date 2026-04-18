import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";

interface AuthRouteProps {
  children: React.ReactNode;
}

export function AuthRoute({ children }: AuthRouteProps) {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to feed if already authenticated
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
