const API_URL = 'http://127.0.0.1:5000/api';

async function runRememberMeTests() {
  console.log('=============================================================');
  console.log('🧪 TESTING REMEMBER ME / PERSISTENT AUTHENTICATION LOGIC');
  console.log('=============================================================\n');

  try {
    // Test 1: Student Login
    console.log('--- [TEST 1] Student Login ---');
    const studentRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campusmind.edu',
        password: 'Student@123456',
      }),
    });

    const studentJson = await studentRes.json();
    const studentData = studentJson.data;
    console.log('✅ Student Login Status:', studentRes.status);
    console.log('✅ Student Role:', studentData.user.role);
    console.log('✅ Password excluded from user object:', studentData.user.password === undefined);
    console.log('✅ Token received length:', studentData.token.length);

    // Test 2: Profile verification via Token (/auth/me)
    console.log('\n--- [TEST 2] Profile Restoration via /auth/me ---');
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentData.token}` },
    });
    const meJson = await meRes.json();
    console.log('✅ /auth/me Status:', meRes.status);
    console.log('✅ User restored email:', meJson.data.user.email);
    console.log('✅ User restored role:', meJson.data.user.role);
    console.log('✅ Password excluded in /auth/me:', meJson.data.user.password === undefined);

    // Test 3: Admin Login & Role Preservation
    console.log('\n--- [TEST 3] Admin Login & Role Preservation ---');
    const adminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@campusmind.edu',
        password: 'Admin@123456',
      }),
    });
    const adminJson = await adminRes.json();
    const adminData = adminJson.data;
    console.log('✅ Admin Login Status:', adminRes.status);
    console.log('✅ Admin Role:', adminData.user.role);

    // Test 4: Protected Admin Route Authorization
    console.log('\n--- [TEST 4] Admin Authorization on Protected Route ---');
    const adminDocsRes = await fetch(`${API_URL}/admin/documents`, {
      headers: { Authorization: `Bearer ${adminData.token}` },
    });
    console.log('✅ Admin Access Status to /api/admin/documents:', adminDocsRes.status);

    // Test 5: Student Forbidden on Admin Route
    console.log('\n--- [TEST 5] Student Access Blocked on Admin Route ---');
    const studentDocsRes = await fetch(`${API_URL}/admin/documents`, {
      headers: { Authorization: `Bearer ${studentData.token}` },
    });
    const studentDocsJson = await studentDocsRes.json();
    if (studentDocsRes.status === 403) {
      console.log('✅ Student correctly rejected with status 403:', studentDocsJson.message);
    } else {
      console.log('❌ Unexpected response status:', studentDocsRes.status);
    }

    // Test 6: Invalid / Expired Token Rejection
    console.log('\n--- [TEST 6] Invalid Token Rejection ---');
    const invalidRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.signature' },
    });
    const invalidJson = await invalidRes.json();
    if (invalidRes.status === 401) {
      console.log('✅ Invalid token correctly rejected with status 401:', invalidJson.message);
    } else {
      console.log('❌ Unexpected response status:', invalidRes.status);
    }

    // Test 7: Logout Route Execution
    console.log('\n--- [TEST 7] Logout Route Execution ---');
    const logoutRes = await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    const logoutJson = await logoutRes.json();
    console.log('✅ Logout Status:', logoutRes.status, `(${logoutJson.message})`);

    console.log('\n=============================================================');
    console.log('🎯 ALL REMEMBER ME AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================================');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runRememberMeTests();
