const express = require('express');
const multer = require('multer');
const path = require('path');
const documentService = require('../services/documentService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload documents
router.post('/upload', upload.array('documents', 10), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of files) {
      const document = await documentService.createDocument(file);
      results.push(document);
    }

    res.status(201).json({
      message: `${results.length} document(s) uploaded successfully`,
      documents: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// Get all documents with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      status,
      search,
      sortField,
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;

    const sort = {};
    if (sortField) {
      sort.field = sortField;
      sort.order = sortOrder;
    }

    const result = await documentService.getDocuments(
      filters,
      sort,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Update reviewed result
router.put('/:id/review', async (req, res) => {
  try {
    const { reviewedResult } = req.body;
    const document = await documentService.updateReviewedResult(req.params.id, reviewedResult);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Finalize document
router.post('/:id/finalize', async (req, res) => {
  try {
    const document = await documentService.finalizeDocument(req.params.id);
    res.json({
      message: 'Document finalized successfully',
      document
    });
  } catch (error) {
    console.error('Finalize error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Export all finalized documents
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const data = await documentService.exportDocuments(format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="documents.json"');
      res.json(data);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="documents.csv"');
      res.send(data);
    } else {
      res.status(400).json({ error: 'Invalid export format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export documents' });
  }
});

// Retry failed job
router.post('/:id/retry', async (req, res) => {
  try {
    const result = await documentService.retryJob(req.params.id);
    res.json({
      message: 'Job retry initiated',
      document: result
    });
  } catch (error) {
    console.error('Retry error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Export finalized documents
router.get('/:id/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const data = await documentService.exportDocuments(format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="documents.json"');
      res.json(data);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="documents.csv"');
      res.send(data);
    } else {
      res.status(400).json({ error: 'Invalid export format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export documents' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    await documentService.deleteDocument(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;