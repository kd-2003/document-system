const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentStep: {
    type: String,
    default: 'queued'
  },
  processingResult: {
    title: String,
    category: String,
    summary: String,
    keywords: [String],
    status: String,
    extractedText: String
  },
  reviewedResult: {
    title: String,
    category: String,
    summary: String,
    keywords: [String],
    status: String,
    extractedText: String
  },
  isFinalized: {
    type: Boolean,
    default: false
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Document', documentSchema);