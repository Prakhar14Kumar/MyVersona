// Firebase Configuration for VerSona
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Demo/placeholder values that should trigger warnings
const DEMO_VALUES = [
  'your_api_key_here',
  'your_actual_api_key_here',
  'your_firebase_api_key_here',
  'your_firebase_auth_domain_here',
  'your_firebase_project_id_here',
  'your_firebase_storage_bucket_here',
  'your_messaging_sender_id_here',
  'your_firebase_app_id_here',
  'your_measurement_id_here',
  'your-project',
  'versona-demo',
  'AIzaSyDEMO',
  'G-DEMO',
  'PLACEHOLDER',
];

// Check if a value is a demo/placeholder
const isDemoValue = (value: string): boolean => {
  // STRICT matching: prevents valid API keys with partial sequences from triggering placebo blocks
  return DEMO_VALUES.some(demo => value === demo) || 
         value === 'AIzaSyDEMO_PLACEHOLDER_ReplaceWithRealKey' || 
         value === 'versona-demo-placeholder.firebaseapp.com' || 
         value === 'versona-demo-placeholder' || 
         value === 'versona-demo-placeholder.appspot.com' ||
         value === '1:123456789012:web:PLACEHOLDER123456' ||
         value === 'G-PLACEHOLDER';
};

// Safely access environment variables with validation and fallback
const getEnvVarWithValidation = (key: string, fallback: string): string => {
  try {
    const value = import.meta?.env?.[key];
    
    if (!value || value === '') {
      return fallback;
    }
    
    return value;
  } catch {
    return fallback;
  }
};

// Firebase configuration from environment variables with working fallbacks
// IMPORTANT: Replace these fallback values with your real Firebase credentials
// The fallbacks allow the app to start, but Firebase operations won't work
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDEMO_PLACEHOLDER_ReplaceWithRealKey',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'versona-demo-placeholder.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'versona-demo-placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'versona-demo-placeholder.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:PLACEHOLDER123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-PLACEHOLDER'
};

// Check if using placeholder values
const hasPlaceholders = Object.entries(firebaseConfig).some(([key, value]) => 
  isDemoValue(value || '')
);

// Global flag to track if Firebase is properly initialized
export let firebaseInitialized = false;

// Track if we've already shown the warning
let hasShownWarning = false;

// Show warning about placeholder credentials
if (hasPlaceholders) {
  const isDev = (() => {
    try {
      return import.meta?.env?.DEV === true;
    } catch {
      return true; // Assume dev if we can't check
    }
  })();
  
  if (isDev && !hasShownWarning) {
    console.warn('⚠️  Firebase is using placeholder credentials.');
    console.warn('🔧 The app will start but Firebase operations will not work.');
    console.warn('📖 To fix: Add your real Firebase credentials.');
    console.warn('   See FIREBASE_SETUP_INSTRUCTIONS.md for details.');
    hasShownWarning = true;
  }
}

// Initialize Firebase only if we don't have placeholder values
// This prevents Firebase Auth from throwing invalid-api-key errors
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (!hasPlaceholders) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      firebaseInitialized = true;
      
      const isDev = (() => {
        try {
          return import.meta?.env?.DEV === true;
        } catch {
          return false;
        }
      })();
      
      if (isDev) {
        console.log('[Firebase] ✅ App initialized successfully');
      }
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('[Firebase] ❌ Initialization failed:', error);
    console.warn('[Firebase] 🔧 App will run in offline mode.');
    firebaseInitialized = false;
  }
} else {
  console.log('[Firebase] 🔧 Skipping initialization due to placeholder credentials');
  console.log('[Firebase] ℹ️  App will display UI but Firebase features will not work');
}

// Export Firebase services (may be null if using placeholders)
export { auth, db, storage, app };

// Initialize Analytics (only in browser environment with proper checks and real credentials)
let analytics: Analytics | null = null;
let analyticsInitializing = false;

/**
 * Initialize Firebase Analytics with safety checks
 * - Only runs in browser (not SSR)
 * - Only if Firebase was properly initialized
 * - Checks if Analytics is supported
 * - Prevents duplicate initialization
 * - Handles AdBlock gracefully
 */
export async function initializeAnalytics(): Promise<Analytics | null> {
  // Firebase not initialized
  if (!firebaseInitialized || !app) {
    return null;
  }

  // Already initialized
  if (analytics) {
    return analytics;
  }

  // Already initializing
  if (analyticsInitializing) {
    return null;
  }

  // Not in browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if measurementId is present and not a placeholder
  if (!firebaseConfig.measurementId || isDemoValue(firebaseConfig.measurementId)) {
    return null;
  }

  try {
    analyticsInitializing = true;
    
    // Check if Analytics is supported (detects AdBlock, privacy mode, etc.)
    const supported = await isSupported();
    
    if (!supported) {
      analyticsInitializing = false;
      return null;
    }

    // Initialize Analytics
    analytics = getAnalytics(app);
    
    analyticsInitializing = false;
    return analytics;
  } catch (error) {
    analyticsInitializing = false;
    return null;
  }
}

/**
 * Get Analytics instance (lazy initialization)
 */
export function getAnalyticsInstance(): Analytics | null {
  return analytics;
}

// Auto-initialize analytics when module loads (in browser only)
if (typeof window !== 'undefined' && firebaseInitialized) {
  const isDev = (() => {
    try {
      return import.meta?.env?.DEV === true;
    } catch {
      return false;
    }
  })();
  
  if (isDev) {
    console.log('%c[Analytics] 🎯 v2.0.0 LOADED', 'color: #10b981; font-weight: bold; font-size: 12px;');
  }
  
  initializeAnalytics().catch(() => {
    // Silently fail - analytics is optional
  });
}

export { analytics };
export default app;