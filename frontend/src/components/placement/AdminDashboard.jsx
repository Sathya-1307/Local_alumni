import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AlumniJobRequestsAdmin = ({ onBackToDashboard }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [jobRequests, setJobRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch job requests and companies from API
  useEffect(() => {
    fetchJobRequests();
    fetchCompanies();
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

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/company-mapping/available-companies`);
      
      if (response.data.success) {
        setCompanies(response.data.data);
      } else {
        console.error('Error in response:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  // Fetch already assigned companies for alumni
  const fetchAssignedCompanies = async (alumniId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/company-mapping/alumni/${alumniId}/assigned-companies`);
      if (response.data.success) {
        setAssignedCompanies(response.data.data.assigned_company_ids || []);
      }
    } catch (err) {
      console.error('Error fetching assigned companies:', err);
      setAssignedCompanies([]);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': '#f59e0b',
      'Approved': '#10b981',
      'Rejected': '#ef4444'
    };
    return statusMap[status] || '#f59e0b';
  };

  const handleReview = async (request) => {
    setSelectedRequest(request);
    setSelectedCompanies([]);
    setRemarks('');
    setShowAssignModal(false);
    await fetchAssignedCompanies(request.alumni_user_id);
  };

  const handleCompanySelection = (companyId) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        // Remove if already selected
        return prev.filter(id => id !== companyId);
      } else {
        // Add if not selected
        return [...prev, companyId];
      }
    });
  };

  const handleAssignMultipleCompanies = async () => {
    if (!selectedRequest || selectedCompanies.length === 0) {
      alert('Please select at least one company');
      return;
    }

    try {
      // Step 1: Assign multiple companies to alumni
      const mappingResponse = await axios.post(`${API_BASE_URL}/api/company-mapping/assign-multiple`, {
        alumni_user_id: selectedRequest.alumni_user_id,
        company_ids: selectedCompanies,
        remarks: remarks || null
      });

      if (mappingResponse.data.success) {
        // Step 2: Update job request status to "Approved"
        const updateResponse = await axios.patch(
          `${API_BASE_URL}/api/job-requests/${selectedRequest.request_id}`,
          { status: 'Approved' }
        );

        if (updateResponse.data.success) {
          const summary = mappingResponse.data.summary;
          let message = `✅ Successfully assigned ${summary.created} company(ies)!`;
          
          if (summary.already_existed > 0) {
            message += ` ${summary.already_existed} company(ies) were already assigned.`;
          }
          
          alert(message);
          
          // Update local state
          setJobRequests(prevRequests =>
            prevRequests.map(req =>
              req.request_id === selectedRequest.request_id
                ? { 
                    ...req, 
                    status: 'Approved', 
                    approved_on: new Date() 
                  }
                : req
            )
          );

          // Update selected request
          setSelectedRequest(prev => ({
            ...prev,
            status: 'Approved',
            approved_on: new Date()
          }));

          // Close modal and reset
          setShowAssignModal(false);
          setSelectedCompanies([]);
          setRemarks('');
          
          // Refresh data
          fetchJobRequests();
          await fetchAssignedCompanies(selectedRequest.alumni_user_id);
        } else {
          alert('Failed to update job request status');
        }
      } else {
        alert(mappingResponse.data.message || 'Failed to assign companies');
      }
    } catch (err) {
      console.error('Error assigning companies:', err);
      alert(err.response?.data?.message || 'Error assigning companies. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/job-requests/${selectedRequest.request_id}`,
        { status: 'Rejected' }
      );

      if (response.data.success) {
        setJobRequests(prevRequests =>
          prevRequests.map(req =>
            req.request_id === selectedRequest.request_id
              ? { ...req, status: 'Rejected', approved_on: new Date() }
              : req
          )
        );

        setSelectedRequest(prev => ({
          ...prev,
          status: 'Rejected',
          approved_on: new Date()
        }));

        alert('Request rejected successfully!');
      } else {
        alert('Failed to update request');
      }
    } catch (err) {
      console.error('Error updating request:', err);
      alert('Error updating request. Please try again.');
    }
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

  const getUserContact = (request) => {
    return request.userContact || request.contact || 'Contact not available';
  };

  const getUserEmail = (request) => {
    return request.userEmail || request.email || 'Email not available';
  };

  // Check if company is already assigned
  const isCompanyAlreadyAssigned = (companyId) => {
    return assignedCompanies.includes(companyId);
  };

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
            Alumni Placement Requests
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
        {jobRequests.length === 0 ? (
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
              No alumni have submitted placement requests yet. Check back later!
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
                    Alumni Name
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
                    Preferred Company
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
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobRequests.map((request, index) => (
                  <tr key={request._id || request.request_id} style={{
                    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                    background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(139, 92, 246, 0.02)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(139, 92, 246, 0.02)';
                  }}>
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
          // Try to parse as JSON array
          const skills = JSON.parse(request.skillset);
          if (Array.isArray(skills)) {
            return skills.map((skill, index) => (
              <span key={index} style={{
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
          // If not valid JSON, try to split by comma
          if (typeof request.skillset === 'string') {
            return request.skillset.split(',').map((skill, index) => (
              <span key={index} style={{
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
    </div>
  ) : 'No skills specified'}
</td>
                    <td style={{
                      padding: '18px 20px',
                      fontSize: '13px',
                      color: '#374151',
                      fontWeight: '500'
                    }}>
                      {request.company}
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
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={() => handleReview(request)}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          color: 'white',
                          fontSize: '13px',
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
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && !showAssignModal && (
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
          // Try to parse as JSON array
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
          // If not valid JSON, try to split by comma
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

              {/* Already Assigned Companies Section */}
              {assignedCompanies.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.15)'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#7c3aed',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📋</span> Already Assigned Companies ({assignedCompanies.length})
                  </h3>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    This alumni already has {assignedCompanies.length} company assignment(s). 
                    You can add more companies below.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '15px',
                marginTop: '25px'
              }}>
                {selectedRequest.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        fontSize: 'clamp(13px, 2.5vw, 15px)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      🏢 Assign Companies (Multiple)
                    </button>
                    <button
                      onClick={handleReject}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        fontSize: 'clamp(13px, 2.5vw, 15px)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {selectedRequest.status === 'Approved' && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    color: '#059669',
                    fontSize: '14px',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    ✅ Companies Already Assigned
                  </div>
                )}
                {selectedRequest.status === 'Rejected' && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    ❌ Request Rejected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Multiple Companies Modal */}
      {selectedRequest && showAssignModal && (
        <div
          onClick={() => setShowAssignModal(false)}
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
            zIndex: 1001,
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
              maxWidth: '800px',
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
                  margin: 0
                }}>
                  🏢 Assign Multiple Companies
                </h2>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '400',
                  marginTop: '5px'
                }}>
                  Select multiple companies for {getUserName(selectedRequest)}
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
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
              {/* Selection Summary */}
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#7c3aed',
                    marginBottom: '4px'
                  }}>
                    Selected: {selectedCompanies.length} company(ies)
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Click on companies to select/deselect
                  </div>
                </div>
                {selectedCompanies.length > 0 && (
                  <button
                    onClick={() => setSelectedCompanies([])}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.05)';
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Companies Grid */}
              <div style={{
                marginBottom: '20px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '10px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '15px'
                }}>
                  {companies.map((company) => {
                    const isSelected = selectedCompanies.includes(company.company_id);
                    const isAlreadyAssigned = isCompanyAlreadyAssigned(company.company_id);
                    
                    return (
                      <div
                        key={company.company_id}
                        onClick={() => !isAlreadyAssigned && handleCompanySelection(company.company_id)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: `2px solid ${isSelected ? '#10b981' : isAlreadyAssigned ? '#f59e0b' : 'rgba(139, 92, 246, 0.2)'}`,
                          background: isSelected 
                            ? 'rgba(16, 185, 129, 0.05)' 
                            : isAlreadyAssigned
                            ? 'rgba(245, 158, 11, 0.05)'
                            : 'white',
                          cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isAlreadyAssigned) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isAlreadyAssigned) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {/* Selection Checkbox */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `2px solid ${isSelected ? '#10b981' : isAlreadyAssigned ? '#f59e0b' : '#d1d5db'}`,
                          background: isSelected ? '#10b981' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: 'white'
                        }}>
                          {isSelected && '✓'}
                          {isAlreadyAssigned && '✓'}
                        </div>

                        {/* Company Name */}
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: isAlreadyAssigned ? '#f59e0b' : '#1f2937',
                          marginBottom: '8px',
                          paddingRight: '30px'
                        }}>
                          {company.name}
                          {isAlreadyAssigned && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '10px',
                              fontWeight: '600',
                              color: '#f59e0b',
                              background: 'rgba(245, 158, 11, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Already Assigned
                            </span>
                          )}
                        </h3>

                        {/* Company Details */}
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          lineHeight: '1.6'
                        }}>
                          <div><strong>Role:</strong> {company.role}</div>
                          <div><strong>Location:</strong> {company.location}</div>
                          <div><strong>Skills:</strong> {company.skills_required}</div>
                          {company.ctc_offered && (
                            <div style={{
                              color: '#7c3aed',
                              fontWeight: '600',
                              marginTop: '4px'
                            }}>
                              <strong>CTC:</strong> {company.ctc_offered}
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div style={{
                          marginTop: '10px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: isSelected ? '#10b981' : isAlreadyAssigned ? '#f59e0b' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isSelected && '✓ Selected'}
                          {isAlreadyAssigned && '⚠ Already Assigned'}
                          {!isSelected && !isAlreadyAssigned && 'Click to select'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any additional notes for all selected companies..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    background: 'white',
                    color: '#1f2937',
                    fontWeight: '400',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    resize: 'vertical'
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

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px'
              }}>
                <button
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    background: 'white',
                    color: '#7c3aed',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.05)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignMultipleCompanies}
                  disabled={selectedCompanies.length === 0}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: selectedCompanies.length > 0 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#d1d5db',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: selectedCompanies.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedCompanies.length > 0 ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCompanies.length > 0) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = selectedCompanies.length > 0 ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none';
                  }}
                >
                  ✅ Assign {selectedCompanies.length} Company{selectedCompanies.length !== 1 ? 'ies' : ''}
                </button>
              </div>
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
        Showing {jobRequests.length} placement request{jobRequests.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default AlumniJobRequestsAdmin;
