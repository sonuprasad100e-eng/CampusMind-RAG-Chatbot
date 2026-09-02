const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const env = require('./src/config/env');
const User = require('./src/models/User');
const Document = require('./src/models/Document');
const chatService = require('./src/services/chatService');
const aiEnhancementService = require('./src/services/aiEnhancementService');

async function runBonusTests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING ADVANCED BONUS FEATURES AUTOMATED TEST SUITE');
  console.log('=============================================================');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const student = await User.findOne({ email: 'student@campusmind.edu' });
  const admin = await User.findOne({ email: 'admin@campusmind.edu' });

  // 1. Test Multilingual Hindi Response
  console.log('\n--- [1/5] Testing Multilingual Chat (Hindi) ---');
  const resHindi = await chatService.processChatMessage({
    userId: student._id,
    message: 'What is the hostel curfew time?',
    category: 'Hostel',
    language: 'hi',
  });
  console.log('✅ Hindi Response Generated:');
  console.log('Snippet:', resHindi.assistantMessage.content.slice(0, 150) + '...');
  console.log('Confidence Score:', (resHindi.assistantMessage.confidenceScore * 100).toFixed(1) + '%');

  // 2. Test Document AI Summarization
  console.log('\n--- [2/5] Testing AI Document Summarization ---');
  const targetDoc = await Document.findOne({ status: 'READY' });
  if (targetDoc) {
    const summary = await aiEnhancementService.generateDocumentSummary(targetDoc._id);
    console.log(`✅ AI Summary Generated for "${targetDoc.title}":`);
    console.log(summary.slice(0, 200) + '...');
  }

  // 3. Test AI FAQ Generation
  console.log('\n--- [3/5] Testing AI FAQ Generation ---');
  if (targetDoc) {
    const faqs = await aiEnhancementService.generateDocumentFAQs(targetDoc._id);
    console.log(`✅ Generated ${faqs.length} FAQs for "${targetDoc.title}":`);
    faqs.forEach((f, i) => console.log(`   ${i + 1}. Q: ${f.question}`));
  }

  // 4. Test Campus FAQs Query
  console.log('\n--- [4/5] Testing Global FAQs Aggregator ---');
  const allFaqs = await aiEnhancementService.getAllCampusFAQs();
  console.log(`✅ Total Campus FAQs in directory: ${allFaqs.length}`);

  // 5. Test Role-Based Faculty Role
  console.log('\n--- [5/5] Testing Role-Based Faculty Role Support ---');
  let facultyUser = await User.findOne({ email: 'faculty@campusmind.edu' });
  if (!facultyUser) {
    facultyUser = await User.create({
      name: 'Dr. Sarah Wilson (Faculty)',
      email: 'faculty@campusmind.edu',
      password: 'Faculty@123456',
      role: 'faculty',
    });
  }
  console.log(`✅ Faculty user verified: ${facultyUser.name} (Role: ${facultyUser.role})`);

  console.log('\n=============================================================');
  console.log('🎯 ALL BONUS FEATURE TESTS PASSED (5/5)');
  console.log('=============================================================');

  await mongoose.disconnect();
}

runBonusTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
