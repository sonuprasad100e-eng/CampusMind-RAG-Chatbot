const Complaint = require('../models/Complaint');
const { getIO } = require('../config/socket');

/**
 * @desc    Submit a new student complaint
 * @route   POST /api/complaints
 * @access  Private (Student)
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, category, description, location, priority } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and location are required.',
      });
    }

    // Process file attachments if uploaded via multer
    const attachments = (req.files || []).map((file) => ({
      fileName: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/complaints/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    }));

    const complaint = new Complaint({
      student: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      title,
      category: category || 'General',
      description,
      location,
      priority: priority || 'Medium',
      status: 'Submitted',
      attachments,
      timeline: [
        {
          status: 'Submitted',
          updatedBy: req.user._id,
          updaterRole: 'student',
          note: 'Grievance submitted by student.',
          timestamp: new Date(),
        },
      ],
    });

    await complaint.save();

    // Emit live socket event to notify admins
    try {
      const io = getIO();
      if (io) {
        io.emit('complaint:new', {
          id: complaint._id,
          ticketId: complaint.ticketId,
          title: complaint.title,
          category: complaint.category,
          studentName: req.user.name,
        });
      }
    } catch (socketErr) {
      // Non-blocking socket error
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get logged in student's complaints with filters
 * @route   GET /api/complaints
 * @access  Private (Student)
 */
exports.getStudentComplaints = async (req, res, next) => {
  try {
    const { status, category, search, priority } = req.query;
    const query = { student: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single complaint details by ID
 * @route   GET /api/complaints/:id
 * @access  Private (Student or Admin)
 */
exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email')
      .populate('timeline.updatedBy', 'name role')
      .populate('resolution.resolvedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Authorization: Students can only view their own complaint
    if (req.user.role !== 'admin' && complaint.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this complaint.',
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add comment / reply to complaint thread
 * @route   POST /api/complaints/:id/comments
 * @access  Private (Student or Admin)
 */
exports.addComment = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this complaint.',
      });
    }

    const newComment = {
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      message: message.trim(),
      createdAt: new Date(),
    };

    complaint.comments.push(newComment);
    await complaint.save();

    // Socket notification
    try {
      const io = getIO();
      if (io) {
        io.emit(`complaint:${complaint._id}:comment`, newComment);
      }
    } catch (socketErr) {}

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: newComment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin: Get all complaints with pagination & advanced filters
 * @route   GET /api/admin/complaints
 * @access  Private (Admin)
 */
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, department, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (department && department !== 'All') {
      query['assignedTo.department'] = department;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: complaints,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin: Update complaint status & resolution details
 * @route   PATCH /api/admin/complaints/:id/status
 * @access  Private (Admin)
 */
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note, resolutionNotes } = req.body;

    const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const userId = req.user?._id || req.user?.id;

    complaint.status = status;

    // Add timeline event
    complaint.timeline.push({
      status,
      updatedBy: userId,
      updaterRole: req.user?.role || 'admin',
      note: note || `Status transitioned to ${status} by administrator.`,
      timestamp: new Date(),
    });

    // Resolution details update
    if (status === 'Resolved' || status === 'Closed') {
      complaint.resolution = {
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: resolutionNotes || note || 'Resolved by administration.',
      };
    }

    await complaint.save();

    // Socket notification
    try {
      const io = getIO();
      if (io) {
        io.emit(`complaint:${complaint._id}:updated`, complaint);
        io.emit('complaint:statusChanged', {
          id: complaint._id,
          ticketId: complaint.ticketId,
          status: complaint.status,
        });
      }
    } catch (socketErr) {}

    res.status(200).json({
      success: true,
      message: `Complaint status updated to "${status}".`,
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin: Assign complaint to Department / Staff
 * @route   PATCH /api/admin/complaints/:id/assign
 * @access  Private (Admin)
 */
exports.assignComplaint = async (req, res, next) => {
  try {
    const { department, staffName, notes } = req.body;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required for assignment.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    complaint.assignedTo = {
      department,
      staffName: staffName || '',
      assignedAt: new Date(),
      notes: notes || '',
    };

    // Automatically transition to 'Assigned' if currently Submitted or Under Review
    if (complaint.status === 'Submitted' || complaint.status === 'Under Review') {
      complaint.status = 'Assigned';
    }

    complaint.timeline.push({
      status: complaint.status,
      updatedBy: req.user._id,
      updaterRole: 'admin',
      note: `Assigned to ${department}${staffName ? ` (${staffName})` : ''}.${notes ? ` Note: ${notes}` : ''}`,
      timestamp: new Date(),
    });

    await complaint.save();

    // Socket notification
    try {
      const io = getIO();
      if (io) {
        io.emit(`complaint:${complaint._id}:updated`, complaint);
      }
    } catch (socketErr) {}

    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${department} successfully.`,
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin: Update priority
 * @route   PATCH /api/admin/complaints/:id/priority
 * @access  Private (Admin)
 */
exports.updateComplaintPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    if (!['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be Low, Medium, High, or Critical.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    complaint.priority = priority;
    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Priority updated to ${priority}.`,
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin: Get Complaint Statistics & Analytics
 * @route   GET /api/admin/complaints/stats
 * @access  Private (Admin)
 */
exports.getComplaintStats = async (req, res, next) => {
  try {
    const total = await Complaint.countDocuments();
    const submitted = await Complaint.countDocuments({ status: 'Submitted' });
    const underReview = await Complaint.countDocuments({ status: 'Under Review' });
    const assigned = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const closed = await Complaint.countDocuments({ status: 'Closed' });

    const activeCount = submitted + underReview + assigned + inProgress;
    const resolvedCount = resolved + closed;
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

    // Category breakdown
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Priority breakdown
    const priorityStats = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Recent activity
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ticketId title category status priority studentName createdAt');

    res.status(200).json({
      success: true,
      data: {
        total,
        activeCount,
        resolvedCount,
        resolutionRate,
        countsByStatus: {
          submitted,
          underReview,
          assigned,
          inProgress,
          resolved,
          closed,
        },
        categoryBreakdown: categoryStats.map((c) => ({ category: c._id, count: c.count })),
        priorityBreakdown: priorityStats.map((p) => ({ priority: p._id, count: p.count })),
        recentComplaints,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin: Delete complaint
 * @route   DELETE /api/admin/complaints/:id
 * @access  Private (Admin)
 */
exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
