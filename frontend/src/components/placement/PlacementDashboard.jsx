import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TrendingUp, Building2, Award, Users, ChevronLeft, Check, ArrowLeft, 
  Search, X, Mail, Calendar, DollarSign, Briefcase, User, ChevronRight, 
  ChevronLeft as ChevronLeftIcon, MoreVertical, Video, GraduationCap
} from 'lucide-react';
import './PlacementDashboard.css';
import AdminDashboard from './AdminDashboard';
import AssignedCompanies from './AssignedCompanies';
import CompanyRegistrationForm from './CompanyRegistrationForm';
import Companies from './companies';
import InterviewResults from './InterviewResults';
import InterviewResultsView from './InterviewResultsView';
import PlacementDataRequestForm from './PlacementDataRequestForm';
import PlacementFeedbackForm from './PlacementFeedbackForm';
import RequesterFeedbackForm from './RequesterFeedbackForm';
import AlumniFeedbackDisplay from './AlumniFeedbackDisplay';
import AlumniJobRequestsDisplay from './AlumniJobRequestsDisplay';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ADDED: Decryption function that matches MentorshipDashboard
const decryptEmail = (encryptedEmail) => {
  try {
    return decodeURIComponent(atob(encryptedEmail));
  } catch (error) {
    console.error('Error decrypting email:', error);
    return encryptedEmail;
  }
};

// ADDED: Encryption function for passing email
const encryptEmail = (email) => {
  try {
    return btoa(encodeURIComponent(email));
  } catch (error) {
    console.error('Error encrypting email:', error);
    return email;
  }
};

const PlacementDashboard = ({ onBackToHome }) => {
  const [view, setView] = useState('email-entry');
  const [analyticsData, setAnalyticsData] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allCompanies, setAllCompanies] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [hasRequestedPlacement, setHasRequestedPlacement] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false); // ADDED: Dropdown state
  
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 6;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.dropdown-menu');
      const menuButton = document.querySelector('.menu-button');
      if (dropdown && menuButton && !dropdown.contains(event.target) && !menuButton.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // UPDATED: Use the proper decryption function
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get("email");
    
    if (emailFromUrl) {
      try {
        // Use the same decryption function as MentorshipDashboard
        const email = decryptEmail(decodeURIComponent(emailFromUrl));
        setUserEmail(email);
        
        // Determine user role
        if (email === "vsnithyasaminathan143@gmail.com") {
          setUserRole("admin");
        } else if (email === "kanthisaranya@gmail.com") {
          setUserRole("coordinator");
        } else {
          setUserRole("alumni");
          checkPlacementRequestStatus(email);
        }
        
        setView("dashboard");
        fetchDashboardData();
        
        // Clean URL after successful authentication
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        
      } catch (error) {
        console.error('Error decrypting email from URL:', error);
        // Fallback to atob for backward compatibility
        try {
          const email = atob(emailFromUrl);
          setUserEmail(email);
          
          if (email === "vsnithyasaminathan143@gmail.com") {
            setUserRole("admin");
          } else if (email === "kanthisaranya@gmail.com") {
            setUserRole("coordinator");
          } else {
            setUserRole("alumni");
            checkPlacementRequestStatus(email);
          }
          
          setView("dashboard");
          fetchDashboardData();
          
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        } catch (fallbackError) {
          console.error('Fallback decryption also failed:', fallbackError);
        }
      }
    } 
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      alert('Please enter your email address');
      return;
    }

    const email = emailInput.trim().toLowerCase();
    setUserEmail(email);

    if (email === 'vsnithyasaminathan143@gmail.com') {
      setUserRole('admin');
      setView('dashboard');
      fetchDashboardData();
    } else if (email === 'kanthisaranya@gmail.com') {
      setUserRole('coordinator');
      setView('dashboard');
      fetchDashboardData();
    } else {
      setUserRole('alumni');
      await checkPlacementRequestStatus(email);
      setView('dashboard');
      fetchDashboardData();
    }
  };

  const checkPlacementRequestStatus = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-requests/check/${email}?_t=${Date.now()}`);
      const data = await response.json();
      if (data.success && data.hasRequested) {
        setHasRequestedPlacement(true);
      }
    } catch (err) {
      console.error('Error checking placement request status:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const timestamp = Date.now();
      
      const mappingsRes = await fetch(`${API_BASE_URL}/api/company-mapping?_t=${timestamp}`);
      const mappingsData = await mappingsRes.json();
      
      const companiesRes = await fetch(`${API_BASE_URL}/api/company-mapping/available-companies?_t=${timestamp}`);
      const companiesData = await companiesRes.json();

      const placementRequestsRes = await fetch(`${API_BASE_URL}/api/job-requests?_t=${timestamp}`);
      const placementRequestsData = await placementRequestsRes.json();

      if (mappingsData.success && companiesData.success) {
        const mappings = mappingsData.data;
        const companies = companiesData.data;
        const placementRequests = placementRequestsData.success ? placementRequestsData.data : [];

        setAllCompanies(companies);

        const applicationsMap = new Map();
        
        mappings.slice(0, 20).forEach((mapping, index) => {
          const name = mapping.alumniName || 'N/A';
          const company = mapping.companyName || 'N/A';
          const role = mapping.companyRole || 'N/A';
          const ctc = mapping.companyCtc || 'N/A';
          const status = mapStatus(mapping.alumni_status);
          const date = mapping.assigned_on || new Date().toISOString();
          const id = mapping.mapping_id || index;
          
          const key = `${name}-${company}-${role}`;
          
          if (!applicationsMap.has(key)) {
            applicationsMap.set(key, {
              id,
              name,
              company,
              role,
              ctc,
              status,
              date,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`
            });
          }
        });

        const applications = Array.from(applicationsMap.values());

        const waitingForApprovalCount = placementRequests.filter(
          request => request.status === 'Pending'
        ).length;
        
        const selectedCount = mappings.filter(m => m.alumni_status === 'Selected').length;
        const rejectedCount = mappings.filter(m => m.alumni_status === 'Rejected').length;

        const overview = {
          total: mappings.length,
          pending: mappings.filter(m => m.alumni_status === 'Not Applied').length,
          completed: selectedCount,
          rejected: rejectedCount,
          inProgress: mappings.filter(m => m.alumni_status === 'In Process' || m.alumni_status === 'Applied').length,
          waitingForApproval: waitingForApprovalCount,
          successRate: mappings.length > 0 
            ? Math.round((selectedCount / mappings.length) * 100)
            : 0
        };

        const yearWiseMap = {};
        mappings.forEach(mapping => {
          const year = new Date(mapping.assigned_on).getFullYear().toString();
          if (!yearWiseMap[year]) {
            yearWiseMap[year] = { applications: 0, placements: 0 };
          }
          yearWiseMap[year].applications++;
          if (mapping.alumni_status === 'Selected') {
            yearWiseMap[year].placements++;
          }
        });

        const yearWiseData = Object.keys(yearWiseMap)
          .sort()
          .slice(-5)
          .map(year => ({
            year,
            applications: yearWiseMap[year].applications,
            placements: yearWiseMap[year].placements
          }));

        const analyticsDataObj = {
          overview,
          yearWiseData: yearWiseData.length > 0 ? yearWiseData : [
            { year: new Date().getFullYear().toString(), applications: mappings.length, placements: overview.completed }
          ],
          applications,
          totalCompanies: companies.length,
          placementRequests: placementRequests
        };

        setAnalyticsData(analyticsDataObj);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
      
      setAnalyticsData({
        overview: {
          total: 0,
          pending: 0,
          completed: 0,
          rejected: 0,
          inProgress: 0,
          waitingForApproval: 0,
          successRate: 0
        },
        yearWiseData: [],
        applications: [],
        totalCompanies: 0,
        placementRequests: []
      });
      setAllCompanies([]);
    }
  };

  useEffect(() => {
    if (view === 'dashboard') {
      console.log('Auto-refreshing dashboard data...');
      fetchDashboardData();
    }
  }, [view, dataVersion]);

  const forceDataRefresh = () => {
    setDataVersion(prev => prev + 1);
  };

  // ADDED: Navigation functions
  const handleWebinarClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      // Encrypt email for Webinar dashboard
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/webinar-dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/webinar-dashboard');
    }
  };

  const handleMentorshipClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      // Encrypt email for Mentorship dashboard
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const mapStatus = (alumniStatus) => {
    const statusMap = {
      'Not Applied': 'pending',
      'Applied': 'inProgress',
      'In Process': 'inProgress',
      'Selected': 'completed',
      'Rejected': 'rejected'
    };
    return statusMap[alumniStatus] || 'pending';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
      'inProgress': { bg: '#dbeafe', text: '#1e40af', icon: '🔄' },
      'completed': { bg: '#d1fae5', text: '#065f46', icon: '✅' },
      'rejected': { bg: '#fee2e2', text: '#991b1b', icon: '❌' }
    };
    return colors[status] || colors.pending;
  };

  const getAvailableActions = () => {
    if (userRole === 'admin') {
      return [
        { 
          id: 'all-companies', 
          icon: '📋', 
          title: 'company onboarding', 
          badge: 'View',
          description: 'View all registered companies in table format with complete details and filters.'
        },
        { 
          id: 'interview-results-view', 
          icon: '📊', 
          title: 'Interview Results', 
          badge: 'View Only',
          description: 'View interview results and alumni selection status (Read-only mode).'
        },
        { 
          id: 'alumni-feedback-display', 
          icon: '💬', 
          title: 'Alumni Feedbacks', 
          badge: 'View',
          description: 'View feedback from alumni with name, batch and feedback details.'
        },
        { 
          id: 'alumni-job-requests', 
          icon: '📋', 
          title: 'Alumni Opportunity Requests', 
          badge: 'View',
          description: 'View alumni placement requests with search and filter options.'
        },
      ];
    } else if (userRole === 'coordinator') {
      return [
        { 
          id: 'add-company', 
          icon: '🏢', 
          title: 'Company onboarding', 
          badge: 'Register',
          description: 'Register companies, roles, skills required, CTC details and hiring process.'
        },
        { 
          id: 'admin-dashboard', 
          icon: '⚙️', 
          title: 'Coordinator Dashboard', 
          badge: 'Management',
          description: 'Comprehensive admin panel to manage all placement activities, data and analytics.'
        },
        { 
          id: 'interview-results', 
          icon: '📈', 
          title: 'Interview Results', 
          badge: 'Manage',
          description: 'View and manage interview outcomes, candidate selection results and feedback.'
        },
        { 
          id: 'placement-feedback', 
          icon: '⭐', 
          title: 'Coordinator Feedback', 
          badge: 'Rating',
          description: 'Capture detailed feedback on the final placement outcome and student experience.'
        }
      ];
    } else if (userRole === 'alumni') {
      if (!hasRequestedPlacement) {
        return [
          { 
            id: 'placement-data-request', 
            icon: '📊', 
            title: 'Alumni Opportunity Requests', 
            badge: 'Required',
            description: 'Share your preferred locations, companies, skills and requirements to get started.'
          }
        ];
      } else {
        return [
          { 
            id: 'placement-data-request', 
            icon: '✅', 
            title: 'Alumni Opportunity Requests', 
            badge: 'Completed',
            description: 'View or update your placement request. Click to make changes.',
            completed: true
          },
          { 
            id: 'assigned-companies', 
            icon: '📋', 
            title: 'Assigned Companies', 
            badge: 'View',
            description: 'View companies assigned to you for placement activities and track your progress.'
          },
          { 
            id: 'requester-feedback', 
            icon: '💬', 
            title: 'Requester Feedback', 
            badge: 'Feedback',
            description: 'Provide feedback about the placement data request process and your experience.'
          }
        ];
      }
    }
    return [];
  };

  const handleQuickAction = (action) => {
    setView(action);
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setTimeout(() => {
      forceDataRefresh();
    }, 100);
  };

  const handleCompanyAdded = () => {
    alert('Company added successfully! Dashboard will update automatically...');
    forceDataRefresh();
    setTimeout(() => {
      setView('dashboard');
    }, 1000);
  };

  const handlePlacementRequestSubmit = () => {
    setHasRequestedPlacement(true);
    setView('dashboard');
    setTimeout(() => {
      forceDataRefresh();
    }, 100);
  };

  const SimpleBackButton = () => (
    <div className="simple-back-container">
      <button className="simple-back-btn" onClick={handleBackToDashboard}>
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
    </div>
  );

  const EmailEntryView = () => {
    const emailInputRef = useRef(null);
    
    useEffect(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }, []);

    return (
      <div className="placement-dashboard">
        <div className="dashboard-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '60px 40px',
            boxShadow: '0 20px 60px rgba(124, 58, 237, 0.15)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
            }}>
              <Mail size={40} color="white" />
            </div>

            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Welcome to Placement Portal
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '40px'
            }}>
              Enter your email address to access the dashboard
            </p>

            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '8px'
                }}>
                  Email Address
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c3aed';
                    e.target.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="email"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                Continue to Dashboard
              </button>
            </form>

            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: 'rgba(124, 58, 237, 0.05)',
              borderRadius: '12px',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#7c3aed',
                marginBottom: '8px'
              }}>
                Different Access Levels:
              </p>
              <ul style={{
                fontSize: '13px',
                color: '#64748b',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li style={{ marginBottom: '4px' }}>Admin: View-only access to all features</li>
                <li style={{ marginBottom: '4px' }}>Coordinator: Manage companies & interviews</li>
                <li>Alumni: Submit requests & view assignments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const maxApplications = Math.max(...(analyticsData?.yearWiseData.map(d => d.applications) || [200]));
    const availableActions = getAvailableActions();

    const totalApplications = analyticsData?.applications.length || 0;
    const totalPages = Math.ceil(totalApplications / applicationsPerPage);
    const startIndex = (currentPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    const displayedApplications = analyticsData?.applications.slice(startIndex, endIndex) || [];

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '18px',
          color: '#7c3aed'
        }}>
          Loading dashboard data...
        </div>
      );
    }

    const handlePrevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    const handleNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    const handlePageClick = (pageNumber) => {
      setCurrentPage(pageNumber);
    };

    return (
      <div className="placement-dashboard">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="header-content">
              <h2 className="dashboard-title">
                Placement Dashboard 
              </h2>
            
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                Logged in as: <strong>{userEmail}</strong>
              </p>
            </div>
            
            {/* ADDED: Three-dot menu at top-right */}
            <div className="placement-header-menu">
              <button 
                className="menu-button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="More options"
              >
                <MoreVertical size={24} />
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={handleWebinarClick}
                  >
                    <Video size={18} />
                    <span>Webinar</span>
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={handleMentorshipClick}
                  >
                    <GraduationCap size={18} />
                    <span>Mentorship</span>
                  </button>
                </div>
              )}
            </div>
            
            {onBackToHome && (
              <button className="back-btn" onClick={onBackToHome}>
                <ChevronLeft size={18} />
                Back to Home
              </button>
            )}
          </div>

          {analyticsData && (
            <div className="analytics-section">
              <div className="analytics-grid-single-row">
                <div className="analytics-card">
                  <Users className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.total}</div>
                  <div className="analytics-label">Total Applications</div>
                </div>
                
                <div className="analytics-card">
                  <div className="analytics-icon" style={{ color: '#f59e0b' }}>⏳</div>
                  <div className="analytics-value">{analyticsData.overview.waitingForApproval}</div>
                  <div className="analytics-label">Waiting for Approval</div>
                  <div className="analytics-subtext">
                    {analyticsData.placementRequests?.length > 0 ? 
                      `${analyticsData.overview.waitingForApproval} of ${analyticsData.placementRequests.length} pending` : 
                      'No placement requests'
                    }
                  </div>
                </div>
                
                <div className="analytics-card">
                  <Check className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.completed}</div>
                  <div className="analytics-label">Selected</div>
                </div>
                
                <div className="analytics-card">
                  <TrendingUp className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.inProgress}</div>
                  <div className="analytics-label">In Progress</div>
                </div>
                
                <div className="analytics-card">
                  <TrendingUp className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.rejected}</div>
                  <div className="analytics-label">Rejected</div>
                </div>
                
                <div className="analytics-card">
                  <TrendingUp className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.pending}</div>
                  <div className="analytics-label">Not Applied</div>
                </div>
                
                <div className="analytics-card">
                  <Award className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.successRate}%</div>
                  <div className="analytics-label">Success Rate</div>
                  <div className="analytics-subtext">
                    Based on completed applications
                  </div>
                </div>
              </div>
            </div>
          )}

          {analyticsData && analyticsData.yearWiseData.length > 0 && (
            <div className="yearwise-section">
              <h3 className="section-title">
                <TrendingUp size={20} />
                Year-wise Student Applications
              </h3>
              <div className="yearwise-chart-card-unique">
                <div className="chart-container-unique">
                  {analyticsData.yearWiseData.map((yearData, index) => {
                    const heightPerc = (yearData.applications / maxApplications) * 100;
                    const barColors = [
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                    ];
                    
                    return (
                      <div key={yearData.year} className="bar-group-unique">
                        <div className="bar-stats-top">
                          <div className="stat-bubble">{yearData.applications}</div>
                        </div>
                        <div className="bar-wrapper-unique">
                          <div className="bar-container-unique">
                            <div 
                              className="bar-unique"
                              style={{
                                height: `${heightPerc}%`,
                                background: barColors[index % barColors.length],
                                animationDelay: `${index * 0.15}s`
                              }}
                            >
                              <div className="bar-glow"></div>
                              <div className="bar-particles">
                                <span className="particle"></span>
                                <span className="particle"></span>
                                <span className="particle"></span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bar-year-unique">{yearData.year}</div>
                        <div className="placement-badge-unique">
                          <span className="badge-icon">✓</span>
                          {yearData.placements} Placed
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {allCompanies.length > 0 && (
            <div className="recruiters-section">
              <h3 className="section-title">
                <Building2 size={20} />
                Recruiters ({allCompanies.length})
                {allCompanies.some(c => c.is_alumni_company) && (
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginLeft: '12px',
                    color: '#7c3aed'
                  }}>
                    • {allCompanies.filter(c => c.is_alumni_company).length} Alumni Companies
                  </span>
                )}
              </h3>

              <div className="recruiters-grid">
                {allCompanies.map((company) => (
                  <div 
                    key={company.company_id} 
                    className={`recruiter-card ${company.is_alumni_company ? 'alumni-company' : ''}`}
                    style={company.is_alumni_company ? {
                      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
                      border: '2px solid #7c3aed',
                      position: 'relative'
                    } : {}}
                  >
                    {company.is_alumni_company && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                      }}>
                        <span>🎓</span>
                        Alumni
                      </div>
                    )}
                    <div className="recruiter-logo" style={company.is_alumni_company ? {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    } : {}}>
                      {company.is_alumni_company ? '🎓' : '🏢'}
                    </div>
                    <h4 className="recruiter-name" style={company.is_alumni_company ? {
                      color: '#7c3aed',
                      fontWeight: '600'
                    } : {}}>
                      {company.name || company.company_name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {userRole === 'alumni' && !hasRequestedPlacement && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              margin: '20px 0'
            }}>
              <h3 style={{ color: '#7c3aed', marginBottom: '10px' }}>Get Started with Placement Process</h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Submit your placement data request below to get access to assigned companies and provide feedback.
              </p>
            </div>
          )}

          <div className="quick-actions-section">
            <h3 className="section-title">
              {userRole === 'alumni' && !hasRequestedPlacement ? 'Get Started' : 'Quick Actions'}
            </h3>
            <div className="quick-actions-grid">
              {availableActions.map((action) => (
                <div 
                  key={action.id} 
                  className={`action-card ${action.completed ? 'action-card-completed' : ''}`}
                  onClick={() => handleQuickAction(action.id)}
                >
                  <div className="action-icon">{action.icon}</div>
                  <h4 className="action-title">{action.title}</h4>
                  <span className={`action-badge ${action.completed ? 'action-badge-completed' : ''}`}>
                    {action.badge}
                  </span>
                  <p className="action-text">{action.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="applications-section">
            <div className="section-header">
              <h3 className="section-title">
                <Users size={20} />
                Recent Applications ({totalApplications})
              </h3>
            </div>

            <div className="modern-applications-grid">
              {displayedApplications.map((application) => {
                const statusColors = getStatusColor(application.status);
                return (
                  <div key={application.id} className="application-card">
                    <div className="application-header">
                      <div className="applicant-info">
                        <div className="applicant-avatar">
                          {application.avatar ? (
                            <img src={application.avatar} alt={application.name} />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="applicant-details">
                          <h4 className="applicant-name">{application.name}</h4>
                          <p className="applicant-company">{application.company}</p>
                        </div>
                      </div>
                      <div className="application-status">
                        <span 
                          className="status-badge"
                          style={{
                            background: statusColors.bg,
                            color: statusColors.text
                          }}
                        >
                          <span className="status-icon">{statusColors.icon}</span>
                          {application.status}
                        </span>
                      </div>
                    </div>

                    <div className="application-details">
                      <div className="detail-item">
                        <Briefcase size={16} />
                        <div>
                          <span className="detail-label">Role</span>
                          <span className="detail-value">{application.role}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <DollarSign size={16} />
                        <div>
                          <span className="detail-label">CTC</span>
                          <span className="detail-value">{application.ctc}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <Calendar size={16} />
                        <div>
                          <span className="detail-label">Applied</span>
                          <span className="detail-value">{new Date(application.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalApplications === 0 && (
                <div className="no-results-card">
                  <div className="no-results-icon">📋</div>
                  <h4>No applications yet</h4>
                  <p>There are no placement applications to display at the moment.</p>
                </div>
              )}
            </div>

            {totalApplications > applicationsPerPage && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon size={16} />
                  Previous
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageClick(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            
            <div className="pagination-info">
              Showing {displayedApplications.length} of {totalApplications} applications (Page {currentPage} of {totalPages})
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    if (view === 'email-entry') {
      return <EmailEntryView />;
    }

    switch (view) {
      case 'dashboard':
        return <DashboardView />;
      case 'admin-dashboard':
        return (userRole === 'coordinator') ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <AdminDashboard />
          </div>
        ) : <DashboardView />;
      case 'assigned-companies':
        return ((userRole === 'alumni' && hasRequestedPlacement)) ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <AssignedCompanies userEmail={userEmail} />
          </div>
        ) : <DashboardView />;
      case 'add-company':
        return (userRole === 'coordinator') ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <CompanyRegistrationForm onCompanyAdded={handleCompanyAdded} />
          </div>
        ) : <DashboardView />;
      case 'all-companies':
        return userRole === 'admin' ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <Companies />
          </div>
        ) : <DashboardView />;
      case 'interview-results':
        return (userRole === 'coordinator') ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <InterviewResults />
          </div>
        ) : <DashboardView />;
      case 'interview-results-view':
        return userRole === 'admin' ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <InterviewResultsView onBackToDashboard={handleBackToDashboard} />
          </div>
        ) : <DashboardView />;
      case 'alumni-feedback-display':
        return userRole === 'admin' ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <AlumniFeedbackDisplay />
          </div>
        ) : <DashboardView />;
      case 'alumni-job-requests':
        return userRole === 'admin' ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <AlumniJobRequestsDisplay onBackToDashboard={handleBackToDashboard} />
          </div>
        ) : <DashboardView />;
      case 'placement-feedback':
        return (userRole === 'coordinator') ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <PlacementFeedbackForm />
          </div>
        ) : <DashboardView />;
      case 'placement-data-request':
        return (userRole === 'alumni') ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <PlacementDataRequestForm 
              userEmail={userEmail} 
              onSubmitSuccess={handlePlacementRequestSubmit}
            />
          </div>
        ) : <DashboardView />;
      case 'requester-feedback':
        return ((userRole === 'alumni' && hasRequestedPlacement)) ? (
          <div className="component-wrapper">
            <SimpleBackButton />
            <RequesterFeedbackForm userEmail={userEmail} />
          </div>
        ) : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <main className="content-section">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default PlacementDashboard;