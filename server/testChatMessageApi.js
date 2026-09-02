async function testChatApi() {
  console.log('Testing HTTP Login and Chat Message Endpoint with native fetch...');
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campusmind.edu',
        password: 'Student@123456',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status, loginData.success ? 'SUCCESS' : loginData.message);
    const token = loginData.data?.token;

    if (!token) {
      console.error('No token returned:', loginData);
      return;
    }

    // 2. Send Chat Message
    const chatRes = await fetch('http://localhost:5000/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: 'What is the hostel curfew time?',
        category: 'Hostel',
        language: 'en',
      }),
    });

    const chatData = await chatRes.json();
    console.log('Chat status:', chatRes.status);
    console.log('Chat response:', JSON.stringify(chatData, null, 2));
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
  }
}

testChatApi();
