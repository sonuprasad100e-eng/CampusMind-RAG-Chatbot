const documentService = require('../services/documentService');
const aiEnhancementService = require('../services/aiEnhancementService');

const uploadDocuments = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded. Please attach at least one PDF, DOCX, or TXT file.',
      });
    }

    const { category = 'General', department = 'All Departments', collectionName = 'General Knowledge Base', title } = req.body;
    const uploadedDocs = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docTitle = files.length === 1 && title ? title : file.originalname.replace(/\.[^/.]+$/, '');
      const fileExt = file.originalname.split('.').pop().toLowerCase();

      const doc = await documentService.createAndIngestDocument({
        title: docTitle,
        category,
        department,
        collectionName,
        filePath: file.path,
        fileName: file.originalname,
        fileType: fileExt,
        fileSize: file.size,
        uploadedBy: req.user.id,
      });

      uploadedDocs.push(doc);
    }

    return res.status(201).json({
      success: true,
      message: `${uploadedDocs.length} document(s) uploaded and queued for processing.`,
      data: { documents: uploadedDocs },
    });
  } catch (err) {
    next(err);
  }
};

const listDocuments = async (req, res, next) => {
  try {
    const { category, department, collectionName, status, search, page = 1, limit = 50 } = req.query;
    const result = await documentService.listDocuments({ category, department, collectionName, status, search, page, limit });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const reprocessDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await documentService.reprocessDocument(id);

    return res.status(200).json({
      success: true,
      message: `Reprocessing initiated for "${doc.title}".`,
      data: { document: doc },
    });
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await documentService.deleteDocument(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

const getDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await documentService.getDocumentStatus(id);

    return res.status(200).json({
      success: true,
      data: { document: doc },
    });
  } catch (err) {
    next(err);
  }
};

const summarizeDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await aiEnhancementService.generateDocumentSummary(id);

    return res.status(200).json({
      success: true,
      message: 'Document summary generated successfully.',
      data: { summary },
    });
  } catch (err) {
    next(err);
  }
};

const generateDocumentFAQs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faqs = await aiEnhancementService.generateDocumentFAQs(id);

    return res.status(200).json({
      success: true,
      message: 'Document FAQs generated successfully.',
      data: { faqs },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadDocuments,
  listDocuments,
  reprocessDocument,
  deleteDocument,
  getDocumentStatus,
  summarizeDocument,
  generateDocumentFAQs,
};
