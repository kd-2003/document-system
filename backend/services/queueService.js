const Queue = require('bull');
const Document = require('../models/Document');
const { createClient } = require('redis');

let ioServer = null;
let documentQueue = null;
let queueAvailable = false;

function setSocketServer(io) {
  ioServer = io;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function initializeQueueService() {
  try {
    const client = createClient({ url: REDIS_URL });
    client.on('error', () => {});
    await client.connect();
    await client.ping();
    await client.disconnect();

    documentQueue = new Queue('document-processing', {
      redis: {
        url: REDIS_URL,
        enableReadyCheck: true
      }
    });

    queueAvailable = true;
  } catch (error) {
    console.warn('Redis unavailable; falling back to inline processing:', error.message);
    queueAvailable = false;
    documentQueue = null;
  }
}

function emitProgress(documentJobId, progress, step, status, error) {
  if (!ioServer) return;
  ioServer.emit('progress', {
    jobId: documentJobId,
    progress,
    step,
    status,
    error
  });
}

async function updateProgress(documentJobId, progress, step, status) {
  const doc = await Document.findOneAndUpdate(
    { jobId: documentJobId },
    {
      progress,
      currentStep: step,
      status,
      updatedAt: new Date()
    },
    { new: true }
  );

  if (doc) {
    emitProgress(documentJobId, progress, step, doc.status);
  }

  return doc;
}

function getCategoryFromFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const categories = {
    pdf: 'Document',
    doc: 'Document',
    docx: 'Document',
    txt: 'Text',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    csv: 'Data',
    xlsx: 'Spreadsheet'
  };
  return categories[ext] || 'Unknown';
}

async function processDocument(documentId) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  const documentJobId = document.jobId;

  await Document.findByIdAndUpdate(documentId, {
    status: 'processing',
    updatedAt: new Date()
  });

  await updateProgress(documentJobId, 10, 'document_received', 'processing');
  await updateProgress(documentJobId, 20, 'parsing_started', 'processing');

  await new Promise(resolve => setTimeout(resolve, 1000));

  await updateProgress(documentJobId, 40, 'parsing_completed', 'processing');
  await updateProgress(documentJobId, 60, 'extraction_started', 'processing');

  await new Promise(resolve => setTimeout(resolve, 1500));

  const processingResult = {
    title: document.originalName.replace(/\.[^/.]+$/, ''),
    category: getCategoryFromFilename(document.originalName),
    summary: `Processed document: ${document.originalName}`,
    keywords: ['document', 'processed', 'async'],
    status: 'processed',
    extractedText: `Mock extracted text from ${document.originalName}. File size: ${document.size} bytes.`
  };

  await updateProgress(documentJobId, 80, 'extraction_completed', 'processing');
  await updateProgress(documentJobId, 90, 'result_stored', 'processing');

  await Document.findByIdAndUpdate(documentId, {
    processingResult,
    status: 'completed',
    progress: 100,
    currentStep: 'completed',
    completedAt: new Date(),
    updatedAt: new Date()
  });

  await updateProgress(documentJobId, 100, 'job_completed', 'completed');
}

async function addDocumentJob(documentId) {
  if (queueAvailable && documentQueue) {
    try {
      const job = await documentQueue.add(
        { documentId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      );
      return job.id;
    } catch (error) {
      console.warn('Queue job add failed, falling back to inline processing:', error.message);
      queueAvailable = false;
    }
  }

  processDocument(documentId).catch(async (error) => {
    console.error('Inline processing failed:', error);
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      error: error.message,
      updatedAt: new Date()
    });
    const doc = await Document.findById(documentId);
    emitProgress(
      doc ? doc.jobId : documentId,
      0,
      'job_failed',
      'failed',
      error.message
    );
  });

  return `inline-${documentId}-${Date.now()}`;
}

function initializeQueue() {
  if (!queueAvailable || !documentQueue) {
    console.warn('Queue service is not available. Documents will process inline.');
    return;
  }

  documentQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  documentQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed:`, err.message);
  });

  documentQueue.on('stalled', (jobId) => {
    console.log(`Job ${jobId} stalled`);
  });

  documentQueue.on('error', (error) => {
    console.error('Queue error:', error.message);
  });
}

module.exports = {
  setSocketServer,
  initializeQueueService,
  initializeQueue,
  addDocumentJob
};