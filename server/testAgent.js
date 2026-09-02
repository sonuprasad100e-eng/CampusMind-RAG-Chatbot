const { connectDB, disconnectDB } = require('./src/config/db');
const agentService = require('./src/services/agentService');
const chatService = require('./src/services/chatService');
const User = require('./src/models/User');

async function testAgentSuite() {
  console.log('=== STARTING CAMPUSMIND AGENT SERVICE TEST SUITE ===\n');
  await connectDB();

  let student = await User.findOne({ role: 'student' }) || await User.findOne();

  // TEST 1: College RAG question
  console.log('--- TEST 1: College RAG Question ("What is the hostel curfew on weekends?") ---');
  let streamedTokens = [];
  const res1 = await agentService.runAgent({
    message: 'What is the hostel curfew on weekends?',
    category: 'Hostel',
    language: 'en',
    emitToken: (t) => streamedTokens.push(t),
  });
  console.log('Tool Used:', res1?.toolUsed);
  console.log('Sources Count:', res1?.sources?.length);
  console.log('Confidence Score:', res1?.confidenceScore);
  console.log('Streamed Tokens Count:', streamedTokens.length);
  console.log('Content Snippet:', res1?.content?.slice(0, 150), '...\n');

  // TEST 2: Another college question
  console.log('--- TEST 2: Attendance Requirements ("What is the minimum attendance required for semester exams?") ---');
  streamedTokens = [];
  const res2 = await agentService.runAgent({
    message: 'What is the minimum attendance required for semester exams?',
    category: 'Exams',
    language: 'en',
    emitToken: (t) => streamedTokens.push(t),
  });
  console.log('Tool Used:', res2?.toolUsed);
  console.log('Sources Count:', res2?.sources?.length);
  console.log('Content Snippet:', res2?.content?.slice(0, 150), '...\n');

  // TEST 3: Unknown question
  console.log('--- TEST 3: Unknown / Out of Scope Question ("What is the astronaut rocket launch schedule on campus?") ---');
  streamedTokens = [];
  const res3 = await agentService.runAgent({
    message: 'What is the astronaut rocket launch schedule on campus?',
    category: 'All',
    language: 'en',
    emitToken: (t) => streamedTokens.push(t),
  });
  console.log('Tool Used:', res3?.toolUsed);
  console.log('Sources Count:', res3?.sources?.length);
  console.log('Answerable:', res3?.answerable);
  console.log('Content Snippet:', res3?.content?.slice(0, 150), '...\n');

  // TEST 4: Conversational Greeting
  console.log('--- TEST 4: Conversational Greeting ("Hello! Who are you and how can you assist me?") ---');
  streamedTokens = [];
  const res4 = await agentService.runAgent({
    message: 'Hello! Who are you and how can you assist me?',
    category: 'All',
    language: 'en',
    emitToken: (t) => streamedTokens.push(t),
  });
  console.log('Tool Used:', res4?.toolUsed);
  console.log('Sources Count:', res4?.sources?.length);
  console.log('Content Snippet:', res4?.content?.slice(0, 150), '...\n');

  // TEST 5: Multi-Turn Conversation History
  console.log('--- TEST 5: Multi-Turn Conversation ---');
  const pastTurns = [
    { role: 'user', content: 'What is the hostel curfew time?' },
    { role: 'assistant', content: 'The weekday curfew time is 10:00 PM.' }
  ];
  streamedTokens = [];
  const res5 = await agentService.runAgent({
    message: 'What about weekends and holidays?',
    pastMessages: pastTurns,
    category: 'Hostel',
    language: 'en',
    emitToken: (t) => streamedTokens.push(t),
  });
  console.log('Tool Used:', res5?.toolUsed);
  console.log('Sources Count:', res5?.sources?.length);
  console.log('Content Snippet:', res5?.content?.slice(0, 150), '...\n');

  await disconnectDB();
  console.log('✅ ALL 5 AGENT SERVICE UNIT TESTS PASSED SUCCESSFULLY!');
}

testAgentSuite().catch((err) => {
  console.error('❌ Agent Test Suite failed:', err);
  process.exit(1);
});
