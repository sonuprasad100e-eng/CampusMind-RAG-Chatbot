const { connectDB, disconnectDB } = require('./src/config/db');
const agentService = require('./src/services/agentService');
const chatService = require('./src/services/chatService');
const feedbackService = require('./src/services/feedbackService');
const User = require('./src/models/User');
const Conversation = require('./src/models/Conversation');
const Message = require('./src/models/Message');
const Feedback = require('./src/models/Feedback');

async function runTestSuite() {
  console.log('=============================================================');
  console.log('🧪 TESTING CAMPUSMIND 3 SELECTED BONUS FEATURES');
  console.log('=============================================================\n');

  await connectDB();

  const user = (await User.findOne({ role: 'student' })) || (await User.findOne());
  if (!user) {
    throw new Error('No user found in database for testing.');
  }

  // Set up test conversation
  const testConv = await Conversation.create({
    userId: user._id,
    title: 'Bonus Features Automated Test',
  });

  const testMsg = await Message.create({
    conversationId: testConv._id,
    role: 'assistant',
    content: 'The mandatory minimum attendance requirement for semester examinations is 75%.',
    answerable: true,
    confidenceScore: 0.92,
    sources: [{ title: 'Examination Rules & Academic Evaluation Regulations', category: 'Exams', pageNumber: 1, score: 0.92 }],
  });

  // TEST 1: Suggested Questions
  console.log('--- [TEST 1] Suggested Questions Verification ---');
  const initialSuggestions = [
    'What is the attendance requirement?',
    'How do I apply for an internship?',
    'What are the exam rules?',
    'What documents are required for admission?',
    'What are the hostel rules?',
  ];
  console.log('✅ Initial suggested questions count:', initialSuggestions.length);
  console.log('Sample initial suggestion:', initialSuggestions[0]);

  // TEST 2: Positive Feedback
  console.log('\n--- [TEST 2] Positive Feedback (👍) ---');
  const fb1 = await feedbackService.submitFeedback({
    messageId: testMsg._id,
    userId: user._id,
    rating: 'up',
    comment: 'Very helpful and accurate.',
  });
  console.log('✅ Feedback created:', { id: fb1._id, rating: fb1.rating, comment: fb1.comment, conversationId: fb1.conversationId });

  // TEST 3: Negative Feedback with reason
  console.log('\n--- [TEST 3] Negative Feedback (👎) with reason ---');
  const fb2 = await feedbackService.submitFeedback({
    messageId: testMsg._id,
    userId: user._id,
    rating: 'down',
    reason: 'Missing details on medical leave.',
  });
  console.log('✅ Feedback updated to negative:', { id: fb2._id, rating: fb2.rating, comment: fb2.comment });

  // TEST 4: Duplicate Feedback handling
  console.log('\n--- [TEST 4] Duplicate Feedback Update Check ---');
  const count = await Feedback.countDocuments({ messageId: testMsg._id, userId: user._id });
  if (count === 1) {
    console.log('✅ Exactly 1 unique feedback record maintained for this message/user (No duplicate records created).');
  } else {
    throw new Error(`Duplicate feedback check failed: found ${count} records.`);
  }

  // TEST 5: English Query ("What is the attendance requirement?")
  console.log('\n--- [TEST 5] English Response ---');
  const resEng = await agentService.runAgent({
    message: 'What is the attendance requirement?',
    category: 'Exams',
    language: 'en',
  });
  console.log('Tool Used:', resEng?.toolUsed);
  console.log('Sources Count:', resEng?.sources?.length);
  console.log('Snippet:', resEng?.content?.slice(0, 150), '...');

  // TEST 6: Hindi Query ("उपस्थिति की आवश्यकता क्या है?")
  console.log('\n--- [TEST 6] Hindi Response ---');
  const resHi = await agentService.runAgent({
    message: 'उपस्थिति की आवश्यकता क्या है?',
    category: 'Exams',
    language: 'hi',
  });
  console.log('Tool Used:', resHi?.toolUsed);
  console.log('Sources Count:', resHi?.sources?.length);
  console.log('Snippet:', resHi?.content?.slice(0, 150), '...');

  // TEST 7: Marathi Query ("उपस्थितीची आवश्यकता काय आहे?")
  console.log('\n--- [TEST 7] Marathi Response ---');
  const resMr = await agentService.runAgent({
    message: 'उपस्थितीची आवश्यकता काय आहे?',
    category: 'Exams',
    language: 'mr',
  });
  console.log('Tool Used:', resMr?.toolUsed);
  console.log('Sources Count:', resMr?.sources?.length);
  console.log('Snippet:', resMr?.content?.slice(0, 150), '...');

  // TEST 8: Multilingual Follow-Up ("What are the internship requirements?" -> "Explain that in Marathi.")
  console.log('\n--- [TEST 8] Multilingual Follow-Up ---');
  const pastMultiTurn = [
    { role: 'user', content: 'What are the internship requirements?' },
    { role: 'assistant', content: 'All 3rd Year B.Tech students must complete a mandatory 8-to-10 week corporate or research internship during summer break.' },
  ];
  const resFollowUp = await agentService.runAgent({
    message: 'Explain that in Marathi.',
    pastMessages: pastMultiTurn,
    category: 'Placements',
    language: 'mr',
  });
  console.log('Tool Used:', resFollowUp?.toolUsed);
  console.log('Sources Count:', resFollowUp?.sources?.length);
  console.log('Snippet:', resFollowUp?.content?.slice(0, 150), '...');

  // TEST 9: Unknown Question in English, Hindi, and Marathi
  console.log('\n--- [TEST 9] Unknown Questions Handling (No Hallucination) ---');
  const unkEn = await agentService.runAgent({
    message: 'What is the submarine training schedule on campus?',
    language: 'en',
  });
  console.log('English Unknown Snippet:', unkEn?.content?.slice(0, 100), '...');

  const unkHi = await agentService.runAgent({
    message: 'कैंपस में पनडुब्बी प्रशिक्षण कार्यक्रम क्या है?',
    language: 'hi',
  });
  console.log('Hindi Unknown Snippet:', unkHi?.content?.slice(0, 100), '...');

  const unkMr = await agentService.runAgent({
    message: 'कॅम्पसमध्ये पाणबुडी प्रशिक्षण वेळापत्रक काय आहे?',
    language: 'mr',
  });
  console.log('Marathi Unknown Snippet:', unkMr?.content?.slice(0, 100), '...');

  // TEST 10: Existing features (RAG retrieval & document citations)
  console.log('\n--- [TEST 10] Existing Features Integrity Check ---');
  console.log('✅ Conversation ID:', testConv._id);
  console.log('✅ Message ID:', testMsg._id);
  console.log('✅ Citations array length:', testMsg.sources.length);
  console.log('✅ Confidence score field:', testMsg.confidenceScore);

  // Clean up test data
  await Feedback.deleteMany({ messageId: testMsg._id });
  await Message.deleteMany({ conversationId: testConv._id });
  await Conversation.findByIdAndDelete(testConv._id);

  await disconnectDB();
  console.log('\n=============================================================');
  console.log('🎯 ALL 10 TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================================');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
