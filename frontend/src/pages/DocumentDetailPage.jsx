import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import ProgressTracker from '../components/ProgressTracker';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedResult, setEditedResult] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${id}`);
      setDocumentData(response.data);
      setEditedResult(response.data.reviewedResult || response.data.processingResult || {});
    } catch (error) {
      console.error('Failed to fetch document:', error);
      alert('Failed to load document');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async () => {
    try {
      setSaving(true);
      await api.put(`/documents/${id}/review`, { reviewedResult: editedResult });
      setDocument(prev => ({
        ...prev,
        reviewedResult: editedResult,
        updatedAt: new Date().toISOString()
      }));
      setEditing(false);
    } catch (error) {
      console.error('Failed to save review:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      await api.post(`/documents/${id}/finalize`);
      setDocumentData(prev => ({
        ...prev,
        isFinalized: true,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to finalize:', error);
      alert('Failed to finalize document');
    }
  };

  const handleRetry = async () => {
    try {
      await api.post(`/documents/${id}/retry`);
      fetchDocument(); // Refresh the document
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to retry job');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/documents/${id}/export/${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${documentData.originalName.replace(/\.[^/.]+$/, "")}.${format}`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export document');
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="card"><p>Loading document...</p></div>;
  }

  if (!documentData) {
    return <div className="card"><p>Document not found</p></div>;
  }

  const displayResult = documentData.reviewedResult || documentData.processingResult;

  return (
    <div className="document-detail-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{documentData.originalName}</h2>
          <div>
            {documentData.status === 'failed' && (
              <button
                onClick={handleRetry}
                style={{ marginRight: '10px', backgroundColor: '#ffc107' }}
              >
                Retry Job
              </button>
            )}
            {documentData.status === 'completed' && !documentData.isFinalized && (
              <button
                onClick={handleFinalize}
                style={{ marginRight: '10px', backgroundColor: '#28a745' }}
              >
                Finalize
              </button>
            )}
            <button
              onClick={() => handleExport('json')}
              style={{ marginRight: '10px' }}
            >
              Export JSON
            </button>
            <button onClick={() => handleExport('csv')}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Document Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <strong>Status:</strong>
            <span style={{
              color: getStatusColor(documentData.status),
              marginLeft: '8px',
              textTransform: 'capitalize'
            }}>
              {documentData.status}
            </span>
            {documentData.isFinalized && (
              <span style={{ color: '#28a745', marginLeft: '8px' }}>
                (Finalized)
              </span>
            )}
          </div>
          <div>
            <strong>File Size:</strong> {(documentData.size / 1024 / 1024).toFixed(2)} MB
          </div>
          <div>
            <strong>Created:</strong> {formatDate(documentData.createdAt)}
          </div>
          {documentData.completedAt && (
            <div>
              <strong>Completed:</strong> {formatDate(documentData.completedAt)}
            </div>
          )}
        </div>

        {/* Progress Tracker */}
        {documentData.status === 'processing' && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Processing Progress</h3>
            <ProgressTracker jobId={documentData.jobId} />
          </div>
        )}

        {/* Processing Result */}
        {displayResult && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Processing Result</h3>
              {documentData.status === 'completed' && !documentData.isFinalized && (
                <button
                  onClick={() => setEditing(!editing)}
                  style={{
                    backgroundColor: editing ? '#6c757d' : '#007bff'
                  }}
                >
                  {editing ? 'Cancel Edit' : 'Edit Result'}
                </button>
              )}
            </div>

            {editing ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label><strong>Title:</strong></label>
                  <input
                    type="text"
                    value={editedResult.title || ''}
                    onChange={(e) => setEditedResult(prev => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label><strong>Category:</strong></label>
                  <input
                    type="text"
                    value={editedResult.category || ''}
                    onChange={(e) => setEditedResult(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label><strong>Summary:</strong></label>
                  <textarea
                    value={editedResult.summary || ''}
                    onChange={(e) => setEditedResult(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label><strong>Keywords:</strong></label>
                  <input
                    type="text"
                    value={editedResult.keywords ? editedResult.keywords.join(', ') : ''}
                    onChange={(e) => setEditedResult(prev => ({
                      ...prev,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }))}
                    placeholder="Enter keywords separated by commas"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label><strong>Status:</strong></label>
                  <input
                    type="text"
                    value={editedResult.status || ''}
                    onChange={(e) => setEditedResult(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label><strong>Extracted Text:</strong></label>
                  <textarea
                    value={editedResult.extractedText || ''}
                    onChange={(e) => setEditedResult(prev => ({ ...prev, extractedText: e.target.value }))}
                    rows={6}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSaveReview}
                    disabled={saving}
                    style={{
                      backgroundColor: saving ? '#6c757d' : '#28a745',
                      flex: 1
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditedResult(displayResult);
                      setEditing(false);
                    }}
                    style={{ backgroundColor: '#6c757d' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div><strong>Title:</strong> {displayResult.title || 'N/A'}</div>
                <div><strong>Category:</strong> {displayResult.category || 'N/A'}</div>
                <div><strong>Summary:</strong> {displayResult.summary || 'N/A'}</div>
                <div><strong>Keywords:</strong> {displayResult.keywords ? displayResult.keywords.join(', ') : 'N/A'}</div>
                <div><strong>Status:</strong> {displayResult.status || 'N/A'}</div>
                <div>
                  <strong>Extracted Text:</strong>
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {displayResult.extractedText || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {documentData.error && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24'
          }}>
            <strong>Error:</strong> {documentData.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetailPage;