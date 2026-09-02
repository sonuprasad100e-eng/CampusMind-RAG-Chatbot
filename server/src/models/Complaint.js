const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updaterRole: {
      type: String,
      enum: ['student', 'admin', 'system'],
      default: 'system',
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ['student', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: [
        'Academic',
        'Hostel',
        'Mess & Cafeteria',
        'Infrastructure & Maintenance',
        'Fee & Accounts',
        'Library',
        'Ragging & Discipline',
        'Transport',
        'General',
      ],
      default: 'General',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location of the issue is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Submitted',
      index: true,
    },
    attachments: [attachmentSchema],
    assignedTo: {
      department: {
        type: String,
        enum: [
          'Unassigned',
          'Academic Dean Office',
          'Hostel Warden & Housing',
          'IT & Network Services',
          'Estate & Maintenance Cell',
          'Examination Cell',
          'Accounts & Finance Dept',
          'Student Welfare & Discipline',
          'Library Administration',
          'Campus Security & Transport',
        ],
        default: 'Unassigned',
      },
      staffName: { type: String, default: '' },
      assignedAt: { type: Date, default: null },
      notes: { type: String, default: '' },
    },
    resolution: {
      resolvedAt: { type: Date, default: null },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolutionNotes: { type: String, default: '' },
    },
    timeline: [timelineEventSchema],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate ticketId e.g. CMP-2026-XXXX
complaintSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `CMP-${year}-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
