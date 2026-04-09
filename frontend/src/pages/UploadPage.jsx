import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import ProgressTracker from '../components/ProgressTracker';

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedDocuments(response.data.documents);
      setFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProgressUpdate = (progressData) => {
    setUploadedDocuments(prev =>
      prev.map(doc =>
        doc.jobId === progressData.jobId
          ? { ...doc, progress: progressData.progress, currentStep: progressData.step, status: progressData.status }
          : doc
      )
    );
  };

  return (
    <div className="upload-page">
      <div className="card">
        <h2>Upload Documents</h2>
        <p>Upload one or more documents for processing. Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG</p>

        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #007bff',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: isDragActive ? '#f8f9fa' : 'white',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
          )}
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Selected Files:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.map((file, index) => (
                <li key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: uploading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {uploadedDocuments.length > 0 && (
          <div>
            <h3>Processing Status:</h3>
            {uploadedDocuments.map((doc, index) => (
              <div key={index} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{doc.originalName}</h4>
                  <button
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
                <ProgressTracker
                  jobId={doc.jobId}
                  onProgressUpdate={handleProgressUpdate}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;