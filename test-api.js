// Simple API tests for the cricket coaching app
const BASE_URL = 'http://127.0.0.1:3002';
const headers = { 'x-local-admin': '1' };

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function runTests() {
  console.log('🧪 Running API Tests\n');

  await test('Health check', async () => {
    const data = await fetchJson(`${BASE_URL}/api/ping`);
    if (data.status !== 'ok') throw new Error('Health check failed');
  });

  await test('Unified coaches endpoint - all', async () => {
    const data = await fetchJson(`${BASE_URL}/api/coaches?limit=10`);
    if (!Array.isArray(data.items)) throw new Error('Expected items array');
    if (typeof data.total !== 'number') throw new Error('Expected total number');
  });

  await test('Unified coaches endpoint - pending filter', async () => {
    const data = await fetchJson(`${BASE_URL}/api/coaches?status=pending`);
    if (!Array.isArray(data.items)) throw new Error('Expected items array');
    if (data.items.some(c => c.status !== 'pending')) throw new Error('Filter not working');
  });

  await test('Unified coaches endpoint - search', async () => {
    const data = await fetchJson(`${BASE_URL}/api/coaches?search=aryan`);
    if (!Array.isArray(data.items)) throw new Error('Expected items array');
  });

  await test('Unified coaches endpoint - pagination', async () => {
    const data = await fetchJson(`${BASE_URL}/api/coaches?limit=1&offset=1`);
    if (!Array.isArray(data.items)) throw new Error('Expected items array');
    if (data.limit !== 1) throw new Error('Limit not applied');
    if (data.offset !== 1) throw new Error('Offset not applied');
  });

  await test('Payments schedule stub', async () => {
    const response = await fetch(`${BASE_URL}/api/payments/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 150, scheduledDate: '2025-09-20' })
    });
    const data = await response.json();
    if (!data.ok) throw new Error('Payment schedule failed');
  });

  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
