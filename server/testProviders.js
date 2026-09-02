const { connectDB, disconnectDB } = require('./src/config/db');
const chatService = require('./src/services/chatService');
const User = require('./src/models/User');

async function testAllProviders() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected to MongoDB.\n');

  let student = await User.findOne({ role: 'student' });
  if (!student) {
    student = await User.findOne();
  }

  const providers = ['groq', 'openai', 'gemini', undefined]; // undefined tests default behavior

  for (const p of providers) {
    const label = p ? p.toUpperCase() : 'DEFAULT (NO PROVIDER PASSED)';
    console.log(`================ Testing Provider: ${label} ================`);
    const start = Date.now();
    const result = await chatService.processChatMessage({
      userId: student._id,
      message: 'What is the hostel curfew time on weekends and holidays?',
      category: 'Hostel',
      provider: p,
    });
    const duration = Date.now() - start;

    console.log(`Duration: ${duration}ms`);
    console.log(`Requested: ${p || '(none - default)'}`);
    console.log(`Provider Used: ${result.assistantMessage.provider}`);
    console.log(`Sources: ${result.assistantMessage.sources.length} document citation(s)`);
    console.log(`Content Snippet:\n${result.assistantMessage.content.slice(0, 200)}...\n`);
  }

  await disconnectDB();
  console.log('✅ ALL PROVIDER INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
}

testAllProviders().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
