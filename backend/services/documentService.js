const Document = require('../models/Document');
const { addDocumentJob } = require('./queueService');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DocumentService {
  // Create a new document record
  async createDocument(file) {
    const jobId = uuidv4();

    const document = new Document({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      jobId,
      status: 'queued',
      progress: 0,
      currentStep: 'queued'
    });

    await document.save();

    // Add to processing queue
    const queueJobId = await addDocumentJob(document._id);

    return {
      ...document.toObject(),
      queueJobId
    };
  }

  // Get all documents with optional filtering
  async getDocuments(filters = {}, sort = {}, page = 1, limit = 10) {
    const query = {};

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { originalName: { $regex: filters.search, $options: 'i' } },
        { 'processingResult.title': { $regex: filters.search, $options: 'i' } },
        { 'processingResult.category': { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOptions = {};
    if (sort.field) {
      sortOptions[sort.field] = sort.order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by creation date
    }

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Document.countDocuments(query);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get document by ID
  async getDocumentById(id) {
    return await Document.findById(id).lean();
  }

  // Get document by job ID
  async getDocumentByJobId(jobId) {
    return await Document.findOne({ jobId }).lean();
  }

  // Update reviewed result
  async updateReviewedResult(id, reviewedResult) {
    return await Document.findByIdAndUpdate(
      id,
      {
        reviewedResult,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();
  }

  // Finalize document
  async finalizeDocument(id) {
    const document = await Document.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== 'completed') {
      throw new Error('Document must be completed before finalizing');
    }

    // Use reviewed result if available, otherwise use processing result
    const finalResult = document.reviewedResult || document.processingResult;

    return await Document.findByIdAndUpdate(
      id,
      {
        isFinalized: true,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();
  }

  // Retry failed job
  async retryJob(id) {
    const document = await Document.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }

    // Reset document state
    await Document.findByIdAndUpdate(id, {
      status: 'queued',
      progress: 0,
      currentStep: 'queued',
      error: null,
      updatedAt: new Date()
    });

    // Add to queue again
    const queueJobId = await addDocumentJob(id);

    return {
      ...document.toObject(),
      queueJobId
    };
  }

  // Export finalized documents
  async exportDocuments(format = 'json') {
    const documents = await Document.find({
      isFinalized: true
    }).lean();

    const exportData = documents.map(doc => ({
      id: doc._id,
      filename: doc.originalName,
      jobId: doc.jobId,
      processedAt: doc.completedAt,
      result: doc.reviewedResult || doc.processingResult
    }));

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value => {
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  // Delete document and file
  async deleteDocument(id) {
    const document = await Document.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.path);
    } catch (error) {
      console.warn('Failed to delete file:', error.message);
    }

    // Delete from database
    await Document.findByIdAndDelete(id);

    return { success: true };
  }
}

module.exports = new DocumentService();