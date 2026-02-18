import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AssignedCompanies = ({ userEmail }) => {
  const [alumniInfo, setAlumniInfo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);
  const dropdownRefs = useRef({});

  const statusOptions = [
    { value: 'Not Applied', label: 'Not Applied', color: '#f59e0b' },
    { value: 'Applied', label: 'Applied', color: '#3b82f6' },
    { value: 'In Process', label: 'In Process', color: '#8b5cf6' },
    { value: 'Selected', label: 'Selected', color: '#10b981' },
    { value: 'Rejected', label: 'Rejected', color: '#ef4444' }
  ];

  // Auto-fetch when component mounts with userEmail prop
  useEffect(() => {
    if (userEmail) {
      fetchAlumniId(userEmail);
    }
  }, [userEmail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let clickedInsideDropdown = false;
      
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) {
          clickedInsideDropdown = true;
        }
      });
      
      if (!clickedInsideDropdown) {
        setShowStatusDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusColor = (status) => {
    const statusMap = {
      'Selected': '#10b981',
      'In Process': '#8b5cf6',
      'Applied': '#3b82f6',
      'Rejected': '#ef4444',
      'Not Applied': '#f59e0b'
    };
    return statusMap[status] || statusMap['Not Applied'];
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'Selected': '✓',
      'In Process': '🔄',
      'Applied': '📨',
      'Rejected': '✕',
      'Not Applied': '⏳'
    };
    return iconMap[status] || '⚠';
  };

  // Function to fetch alumni ID from email
  const fetchAlumniId = async (email) => {
    try {
      setLoading(true);
      setError('');
      setAlumniInfo(null);
      setCompanies([]);

      console.log('🔍 Fetching alumni with email:', email);
      
      const response = await axios.get(`${API_BASE_URL}/api/members/email/${encodeURIComponent(email)}`);
      
      console.log('📦 Response:', response.data);
      
      if (response.data.success && response.data.member) {
        const member = response.data.member;
        setAlumniInfo({
          id: member._id,
          name: member.name,
          email: member.email,
          batch: member.batch,
          mobile: member.mobile
        });
        
        fetchCompanyMappings(member._id);
      } else {
        setError(response.data.message || 'Alumni not found');
      }
    } catch (err) {
      console.error('❌ Error fetching alumni:', err);
      
      let errorMessage = 'Error fetching alumni details';
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setCompanies([]);
      setAlumniInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch company mappings for alumni
  const fetchCompanyMappings = async (alumniId) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching company mappings for alumni ID:', alumniId);
      
      const response = await axios.get(`${API_BASE_URL}/api/company-mapping/alumni/${alumniId}`);
      
      console.log('📦 Company mappings response:', response.data);
      
      if (response.data.success) {
        setCompanies(response.data.data || []);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error('❌ Error fetching company mappings:', err);
      setError('Error fetching company assignments');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (mappingId, newStatus, newRemarks) => {
    try {
      console.log('🔄 Updating status:', { mappingId, newStatus });
      
      const response = await axios.patch(`${API_BASE_URL}/api/company-mapping/${mappingId}`, {
        alumni_status: newStatus,
        remarks: newRemarks || ''
      });
      
      if (response.data.success) {
        setCompanies(companies.map(company => 
          company.mapping_id === mappingId ? { 
            ...company, 
            alumni_status: newStatus,
            remarks: newRemarks || company.remarks
          } : company
        ));
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      setError('Error updating status');
    }
    setShowStatusDropdown(null);
  };

  // Handle feedback/remarks update
  const handleRemarksChange = async (mappingId, remarks) => {
    try {
      console.log('📝 Updating remarks for mapping:', mappingId);
      
      await axios.patch(`${API_BASE_URL}/api/company-mapping/${mappingId}`, {
        remarks: remarks
      });
      
      setCompanies(companies.map(company => 
        company.mapping_id === mappingId ? { ...company, remarks } : company
      ));
    } catch (err) {
      console.error('❌ Error updating remarks:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Toggle dropdown
  const toggleDropdown = (mappingId) => {
    setShowStatusDropdown(showStatusDropdown === mappingId ? null : mappingId);
  };

  return (
    <div style={{ minHeight: '100vh',  padding: '30px 20px' }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 30px',
        textAlign: 'center'
      }}>
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
          🏢
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          margin: '0 0 8px 0'
        }}>
          Assigned Companies
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          margin: '0 0 20px 0'
        }}>
          View and manage your assigned companies
        </p>

        {/* User Info Display */}
        {alumniInfo && (
          <div style={{
            maxWidth: '500px',
            margin: '0 auto 30px',
            padding: '20px',
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 5px 20px rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.1)'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#374151',
              padding: '15px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              borderRadius: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>👤</span>
                <span style={{ fontWeight: '600' }}>{alumniInfo.name}</span>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Batch:</span> {alumniInfo.batch}
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Email:</span> {alumniInfo.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            color: '#dc2626',
            padding: '15px 20px',
            borderRadius: '10px',
            margin: '0 auto 20px',
            maxWidth: '600px',
            border: '1px solid #fca5a5'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <div>
                <strong style={{ display: 'block', marginBottom: '5px' }}>Error</strong>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⏳</div>
            <div>Fetching your assigned companies...</div>
          </div>
        )}

        {/* No Companies State */}
        {!loading && companies.length === 0 && alumniInfo && !error && (
          <div style={{
            textAlign: 'center',
            padding: '50px 30px',
            background: 'white',
            borderRadius: '15px',
            maxWidth: '600px',
            margin: '0 auto',
            boxShadow: '0 5px 20px rgba(139, 92, 246, 0.1)',
            border: '2px dashed #e5e7eb'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.7 }}>📭</div>
            <h3 style={{ color: '#4b5563', marginBottom: '10px', fontSize: '18px' }}>
              No Companies Assigned Yet
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              You haven't been assigned to any companies yet. Please check back later or contact the placement office.
            </p>
          </div>
        )}
      </div>

      {/* Cards Container */}
      {!loading && companies.length > 0 && (
        <div>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              padding: '10px 20px',
              borderRadius: '50px',
              boxShadow: '0 2px 10px rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <span style={{ color: '#8b5cf6' }}>📊</span>
              Showing {companies.length} assigned compan{companies.length === 1 ? 'y' : 'ies'}
            </div>
          </div>
          
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '25px'
          }}>
            {companies.map((company) => (
              <div
                key={company.mapping_id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  boxShadow: '0 10px 30px rgba(139, 92, 246, 0.1)',
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  width: '340px',
                  flex: '0 0 340px',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.1)';
                }}
              >
                {/* Company Logo Section */}
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  padding: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '140px',
                  position: 'relative',
                  borderRadius: '20px 20px 0 0'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <span style={{ fontSize: '40px', opacity: 0.9, color: 'white' }}>🏢</span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '15px',
                    left: '0',
                    right: '0',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '4px 12px',
                      borderRadius: '20px'
                    }}>
                      {company.companyName || 'Company'}
                    </span>
                  </div>
                </div>

                {/* Company Info Section */}
                <div style={{ padding: '25px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: '0 0 20px 0',
                    paddingBottom: '15px',
                    borderBottom: '2px solid rgba(139, 92, 246, 0.1)'
                  }}>
                    {company.companyName}
                  </h3>

                  {/* Role */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '6px'
                    }}>
                      <span style={{ color: '#8b5cf6' }}>💼</span>
                      Position
                    </label>
                    <div style={{
                      fontSize: '15px',
                      color: '#1f2937',
                      fontWeight: '500',
                      paddingLeft: '26px'
                    }}>
                      {company.companyRole}
                    </div>
                  </div>

                  {/* CTC */}
                  {company.companyCtc && company.companyCtc !== 'N/A' && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                      }}>
                        <span style={{ color: '#8b5cf6' }}>💰</span>
                        CTC Offered
                      </label>
                      <div style={{
                        fontSize: '15px',
                        color: '#1f2937',
                        fontWeight: '500',
                        paddingLeft: '26px'
                      }}>
                        {company.companyCtc}
                      </div>
                    </div>
                  )}

                  {/* Assigned Date */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '6px'
                    }}>
                      <span style={{ color: '#8b5cf6' }}>📅</span>
                      Assigned On
                    </label>
                    <div style={{
                      fontSize: '14px',
                      color: '#1f2937',
                      fontWeight: '500',
                      paddingLeft: '26px'
                    }}>
                      {formatDate(company.assigned_on)}
                    </div>
                  </div>

                  {/* Status Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#8b5cf6' }}>📊</span>
                      Application Status
                    </label>
                    <div style={{ position: 'relative' }} ref={el => dropdownRefs.current[company.mapping_id] = el}>
                      <button
                        onClick={() => toggleDropdown(company.mapping_id)}
                        style={{
                          width: '100%',
                          padding: '14px 15px',
                          border: 'none',
                          borderRadius: '12px',
                          background: getStatusColor(company.alumni_status || 'Not Applied'),
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: '18px', width: '24px' }}>{getStatusIcon(company.alumni_status || 'Not Applied')}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{company.alumni_status || 'Not Applied'}</span>
                        <span style={{ fontSize: '12px', transition: 'transform 0.2s', transform: showStatusDropdown === company.mapping_id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </button>
                      
                      {showStatusDropdown === company.mapping_id && (
                        <div style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)',
                          overflow: 'hidden',
                          zIndex: 1000,
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          {statusOptions.map((option, index) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(company.mapping_id, option.value, company.remarks)}
                              style={{
                                width: '100%',
                                padding: '14px 15px',
                                border: 'none',
                                background: company.alumni_status === option.value ? 'rgba(139, 92, 246, 0.08)' : 'white',
                                color: company.alumni_status === option.value ? '#7c3aed' : '#1f2937',
                                fontWeight: '600',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderBottom: index < statusOptions.length - 1 ? '1px solid rgba(139, 92, 246, 0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                              onMouseEnter={(e) => {
                                if (company.alumni_status !== option.value) {
                                  e.target.style.background = 'rgba(139, 92, 246, 0.08)';
                                  e.target.style.color = '#7c3aed';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (company.alumni_status !== option.value) {
                                  e.target.style.background = 'white';
                                  e.target.style.color = '#1f2937';
                                }
                              }}
                            >
                              <span style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                background: option.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: 'white',
                                flexShrink: 0
                              }}>
                                {getStatusIcon(option.value)}
                              </span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remarks/Feedback Section */}
                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#8b5cf6' }}>💬</span>
                      Remarks / Feedback
                    </label>
                    <textarea
                      value={company.remarks || ''}
                      onChange={(e) => handleRemarksChange(company.mapping_id, e.target.value)}
                      placeholder="Enter your remarks, interview feedback, or notes..."
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '14px 15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                        minHeight: '100px',
                        backgroundColor: '#f9fafb'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        e.target.style.backgroundColor = 'white';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                        e.target.style.backgroundColor = '#f9fafb';
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }
        
        textarea {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default AssignedCompanies;