import { AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { firebaseInitialized } from '../lib/firebase';

/**
 * Warning banner that appears when Firebase is not properly initialized
 * Shows when using placeholder credentials or when Firebase fails to initialize
 */
export function DemoCredentialsWarning() {
  const [dismissed, setDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Only show in development
    const isDev = import.meta.env.DEV;
    if (!isDev) return;

    // Check if user has dismissed the warning in this session
    const isDismissed = sessionStorage.getItem('firebase-warning-dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Show warning if Firebase is not initialized
    if (!firebaseInitialized) {
      setShowWarning(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('firebase-warning-dismissed', 'true');
    setDismissed(true);
  };

  // Don't show if dismissed or Firebase is working
  if (dismissed || !showWarning) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <div className="text-sm">
              <strong className="font-semibold">⚠️ Firebase Not Configured:</strong>
              <span className="ml-2">
                You're using placeholder credentials. Authentication, database, and storage features will not work until you add real Firebase credentials.
              </span>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline hover:no-underline font-medium"
              >
                Get Firebase Credentials →
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}