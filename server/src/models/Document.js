const mongoose = require('mongoose');

const CATEGORIES = [
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'General',
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Management & Business Studies',
  'Hostel & Student Housing',
  'Examination Cell',
  'Library & Information Science',
];

const versionHistorySchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
      default: 'General',
      index: true,
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      default: 'All Departments',
      index: true,
    },
    collectionName: {
      type: String,
      default: 'General Knowledge Base',
      trim: true,
      index: true,
    },
    originalFileUrl: {
      type: String,
      required: [true, 'Original file path or URL is required'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'docx', 'txt'],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'],
      default: 'UPLOADED',
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [versionHistorySchema],
    summary: {
      type: String,
      default: '',
    },
    faqs: [faqSchema],
    isOcrProcessed: {
      type: Boolean,
      default: false,
    },
    errorReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ department: 1, collectionName: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.DEPARTMENTS = DEPARTMENTS;
