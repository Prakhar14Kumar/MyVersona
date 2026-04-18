/**
 * Analytics Version Checker
 * 
 * Detects if you're running the latest analytics code
 * Run in console: checkAnalyticsVersion()
 */

export function checkAnalyticsVersion(): void {
  console.log('🔍 Checking Analytics Version...\n');
  
  const version = (window as any).ANALYTICS_VERSION;
  const expectedVersion = '1.1.0-fixed';
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 VERSION CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (version === expectedVersion) {
    console.log(`✅ CORRECT VERSION: ${version}`);
    console.log('✅ You have the latest analytics code\n');
  } else if (version) {
    console.log(`⚠️  OLD VERSION: ${version}`);
    console.log(`⚠️  Expected: ${expectedVersion}`);
    console.log('\n🔄 Action needed: Hard refresh browser');
    console.log('   Windows/Linux: Ctrl + Shift + R');
    console.log('   Mac: Cmd + Shift + R\n');
  } else {
    console.log('❌ NO VERSION FOUND');
    console.log('❌ Analytics code may not be loaded\n');
    console.log('🔄 Action needed: Reload page');
    console.log('   Or run: location.reload(true)\n');
  }
  
  // Check for old warning strings in console
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CHECKING FOR OLD CODE PATTERNS\n');
  
  // We can't directly check console history, but we can check the loaded modules
  const checks = {
    'Version marker exists': !!version,
    'Correct version': version === expectedVersion,
    'clearAnalyticsCache available': typeof (window as any).clearAnalyticsCache === 'function',
    'verifyAnalytics available': typeof (window as any).verifyAnalytics === 'function',
  };
  
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (version !== expectedVersion) {
    console.log('\n💡 RECOMMENDATION:');
    console.log('   1. Run: clearAnalyticsCache()');
    console.log('   2. Or hard refresh: Ctrl+Shift+R');
    console.log('   3. Or close all tabs and reopen\n');
  } else {
    console.log('\n✅ Everything looks good!\n');
    console.log('If you see any warnings, they are from:');
    console.log('  • Browser cache (hard refresh to fix)');
    console.log('  • ServiceWorker (unregister in DevTools)');
    console.log('  • Old browser tab (close and reopen)\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Check if we're running old code by looking at console methods
function detectOldAnalyticsCode(): boolean {
  // This is a heuristic - if we see the warning pattern, we know it's old code
  // We can't directly intercept console.warn, but we can check version
  const version = (window as any).ANALYTICS_VERSION;
  return !version || version !== '1.1.0-fixed';
}

// Auto-check on load (only in development)
if (typeof window !== 'undefined') {
  const isDev = (() => {
    try {
      return import.meta?.env?.DEV === true;
    } catch {
      return false;
    }
  })();
  
  if (isDev) {
    // Make function globally available
    (window as any).checkAnalyticsVersion = checkAnalyticsVersion;
    
    // Auto-check and warn if old version
    setTimeout(() => {
      const version = (window as any).ANALYTICS_VERSION;
      const expectedVersion = '1.1.0-fixed';
      
      if (version !== expectedVersion) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  OLD ANALYTICS CODE DETECTED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('Current version:', version || 'unknown');
        console.log('Expected version:', expectedVersion);
        console.log('');
        console.log('🔄 Please hard refresh your browser:');
        console.log('   Windows/Linux: Ctrl + Shift + R');
        console.log('   Mac: Cmd + Shift + R');
        console.log('');
        console.log('Or run: clearAnalyticsCache()');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
    }, 1000); // Check after 1 second to let everything load
  }
}

export { detectOldAnalyticsCode };
