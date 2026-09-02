const path = require('path');
const fs = require('fs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const documentService = require('../services/documentService');

const SAMPLE_DOCS = [
  {
    fileName: 'admissions_guide_2026.txt',
    title: 'Admissions & Fee Guide 2026-2027',
    category: 'Admissions',
  },
  {
    fileName: 'hostel_and_mess_handbook.txt',
    title: 'Residence Hall & Mess Guidelines Handbook',
    category: 'Hostel',
  },
  {
    fileName: 'examination_and_academic_policies.txt',
    title: 'Examination Rules & Academic Evaluation Regulations',
    category: 'Exams',
  },
  {
    fileName: 'placements_and_internships_2026.txt',
    title: 'Career Development & Placement Report 2025-2026',
    category: 'Placements',
  },
  {
    fileName: 'scholarships_and_financial_aid.txt',
    title: 'Scholarships & Financial Assistance Schemes',
    category: 'Scholarships',
  },
  {
    fileName: 'student_clubs_and_events.txt',
    title: 'Student Life, Technical Clubs & Annual Festivals',
    category: 'Clubs',
  },
];

async function seedSampleDocuments() {
  try {
    await connectDB();
    console.log('[SeedDocs] Starting Sample Document Ingestion Pipeline...');

    // Find or create admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@campusmind.edu',
        password: 'Admin@123456',
        role: 'admin',
      });
      console.log('[SeedDocs] Created Admin user for document seeding.');
    }

    const docsDir = path.resolve(__dirname, '../../sample_docs');

    for (const item of SAMPLE_DOCS) {
      const filePath = path.join(docsDir, item.fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`[SeedDocs] File not found: ${filePath}`);
        continue;
      }

      // Check if document already ingested
      let existingDoc = await Document.findOne({ title: item.title });
      if (existingDoc) {
        console.log(`[SeedDocs] Document already exists: "${item.title}". Reprocessing...`);
        await documentService.reprocessDocument(existingDoc._id);
        console.log(`âœ… Reprocessed "${item.title}" (${existingDoc.chunkCount} chunks)`);
        continue;
      }

      const stats = fs.statSync(filePath);
      const doc = await documentService.createAndIngestDocument({
        title: item.title,
        category: item.category,
        filePath: filePath,
        fileName: item.fileName,
        fileType: 'txt',
        fileSize: stats.size,
        uploadedBy: admin._id,
      });

      console.log(`âœ… Ingested "${doc.title}" [${doc.category}] -> Status: ${doc.status}, Chunks: ${doc.chunkCount}`);
    }

    const totalChunks = await DocumentChunk.countDocuments();
    const totalDocs = await Document.countDocuments();
    console.log(`\n==============================================`);
    console.log(`ðŸ“š Ingestion Complete: ${totalDocs} Documents, ${totalChunks} Vector Chunks in Knowledge Base.`);
    console.log(`==============================================\n`);
  } catch (err) {
    console.error('[SeedDocs] Error seeding sample documents:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedSampleDocuments();
