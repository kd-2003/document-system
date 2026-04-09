import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const ProgressTracker = ({ jobId, onProgressUpdate }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('queued');
  const [status, setStatus] = useState('queued');

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

    socket.on('progress', (data) => {
      if (data.jobId === jobId) {
        setProgress(data.progress);
        setCurrentStep(data.step);
        setStatus(data.status);

        if (onProgressUpdate) {
          onProgressUpdate(data);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId, onProgressUpdate]);

  const getStepDescription = (step) => {
    const descriptions = {
      queued: 'Job queued for processing',
      document_received: 'Document received',
      parsing_started: 'Parsing document...',
      parsing_completed: 'Document parsing completed',
      extraction_started: 'Extracting structured data...',
      extraction_completed: 'Data extraction completed',
      result_stored: 'Storing results...',
      job_completed: 'Processing completed successfully',
      job_failed: 'Processing failed'
    };
    return descriptions[step] || step;
  };

  const getStatusColor = (status) => {
    const colors = {
      queued: '#ffc107',
      processing: '#007bff',
      completed: '#28a745',
      failed: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="progress-tracker">
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong>
        <span style={{
          color: getStatusColor(status),
          marginLeft: '8px',
          textTransform: 'capitalize'
        }}>
          {status}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: getStatusColor(status)
          }}
        />
      </div>

      <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
        {progress}% - {getStepDescription(currentStep)}
      </div>
    </div>
  );
};

export default ProgressTracker;