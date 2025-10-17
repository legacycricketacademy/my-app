#!/usr/bin/env node

/**
 * CI export check - ensures critical dependencies export what we need
 * Prevents runtime crashes from missing exports
 */

async function checkDateFnsTz() {
  try {
    const m = await import('date-fns-tz');
    
    // date-fns-tz v2 API: zonedTimeToUtc, utcToZonedTime
    // date-fns-tz v3 API: fromZonedTime, toZonedTime
    
    // Check which version is installed and verify correct export exists
    const hasV2Export = 'zonedTimeToUtc' in m;
    const hasV3Export = 'fromZonedTime' in m;
    
    if (!hasV2Export && !hasV3Export) {
      console.error('❌ date-fns-tz missing timezone conversion exports');
      console.error('Available exports:', Object.keys(m));
      console.error('Expected: zonedTimeToUtc (v2) OR fromZonedTime (v3)');
      process.exit(1);
    }
    
    if (hasV2Export) {
      console.log('✅ date-fns-tz v2 detected: exports zonedTimeToUtc');
    } else {
      console.log('✅ date-fns-tz v3 detected: exports fromZonedTime');
    }
    
    // We intentionally do NOT use utcToZonedTime/toZonedTime on server
    // Server returns UTC only; client handles timezone display
    
  } catch (e) {
    console.error('❌ Failed to import date-fns-tz:', e.message);
    process.exit(1);
  }
}

async function checkCriticalDeps() {
  console.log('🔍 Checking critical dependency exports...\n');
  
  await checkDateFnsTz();
  
  console.log('\n✅ All critical exports verified');
  process.exit(0);
}

checkCriticalDeps();

