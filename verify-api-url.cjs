/**
 * Verify that the client code is configured to call port 3000 directly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying API URL Configuration\n');
console.log('============================================================\n');

// Check client/src/lib/api.ts
const apiTsPath = path.join(__dirname, 'client/src/lib/api.ts');
const apiTsContent = fs.readFileSync(apiTsPath, 'utf8');

console.log('1️⃣  Checking client/src/lib/api.ts...');
if (apiTsContent.includes("API_BASE_URL")) {
  console.log('   ✅ API_BASE_URL constant found');
  
  if (apiTsContent.includes("'http://localhost:3000'")) {
    console.log('   ✅ Default URL is http://localhost:3000');
  } else {
    console.log('   ❌ Default URL is NOT http://localhost:3000');
  }
  
  if (apiTsContent.includes("VITE_API_BASE_URL")) {
    console.log('   ✅ Uses VITE_API_BASE_URL environment variable');
  } else {
    console.log('   ⚠️  Does not use VITE_API_BASE_URL environment variable');
  }
} else {
  console.log('   ❌ API_BASE_URL constant NOT found');
}

// Check client/src/auth/session.tsx
const sessionTsxPath = path.join(__dirname, 'client/src/auth/session.tsx');
const sessionTsxContent = fs.readFileSync(sessionTsxPath, 'utf8');

console.log('\n2️⃣  Checking client/src/auth/session.tsx...');
if (sessionTsxContent.includes("API_BASE_URL")) {
  console.log('   ✅ API_BASE_URL constant found');
  
  if (sessionTsxContent.includes("'http://localhost:3000'")) {
    console.log('   ✅ Default URL is http://localhost:3000');
  } else {
    console.log('   ❌ Default URL is NOT http://localhost:3000');
  }
  
  if (sessionTsxContent.includes("${API_BASE_URL}/api/auth/login")) {
    console.log('   ✅ Login calls use ${API_BASE_URL}/api/auth/login');
  } else {
    console.log('   ❌ Login calls do NOT use ${API_BASE_URL}/api/auth/login');
  }
  
  if (sessionTsxContent.includes("${API_BASE_URL}/api/_whoami")) {
    console.log('   ✅ Whoami calls use ${API_BASE_URL}/api/_whoami');
  } else {
    console.log('   ❌ Whoami calls do NOT use ${API_BASE_URL}/api/_whoami');
  }
} else {
  console.log('   ❌ API_BASE_URL constant NOT found');
}

console.log('\n============================================================');
console.log('✅ Verification complete!\n');
console.log('Expected behavior in browser:');
console.log('  - Login requests will go to: http://localhost:3000/api/auth/login');
console.log('  - Whoami requests will go to: http://localhost:3000/api/_whoami');
console.log('  - Session requests will go to: http://localhost:3000/api/session/me');
console.log('\nTo override in production, set VITE_API_BASE_URL environment variable.\n');
