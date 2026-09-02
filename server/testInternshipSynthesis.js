const { connectDB, disconnectDB } = require('./src/config/db');
const agentService = require('./src/services/agentService');

async function runSynthesisTests() {
  console.log('=============================================================');
  console.log('🧪 TESTING AGENTIC RAG SYNTHESIS & QUESTION-SCOPE CONTROL');
  console.log('=============================================================\n');

  await connectDB();

  // TEST 1: Recommendation question ("Should I do internship?")
  console.log('--- TEST 1: Recommendation ("Should I do internship?") ---');
  let tokens = [];
  const res1 = await agentService.runAgent({
    message: 'Should I do internship?',
    category: 'Placements',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res1?.toolUsed);
  console.log('Confidence Score:', res1?.confidenceScore);
  console.log('Sources Count:', res1?.sources?.length);
  console.log('Answer Content:\n' + res1?.content + '\n');

  // TEST 2: Single Fact question ("How many credits are required for B.Tech?")
  console.log('--- TEST 2: Single Fact ("How many credits are required for B.Tech?") ---');
  tokens = [];
  const res2 = await agentService.runAgent({
    message: 'How many credits are required for B.Tech?',
    category: 'Placements',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res2?.toolUsed);
  console.log('Answer Content:\n' + res2?.content + '\n');

  // TEST 3: Procedure question ("Can I arrange my own internship?")
  console.log('--- TEST 3: Procedure ("Can I arrange my own internship?") ---');
  tokens = [];
  const res3 = await agentService.runAgent({
    message: 'Can I arrange my own internship?',
    category: 'Placements',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res3?.toolUsed);
  console.log('Answer Content:\n' + res3?.content + '\n');

  // TEST 4: List question ("What are the benefits of internship?")
  console.log('--- TEST 4: List ("What are the benefits of internship?") ---');
  tokens = [];
  const res4 = await agentService.runAgent({
    message: 'What are the benefits of internship?',
    category: 'Placements',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res4?.toolUsed);
  console.log('Answer Content:\n' + res4?.content + '\n');

  // TEST 5: Detailed Explanation ("Explain the complete internship policy.")
  console.log('--- TEST 5: Detailed Explanation ("Explain the complete internship policy.") ---');
  tokens = [];
  const res5 = await agentService.runAgent({
    message: 'Explain the complete internship policy.',
    category: 'Placements',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res5?.toolUsed);
  console.log('Answer Content:\n' + res5?.content + '\n');

  // TEST 6: Greeting ("Hello")
  console.log('--- TEST 6: Conversational Greeting ("Hello") ---');
  tokens = [];
  const res6 = await agentService.runAgent({
    message: 'Hello',
    category: 'All',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res6?.toolUsed);
  console.log('Answer Content:\n' + res6?.content + '\n');

  // TEST 7: Follow-up question ("What about credits?")
  console.log('--- TEST 7: Follow-up Question ("What about credits?" after internship context) ---');
  const pastTurns = [
    { role: 'user', content: 'What is the internship policy?' },
    { role: 'assistant', content: 'The college has an Internship Policy designed to provide industrial exposure to students through summer and semester internships.' }
  ];
  tokens = [];
  const res7 = await agentService.runAgent({
    message: 'What about credits?',
    pastMessages: pastTurns,
    category: 'Placements',
    emitToken: (t) => tokens.push(t),
  });
  console.log('Tool Used:', res7?.toolUsed);
  console.log('Answer Content:\n' + res7?.content + '\n');

  await disconnectDB();
  console.log('=============================================================');
  console.log('🎯 ALL 7 SYNTHESIS TESTS EXECUTED SUCCESSFULLY');
  console.log('=============================================================');
}

runSynthesisTests().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
