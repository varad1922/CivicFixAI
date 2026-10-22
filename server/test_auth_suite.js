const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }
  return { status: response.status, data };
}

async function runTests() {
  console.log('--- STARTING CIVICFIX AUTH & API TEST SUITE ---\n');
  let passed = 0;
  let failed = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // 1. Citizen Login
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'citizen@civicfix.org',
        password: 'Citizen@123',
        requestedRole: 'citizen'
      })
    });
    report('1. Citizen login succeeds', res.status === 200 && res.data?.token && res.data?.role === 'citizen', JSON.stringify(res.data));
  } catch (err) {
    report('1. Citizen login', false, err.message);
  }

  // 2. Authority Login
  let authorityToken = null;
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'authority@civicfix.org',
        password: 'Authority@123',
        requestedRole: 'authority'
      })
    });
    authorityToken = res.data?.token;
    report('2. Authority login succeeds', res.status === 200 && res.data?.role === 'authority', JSON.stringify(res.data));
  } catch (err) {
    report('2. Authority login', false, err.message);
  }

  // 3. Authority Pending Verification Check
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'pending.authority@civicfix.org',
        password: 'Authority@123',
        requestedRole: 'authority'
      })
    });
    report('3. Pending authority blocked with 403', res.status === 403 && res.data?.message?.includes('verification'), JSON.stringify(res.data));
  } catch (err) {
    report('3. Pending authority blocked', false, err.message);
  }

  // 4. Admin Login
  let adminToken = null;
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@civicfix.org',
        password: 'Admin@123',
        requestedRole: 'admin'
      })
    });
    adminToken = res.data?.token;
    report('4. Admin login succeeds', res.status === 200 && res.data?.role === 'admin', JSON.stringify(res.data));
  } catch (err) {
    report('4. Admin login', false, err.message);
  }

  // 5. Invalid Password
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'citizen@civicfix.org',
        password: 'WrongPassword999!',
        requestedRole: 'citizen'
      })
    });
    report('5. Invalid password returns 401', res.status === 401, JSON.stringify(res.data));
  } catch (err) {
    report('5. Invalid password', false, err.message);
  }

  // 6. Role mismatch
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'citizen@civicfix.org',
        password: 'Citizen@123',
        requestedRole: 'authority'
      })
    });
    report('6. Role mismatch returns 403', res.status === 403 && res.data?.message?.includes('registered as citizen'), JSON.stringify(res.data));
  } catch (err) {
    report('6. Role mismatch', false, err.message);
  }

  // 7. New Citizen Registration
  const testCitizenEmail = `test.citizen.${Date.now()}@example.com`;
  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Automated Tester',
        email: testCitizenEmail,
        password: 'TestPassword@123',
        phone: '9876543210',
        gender: 'female',
        role: 'citizen'
      })
    });
    report('7. Citizen registration succeeds', res.status === 201 && res.data?.token && res.data?.email === testCitizenEmail, JSON.stringify(res.data));
  } catch (err) {
    report('7. Citizen registration', false, err.message);
  }

  // 8. New Authority Registration (Must return 403 pending verification)
  const testAuthEmail = `test.authority.${Date.now()}@example.com`;
  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Officer K',
        email: testAuthEmail,
        password: 'TestPassword@123',
        phone: '9876543219',
        gender: 'male',
        role: 'authority',
        department: 'Road Authority',
        jurisdiction: 'Pune Central'
      })
    });
    report('8. Authority registration pending returns 403', res.status === 403 && res.data?.message?.includes('verification'), JSON.stringify(res.data));
  } catch (err) {
    report('8. Authority registration', false, err.message);
  }

  // 9. Protected Endpoint /api/auth/me
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'citizen@civicfix.org',
        password: 'Citizen@123'
      })
    });
    const citizenToken = loginRes.data?.token;
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${citizenToken}`
      }
    });
    report('9. Protected /auth/me returns citizen profile', meRes.status === 200 && meRes.data?.email === 'citizen@civicfix.org', JSON.stringify(meRes.data));
  } catch (err) {
    report('9. Protected /auth/me', false, err.message);
  }

  // 10. Admin Stats /api/admin/stats
  try {
    const statsRes = await request('/admin/stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    report('10. Admin /admin/stats returns statistics', statsRes.status === 200 && statsRes.data?.totalUsers !== undefined, JSON.stringify(statsRes.data));
  } catch (err) {
    report('10. Admin stats', false, err.message);
  }

  // 11. Public Issues Endpoint /api/issues
  try {
    const issuesRes = await request('/issues', {
      method: 'GET'
    });
    report('11. /api/issues returns civic issues list', issuesRes.status === 200 && Array.isArray(issuesRes.data) && issuesRes.data.length > 0, `Issues count: ${issuesRes.data?.length}`);
  } catch (err) {
    report('11. /api/issues', false, err.message);
  }

  console.log(`\n--- TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED ---`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
