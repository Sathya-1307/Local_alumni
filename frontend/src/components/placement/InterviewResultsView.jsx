import React, { useState, useEffect } from 'react';
import { Search, Eye, ArrowLeft } from 'lucide-react';

const InterviewResultsView = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [alumniDetails, setAlumniDetails] = useState(null);
  const [companiesAssigned, setCompaniesAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // FIX: Add /api to the base URL
  const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_BASE = `${API_BASE_URL}/api`;
  
  console.log('API Base URL:', API_BASE);

  // Responsive screen detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch all alumni with company count
  useEffect(() => {
    fetchAlumniWithCounts();
  }, []);

  const fetchAlumniWithCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `${API_BASE}/company-mapping`;
      console.log('Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data) {
        const alumniMap = new Map();
        
        result.data.forEach(mapping => {
          const alumniId = mapping.alumni_user_id;
          if (!alumniMap.has(alumniId)) {
            alumniMap.set(alumniId, {
              id: alumniId,
              name: mapping.alumniName || 'Unknown',
              batch: mapping.alumniBatch || 'Unknown',
              email: mapping.alumniEmail || 'No email',
              companyCount: 0,
              appliedCount: 0,
              selectedCount: 0
            });
          }
          
          const alumni = alumniMap.get(alumniId);
          alumni.companyCount++;
          
          if (mapping.alumni_status === 'Applied' || mapping.alumni_status === 'In Process') {
            alumni.appliedCount++;
          }
          if (mapping.alumni_status === 'Selected') {
            alumni.selectedCount++;
          }
        });
        
        setAlumniList(Array.from(alumniMap.values()));
      } else {
        setError('No data received from API');
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumniDetails = async (alumni) => {
    try {
      setDetailsLoading(true);
      
      const companiesRes = await fetch(`${API_BASE}/company-mapping/alumni/${alumni.id}`);
      const companiesData = await companiesRes.json();
      
      if (companiesData.success) {
        setCompaniesAssigned(companiesData.data || []);
      }
      
      const memberRes = await fetch(`${API_BASE}/members/email/${encodeURIComponent(alumni.email)}`);
      const memberData = await memberRes.json();
      
      if (memberData.success && memberData.member) {
        setAlumniDetails({
          name: memberData.member.name || alumni.name,
          email: memberData.member.email || alumni.email,
          phone: memberData.member.mobile || 'Not available',
          batch: memberData.member.batch || alumni.batch,
          skills: []
        });
      } else {
        setAlumniDetails({
          name: alumni.name,
          email: alumni.email,
          phone: 'Not available',
          batch: alumni.batch,
          skills: []
        });
      }
    } catch (error) {
      console.error('Error fetching alumni details:', error);
      setAlumniDetails({
        name: alumni.name,
        email: alumni.email,
        phone: 'Not available',
        batch: alumni.batch,
        skills: []
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewMore = (alumni) => {
    setSelectedAlumni(alumni);
    fetchAlumniDetails(alumni);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToList = () => {
    setSelectedAlumni(null);
    setAlumniDetails(null);
    setCompaniesAssigned([]);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Applied': { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280' },
      'Applied': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
      'In Process': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
      'Selected': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
    };
    return colors[status] || colors['Not Applied'];
  };

  const filteredAlumni = alumniList.filter(alumni => 
    alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Responsive styles - REMOVED background color
  const containerStyle = {
    minHeight: '100vh',
    padding: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem'
    // Background color removed here
  };

  const cardStyle = {
    background: 'white',
    borderRadius: isMobile ? '12px' : '16px',
    padding: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
    boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.1)' : '0 20px 60px rgba(0,0,0,0.15)',
    marginBottom: isMobile ? '1rem' : '1.5rem'
  };

  // LIST VIEW
  if (!selectedAlumni) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            ...cardStyle,
            borderLeft: '6px solid #667eea'
          }}>
            <h1 style={{ 
              fontSize: isMobile ? '1.5rem' : isTablet ? '1.75rem' : '2rem', 
              fontWeight: '700', 
              color: '#1f2937', 
              marginBottom: isMobile ? '0.5rem' : '1rem' 
            }}>
              Interview Outcomes Dashboard
            </h1>
            <p style={{ 
              color: '#6b7280', 
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              Track alumni company assignments and application status
            </p>
          </div>

          {/* Search Bar */}
          <div style={cardStyle}>
            <div style={{ position: 'relative' }}>
              <Search style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af', 
                width: isMobile ? '18px' : '20px', 
                height: isMobile ? '18px' : '20px' 
              }} />
              <input
                type="text"
                placeholder="Search by name, email, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '0.5rem 0.5rem 0.5rem 2.5rem' : '0.75rem 1rem 0.75rem 3rem', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: isMobile ? '8px' : '12px', 
                  fontSize: isMobile ? '0.875rem' : '1rem', 
                  outline: 'none', 
                  transition: 'all 0.3s',
                  WebkitAppearance: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              ...cardStyle,
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
              border: '1px solid #ef4444',
              color: '#7f1d1d',
              marginBottom: '1rem',
              padding: isMobile ? '0.75rem' : '1rem'
            }}>
              <strong style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Error:</strong> {error}
            </div>
          )}

          {/* Alumni List */}
          <div style={cardStyle}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: isMobile ? '1rem' : '1.5rem', 
              paddingBottom: isMobile ? '0.75rem' : '1rem', 
              borderBottom: '2px solid #f3f4f6',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '0.5rem' : '0'
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '1.25rem' : isTablet ? '1.375rem' : '1.5rem', 
                fontWeight: '700', 
                color: '#1f2937' 
              }}>
                Alumni List ({filteredAlumni.length})
              </h2>
             
            </div>

            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem', 
                color: '#6b7280' 
              }}>
                <div style={{ 
                  width: isMobile ? '40px' : isTablet ? '45px' : '50px', 
                  height: isMobile ? '40px' : isTablet ? '45px' : '50px', 
                  border: '4px solid #f3f4f6', 
                  borderTop: '4px solid #667eea', 
                  borderRadius: '50%', 
                  margin: '0 auto 1rem', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
                Loading alumni...
              </div>
            ) : error ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem', 
                color: '#6b7280' 
              }}>
                <div style={{ 
                  color: '#ef4444', 
                  fontSize: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem', 
                  marginBottom: '1rem' 
                }}>
                  ⚠️
                </div>
                <p style={{ 
                  marginBottom: '1rem', 
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  lineHeight: '1.5'
                }}>
                  {error}
                </p>
                <button 
                  onClick={fetchAlumniWithCounts}
                  style={{
                    padding: isMobile ? '0.5rem 1rem' : isTablet ? '0.625rem 1.25rem' : '0.75rem 1.5rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: isMobile ? '6px' : '8px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) e.currentTarget.style.opacity = '1';
                  }}
                >
                  Retry
                </button>
              </div>
            ) : filteredAlumni.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem', 
                color: '#6b7280' 
              }}>
                No alumni found
              </div>
            ) : (
              <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : isTablet ? '0.875rem' : '1rem' }}>
                {filteredAlumni.map((alumni, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '0.75rem' : isTablet ? '0.875rem' : '1rem',
                      padding: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
                      background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                      borderRadius: isMobile ? '8px' : '12px',
                      border: '1px solid #e0e7ff',
                      alignItems: 'center',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewMore(alumni)}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Name & Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: isMobile ? '1rem' : isTablet ? '1.1rem' : '1.125rem', 
                        fontWeight: '600', 
                        color: '#1f2937', 
                        marginBottom: '0.25rem' 
                      }}>
                        {alumni.name}
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem', 
                        color: '#6b7280',
                        wordBreak: 'break-word'
                      }}>
                        {alumni.email}
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem', 
                        color: '#6b7280', 
                        marginTop: '0.25rem' 
                      }}>
                        Batch: {alumni.batch}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
                      gap: isMobile ? '0.5rem' : isTablet ? '0.75rem' : '1rem',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      {/* Companies Assigned */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem', 
                          fontWeight: '700', 
                          color: '#667eea' 
                        }}>
                          {alumni.companyCount}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.625rem' : isTablet ? '0.7rem' : '0.75rem', 
                          color: '#6b7280', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>
                          Companies
                        </div>
                      </div>

                      {/* Applied */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '1.5rem', 
                          fontWeight: '600', 
                          color: '#f59e0b' 
                        }}>
                          {alumni.appliedCount}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.625rem' : isTablet ? '0.7rem' : '0.75rem', 
                          color: '#6b7280', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>
                          Applied
                        </div>
                      </div>

                      {/* Selected */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '1.5rem', 
                          fontWeight: '600', 
                          color: '#10b981' 
                        }}>
                          {alumni.selectedCount}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.625rem' : isTablet ? '0.7rem' : '0.75rem', 
                          color: '#6b7280', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>
                          Selected
                        </div>
                      </div>
                    </div>

                    {/* View More Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMore(alumni);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: isMobile ? '0.5rem' : isTablet ? '0.625rem 1.25rem' : '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: isMobile ? '6px' : '8px',
                        fontSize: isMobile ? '0.75rem' : isTablet ? '0.8125rem' : '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        width: isMobile ? '100%' : 'auto',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Eye size={isMobile ? 14 : isTablet ? 15 : 16} />
                      View More
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* Mobile optimizations */
          @media (max-width: 767px) {
            * {
              -webkit-tap-highlight-color: transparent;
            }
            
            button:active {
              transform: scale(0.98);
              transition: transform 0.1s;
            }
            
            input:focus {
              font-size: 16px !important; /* Prevents iOS zoom */
            }
          }
          
          /* Tablet optimizations */
          @media (min-width: 768px) and (max-width: 1023px) {
            button:hover {
              opacity: 0.9;
            }
          }
          
          /* Desktop optimizations */
          @media (min-width: 1024px) {
            button:hover {
              opacity: 0.9;
            }
          }
        `}</style>
      </div>
    );
  }

  // DETAIL VIEW
  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.5rem 1rem' : isTablet ? '0.625rem 1.25rem' : '0.75rem 1.5rem',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: isMobile ? '8px' : '12px',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
            transition: 'all 0.3s',
            width: isMobile ? '100%' : 'auto'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }
          }}
        >
          <ArrowLeft size={isMobile ? 16 : isTablet ? 17 : 18} />
          Back to List
        </button>

        {detailsLoading ? (
          <div style={{ 
            ...cardStyle,
            textAlign: 'center', 
            padding: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem'
          }}>
            <div style={{ 
              width: isMobile ? '40px' : isTablet ? '45px' : '50px', 
              height: isMobile ? '40px' : isTablet ? '45px' : '50px', 
              border: '4px solid #f3f4f6', 
              borderTop: '4px solid #667eea', 
              borderRadius: '50%', 
              margin: '0 auto 1rem', 
              animation: 'spin 1s linear infinite' 
            }}></div>
            Loading details...
          </div>
        ) : alumniDetails ? (
          <>
            {/* Profile Card */}
            <div style={cardStyle}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0'
              }}>
                <h2 style={{ 
                  fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem', 
                  fontWeight: '700', 
                  color: '#1f2937' 
                }}>
                  {alumniDetails.name}
                </h2>
                <span style={{ 
                  padding: isMobile ? '0.375rem 0.75rem' : isTablet ? '0.5rem 1rem' : '0.5rem 1rem', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: '#10b981', 
                  borderRadius: isMobile ? '12px' : '20px', 
                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Active
                </span>
              </div>

              {/* Info Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem', 
                marginBottom: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem' 
              }}>
                <div>
                  <div style={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem', 
                    color: '#6b7280', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: '0.25rem' 
                  }}>
                    📧 Email
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.875rem' : '1rem', 
                    color: '#1f2937', 
                    fontWeight: '500',
                    wordBreak: 'break-word'
                  }}>
                    {alumniDetails.email}
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem', 
                    color: '#6b7280', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: '0.25rem' 
                  }}>
                    📱 Phone
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.875rem' : '1rem', 
                    color: '#1f2937', 
                    fontWeight: '500' 
                  }}>
                    {alumniDetails.phone}
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem', 
                    color: '#6b7280', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: '0.25rem' 
                  }}>
                    🎓 Batch
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.875rem' : '1rem', 
                    color: '#1f2937', 
                    fontWeight: '500' 
                  }}>
                    {alumniDetails.batch}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', 
                gap: isMobile ? '0.5rem' : isTablet ? '0.75rem' : '1rem' 
              }}>
                <div style={{ 
                  padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.5rem', 
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                  borderRadius: isMobile ? '8px' : '12px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem', 
                    fontWeight: '700', 
                    color: '#1e40af' 
                  }}>
                    {companiesAssigned.length}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#1e3a8a', 
                    marginTop: isMobile ? '0.25rem' : '0.5rem' 
                  }}>
                    Total Companies
                  </div>
                </div>

                <div style={{ 
                  padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.5rem', 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                  borderRadius: isMobile ? '8px' : '12px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem', 
                    fontWeight: '700', 
                    color: '#b45309' 
                  }}>
                    {companiesAssigned.filter(c => c.alumni_status === 'Applied' || c.alumni_status === 'In Process').length}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#92400e', 
                    marginTop: isMobile ? '0.25rem' : '0.5rem' 
                  }}>
                    In Progress
                  </div>
                </div>

                <div style={{ 
                  padding: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.5rem', 
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                  borderRadius: isMobile ? '8px' : '12px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem', 
                    fontWeight: '700', 
                    color: '#065f46' 
                  }}>
                    {companiesAssigned.filter(c => c.alumni_status === 'Selected').length}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#064e3b', 
                    marginTop: isMobile ? '0.25rem' : '0.5rem' 
                  }}>
                    Selected
                  </div>
                </div>
              </div>
            </div>

            {/* Companies Assigned */}
            <div style={cardStyle}>
              <h3 style={{ 
                fontSize: isMobile ? '1.125rem' : isTablet ? '1.25rem' : '1.5rem', 
                fontWeight: '700', 
                color: '#1f2937', 
                marginBottom: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem' 
              }}>
                Assigned Companies
              </h3>

              {companiesAssigned.length > 0 ? (
                <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : isTablet ? '0.875rem' : '1rem' }}>
                  {companiesAssigned.map((company, index) => {
                    const statusStyle = getStatusColor(company.alumni_status);
                    return (
                      <div key={index} style={{ 
                        padding: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem', 
                        background: '#f9fafb', 
                        borderRadius: isMobile ? '8px' : '12px', 
                        border: '1px solid #e5e7eb' 
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'start', 
                          marginBottom: isMobile ? '0.75rem' : '1rem',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: isMobile ? '0.5rem' : '0'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              fontSize: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem', 
                              fontWeight: '600', 
                              color: '#1f2937', 
                              marginBottom: '0.25rem' 
                            }}>
                              {company.companyName}
                            </h4>
                            <p style={{ 
                              color: '#6b7280', 
                              fontSize: isMobile ? '0.75rem' : '0.875rem' 
                            }}>
                              {company.companyRole}
                            </p>
                          </div>
                          <span style={{ 
                            padding: isMobile ? '0.375rem 0.75rem' : isTablet ? '0.5rem 1rem' : '0.5rem 1rem', 
                            background: statusStyle.bg, 
                            color: statusStyle.color, 
                            borderRadius: isMobile ? '12px' : '20px', 
                            fontSize: isMobile ? '0.75rem' : '0.875rem', 
                            fontWeight: '600',
                            alignSelf: isMobile ? 'flex-start' : 'auto'
                          }}>
                            {company.alumni_status}
                          </span>
                        </div>

                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                          gap: isMobile ? '0.75rem' : isTablet ? '0.875rem' : '1rem', 
                          marginTop: isMobile ? '0.75rem' : '1rem' 
                        }}>
                          <div>
                            <div style={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem', 
                              color: '#6b7280', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              marginBottom: '0.25rem' 
                            }}>
                              Location
                            </div>
                            <div style={{ 
                              fontSize: isMobile ? '0.75rem' : '0.875rem', 
                              color: '#1f2937', 
                              fontWeight: '500' 
                            }}>
                              📍 {company.companyLocation}
                            </div>
                          </div>

                          <div>
                            <div style={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem', 
                              color: '#6b7280', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              marginBottom: '0.25rem' 
                            }}>
                              CTC
                            </div>
                            <div style={{ 
                              fontSize: isMobile ? '0.75rem' : '0.875rem', 
                              color: '#1f2937', 
                              fontWeight: '500' 
                            }}>
                              💰 {company.companyCtc}
                            </div>
                          </div>

                          <div>
                            <div style={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem', 
                              color: '#6b7280', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              marginBottom: '0.25rem' 
                            }}>
                              Assigned On
                            </div>
                            <div style={{ 
                              fontSize: isMobile ? '0.75rem' : '0.875rem', 
                              color: '#1f2937', 
                              fontWeight: '500' 
                            }}>
                              📅 {company.assigned_on ? new Date(company.assigned_on).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {company.remarks && (
                          <div style={{ 
                            marginTop: isMobile ? '0.75rem' : '1rem', 
                            padding: isMobile ? '0.5rem' : '0.75rem', 
                            background: '#f3f4f6', 
                            borderRadius: isMobile ? '6px' : '8px' 
                          }}>
                            <div style={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem', 
                              color: '#6b7280', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              marginBottom: '0.25rem' 
                            }}>
                              Remarks
                            </div>
                            <div style={{ 
                              fontSize: isMobile ? '0.75rem' : '0.875rem', 
                              color: '#374151' 
                            }}>
                              {company.remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem', 
                  color: '#6b7280' 
                }}>
                  No companies assigned to this alumni
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ 
            ...cardStyle,
            textAlign: 'center', 
            padding: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem'
          }}>
            <div style={{ 
              color: '#ef4444', 
              fontSize: isMobile ? '1.25rem' : isTablet ? '1.375rem' : '1.5rem', 
              marginBottom: '1rem' 
            }}>
              ⚠️
            </div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: isMobile ? '0.875rem' : '1rem' 
            }}>
              Could not load alumni details. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewResultsView;