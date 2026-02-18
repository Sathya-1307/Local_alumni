import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AlumniJobRequestsDisplay = ({ onBackToDashboard }) => {
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch job requests from API
  useEffect(() => {
    fetchJobRequests();
  }, []);

  const fetchJobRequests = async () => {
    try {
      setLoading(true);
      setError(null);
     const response = await axios.get(`${API_BASE_URL}/api/job-requests`);
      
      if (response.data.success) {
        setJobRequests(response.data.data);
      } else {
        setError('Failed to fetch placement requests');
      }
    } catch (err) {
      console.error('Error fetching placement requests:', err);
      setError('Error loading placement requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': '#f59e0b',
      'Approved': '#10b981',
      'Rejected': '#ef4444'
    };
    return statusMap[status] || '#6b7280';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getUserName = (request) => {
    return request.userName || request.name || `User ID: ${request.alumni_user_id}`;
  };

  const getUserBatch = (request) => {
    return request.userBatch || request.batch || 'Batch not available';
  };

  const getUserEmail = (request) => {
    return request.userEmail || request.email || 'Email not available';
  };

  const getUserContact = (request) => {
    return request.userContact || request.contact || 'Contact not available';
  };

  // Filter job requests based on search term and status
  const filteredRequests = jobRequests.filter(request => {
    const matchesSearch = 
      getUserName(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserBatch(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserEmail(request).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.company && request.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.location && request.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 20px',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Loading placement requests...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '40px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '35px'
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '10px'
          }}>
            Error Loading Data
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </p>
          <button
            onClick={fetchJobRequests}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '250px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '35px',
            boxShadow: '0 10px 28px rgba(139, 92, 246, 0.32)'
          }}>
            👥
          </div>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 28px)',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Alumni Opportunity Requests
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            margin: 0
          }}>
            {jobRequests.length} request{jobRequests.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                color: '#7c3aed',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              ← Back to Dashboard
            </button>
          )}
          
          <button
            onClick={fetchJobRequests}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        padding: '20px',
        boxShadow: '0 5px 15px rgba(139, 92, 246, 0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          {/* Search Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, batch, email, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '2px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                background: 'white',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '2px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                background: 'white',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Results Count */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Showing Results
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7c3aed'
            }}>
              {filteredRequests.length} of {jobRequests.length} requests
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15)',
        overflow: 'hidden'
      }}>
        {filteredRequests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px'
            }}>
              📭
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '10px'
            }}>
              No Placement Requests Found
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'No requests match your search criteria. Try different filters.'
                : 'No alumni have submitted placement requests yet. Check back later!'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white'
                }}>
                  <th style={{
                    padding: '18px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    ID
                  </th>
                  <th style={{
                    padding: '18px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Alumni Details
                  </th>
                  <th style={{
                    padding: '18px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Skillset
                  </th>
                  <th style={{
                    padding: '18px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Target Company
                  </th>
                  <th style={{
                    padding: '18px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '18px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Request Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr 
                    key={request._id || request.request_id} 
                    style={{
                      borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(139, 92, 246, 0.02)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(139, 92, 246, 0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td style={{
                      padding: '18px 20px',
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '600',
                      fontFamily: 'monospace'
                    }}>
                      {request.request_id}
                    </td>
                    <td style={{
                      padding: '18px 20px',
                      fontSize: '15px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <div>
                          <div>{getUserName(request)}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                            {getUserBatch(request)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '400' }}>
                            {getUserEmail(request)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '18px 20px',
                      fontSize: '14px',
                      color: '#374151',
                      fontWeight: '500',
                      maxWidth: '200px'
                    }}>
                      {request.skillset ? (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {(() => {
                            try {
                              const skills = JSON.parse(request.skillset);
                              if (Array.isArray(skills)) {
                                return skills.slice(0, 3).map((skill, idx) => (
                                  <span key={idx} style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#7c3aed',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {skill.trim()}
                                  </span>
                                ));
                              }
                            } catch (e) {
                              if (typeof request.skillset === 'string') {
                                return request.skillset.split(',').slice(0, 3).map((skill, idx) => (
                                  <span key={idx} style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#7c3aed',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {skill.trim()}
                                  </span>
                                ));
                              }
                            }
                            return 'No skills specified';
                          })()}
                          {(() => {
                            try {
                              const skills = JSON.parse(request.skillset);
                              if (Array.isArray(skills) && skills.length > 3) {
                                return (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    background: 'rgba(156, 163, 175, 0.1)',
                                    color: '#6b7280',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    border: '1px solid rgba(156, 163, 175, 0.2)'
                                  }}>
                                    +{skills.length - 3} more
                                  </span>
                                );
                              }
                            } catch (e) {
                              if (typeof request.skillset === 'string') {
                                const skillCount = request.skillset.split(',').length;
                                if (skillCount > 3) {
                                  return (
                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '12px',
                                      background: 'rgba(156, 163, 175, 0.1)',
                                      color: '#6b7280',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      border: '1px solid rgba(156, 163, 175, 0.2)'
                                    }}>
                                      +{skillCount - 3} more
                                    </span>
                                  );
                                }
                              }
                            }
                            return null;
                          })()}
                        </div>
                      ) : 'No skills specified'}
                    </td>
                    <td style={{
                      padding: '18px 20px',
                      fontSize: '14px',
                      color: '#374151',
                      fontWeight: '500'
                    }}>
                      {request.company || 'Not specified'}
                    </td>
                    <td style={{
                      padding: '18px 20px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: getStatusColor(request.status),
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'inline-block'
                      }}>
                        {request.status}
                      </span>
                    </td>
                    <td style={{
                      padding: '18px 20px',
                      textAlign: 'center',
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {formatDate(request.requested_on)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div
          onClick={() => setSelectedRequest(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(40px)',
              borderRadius: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.25)',
              margin: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 25px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              zIndex: 10,
              gap: '15px'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: '800',
                  color: '#1f2937',
                  margin: 0,
                  wordBreak: 'break-word'
                }}>
                  {getUserName(selectedRequest)}
                  <span style={{
                    marginLeft: '10px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: getStatusColor(selectedRequest.status),
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    verticalAlign: 'middle'
                  }}>
                    {selectedRequest.status}
                  </span>
                </h2>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '400',
                  marginTop: '5px'
                }}>
                  Request ID: {selectedRequest.request_id}
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  minWidth: '40px',
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  color: '#7c3aed',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.target.style.color = '#7c3aed';
                  e.target.style.transform = 'rotate(0deg)';
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '25px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      width: '40%'
                    }}>
                      📧 Email
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600',
                      wordBreak: 'break-word'
                    }}>
                      {getUserEmail(selectedRequest)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      📱 Phone
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {getUserContact(selectedRequest)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      🎓 Batch
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {getUserBatch(selectedRequest)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      📍 Preferred Location
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {selectedRequest.location}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      💼 Skillset
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {selectedRequest.skillset ? (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginTop: '5px'
                        }}>
                          {(() => {
                            try {
                              const skills = JSON.parse(selectedRequest.skillset);
                              if (Array.isArray(skills)) {
                                return skills.map((skill, index) => (
                                  <span key={index} style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                    color: '#7c3aed',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)'
                                  }}>
                                    {skill.trim()}
                                  </span>
                                ));
                              }
                            } catch (e) {
                              if (typeof selectedRequest.skillset === 'string') {
                                return selectedRequest.skillset.split(',').map((skill, index) => (
                                  <span key={index} style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                    color: '#7c3aed',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)'
                                  }}>
                                    {skill.trim()}
                                  </span>
                                ));
                              }
                            }
                            return 'No skills specified';
                          })()}
                        </div>
                      ) : 'No skills specified'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      🏢 Target Company
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {selectedRequest.company}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      ⏱️ Experience
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {selectedRequest.experience || 'Not specified'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      💰 Current CTC
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '16px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {selectedRequest.ctc_current ? `₹${selectedRequest.ctc_current}` : 'Not specified'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      📅 Requested On
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {formatDate(selectedRequest.requested_on)}
                    </td>
                  </tr>
                  {selectedRequest.approved_on && (
                    <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                      <td style={{
                        padding: '15px 10px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        ✅ Updated On
                      </td>
                      <td style={{
                        padding: '15px 10px',
                        fontSize: '14px',
                        color: selectedRequest.status === 'Approved' ? '#10b981' : '#ef4444',
                        fontWeight: '700'
                      }}>
                        {formatDate(selectedRequest.approved_on)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      📝 Additional Message
                    </td>
                    <td style={{
                      padding: '15px 10px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500',
                      fontStyle: 'italic'
                    }}>
                      {selectedRequest.message || 'No additional message'}
                    </td>
                  </tr>
                  {selectedRequest.attachment && (
                    <tr>
                      <td style={{
                        padding: '15px 10px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        📎 Resume
                      </td>
                      <td style={{
                        padding: '15px 10px',
                        fontSize: '14px',
                        color: '#1f2937',
                        fontWeight: '600'
                      }}>
                        <a
                        href={`${API_BASE_URL}/uploads/${selectedRequest.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#7c3aed',
                            textDecoration: 'none',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            transition: 'all 0.3s ease',
                            display: 'inline-block'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(139, 92, 246, 0.2)';
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(139, 92, 246, 0.1)';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          📄 View Resume
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        Displaying {filteredRequests.length} placement request{filteredRequests.length !== 1 ? 's' : ''} • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default AlumniJobRequestsDisplay;