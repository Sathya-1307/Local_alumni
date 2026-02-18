import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, Save, ArrowLeft, Edit, FileText, AlertCircle, Menu, X } from 'lucide-react';

const InterviewResults = () => {
  const [alumniList, setAlumniList] = useState([]);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [alumniDetails, setAlumniDetails] = useState(null);
  const [companiesAssigned, setCompaniesAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  
  // New states for final status and remarks
  const [editingCompany, setEditingCompany] = useState(null);
  const [finalStatus, setFinalStatus] = useState('');
  const [coordinatorRemark, setCoordinatorRemark] = useState('');
  const [isSavingFinalStatus, setIsSavingFinalStatus] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // CORRECTED: Use environment variable or fallback
  const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_BASE = `${API_BASE_URL}/api`;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all alumni with company count
  useEffect(() => {
    fetchAlumniWithCounts();
  }, []);

  // CORRECTED: Final status calculation
  const fetchAlumniWithCounts = async () => {
    try {
      setLoading(true);
      
      const mappingsRes = await fetch(`${API_BASE}/company-mapping`);
      const mappingsData = await mappingsRes.json();
      
      if (mappingsData.success) {
        const alumniMap = new Map();
        
        mappingsData.data.forEach(mapping => {
          const alumniId = mapping.alumni_user_id;
          
          if (!alumniMap.has(alumniId)) {
            alumniMap.set(alumniId, {
              id: alumniId,
              name: mapping.alumniName,
              batch: mapping.alumniBatch,
              email: mapping.alumniEmail,
              companyCount: 0,
              appliedCount: 0,
              selectedCount: 0,
              closureCount: 0,
              notDoableCount: 0,
              pendingCount: 0,
              finalStatus: 'pending'
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
          
          if (mapping.final_status === 'Closure') {
            alumni.closureCount++;
          }
          if (mapping.final_status === 'Not Doable') {
            alumni.notDoableCount++;
          }
          if (!mapping.final_status) {
            alumni.pendingCount++;
          }
        });
        
        const alumniArray = Array.from(alumniMap.values());
        
        alumniArray.forEach(alumni => {
          if (alumni.closureCount > 0) {
            alumni.finalStatus = 'closure';
            alumni.finalStatusLabel = '✅ Closure';
            alumni.finalStatusColor = '#10b981';
            alumni.finalStatusIcon = <CheckCircle size={14} />;
          }
          else if (alumni.notDoableCount > 0) {
            alumni.finalStatus = 'not-doable';
            alumni.finalStatusLabel = '❌ Not Doable';
            alumni.finalStatusColor = '#ef4444';
            alumni.finalStatusIcon = <XCircle size={14} />;
          }
          else {
            alumni.finalStatus = 'pending';
            alumni.finalStatusLabel = '⏳ Pending';
            alumni.finalStatusColor = '#f59e0b';
            alumni.finalStatusIcon = <Clock size={14} />;
          }
        });
        
        setAlumniList(alumniArray);
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumniDetails = async (alumni) => {
    try {
      setDetailsLoading(true);
      setUpdateSuccess(false);
      setUpdateError(null);
      setEditingCompany(null);
      
      const companiesRes = await fetch(`${API_BASE}/company-mapping/alumni/${alumni.id}`);
      const companiesData = await companiesRes.json();
      
      if (companiesData.success) {
        setCompaniesAssigned(companiesData.data || []);
      }
      
      const memberRes = await fetch(`${API_BASE}/members/email/${encodeURIComponent(alumni.email)}`);
      const memberData = await memberRes.json();
      
      if (memberData.success && memberData.member) {
        setAlumniDetails({
          name: memberData.member.name || alumni.name || 'N/A',
          email: memberData.member.email || alumni.email || 'N/A',
          phone: memberData.member.mobile || 'N/A',
          batch: memberData.member.batch || alumni.batch || 'N/A',
        });
      } else {
        setAlumniDetails({
          name: alumni.name || 'N/A',
          email: alumni.email || 'N/A',
          phone: 'Not available',
          batch: alumni.batch || 'N/A',
        });
      }
    } catch (error) {
      console.error('Error fetching alumni details:', error);
      setAlumniDetails({
        name: alumni.name || 'N/A',
        email: alumni.email || 'N/A',
        phone: 'Not available',
        batch: alumni.batch || 'N/A',
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
    setUpdateSuccess(false);
    setUpdateError(null);
    setEditingCompany(null);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMarkAsSelected = async (mappingId) => {
    if (!window.confirm('Are you sure you want to mark this as Selected? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdatingStatus(mappingId);
      setUpdateError(null);
      
      const response = await fetch(`${API_BASE}/company-mapping/${mappingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alumni_status: 'Selected',
          remarks: 'Marked as Selected by Coordinator'
        })
      });

      const data = await response.json();

      if (data.success) {
        setUpdateSuccess(true);
        
        setCompaniesAssigned(prev => 
          prev.map(company => 
            company.mapping_id === mappingId 
              ? { ...company, alumni_status: 'Selected' }
              : company
          )
        );
        
        setTimeout(() => {
          if (selectedAlumni) {
            fetchAlumniDetails(selectedAlumni);
          }
          fetchAlumniWithCounts();
        }, 500);
      } else {
        setUpdateError(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdateError('Error updating status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditFinalStatus = (company) => {
    setEditingCompany(company.mapping_id);
    setFinalStatus(company.final_status || '');
    setCoordinatorRemark(company.coordinator_remark || '');
    if (isMobile) {
      setTimeout(() => {
        const element = document.getElementById(`company-${company.mapping_id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const handleSaveFinalStatus = async (mappingId) => {
    if (!finalStatus && !coordinatorRemark) {
      setUpdateError('Please enter either final status or coordinator remark');
      return;
    }

    try {
      setIsSavingFinalStatus(true);
      setUpdateError(null);

      const response = await fetch(`${API_BASE}/company-mapping/${mappingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          final_status: finalStatus || null,
          coordinator_remark: coordinatorRemark || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setUpdateSuccess(true);
        
        setCompaniesAssigned(prev => 
          prev.map(company => 
            company.mapping_id === mappingId 
              ? { 
                  ...company, 
                  final_status: finalStatus || null,
                  coordinator_remark: coordinatorRemark || null
                }
              : company
          )
        );
        
        setEditingCompany(null);
        setFinalStatus('');
        setCoordinatorRemark('');
        
        setTimeout(() => {
          if (selectedAlumni) {
            fetchAlumniDetails(selectedAlumni);
          }
          fetchAlumniWithCounts();
        }, 500);
        
      } else {
        setUpdateError(data.message || 'Failed to save final status');
      }
    } catch (error) {
      console.error('Error saving final status:', error);
      setUpdateError('Error saving final status. Please try again.');
    } finally {
      setIsSavingFinalStatus(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
    setFinalStatus('');
    setCoordinatorRemark('');
    setUpdateError(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Applied': { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280', icon: <Clock size={14} /> },
      'Applied': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: <Clock size={14} /> },
      'In Process': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', icon: <Clock size={14} /> },
      'Selected': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: <CheckCircle size={14} /> },
      'Rejected': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: <XCircle size={14} /> }
    };
    return colors[status] || colors['Not Applied'];
  };

  const getFinalStatusColor = (status) => {
    const colors = {
      'Closure': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: <CheckCircle size={14} /> },
      'Not Doable': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: <XCircle size={14} /> },
      '': { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280', icon: <AlertCircle size={14} /> }
    };
    return colors[status] || colors[''];
  };

  const getStatusAction = (status) => {
    if (status === 'Selected') {
      return { label: 'Already Selected', disabled: true };
    } else if (status === 'Rejected') {
      return { label: 'Cannot Select (Rejected)', disabled: true };
    } else {
      return { label: 'Mark as Selected', disabled: false };
    }
  };

  const filteredAlumni = alumniList.filter(alumni => 
    alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Responsive container styles
  const containerStyle = {
    minHeight: '100vh',
    padding: isMobile ? '1rem' : '2rem',
   
  };

  const cardStyle = {
    background: 'white',
    borderRadius: isMobile ? '12px' : '16px',
    padding: isMobile ? '1rem' : '1.5rem',
    boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.1)' : '0 20px 60px rgba(0,0,0,0.15)',
    marginBottom: isMobile ? '1rem' : '1.5rem'
  };

  // LIST VIEW
  if (!selectedAlumni) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  padding: '0.5rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                Interview Results
              </h1>
              <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
            </div>
          )}

          {/* Header */}
          <div style={{
            ...cardStyle,
            borderLeft: '6px solid #667eea',
            display: isMobile && isMobileMenuOpen ? 'none' : 'block'
          }}>
            <h1 style={{ 
              fontSize: isMobile ? '1.5rem' : '2rem', 
              fontWeight: '700', 
              color: '#1f2937', 
              marginBottom: '0.5rem' 
            }}>
              Interview Results Dashboard
            </h1>
            <p style={{ 
              color: '#6b7280', 
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              Track alumni company assignments and mark selected candidates
            </p>
          </div>

          {/* Search Bar */}
          <div style={{
            ...cardStyle,
            display: isMobile && isMobileMenuOpen ? 'none' : 'block'
          }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af', 
                width: '18px', 
                height: '18px' 
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
                  borderRadius: '8px', 
                  fontSize: isMobile ? '0.875rem' : '1rem', 
                  outline: 'none', 
                  transition: 'all 0.3s' 
                }}
              />
            </div>
          </div>

          {/* Alumni List */}
          <div style={{
            ...cardStyle,
            display: isMobile && isMobileMenuOpen ? 'none' : 'block'
          }}>
            <div style={{ 
              marginBottom: '1rem', 
              paddingBottom: '0.75rem', 
              borderBottom: '2px solid #f3f4f6' 
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '1.125rem' : '1.5rem', 
                fontWeight: '700', 
                color: '#1f2937' 
              }}>
                Alumni List ({filteredAlumni.length})
              </h2>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #f3f4f6', 
                  borderTop: '4px solid #667eea', 
                  borderRadius: '50%', 
                  margin: '0 auto 1rem', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
                Loading alumni...
              </div>
            ) : filteredAlumni.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No alumni found
              </div>
            ) : (
              <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem' }}>
                {filteredAlumni.map((alumni, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '0.75rem' : '1rem',
                      padding: isMobile ? '1rem' : '1.5rem',
                      background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                      borderRadius: '8px',
                      border: '1px solid #e0e7ff',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={() => !isMobile && handleViewMore(alumni)}
                  >
                    {/* Name & Details - Mobile Stack */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      width: '100%'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: isMobile ? '1rem' : '1.125rem', 
                          fontWeight: '600', 
                          color: '#1f2937', 
                          marginBottom: '0.25rem' 
                        }}>
                          {alumni.name}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem', 
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
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
                      
                      {/* Final Status Badge for Mobile */}
                      {isMobile && (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.5rem',
                          background: `${alumni.finalStatusColor}20`,
                          color: alumni.finalStatusColor,
                          borderRadius: '12px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {alumni.finalStatusIcon}
                          <span style={{ marginLeft: '0.25rem' }}>
                            {alumni.finalStatusLabel.replace('✅', '').replace('❌', '').replace('⏳', '')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
                      gap: isMobile ? '0.5rem' : '1rem',
                      width: '100%'
                    }}>
                      {/* Companies Assigned */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: isMobile ? '1.25rem' : '2rem', 
                          fontWeight: '700', 
                          color: '#667eea' 
                        }}>
                          {alumni.companyCount}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.625rem' : '0.75rem', 
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
                          fontSize: isMobile ? '1.25rem' : '1.5rem', 
                          fontWeight: '600', 
                          color: '#f59e0b' 
                        }}>
                          {alumni.appliedCount}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.625rem' : '0.75rem', 
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
                          fontSize: isMobile ? '1.25rem' : '1.5rem', 
                          fontWeight: '600', 
                          color: '#10b981' 
                        }}>
                          {alumni.selectedCount}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '0.625rem' : '0.75rem', 
                          color: '#6b7280', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>
                          Selected
                        </div>
                      </div>

                      {/* Final Status - Desktop */}
                      {!isMobile && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.375rem 0.75rem',
                              background: `${alumni.finalStatusColor}20`,
                              color: alumni.finalStatusColor,
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {alumni.finalStatusIcon}
                              {alumni.finalStatusLabel}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                              {alumni.closureCount > 0 && `${alumni.closureCount} C`}
                              {alumni.notDoableCount > 0 && `${alumni.notDoableCount} N`}
                              {alumni.pendingCount > 0 && `${alumni.pendingCount} P`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View More Button */}
                    <button
                      onClick={() => handleViewMore(alumni)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: isMobile ? '0.5rem' : '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        width: '100%',
                        marginTop: isMobile ? '0.25rem' : '0'
                      }}
                    >
                      <Eye size={isMobile ? 14 : 16} />
                      View Details
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
          input:focus {
            border-color: #667eea !important;
          }
        `}</style>
      </div>
    );
  }

  // DETAIL VIEW
  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Button and Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: isMobile ? '1rem' : '1.5rem',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : '0'
        }}>
          <button
            onClick={handleBackToList}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <ArrowLeft size={isMobile ? 16 : 18} />
            Back to List
          </button>
          
          <h1 style={{ 
            fontSize: isMobile ? '1.25rem' : '1.75rem', 
            fontWeight: '700', 
            color: '#1f2937',
            textAlign: isMobile ? 'center' : 'left',
            width: isMobile ? '100%' : 'auto'
          }}>
            Interview Outcomes Dashboard
          </h1>
        </div>

        {/* Success Message */}
        {updateSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={18} color="#10b981" />
            <span style={{ color: '#065f46', fontWeight: '500', fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Status updated successfully!
            </span>
          </div>
        )}

        {/* Error Message */}
        {updateError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <XCircle size={18} color="#ef4444" />
            <span style={{ color: '#991b1b', fontWeight: '500', fontSize: isMobile ? '0.875rem' : '1rem' }}>
              {updateError}
            </span>
          </div>
        )}

        {detailsLoading ? (
          <div style={{ 
            ...cardStyle,
            textAlign: 'center', 
            padding: isMobile ? '2rem' : '3rem'
          }}>
            <div style={{ 
              width: isMobile ? '40px' : '50px', 
              height: isMobile ? '40px' : '50px', 
              border: '4px solid #f3f4f6', 
              borderTop: '4px solid #667eea', 
              borderRadius: '50%', 
              margin: '0 auto 1rem', 
              animation: 'spin 1s linear infinite' 
            }}></div>
            Loading alumni details...
          </div>
        ) : alumniDetails ? (
          <>
            {/* Profile Card */}
            <div style={cardStyle}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: isMobile ? '1rem' : '2rem',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0'
              }}>
                <h2 style={{ 
                  fontSize: isMobile ? '1.25rem' : '2rem', 
                  fontWeight: '700', 
                  color: '#1f2937' 
                }}>
                  {alumniDetails.name}
                </h2>
                <span style={{ 
                  padding: '0.375rem 0.75rem', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: '#10b981', 
                  borderRadius: '12px', 
                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                  fontWeight: '600' 
                }}>
                  Alumni Profile
                </span>
              </div>

              {/* Info Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: isMobile ? '1rem' : '1.5rem', 
                marginBottom: isMobile ? '1rem' : '2rem' 
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
                  <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: '#1f2937', fontWeight: '500' }}>
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
                  <div style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: '#1f2937', fontWeight: '500' }}>
                    {alumniDetails.batch}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', 
                gap: isMobile ? '0.5rem' : '1rem' 
              }}>
                <div style={{ 
                  padding: isMobile ? '0.75rem' : '1.5rem', 
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                  borderRadius: '8px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '2rem', 
                    fontWeight: '700', 
                    color: '#1e40af' 
                  }}>
                    {companiesAssigned.length}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#1e3a8a', 
                    marginTop: '0.25rem' 
                  }}>
                    Total Companies
                  </div>
                </div>

                <div style={{ 
                  padding: isMobile ? '0.75rem' : '1.5rem', 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                  borderRadius: '8px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '2rem', 
                    fontWeight: '700', 
                    color: '#b45309' 
                  }}>
                    {companiesAssigned.filter(c => c.alumni_status === 'Applied' || c.alumni_status === 'In Process').length}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#92400e', 
                    marginTop: '0.25rem' 
                  }}>
                    In Progress
                  </div>
                </div>

                <div style={{ 
                  padding: isMobile ? '0.75rem' : '1.5rem', 
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                  borderRadius: '8px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '2rem', 
                    fontWeight: '700', 
                    color: '#065f46' 
                  }}>
                    {companiesAssigned.filter(c => c.alumni_status === 'Selected').length}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                    color: '#064e3b', 
                    marginTop: '0.25rem' 
                  }}>
                    Selected
                  </div>
                </div>
              </div>
            </div>

            {/* Companies Assigned */}
            <div style={cardStyle}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: isMobile ? '1rem' : '1.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0'
              }}>
                <h3 style={{ 
                  fontSize: isMobile ? '1.125rem' : '1.5rem', 
                  fontWeight: '700', 
                  color: '#1f2937' 
                }}>
                  Assigned Companies
                </h3>
                <div style={{ 
                  padding: '0.375rem 0.75rem', 
                  background: 'rgba(102, 126, 234, 0.1)', 
                  color: '#667eea', 
                  borderRadius: '12px', 
                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                  fontWeight: '600' 
                }}>
                  {companiesAssigned.filter(c => c.alumni_status === 'Selected').length} Selected
                </div>
              </div>

              {companiesAssigned.length > 0 ? (
                <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem' }}>
                  {companiesAssigned.map((company, index) => {
                    const statusStyle = getStatusColor(company.alumni_status);
                    const finalStatusStyle = getFinalStatusColor(company.final_status || '');
                    const statusAction = getStatusAction(company.alumni_status);
                    
                    return (
                      <div 
                        key={index} 
                        id={`company-${company.mapping_id}`}
                        style={{ 
                          padding: isMobile ? '1rem' : '1.5rem', 
                          background: '#f9fafb', 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb',
                          position: 'relative'
                        }}>
                        {/* Status Badge - Mobile positioning */}
                        <div style={{ 
                          position: isMobile ? 'relative' : 'absolute', 
                          top: isMobile ? 'auto' : '1.5rem', 
                          right: isMobile ? 'auto' : '1.5rem',
                          left: isMobile ? 'auto' : 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isMobile ? 'flex-start' : 'center',
                          gap: '0.5rem',
                          padding: '0.375rem 0.75rem', 
                          background: statusStyle.bg, 
                          color: statusStyle.color, 
                          borderRadius: '12px', 
                          fontSize: isMobile ? '0.75rem' : '0.875rem', 
                          fontWeight: '600',
                          marginBottom: isMobile ? '0.75rem' : '0',
                          width: isMobile ? 'fit-content' : 'auto'
                        }}>
                          {statusStyle.icon}
                          {company.alumni_status}
                        </div>

                        {/* Final Status Badge */}
                        {(company.final_status || company.coordinator_remark) && !editingCompany && (
                          <div style={{ 
                            position: isMobile ? 'relative' : 'absolute', 
                            top: isMobile ? 'auto' : '4rem', 
                            right: isMobile ? 'auto' : '1.5rem',
                            left: isMobile ? 'auto' : 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            maxWidth: isMobile ? '100%' : '200px',
                            marginTop: isMobile ? '0.5rem' : '0',
                            marginBottom: isMobile ? '0.75rem' : '0'
                          }}>
                            {company.final_status && (
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isMobile ? 'flex-start' : 'center',
                                gap: '0.5rem',
                                padding: '0.375rem 0.75rem', 
                                background: finalStatusStyle.bg, 
                                color: finalStatusStyle.color, 
                                borderRadius: '12px', 
                                fontSize: isMobile ? '0.75rem' : '0.875rem', 
                                fontWeight: '600',
                                textAlign: isMobile ? 'left' : 'center'
                              }}>
                                {finalStatusStyle.icon}
                                Final: {company.final_status}
                              </div>
                            )}
                            
                            {company.coordinator_remark && (
                              <div style={{ 
                                padding: '0.5rem 0.75rem', 
                                background: 'rgba(59, 130, 246, 0.1)', 
                                color: '#3b82f6', 
                                borderRadius: '8px', 
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                maxHeight: '100px',
                                overflowY: 'auto'
                              }}>
                                <div style={{ 
                                  fontSize: isMobile ? '0.65rem' : '0.7rem', 
                                  color: '#3b82f6', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.05em', 
                                  marginBottom: '0.25rem' 
                                }}>
                                  Coordinator Remark:
                                </div>
                                {company.coordinator_remark}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Company Info */}
                        <div style={{ 
                          marginRight: editingCompany || isMobile ? '0' : '120px',
                          marginTop: isMobile ? '0' : '0'
                        }}>
                          <h4 style={{ 
                            fontSize: isMobile ? '1rem' : '1.25rem', 
                            fontWeight: '600', 
                            color: '#1f2937', 
                            marginBottom: '0.25rem' 
                          }}>
                            {company.companyName}
                          </h4>
                          <p style={{ 
                            color: '#6b7280', 
                            fontSize: isMobile ? '0.75rem' : '0.875rem', 
                            marginBottom: '0.5rem' 
                          }}>
                            Role: {company.companyRole}
                          </p>

                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: isMobile ? '0.5rem' : '1rem', 
                            marginTop: '0.5rem' 
                          }}>
                            <div>
                              <div style={{ 
                                fontSize: isMobile ? '0.65rem' : '0.75rem', 
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
                                fontSize: isMobile ? '0.65rem' : '0.75rem', 
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
                                fontSize: isMobile ? '0.65rem' : '0.75rem', 
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

                          {/* Final Status Edit Form or Edit Button */}
                          {editingCompany === company.mapping_id ? (
                            <div style={{ 
                              marginTop: '1rem', 
                              padding: isMobile ? '1rem' : '1.5rem', 
                              background: '#f0f9ff', 
                              borderRadius: '8px', 
                              border: '1px solid #bae6fd'
                            }}>
                              <h5 style={{ 
                                fontSize: isMobile ? '0.875rem' : '1rem', 
                                fontWeight: '600', 
                                color: '#0369a1', 
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <Edit size={isMobile ? 14 : 16} />
                                Edit Final Status
                              </h5>
                              
                              <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <div>
                                  <label style={{ 
                                    display: 'block', 
                                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                                    fontWeight: '500', 
                                    color: '#374151', 
                                    marginBottom: '0.25rem' 
                                  }}>
                                    Final Status
                                  </label>
                                  <select
                                    value={finalStatus}
                                    onChange={(e) => setFinalStatus(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '2px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      outline: 'none',
                                      background: 'white',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">Select final status (optional)</option>
                                    <option value="Closure">Closure</option>
                                    <option value="Not Doable">Not Doable</option>
                                  </select>
                                </div>

                                <div>
                                  <label style={{ 
                                    display: 'block', 
                                    fontSize: isMobile ? '0.75rem' : '0.875rem', 
                                    fontWeight: '500', 
                                    color: '#374151', 
                                    marginBottom: '0.25rem' 
                                  }}>
                                    Coordinator Remarks (optional)
                                  </label>
                                  <textarea
                                    value={coordinatorRemark}
                                    onChange={(e) => setCoordinatorRemark(e.target.value)}
                                    placeholder="Enter any remarks or notes..."
                                    rows={3}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '2px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      outline: 'none',
                                      background: 'white',
                                      resize: 'vertical'
                                    }}
                                  />
                                </div>

                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'flex-end', 
                                  gap: '0.5rem',
                                  flexWrap: 'wrap'
                                }}>
                                  <button
                                    onClick={handleCancelEdit}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: 'white',
                                      color: '#6b7280',
                                      border: '2px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s',
                                      flex: isMobile ? '1' : 'auto'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveFinalStatus(company.mapping_id)}
                                    disabled={isSavingFinalStatus}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      fontWeight: '600',
                                      cursor: isSavingFinalStatus ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.3s',
                                      opacity: isSavingFinalStatus ? 0.7 : 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.5rem',
                                      flex: isMobile ? '1' : 'auto'
                                    }}
                                  >
                                    {isSavingFinalStatus ? (
                                      <>
                                        <div style={{ 
                                          width: '14px', 
                                          height: '14px', 
                                          border: '2px solid rgba(255,255,255,0.3)', 
                                          borderTop: '2px solid white', 
                                          borderRadius: '50%', 
                                          animation: 'spin 1s linear infinite' 
                                        }} />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save size={isMobile ? 12 : 16} />
                                        Save
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Coordinator Action Buttons */}
                              <div style={{ 
                                marginTop: '1rem', 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? '0.5rem' : '0'
                              }}>
                                <button
                                  onClick={() => handleEditFinalStatus(company)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    width: isMobile ? '100%' : 'auto'
                                  }}
                                >
                                  <Edit size={isMobile ? 12 : 16} />
                                  {company.final_status ? 'Edit Final Status' : 'Add Final Status'}
                                </button>

                                <button
                                  onClick={() => handleMarkAsSelected(company.mapping_id)}
                                  disabled={statusAction.disabled || updatingStatus === company.mapping_id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                                    background: statusAction.disabled 
                                      ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'
                                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    fontWeight: '600',
                                    cursor: statusAction.disabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: statusAction.disabled ? 0.7 : 1,
                                    width: isMobile ? '100%' : 'auto'
                                  }}
                                >
                                  {updatingStatus === company.mapping_id ? (
                                    <>
                                      <div style={{ 
                                        width: '14px', 
                                        height: '14px', 
                                        border: '2px solid rgba(255,255,255,0.3)', 
                                        borderTop: '2px solid white', 
                                        borderRadius: '50%', 
                                        animation: 'spin 1s linear infinite' 
                                      }} />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Save size={isMobile ? 12 : 16} />
                                      {statusAction.label}
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {company.remarks && company.remarks !== 'Marked as Selected by Coordinator' && (
                          <div style={{ 
                            marginTop: '0.75rem', 
                            padding: '0.5rem', 
                            background: '#f3f4f6', 
                            borderRadius: '6px' 
                          }}>
                            <div style={{ 
                              fontSize: isMobile ? '0.65rem' : '0.75rem', 
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
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No companies assigned to this alumni
                </div>
              )}

              {/* Coordinator Instructions */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: 'rgba(245, 158, 11, 0.1)', 
                borderRadius: '8px', 
                border: '1px solid rgba(245, 158, 11, 0.3)' 
              }}>
                <div style={{ 
                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                  color: '#92400e', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <AlertCircle size={isMobile ? 14 : 16} />
                  Coordinator Final Status - IMPORTANT:
                </div>
                <ul style={{ 
                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                  color: '#92400e', 
                  paddingLeft: '1.25rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  <li><strong>✅ Closure</strong> - MANUALLY set when alumni responded</li>
                  <li><strong>❌ Not Doable</strong> - MANUALLY set when alumni no response</li>
                  <li><strong>⏳ Pending</strong> - DEFAULT - no action yet</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div style={{ 
            ...cardStyle,
            textAlign: 'center', 
            padding: isMobile ? '2rem' : '3rem'
          }}>
            <div style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>
              ⚠️
            </div>
            <p style={{ color: '#6b7280', fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Could not load alumni details. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewResults;