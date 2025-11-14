#!/usr/bin/env node

/**
 * Test script to verify login flow
 * Run with: node test-login.js
 */

const http = require('http');

const API_BASE = 'http://localhost:3002';

function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'] || [];
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookies: setCookie,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookies: setCookie,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health check
    console.log('\n1️⃣  Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.body);

    // Test 2: Login with admin credentials
    console.log('\n2️⃣  Testing login with admin@test.com...');
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@test.com',
      password: 'password'
    });
    console.log(`   Status: ${login.status}`);
    console.log(`   Response:`, login.body);
    console.log(`   Cookies:`, login.cookies);

    if (login.status !== 200) {
      console.error('   ❌ Login failed!');
      return;
    }

    // Extract session cookie
    const sessionCookie = login.cookies.find(c => c.startsWith('sid=') || c.startsWith('connect.sid='));
    if (!sessionCookie) {
      console.error('   ❌ No session cookie received!');
      return;
    }
    console.log(`   ✅ Session cookie received`);

    // Test 3: Verify session with /api/user
    console.log('\n3️⃣  Testing /api/user with session cookie...');
    const user = await makeRequest('GET', '/api/user', null, sessionCookie);
    console.log(`   Status: ${user.status}`);
    console.log(`   Response:`, user.body);

    if (user.status === 200) {
      console.log('   ✅ User authenticated successfully!');
    } else {
      console.error('   ❌ User authentication failed!');
    }

    // Test 4: Verify session with /api/session/me
    console.log('\n4️⃣  Testing /api/session/me with session cookie...');
    const sessionMe = await makeRequest('GET', '/api/session/me', null, sessionCookie);
    console.log(`   Status: ${sessionMe.status}`);
    console.log(`   Response:`, sessionMe.body);

    // Test 5: Test logout
    console.log('\n5️⃣  Testing logout...');
    const logout = await makeRequest('POST', '/api/auth/logout', null, sessionCookie);
    console.log(`   Status: ${logout.status}`);
    console.log(`   Response:`, logout.body);

    // Test 6: Verify session is cleared
    console.log('\n6️⃣  Testing /api/user after logout...');
    const userAfterLogout = await makeRequest('GET', '/api/user', null, sessionCookie);
    console.log(`   Status: ${userAfterLogout.status}`);
    console.log(`   Response:`, userAfterLogout.body);

    if (userAfterLogout.status === 401) {
      console.log('   ✅ Session cleared successfully!');
    } else {
      console.error('   ❌ Session not cleared!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run tests
testLoginFlow();
