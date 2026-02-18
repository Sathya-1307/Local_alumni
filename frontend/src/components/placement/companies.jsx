import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'alumni', 'non-alumni'

  // Fetch all companies
  useEffect(() => {
    fetchCompanies();
  }, []);

// Replace the fetchCompanies function in Companies.jsx with:
const fetchCompanies = async () => {
  try {
    setLoading(true);
   const response = await axios.get(`${API_BASE_URL}/api/company-mapping/available-companies`);
    
    if (response.data.success) {
      setCompanies(response.data.data);
      setError('');
    } else {
      setError('Failed to load companies data');
    }
  } catch (err) {
    setError('Failed to fetch companies. Please try again.');
    console.error('Error fetching companies:', err);
  } finally {
    setLoading(false);
  }
};
 

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredCompanies = companies.filter(company => {
    if (filter === 'all') return true;
    if (filter === 'alumni') return company.is_alumni_company;
    if (filter === 'non-alumni') return !company.is_alumni_company;
    return true;
  });

  // Inline CSS
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    title: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    filters: {
      display: 'flex',
      gap: '10px'
    },
    filterButton: {
      padding: '8px 16px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s'
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white'
    },
    th: {
      backgroundColor: '#f8f9fa',
      padding: '16px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#2c3e50',
      borderBottom: '2px solid #e9ecef',
      position: 'sticky',
      top: 0
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #e9ecef',
      verticalAlign: 'top'
    },
    tr: {
      transition: 'background-color 0.2s'
    },
    companyName: {
      fontWeight: '500',
      color: '#3498db',
      cursor: 'pointer'
    },
    alumniBadge: {
      backgroundColor: '#27ae60',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    nonAlumniBadge: {
      backgroundColor: '#7f8c8d',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    skills: {
      color: '#666',
      fontSize: '14px',
      maxWidth: '250px'
    },
    location: {
      color: '#666',
      fontSize: '14px'
    },
    deadline: {
      color: '#e74c3c',
      fontWeight: '500'
    },
    ctc: {
      color: '#27ae60',
      fontWeight: '600'
    },
    viewButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.3s'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#7f8c8d'
    },
    modalDetail: {
      marginBottom: '15px'
    },
    modalLabel: {
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '5px'
    },
    modalValue: {
      color: '#34495e',
      lineHeight: '1.6'
    },
    posterImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      marginTop: '10px'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: '#7f8c8d'
    },
    error: {
      textAlign: 'center',
      padding: '20px',
      color: '#e74c3c',
      backgroundColor: '#fadbd8',
      borderRadius: '5px',
      margin: '20px 0'
    },
    link: {
      color: '#3498db',
      textDecoration: 'none'
    },
    linkButton: {
      display: 'inline-block',
      backgroundColor: '#2ecc71',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: '500',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Recruiting Companies</h1>
        
        <div style={styles.filters}>
          <button 
            style={{ 
              ...styles.filterButton, 
              backgroundColor: filter === 'all' ? '#3498db' : '#ecf0f1',
              color: filter === 'all' ? 'white' : '#2c3e50'
            }}
            onClick={() => setFilter('all')}
          >
            All Companies ({companies.length})
          </button>
          <button 
            style={{ 
              ...styles.filterButton, 
              backgroundColor: filter === 'alumni' ? '#27ae60' : '#ecf0f1',
              color: filter === 'alumni' ? 'white' : '#2c3e50'
            }}
            onClick={() => setFilter('alumni')}
          >
            Alumni Companies ({companies.filter(c => c.is_alumni_company).length})
          </button>
          <button 
            style={{ 
              ...styles.filterButton, 
              backgroundColor: filter === 'non-alumni' ? '#e74c3c' : '#ecf0f1',
              color: filter === 'non-alumni' ? 'white' : '#2c3e50'
            }}
            onClick={() => setFilter('non-alumni')}
          >
            Non-Alumni Companies ({companies.filter(c => !c.is_alumni_company).length})
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>
          <p>Loading companies...</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Company Name</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Skills Required</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>CTC Offered</th>
                <th style={styles.th}>Deadline</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company._id} style={styles.tr}>
                  <td style={styles.td}>{company.company_id}</td>
                  <td style={styles.td}>
                    <div 
                      style={styles.companyName}
                      onClick={() => handleViewDetails(company)}
                    >
                      {company.name}
                    </div>
                  </td>
                  <td style={styles.td}>{company.role}</td>
                  <td style={styles.td}>
                    <div style={styles.skills}>
                      {company.skills_required}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.location}>
                      {company.location}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.ctc}>
                      {company.ctc_offered || 'Not specified'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.deadline}>
                      {formatDate(company.deadline)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={company.is_alumni_company ? styles.alumniBadge : styles.nonAlumniBadge}>
                      {company.is_alumni_company ? 'Alumni' : 'Non-Alumni'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.viewButton}
                      onClick={() => handleViewDetails(company)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for company details */}
      {showModal && selectedCompany && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{selectedCompany.name}</h2>
              <button style={styles.closeButton} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Company ID</div>
              <div style={styles.modalValue}>{selectedCompany.company_id}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Job Role</div>
              <div style={styles.modalValue}>{selectedCompany.role}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Location</div>
              <div style={styles.modalValue}>{selectedCompany.location}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>CTC Offered</div>
              <div style={styles.modalValue}>{selectedCompany.ctc_offered || 'Not specified'}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Deadline</div>
              <div style={styles.modalValue}>{formatDate(selectedCompany.deadline)}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Skills Required</div>
              <div style={styles.modalValue}>{selectedCompany.skills_required}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Job Description</div>
              <div style={styles.modalValue}>{selectedCompany.description || 'No description provided'}</div>
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Application Link</div>
              {selectedCompany.link ? (
                <a 
                  href={selectedCompany.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.linkButton}
                >
                  Apply Now
                </a>
              ) : (
                <div style={styles.modalValue}>No link provided</div>
              )}
            </div>

            <div style={styles.modalDetail}>
              <div style={styles.modalLabel}>Company Type</div>
              <div style={styles.modalValue}>
                <span style={selectedCompany.is_alumni_company ? styles.alumniBadge : styles.nonAlumniBadge}>
                  {selectedCompany.is_alumni_company ? 'Alumni Company' : 'Non-Alumni Company'}
                </span>
              </div>
            </div>

            {selectedCompany.poster && (
              <div style={styles.modalDetail}>
                <div style={styles.modalLabel}>Job Poster</div>
                <img 
                src={`${API_BASE_URL}/uploads/${selectedCompany.poster}`}
                  alt="Job Poster" 
                  style={styles.posterImage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;