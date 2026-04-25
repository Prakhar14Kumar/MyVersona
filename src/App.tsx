import { useState, lazy, Suspense, useEffect } from "react";
import { RouterProvider } from "react-router";
import { AppProvider } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { router } from "./routes";
import { useAuth } from "./hooks/useAuth";
import { initializeAndVerifyAnalytics } from "./lib/analytics";
import { initBehaviorTracker, trackAppOpen } from "./lib/userBehaviorTracker";
import { setupGlobalErrorHandlers } from "./lib/errorLogger";


function AppContent() {
  const { user } = useAuth();

  // Initialize analytics on app mount
  useEffect(() => {
    initializeAndVerifyAnalytics();
    initBehaviorTracker();
  }, []);

  // Track app open when user is authenticated
  useEffect(() => {
    if (user?.uid) {
      trackAppOpen(user.uid);
    }
  }, [user?.uid]);

  // Setup global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers(user?.uid);
  }, [user?.uid]);

  // Enable automatic token refresh

  return (
    <>
      <RouterProvider router={router} />
      <PerformanceMonitor />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundaryWrapper>
        <AppContent />
      </ErrorBoundaryWrapper>
    </AppProvider>
  );
}

// Wrapper to get userId from context and pass to ErrorBoundary
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return (
    <ErrorBoundary userId={user?.uid}>
      {children}
    </ErrorBoundary>
  );
}