/**
 * Test browser-style login through Vite proxy
 * This simulates what the browser does when calling /api/auth/login
 */

const http = require('http');

async function testBrowserLogin() {
  console.log('🧪 Testing Browser-Style Login\n');
  console.log('============================================================\n');

  // Test 1: Login through Vite proxy (port 5173)
  console.log('1️⃣  Testing login through Vite proxy (http://localhost:5173/api/auth/login)...');
  
  const postData = JSON.stringify({
    email: 'admin@test.com',
    password: 'password'
  });

  const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Origin': 'http://localhost:5173'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('   Status:', res.statusCode);
        try {
          const jsonData = JSON.parse(data);
          console.log('   Response:', JSON.stringify(jsonData, null, 2));
          
          if (res.statusCode === 200) {
            console.log('   ✅ Login successful through Vite proxy!\n');
            resolve();
          } else {
            console.log('   ❌ Login failed through Vite proxy\n');
            reject(new Error(`Login failed with status ${res.statusCode}`));
          }
        } catch (e) {
          console.log('   Response (raw):', data);
          console.log('   ❌ Failed to parse response\n');
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ Request error:', error.message);
      console.log('   Note: Make sure Vite dev server is running on port 5173\n');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testBrowserLogin()
  .then(() => {
    console.log('============================================================');
    console.log('✅ All tests completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.log('============================================================');
    console.log('❌ Test failed:', error.message, '\n');
    process.exit(1);
  });
