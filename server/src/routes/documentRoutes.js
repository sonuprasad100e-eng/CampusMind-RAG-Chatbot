const express = require('express');
const documentController = require('../controllers/documentController');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');
const upload = require('../middlewares/upload');

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get('/', documentController.listDocuments);
router.post('/', upload.array('files', 10), documentController.uploadDocuments);
router.get('/:id/status', documentController.getDocumentStatus);
router.post('/:id/reprocess', documentController.reprocessDocument);
router.post('/:id/summarize', documentController.summarizeDocument);
router.post('/:id/faqs', documentController.generateDocumentFAQs);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
