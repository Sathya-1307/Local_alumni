import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  User, 
  Calendar, 
  GraduationCap,
  Search
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AlumniFeedbackDisplay = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Fetch feedback data
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
     const response = await axios.get(`${API_BASE_URL}/api/requester-feedback`);
      
      if (response.data.success) {
        setFeedbacks(response.data.feedbacks);
        setError('');
      } else {
        setError('Failed to load feedback data');
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to fetch alumni feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter feedbacks by name, batch, or feedback
  const filteredFeedbacks = feedbacks.filter(feedback => {
    return (
      feedback.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.userBatch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedback_text?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner purple-spinner"></div>
          <p className="loading-text">Loading alumni feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-full-container">
        <h3 className="error-full-title">Error Loading Feedback</h3>
        <p className="error-full-message">{error}</p>
        <button
          onClick={fetchFeedbacks}
          className="error-retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="alumni-container">
      <div className="alumni-wrapper">
        {/* Header */}
        <div className="alumni-header">
          <h1 className="alumni-title">
            <MessageSquare className="alumni-header-icon" />
            Alumni Feedback
          </h1>
          <p className="alumni-subtitle">
            Feedback from alumni for placement requests
          </p>
        </div>

        {/* Search Bar */}
        <div className="alumni-search-container">
          <div className="alumni-search-wrapper">
            <Search className="alumni-search-icon" />
            <input
              type="text"
              placeholder="Search by name, batch, or feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="alumni-search-input"
            />
          </div>
        </div>

        {/* Feedback Table */}
        <div className="alumni-table-container">
          <div className="alumni-table-wrapper">
            <table className="alumni-table">
              <thead className="alumni-table-header">
                <tr>
                  <th className="alumni-th">
                    Alumni Name
                  </th>
                  <th className="alumni-th">
                    Batch
                  </th>
                  <th className="alumni-th">
                    Feedback
                  </th>
                  <th className="alumni-th">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="alumni-table-body">
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="alumni-empty-state">
                      <div className="alumni-empty-content">
                        <MessageSquare className="alumni-empty-icon" />
                        <h3 className="alumni-empty-title">No feedback found</h3>
                        <p className="alumni-empty-text">
                          {searchTerm ? 'Try changing your search' : 'No alumni feedback available yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <tr 
                      key={feedback._id} 
                      className="alumni-table-row"
                      onClick={() => setSelectedFeedback(feedback)}
                    >
                      {/* Name Column */}
                      <td className="alumni-name-cell">
                        <div className="alumni-name-content">
                          <div className="alumni-name-avatar">
                            <User className="alumni-name-icon" />
                          </div>
                          <div className="alumni-name-details">
                            <div className="alumni-name-text">
                              {feedback.userName || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Batch Column */}
                      <td className="alumni-batch-cell">
                        <div className="alumni-batch-content">
                          <GraduationCap className="alumni-batch-icon" />
                          <span className="alumni-batch-text">
                            {feedback.userBatch || 'N/A'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Feedback Column */}
                      <td className="alumni-feedback-cell">
                        <div className="alumni-feedback-text">
                          {feedback.feedback_text ? (
                            <span className="alumni-feedback-truncated">
                              {feedback.feedback_text}
                            </span>
                          ) : (
                            <span className="alumni-no-feedback">No feedback provided</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Date Column */}
                      <td className="alumni-date-cell">
                        <div className="alumni-date-content">
                          <Calendar className="alumni-date-icon" />
                          {formatDate(feedback.submitted_on)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="alumni-summary">
          Showing {filteredFeedbacks.length} of {feedbacks.length} feedbacks
        </div>

        {/* Modal for detailed view */}
        {selectedFeedback && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-content">
                {/* Modal Header */}
                <div className="modal-header">
                  <div>
                    <h3 className="modal-title">Feedback Details</h3>
                    <p className="modal-subtitle">Complete feedback information</p>
                  </div>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="modal-close-button"
                  >
                    ✕
                  </button>
                </div>

                {/* Alumni Info */}
                <div className="modal-info-section">
                  <h4 className="modal-section-title">
                    <User className="modal-section-icon user-icon" />
                    Alumni Information
                  </h4>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <label className="modal-info-label">Name</label>
                      <p className="modal-info-value">{selectedFeedback.userName || 'N/A'}</p>
                    </div>
                    <div className="modal-info-item">
                      <label className="modal-info-label">Batch</label>
                      <p className="modal-info-value">
                        <GraduationCap className="modal-batch-icon" />
                        {selectedFeedback.userBatch || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feedback Details */}
                <div className="modal-feedback-section">
                  <h4 className="modal-section-title">
                    <MessageSquare className="modal-section-icon feedback-icon" />
                    Feedback
                  </h4>
                  <div className="modal-feedback-content">
                    <label className="modal-info-label">Feedback Text</label>
                    <div className="modal-feedback-box">
                      <p className="modal-feedback-text">
                        {selectedFeedback.feedback_text || 'No feedback provided'}
                      </p>
                    </div>
                  </div>
                  <div className="modal-feedback-date">
                    <Calendar className="modal-date-icon" />
                    Submitted on: {formatDate(selectedFeedback.submitted_on)}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="modal-close-footer-button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Base Styles */
        .alumni-container {
          min-height: 100vh;
         
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .alumni-container {
            padding: 1.5rem;
          }
        }

        .alumni-wrapper {
          max-width: 80rem;
          margin: 0 auto;
        }

        /* Header Styles */
        .alumni-header {
          margin-bottom: 2rem;
        }

        .alumni-title {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .alumni-header-icon {
          display: inline-block;
          margin-right: 0.75rem;
          color: #9333ea;
          height: 1.5rem;
          width: 1.5rem;
        }

        .alumni-subtitle {
          color: #6b7280;
        }

        /* Search Bar Styles */
        .alumni-search-container {
          background-color: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .alumni-search-wrapper {
          position: relative;
        }

        .alumni-search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          height: 1.25rem;
          width: 1.25rem;
        }

        .alumni-search-input {
          width: 100%;
          padding-left: 2.5rem;
          padding-right: 1rem;
          padding-top: 0.625rem;
          padding-bottom: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }

        .alumni-search-input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.5);
        }

        /* Table Styles */
        .alumni-table-container {
          background-color: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .alumni-table-wrapper {
          overflow-x: auto;
        }

        .alumni-table {
          min-width: 100%;
          border-collapse: collapse;
        }

        .alumni-table-header {
          background-color: #f9fafb;
        }

        .alumni-th {
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }

        .alumni-table-body {
          background-color: white;
        }

        .alumni-table-row {
          transition: background-color 0.2s;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }

        .alumni-table-row:hover {
          background-color: #f9fafb;
        }

        /* Name Cell */
        .alumni-name-cell {
          padding: 1rem 1.5rem;
          white-space: nowrap;
        }

        .alumni-name-content {
          display: flex;
          align-items: center;
        }

        .alumni-name-avatar {
          flex-shrink: 0;
          height: 2.5rem;
          width: 2.5rem;
          background-color: #f3e8ff;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alumni-name-icon {
          height: 1.25rem;
          width: 1.25rem;
          color: #9333ea;
        }

        .alumni-name-details {
          margin-left: 1rem;
        }

        .alumni-name-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        /* Batch Cell */
        .alumni-batch-cell {
          padding: 1rem 1.5rem;
          white-space: nowrap;
        }

        .alumni-batch-content {
          display: flex;
          align-items: center;
        }

        .alumni-batch-icon {
          height: 1rem;
          width: 1rem;
          color: #9ca3af;
          margin-right: 0.5rem;
        }

        .alumni-batch-text {
          font-size: 0.875rem;
          color: #111827;
        }

        /* Feedback Cell */
        .alumni-feedback-cell {
          padding: 1rem 1.5rem;
        }

        .alumni-feedback-text {
          font-size: 0.875rem;
          color: #111827;
        }

        .alumni-feedback-truncated {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .alumni-no-feedback {
          color: #9ca3af;
          font-style: italic;
        }

        /* Date Cell */
        .alumni-date-cell {
          padding: 1rem 1.5rem;
          white-space: nowrap;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .alumni-date-content {
          display: flex;
          align-items: center;
        }

        .alumni-date-icon {
          height: 1rem;
          width: 1rem;
          margin-right: 0.5rem;
          color: #9ca3af;
        }

        /* Empty State */
        .alumni-empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .alumni-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .alumni-empty-icon {
          height: 3rem;
          width: 3rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .alumni-empty-title {
          font-size: 1.125rem;
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .alumni-empty-text {
          color: #6b7280;
        }

        /* Summary */
        .alumni-summary {
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
        }

        /* Loading Styles */
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 16rem;
        }

        .loading-content {
          text-align: center;
        }

        .spinner {
          animation: spin 1s linear infinite;
          border-radius: 9999px;
          height: 3rem;
          width: 3rem;
          margin: 0 auto 1rem;
        }

        .purple-spinner {
          border-bottom: 2px solid #9333ea;
        }

        .loading-text {
          color: #6b7280;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Error Full Page Styles */
        .error-full-container {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.5rem;
          padding: 1.5rem;
          text-align: center;
        }

        .error-full-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #991b1b;
          margin-bottom: 0.5rem;
        }

        .error-full-message {
          color: #dc2626;
          margin-bottom: 1rem;
        }

        .error-retry-button {
          padding: 0.5rem 1rem;
          background-color: #dc2626;
          color: white;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .error-retry-button:hover {
          background-color: #b91c1c;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 50;
        }

        .modal-container {
          background-color: white;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 42rem;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content {
          padding: 1.5rem;
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #111827;
        }

        .modal-subtitle {
          color: #6b7280;
        }

        .modal-close-button {
          color: #9ca3af;
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
        }

        .modal-close-button:hover {
          color: #6b7280;
        }

        /* Modal Sections */
        .modal-info-section,
        .modal-feedback-section {
          background-color: #f9fafb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .modal-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }

        .modal-section-icon {
          height: 1.25rem;
          width: 1.25rem;
          margin-right: 0.5rem;
        }

        .user-icon {
          color: #9333ea;
        }

        .feedback-icon {
          color: #16a34a;
        }

        .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .modal-info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .modal-info-item {
          display: flex;
          flex-direction: column;
        }

        .modal-info-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .modal-info-value {
          color: #111827;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .modal-batch-icon {
          height: 1rem;
          width: 1rem;
          margin-right: 0.5rem;
        }

        /* Feedback Content */
        .modal-feedback-content {
          margin-bottom: 1.5rem;
        }

        .modal-feedback-box {
          margin-top: 0.5rem;
          padding: 1rem;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          min-height: 150px;
        }

        .modal-feedback-text {
          color: #111827;
        }

        .modal-feedback-date {
          display: flex;
          align-items: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .modal-date-icon {
          height: 1rem;
          width: 1rem;
          margin-right: 0.5rem;
        }

        /* Modal Footer */
        .modal-footer {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
        }

        .modal-close-footer-button {
          padding: 0.625rem 1.5rem;
          background-color: #f3f4f6;
          color: #374151;
          border-radius: 0.5rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .modal-close-footer-button:hover {
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default AlumniFeedbackDisplay;