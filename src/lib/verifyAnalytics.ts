/**
 * Analytics Verification Utility
 * 
 * Run this in browser console to verify analytics is working:
 * ```
 * import { verifyAnalytics } from './lib/verifyAnalytics';
 * verifyAnalytics();
 * ```
 */

import { getAnalyticsInstance } from './firebase';
import { fireTestEvent, trackEvent, AnalyticsEvents } from './analytics';

export async function verifyAnalytics(): Promise<void> {
  console.log('🔍 [Analytics Verification] Starting verification...\n');
  
  const results: { check: string; status: string; details: string }[] = [];
  
  // Check 1: Analytics instance exists
  const analytics = getAnalyticsInstance();
  results.push({
    check: 'Analytics Instance',
    status: analytics ? '✅ PASS' : '❌ FAIL',
    details: analytics ? 'Analytics object exists' : 'Analytics is null - may be blocked'
  });
  
  // Check 2: Browser environment
  results.push({
    check: 'Browser Environment',
    status: typeof window !== 'undefined' ? '✅ PASS' : '❌ FAIL',
    details: typeof window !== 'undefined' ? 'Running in browser' : 'Not in browser'
  });
  
  // Check 3: measurementId
  const measurementId = 'G-J8CB4FXNX9';
  results.push({
    check: 'Measurement ID',
    status: '✅ PASS',
    details: `Using: ${measurementId}`
  });
  
  // Check 4: Network connectivity
  results.push({
    check: 'Network Status',
    status: navigator.onLine ? '✅ PASS' : '⚠️ WARNING',
    details: navigator.onLine ? 'Online' : 'Offline - events won\'t send'
  });
  
  // Check 5: Try to fire test event
  if (analytics) {
    try {
      await fireTestEvent();
      results.push({
        check: 'Test Event',
        status: '✅ PASS',
        details: 'Test event fired successfully'
      });
    } catch (error) {
      results.push({
        check: 'Test Event',
        status: '❌ FAIL',
        details: `Error: ${error}`
      });
    }
  }
  
  // Print results table
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ANALYTICS VERIFICATION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  results.forEach(({ check, status, details }) => {
    console.log(`${status} ${check}`);
    console.log(`   ${details}\n`);
  });
  
  const passed = results.filter(r => r.status.includes('✅')).length;
  const total = results.length;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📈 SCORE: ${passed}/${total} checks passed\n`);
  
  if (analytics && navigator.onLine) {
    console.log('✅ Analytics is working!');
    console.log('📊 Check Firebase Realtime Dashboard:');
    console.log('   https://console.firebase.google.com/project/versona-app/analytics/realtime\n');
    console.log('⏱️  Events may take 5-30 seconds to appear in Realtime.');
    console.log('🔄 Refresh the dashboard after waiting.\n');
  } else if (!analytics) {
    console.log('ℹ️  Analytics is not available.');
    console.log('💡 Possible reasons:');
    console.log('   • AdBlock is enabled');
    console.log('   • Privacy mode/Incognito');
    console.log('   • Browser extensions blocking analytics');
    console.log('   • Analytics not supported in this environment\n');
  } else if (!navigator.onLine) {
    console.log('⚠️  You are offline. Events won\'t send until reconnected.\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Check network requests to verify events are being sent
 */
export function checkNetworkRequests(): void {
  console.log('🔍 [Analytics Verification] Checking network requests...\n');
  console.log('1. Open DevTools Network tab');
  console.log('2. Filter for: "google-analytics.com"');
  console.log('3. Look for requests to: "/g/collect"');
  console.log('4. Each event should create 1 request\n');
  console.log('Expected URL pattern:');
  console.log('  https://www.google-analytics.com/g/collect?...\n');
  console.log('If you see these requests, analytics is working! ✅\n');
}

/**
 * Fire multiple test events to verify tracking
 */
export async function fireMultipleTestEvents(): Promise<void> {
  console.log('🔥 [Analytics Verification] Firing multiple test events...\n');
  
  const events = [
    { name: AnalyticsEvents.ANALYTICS_TEST, params: { test: 'event_1' } },
    { name: AnalyticsEvents.SCREEN_VIEW, params: { screen_name: 'Test Screen' } },
    { name: 'custom_test_event', params: { source: 'verification' } },
  ];
  
  for (const event of events) {
    console.log(`  Firing: ${event.name}...`);
    await trackEvent(event.name, event.params, { skipDedup: true });
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between events
  }
  
  console.log('\n✅ All test events fired!');
  console.log('📊 Check Firebase Realtime Dashboard in 5-30 seconds.\n');
}

// Export verification functions for console access
if (typeof window !== 'undefined') {
  (window as any).verifyAnalytics = verifyAnalytics;
  (window as any).checkNetworkRequests = checkNetworkRequests;
  (window as any).fireMultipleTestEvents = fireMultipleTestEvents;
  
  console.log('🔍 [Analytics Verification] Utilities loaded!');
  console.log('   Run: verifyAnalytics()');
  console.log('   Run: checkNetworkRequests()');
  console.log('   Run: fireMultipleTestEvents()\n');
}
