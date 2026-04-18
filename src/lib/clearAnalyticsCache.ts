/**
 * Clear Analytics Cache and Reload
 * 
 * Run this in browser console to clear all analytics-related caches
 * and force reload the app with the latest analytics code
 */

export function clearAnalyticsCache(): void {
  console.log('🧹 [Analytics] Clearing all caches...\n');
  
  // Clear localStorage
  const analyticsKeys = Object.keys(localStorage).filter(key => 
    key.includes('firebase') || key.includes('analytics')
  );
  
  if (analyticsKeys.length > 0) {
    console.log(`   ✅ Removing ${analyticsKeys.length} localStorage items`);
    analyticsKeys.forEach(key => localStorage.removeItem(key));
  }
  
  // Clear sessionStorage
  const sessionKeys = Object.keys(sessionStorage).filter(key =>
    key.includes('firebase') || key.includes('analytics')
  );
  
  if (sessionKeys.length > 0) {
    console.log(`   ✅ Removing ${sessionKeys.length} sessionStorage items`);
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
  }
  
  // Clear IndexedDB (Firebase uses this)
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      const firebaseDbs = databases.filter(db => 
        db.name?.includes('firebase') || db.name?.includes('firebaseLocalStorage')
      );
      firebaseDbs.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`   ✅ Deleted IndexedDB: ${db.name}`);
        }
      });
    });
  }
  
  console.log('\n✅ Cache cleared!');
  console.log('🔄 Hard reloading page in 2 seconds...\n');
  
  setTimeout(() => {
    // Hard reload (bypass cache)
    window.location.reload();
  }, 2000);
}

// Auto-export to window for console access
if (typeof window !== 'undefined') {
  (window as any).clearAnalyticsCache = clearAnalyticsCache;
  
  // Add version marker
  const ANALYTICS_VERSION = '1.1.0-fixed';
  (window as any).ANALYTICS_VERSION = ANALYTICS_VERSION;
  
  console.log(`[Analytics] Version ${ANALYTICS_VERSION} loaded`);
  console.log('[Analytics] To clear cache: clearAnalyticsCache()');
}

export const ANALYTICS_VERSION = '1.1.0-fixed';
