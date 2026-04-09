import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import ProgressTracker from '../components/ProgressTracker';

const DashboardPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortField: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, [filters, pagination.page]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      const response = await api.get(`/documents?${params}`);
      setDocuments(response.data.documents);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSort = (field) => {
    const newOrder = filters.sortField === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortOrder: newOrder
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRetry = async (documentId) => {
    try {
      await api.post(`/documents/${documentId}/retry`);
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to retry job');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/documents/export/${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documents.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export documents');
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

  return (
    <div className="dashboard-page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Document Dashboard</h2>
          <div>
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

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{ marginLeft: '8px' }}
            >
              <option value="">All</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label>Search:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by filename, title, or category..."
              style={{ marginLeft: '8px', width: '100%' }}
            />
          </div>
        </div>

        {/* Documents Table */}
        {loading ? (
          <p>Loading documents...</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th
                      style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', cursor: 'pointer' }}
                      onClick={() => handleSort('originalName')}
                    >
                      Filename {filters.sortField === 'originalName' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', cursor: 'pointer' }}
                      onClick={() => handleSort('status')}
                    >
                      Status {filters.sortField === 'status' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', cursor: 'pointer' }}
                      onClick={() => handleSort('createdAt')}
                    >
                      Created {filters.sortField === 'createdAt' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                      Progress
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {doc.originalName}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <span style={{
                          color: getStatusColor(doc.status),
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {formatDate(doc.createdAt)}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {doc.status === 'processing' ? (
                          <ProgressTracker jobId={doc.jobId} />
                        ) : (
                          `${doc.progress || 0}%`
                        )}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <button
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          style={{ marginRight: '8px' }}
                        >
                          View
                        </button>
                        {doc.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(doc._id)}
                            style={{ backgroundColor: '#ffc107' }}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      backgroundColor: pagination.page === page ? '#007bff' : '#f8f9fa',
                      color: pagination.page === page ? 'white' : 'black'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;