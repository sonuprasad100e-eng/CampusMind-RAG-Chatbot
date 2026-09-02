const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middlewares/auth');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

// Ensure upload directory exists
const complaintUploadDir = path.join(__dirname, '../../uploads/complaints');
if (!fs.existsSync(complaintUploadDir)) {
  fs.mkdirSync(complaintUploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, complaintUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `complaint-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed. Supported formats: Images, PDF, DOCX, TXT`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

// ==========================================
// Student & General Authenticated Endpoints
// ==========================================
router.use(protect);

router
  .route('/')
  .post(upload.array('attachments', 5), complaintController.createComplaint)
  .get(complaintController.getStudentComplaints);

router
  .route('/:id')
  .get(complaintController.getComplaintById);

router
  .route('/:id/comments')
  .post(complaintController.addComment);

// ==========================================
// Admin Dedicated Endpoints
// ==========================================
router.get('/admin/list', authorize('admin'), complaintController.getAllComplaints);
router.get('/admin/stats', authorize('admin'), complaintController.getComplaintStats);
router.patch('/admin/:id/status', authorize('admin'), complaintController.updateComplaintStatus);
router.patch('/admin/:id/assign', authorize('admin'), complaintController.assignComplaint);
router.patch('/admin/:id/priority', authorize('admin'), complaintController.updateComplaintPriority);
router.delete('/admin/:id', authorize('admin'), complaintController.deleteComplaint);

module.exports = router;
