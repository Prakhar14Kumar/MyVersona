import { createBrowserRouter, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "./components/LoadingScreen";
import { LandingPage } from "./components/LandingPage";
import { RootLayout } from "./components/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthRoute } from "./components/AuthRoute";

// Lazy load pages for better performance
const SignupPage = lazy(() => import("./components/SignupPage").then(module => ({ default: module.SignupPage })));
const LoginPage = lazy(() => import("./components/LoginPage").then(module => ({ default: module.LoginPage })));
const OnboardingFlow = lazy(() => import("./components/OnboardingFlow").then(module => ({ default: module.OnboardingFlow })));
const FeedPage = lazy(() => import("./components/FeedPage").then(module => ({ default: module.FeedPage })));
const CollegePage = lazy(() => import("./components/CollegePage").then(module => ({ default: module.CollegePage })));
const ChatPage = lazy(() => import("./components/ChatPage").then(module => ({ default: module.ChatPage })));
const ExplorePage = lazy(() => import("./components/ExplorePage").then(module => ({ default: module.ExplorePage })));
const SettingsPage = lazy(() => import("./components/SettingsPage").then(module => ({ default: module.SettingsPage })));
const CareerPage = lazy(() => import("./components/CareerPage").then(module => ({ default: module.CareerPage })));
const GrowthDashboard = lazy(() => import("./components/GrowthDashboard").then(module => ({ default: module.GrowthDashboard })));
const SearchPage = lazy(() => import("./components/SearchPage").then(module => ({ default: module.SearchPage })));
const ProfilePage = lazy(() => import("./components/ProfilePage").then(module => ({ default: module.ProfilePage })));
const BookmarksPage = lazy(() => import("./components/BookmarksPage").then(module => ({ default: module.BookmarksPage })));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: (
          <AuthRoute>
            <LandingPage />
          </AuthRoute>
        ),
      },
      {
        path: "/signup",
        element: (
          <AuthRoute>
            <Suspense fallback={<LoadingScreen />}>
              <SignupPage />
            </Suspense>
          </AuthRoute>
        ),
      },
      {
        path: "/login",
        element: (
          <AuthRoute>
            <Suspense fallback={<LoadingScreen />}>
              <LoginPage />
            </Suspense>
          </AuthRoute>
        ),
      },
      {
        path: "/onboarding",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <OnboardingFlow />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/feed",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <FeedPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <ExplorePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/college",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <CollegePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/chat",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <ChatPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/career",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <CareerPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/search",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <SearchPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/growth",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <GrowthDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/:userId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/college/:collegeId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <CollegePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/bookmarks",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <BookmarksPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/feed" replace />,
      },
    ],
  },
]);