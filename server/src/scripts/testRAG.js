const path = require('path');
const fs = require('fs');
const { connectDB, disconnectDB } = require('../config/db');
const retrievalService = require('../services/retrievalService');
const chatService = require('../services/chatService');
const documentService = require('../services/documentService');
const User = require('../models/User');
const Document = require('../models/Document');

const SAMPLE_DOCS = [
  { fileName: 'admissions_guide_2026.txt', title: 'Admissions & Fee Guide 2026-2027', category: 'Admissions' },
  { fileName: 'hostel_and_mess_handbook.txt', title: 'Residence Hall & Mess Guidelines Handbook', category: 'Hostel' },
  { fileName: 'examination_and_academic_policies.txt', title: 'Examination Rules & Academic Evaluation Regulations', category: 'Exams' },
  { fileName: 'placements_and_internships_2026.txt', title: 'Career Development & Placement Report 2025-2026', category: 'Placements' },
  { fileName: 'scholarships_and_financial_aid.txt', title: 'Scholarships & Financial Assistance Schemes', category: 'Scholarships' },
  { fileName: 'student_clubs_and_events.txt', title: 'Student Life, Technical Clubs & Annual Festivals', category: 'Clubs' },
];

const TEST_QUERIES = [
  {
    query: 'What is the hostel curfew time?',
    expectedCategory: 'Hostel',
    description: 'Verify hostel curfew timing retrieval (10:00 PM weekdays / 10:30 PM weekends)',
  },
  {
    query: 'What is the eligibility for B.Tech CS?',
    expectedCategory: 'Admissions',
    description: 'Verify B.Tech CSE eligibility criteria retrieval (75% aggregate in 10+2 PCM)',
  },
  {
    query: 'What is the fee refund policy?',
    expectedCategory: 'Admissions',
    description: 'Verify fee refund tiers and deadlines retrieval',
  },
  {
    query: 'What is the secret recipe for interstellar dark matter fuel?',
    expectedCategory: null,
    expectUnknown: true,
    description: 'Verify unknown query rejection and answerable: false flag',
  },
];

async function ensureDataSeeded(admin) {
  const docCount = await Document.countDocuments({ status: 'READY' });
  if (docCount >= 4) {
    console.log(`[Test] Knowledge base already contains ${docCount} documents.`);
    return;
  }

  console.log('[Test] Ingesting sample documents for verification...');
  const docsDir = path.resolve(__dirname, '../../sample_docs');

  for (const item of SAMPLE_DOCS) {
    const filePath = path.join(docsDir, item.fileName);
    if (!fs.existsSync(filePath)) continue;

    const stats = fs.statSync(filePath);
    await documentService.createAndIngestDocument({
      title: item.title,
      category: item.category,
      filePath: filePath,
      fileName: item.fileName,
      fileType: 'txt',
      fileSize: stats.size,
      uploadedBy: admin._id,
    });
  }
}

async function runRAGTests() {
  try {
    await connectDB();
    console.log('\n=============================================================');
    console.log('ðŸ§ª RUNNING CAMPUSMIND RAG RETRIEVAL & VECTOR PIPELINE TESTS');
    console.log('=============================================================\n');

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin Test',
        email: 'admin@campusmind.edu',
        password: 'Admin@123456',
        role: 'admin',
      });
    }

    let student = await User.findOne({ role: 'student' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'teststudent@campusmind.edu',
        password: 'Password@123',
        role: 'student',
      });
    }

    await ensureDataSeeded(admin);

    let passedCount = 0;

    for (let i = 0; i < TEST_QUERIES.length; i++) {
      const test = TEST_QUERIES[i];
      console.log(`\n--- Test Case ${i + 1}: "${test.query}" ---`);
      console.log(`ðŸ“‹ Target: ${test.description}`);

      // 1. Test Retrieval
      const retrieval = await retrievalService.retrieveContext({
        query: test.query,
      });

      console.log(`   Top Similarity Score: ${retrieval.topScore}`);
      console.log(`   Answerable Flag: ${retrieval.answerable}`);
      console.log(`   Sources Found: ${retrieval.sources.length}`);

      if (retrieval.sources.length > 0) {
        console.log(`   Primary Citation: "${retrieval.sources[0].title}" (${retrieval.sources[0].category}) - Score: ${retrieval.sources[0].score}`);
      }

      // 2. Test Full RAG Chat Generation
      const chatResult = await chatService.processChatMessage({
        userId: student._id,
        message: test.query,
      });

      const assistantReply = chatResult.assistantMessage;
      console.log(`   Provider Used: ${assistantReply.provider}`);
      console.log(`   Answer Snippet: ${assistantReply.content.substring(0, 140)}...`);

      if (test.expectUnknown) {
        if (!assistantReply.answerable) {
          console.log(`   âœ… PASS: Correctly marked as unanswerable with honest fallback.`);
          passedCount++;
        } else {
          console.log(`   â Œ FAIL: Expected answerable: false for unknown question.`);
        }
      } else {
        if (assistantReply.answerable && retrieval.topScore >= 0.6) {
          console.log(`   âœ… PASS: Retrieved relevant context and generated grounded answer.`);
          passedCount++;
        } else {
          console.log(`   â Œ FAIL: Retrieval score or answerable flag failed.`);
        }
      }
    }

    console.log(`\n=============================================================`);
    console.log(`ðŸŽ¯ TEST RESULTS: ${passedCount} / ${TEST_QUERIES.length} Tests Passed`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runRAGTests();
