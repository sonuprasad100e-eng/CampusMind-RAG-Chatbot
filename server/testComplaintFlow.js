const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
const env = require('./src/config/env');
const User = require('./src/models/User');
const Complaint = require('./src/models/Complaint');

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '1d' });
};

const runComplaintTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING COMPLAINT & GRIEVANCE MANAGEMENT AUTOMATED TESTS');
  console.log('=============================================================');

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Fetch Student & Admin users
    const student = await User.findOne({ role: 'student' });
    const admin = await User.findOne({ role: 'admin' });

    if (!student || !admin) {
      throw new Error('Seed student or admin user missing in database.');
    }
    console.log(`👤 Student: ${student.name} (${student.email})`);
    console.log(`👑 Admin: ${admin.name} (${admin.email})`);

    // 2. Test Complaint Creation
    const testComplaint = new Complaint({
      student: student._id,
      studentName: student.name,
      studentEmail: student.email,
      title: 'Water leakage in Hostel Block B 3rd Floor Washroom',
      category: 'Hostel',
      description: 'The main pipe in the washroom on 3rd floor Block B is leaking heavily causing water accumulation.',
      location: 'Hostel Block B, 3rd Floor Washroom near Room 312',
      priority: 'High',
      status: 'Submitted',
      attachments: [
        {
          fileName: 'pipe_leak.jpg',
          originalName: 'photo_leak.jpg',
          fileUrl: '/uploads/complaints/pipe_leak.jpg',
          mimeType: 'image/jpeg',
          size: 1048576,
        },
      ],
      timeline: [
        {
          status: 'Submitted',
          updatedBy: student._id,
          updaterRole: 'student',
          note: 'Complaint submitted by student.',
          timestamp: new Date(),
        },
      ],
    });

    await testComplaint.save();
    console.log(`✅ [1/6] Created Complaint with Ticket ID: ${testComplaint.ticketId}`);

    // 3. Test Student Complaint Fetching
    const studentComplaints = await Complaint.find({ student: student._id });
    console.log(`✅ [2/6] Student complaints retrieved: ${studentComplaints.length} records`);

    // 4. Test Admin Department Assignment
    testComplaint.assignedTo = {
      department: 'Estate & Maintenance Cell',
      staffName: 'Mr. Ramesh Plumber Head',
      assignedAt: new Date(),
      notes: 'Plumbing team assigned for immediate inspection.',
    };
    testComplaint.status = 'Assigned';
    testComplaint.timeline.push({
      status: 'Assigned',
      updatedBy: admin._id,
      updaterRole: 'admin',
      note: 'Assigned to Estate & Maintenance Cell (Mr. Ramesh Plumber Head).',
      timestamp: new Date(),
    });
    await testComplaint.save();
    console.log(`✅ [3/6] Complaint assigned to department: ${testComplaint.assignedTo.department}`);

    // 5. Test Adding Comments / Discussion Thread
    testComplaint.comments.push({
      user: admin._id,
      userName: admin.name,
      userRole: 'admin',
      message: 'Plumber team is dispatched with replacement pipe fittings.',
      createdAt: new Date(),
    });
    testComplaint.comments.push({
      user: student._id,
      userName: student.name,
      userRole: 'student',
      message: 'Thank you! The caretaker is already at the location.',
      createdAt: new Date(),
    });
    await testComplaint.save();
    console.log(`✅ [4/6] Added ${testComplaint.comments.length} comments in complaint discussion thread`);

    // 6. Test Admin Status Transition to Resolved with Resolution Details
    testComplaint.status = 'Resolved';
    testComplaint.resolution = {
      resolvedAt: new Date(),
      resolvedBy: admin._id,
      resolutionNotes: 'Pipe replaced and water pressure verified. No further leakage.',
    };
    testComplaint.timeline.push({
      status: 'Resolved',
      updatedBy: admin._id,
      updaterRole: 'admin',
      note: 'Pipe repaired and verified by Estate maintenance team.',
      timestamp: new Date(),
    });
    await testComplaint.save();
    console.log(`✅ [5/6] Complaint resolved with resolution details: "${testComplaint.resolution.resolutionNotes}"`);

    // 7. Test Complaint Statistics Aggregation
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    console.log(`✅ [6/6] Stats Aggregated: Total: ${total}, Resolved: ${resolved}, Categories: ${categoryStats.length}`);

    console.log('=============================================================');
    console.log('🎯 ALL COMPLAINT BACKEND TESTS PASSED (6/6)');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runComplaintTests();
