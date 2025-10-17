#!/usr/bin/env node

/**
 * CI export check - ensures critical dependencies export what we need
 * Prevents runtime crashes from missing exports
 */

async function checkDateFnsTz() {
  try {
    const m = await import('date-fns-tz');
    
    // date-fns-tz v3 renamed functions:
    // - zonedTimeToUtc → fromZonedTime
    // - utcToZonedTime → toZonedTime
    
    // We MUST have fromZonedTime for server-side timezone conversion
    if (!('fromZonedTime' in m)) {
      console.error('❌ date-fns-tz missing fromZonedTime export');
      console.error('Available exports:', Object.keys(m));
      process.exit(1);
    }
    
    console.log('✅ date-fns-tz exports fromZonedTime');
    
    // We intentionally do NOT use toZonedTime on server
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

