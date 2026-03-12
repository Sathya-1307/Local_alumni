import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Building2, Award, Users, ChevronLeft, Check, ArrowLeft, 
  Search, X, Mail, Calendar, DollarSign, Briefcase, User, ChevronRight, 
  ChevronLeft as ChevronLeftIcon, MoreVertical, Video, GraduationCap,
  LayoutDashboard, Building, Link, Table, MessageSquare, Star,
  FileText, HelpCircle, BarChart3,
  Shield, Settings
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

// Encryption/Decryption functions
const encryptEmail = (email) => {
  try {
    return btoa(encodeURIComponent(email));
  } catch (error) {
    console.error('Error encrypting email:', error);
    return email;
  }
};

const decryptEmail = (encryptedEmail) => {
  try {
    return decodeURIComponent(atob(encryptedEmail));
  } catch (error) {
    console.error('Error decrypting email:', error);
    return encryptedEmail;
  }
};

// Extract graduation year from label
const extractYearFromLabel = (label) => {
  if (!label) return null;
  const yearMatch = String(label).match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
};

// Map icon names to Lucide components
const iconMap = {
  'Building2': Building2,
  'Users': Users,
  'Briefcase': Briefcase,
  'Mail': Mail,
  'Calendar': Calendar,
  'DollarSign': DollarSign,
  'User': User,
  'Check': Check,
  'TrendingUp': TrendingUp,
  'Award': Award,
  'Search': Search,
  'X': X,
  'ChevronLeft': ChevronLeft,
  'ChevronRight': ChevronRight,
  'MoreVertical': MoreVertical,
  'Video': Video,
  'GraduationCap': GraduationCap,
  'ArrowLeft': ArrowLeft,
  'LayoutDashboard': LayoutDashboard,
  'Building': Building,
  'Link': Link,
  'Table': Table,
  'MessageSquare': MessageSquare,
  'Star': Star,
  'FileText': FileText,
  'HelpCircle': HelpCircle,
  'BarChart3': BarChart3,
  'Shield': Shield,
  'Settings': Settings
};

const PlacementDashboard = ({ onBackToHome }) => {
  const [view, setView] = useState('email-entry');
  const [analyticsData, setAnalyticsData] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [allCompanies, setAllCompanies] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [hasRequestedPlacement, setHasRequestedPlacement] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userEducation, setUserEducation] = useState([]);
  const [graduationYear, setGraduationYear] = useState(null);
  const [isAlumni, setIsAlumni] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [quickActions, setQuickActions] = useState([]);
  const [userType, setUserType] = useState('');
  const [roleNames, setRoleNames] = useState([]);
  const [isCoordinator, setIsCoordinator] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 6;
  
  const authInProgress = useRef(false);
  
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

  // Function to fetch user permissions from placement auth API
  const fetchUserPermissions = async (email) => {
    try {
      console.log('🔍 Fetching placement permissions for email:', email);
      const response = await fetch(`${API_BASE_URL}/api/auth/placement?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Permissions fetched:', data);
        setUserRole(data.role);
        setUserType(data.userType);
        setRoleNames(data.roleNames || []);
        setIsCoordinator(data.isCoordinator || false);
        setQuickActions(data.quickActions || []);
        
        // Set alumni status based on userType
        setIsAlumni(data.userType === 'alumni' || data.userType === 'admin' || data.userType === 'placement_coordinator');
        setAccessDenied(false);
        
        return data;
      } else {
        console.log('❌ Failed to fetch permissions');
        return null;
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return null;
    }
  };

  // Handle email from URL
  useEffect(() => {
    // Prevent duplicate authentication calls
    if (authInProgress.current) return;
    authInProgress.current = true;
    
    const getEmailAndAuthenticate = async () => {
      setAuthLoading(true);
      console.log('📍 Starting placement authentication process...');
      
      const params = new URLSearchParams(window.location.search);
      const encryptedEmailFromUrl = params.get("email");
      
      let email = '';
      
      if (encryptedEmailFromUrl) {
        try {
          // Decrypt the email from URL
          const decryptedEmail = decryptEmail(decodeURIComponent(encryptedEmailFromUrl));
          if (decryptedEmail && decryptedEmail.includes('@')) {
            email = decryptedEmail;
            localStorage.setItem('userEmail', email);
            console.log('✅ User email decrypted from URL:', email);
          }
        } catch (error) {
          console.error('Error decrypting email from URL:', error);
          // Fallback to atob
          try {
            const fallbackEmail = atob(encryptedEmailFromUrl);
            email = fallbackEmail;
            localStorage.setItem('userEmail', email);
          } catch (fallbackError) {
            console.error('Fallback decryption failed:', fallbackError);
          }
        }
      } else {
        // Get email from localStorage
        email = localStorage.getItem('userEmail') || '';
        console.log('📧 Using email from localStorage:', email);
      }
      
      if (email) {
        setUserEmail(email);
        
        // ✅ ALL USERS (including admin) - Fetch from backend
        const permissionsData = await fetchUserPermissions(email);
        
        if (permissionsData) {
          // Check if user has placement access (alumni, admin, coordinator)
          if (permissionsData.userType === 'alumni' || 
              permissionsData.userType === 'admin' || 
              permissionsData.userType === 'placement_coordinator') {
            
            setView('dashboard');
            await fetchDashboardData();
            await checkPlacementRequestStatus(email);
          } else {
            // User doesn't have placement access (student, etc.)
            setAccessDenied(true);
            setAccessMessage(`You are a ${permissionsData.userType || 'student'}. Only alumni, placement coordinators, and admins can access the placement portal.`);
          }
        } else {
          // Fallback to old method if API fails
          console.log('⚠️ Falling back to manual user type determination');
          await fetchUserDataFromDB(email);
        }
        
        // Clean URL after successful authentication
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      } else {
        // No email found, show email entry
        console.log('❌ No email found, showing email entry');
        setView('email-entry');
      }
      
      setAuthLoading(false);
      authInProgress.current = false;
    };

    getEmailAndAuthenticate();
    
    return () => {
      authInProgress.current = false;
    };
  }, []);

  // Fetch user data from database (fallback method)
  const fetchUserDataFromDB = async (email) => {
    setIsLoadingUser(true);
    setAccessDenied(false);
    setAccessMessage('');
    
    try {
      console.log('Fetching user data for email:', email);
      const response = await fetch(`${API_BASE_URL}/api/members/email/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      console.log('User data response:', data);
      
      if (data.success && data.member) {
        setUserData(data.member);
        
        const education = data.member.education_details || [];
        setUserEducation(education);
        
        const extractedYear = extractYearFromLabel(data.member.label || data.member.batch);
        setGraduationYear(extractedYear);
        
        console.log('Extracted graduation year:', extractedYear);
        
        // Check if user is alumni using label
        const currentYear = new Date().getFullYear();
        const alumniStatus = extractedYear ? extractedYear < currentYear : false;
        setIsAlumni(alumniStatus);
        
        if (alumniStatus) {
          setUserRole('alumni');
          await checkPlacementRequestStatus(email);
          setAccessDenied(false);
          setView('dashboard');
          await fetchDashboardData();
          console.log('Access GRANTED - User is alumni');
        } else {
          setUserRole('non-alumni');
          setAccessDenied(true);
          
          if (extractedYear) {
            if (extractedYear > currentYear) {
              setAccessMessage(`You are a current student (expected graduation ${extractedYear}). Only graduated alumni (graduation year < ${currentYear}) can access.`);
            } else if (extractedYear === currentYear) {
              setAccessMessage(`You are a current year student (graduating ${extractedYear}). Only graduated alumni (graduation year < ${currentYear}) can access.`);
            }
          } else {
            setAccessMessage(`No valid graduation year found. Only alumni with graduation year < ${currentYear} can access.`);
          }
          
          console.log('Access DENIED - User is not alumni');
        }
        
        return alumniStatus;
      } else {
        console.log('User not found in members collection');
        setUserRole('unknown');
        setAccessDenied(true);
        setAccessMessage(`Email not found in alumni database. Please register or use a registered email.`);
        return false;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserRole('unknown');
      setAccessDenied(true);
      setAccessMessage('Error verifying alumni status. Please try again.');
      return false;
    } finally {
      setIsLoadingUser(false);
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
    if (view === 'dashboard' && (isAlumni || userType === 'admin' || userType === 'placement_coordinator')) {
      console.log('Auto-refreshing dashboard data...');
      fetchDashboardData();
    }
  }, [view, dataVersion, isAlumni, userType]);

  const forceDataRefresh = () => {
    setDataVersion(prev => prev + 1);
  };

  // Navigation functions
  const handleWebinarClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/webinar-dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/webinar-dashboard');
    }
  };

  const handleMentorshipClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Admin Dashboard navigation (only for admin users)
  const handleAdminDashboardClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/local-admin-dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/local-admin-dashboard');
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

  // Handle email submit from form
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      alert('Please enter your email address');
      return;
    }

    const email = emailInput.trim().toLowerCase();
    setUserEmail(email);
    
    const permissionsData = await fetchUserPermissions(email);
    
    if (permissionsData) {
      if (permissionsData.userType === 'alumni' || 
          permissionsData.userType === 'admin' || 
          permissionsData.userType === 'placement_coordinator') {
        setView('dashboard');
        await fetchDashboardData();
        await checkPlacementRequestStatus(email);
      } else {
        setAccessDenied(true);
        setAccessMessage(`You are a ${permissionsData.userType || 'student'}. Only alumni, placement coordinators, and admins can access.`);
      }
    } else {
      // Fallback to old method
      const isAlumniUser = await fetchUserDataFromDB(email);
      if (isAlumniUser) {
        setView('dashboard');
        await fetchDashboardData();
      }
    }
  };

  // Pure database-driven navigation
  const handleQuickAction = (action) => {
    console.log('Quick action clicked:', action);
    
    if (action.path) {
      navigate(`${action.path}?email=${encodeURIComponent(userEmail)}`);
    } else if (action.id) {
      console.warn('No path in action, using ID:', action.id);
    }
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

  const AccessDeniedView = () => {
    const currentYear = new Date().getFullYear();
    
    return (
      <div className="placement-dashboard">
        <div className="dashboard-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '60px 40px',
            boxShadow: '0 20px 60px rgba(239, 68, 68, 0.15)',
            textAlign: 'center',
            border: '2px solid #ef4444'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
            }}>
              <X size={40} color="white" />
            </div>

            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Access Denied
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#ef4444',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              You don't have permission to access the Placement Portal
            </p>

            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '30px'
            }}>
              {accessMessage || `Only alumni (graduated), placement coordinators, and admins can access.`}
            </p>

            {userData && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: '#f3f4f6',
                borderRadius: '12px',
                textAlign: 'left'
              }}>
                <p style={{ fontWeight: '600', marginBottom: '10px', color: '#374151' }}>Your Details:</p>
                <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                  <div><strong>Name:</strong> {userData.name || 'N/A'}</div>
                  <div><strong>Batch/Label:</strong> {userData.batch || userData.label || 'N/A'}</div>
                  <div><strong>User Type:</strong> {userType || 'unknown'}</div>
                  {graduationYear && (
                    <div><strong>Graduation Year:</strong> {graduationYear}</div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setView('email-entry');
                setAccessDenied(false);
                setEmailInput('');
              }}
              style={{
                marginTop: '30px',
                padding: '14px 30px',
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
            >
              Try Another Email
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmailEntryView = () => {
    const emailInputRef = useRef(null);
    const currentYear = new Date().getFullYear();
    
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
              Alumni Placement Portal
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '10px'
            }}>
              Enter your email address to access the dashboard
            </p>

            <p style={{
              fontSize: '14px',
              color: '#ef4444',
              marginBottom: '30px',
              fontWeight: '500',
              padding: '10px',
              background: '#fee2e2',
              borderRadius: '8px'
            }}>
              ⚠️ Only alumni, placement coordinators, and admins can access
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
                  disabled={isLoadingUser}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    opacity: isLoadingUser ? 0.7 : 1,
                    cursor: isLoadingUser ? 'not-allowed' : 'text'
                  }}
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingUser}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  background: isLoadingUser ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isLoadingUser ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isLoadingUser ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                {isLoadingUser ? 'Checking...' : 'Continue to Dashboard'}
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
                Access Levels:
              </p>
              <ul style={{
                fontSize: '13px',
                color: '#64748b',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li style={{ marginBottom: '4px' }}>👑 <strong>Admin</strong> - Full access to all modules (view only)</li>
                <li style={{ marginBottom: '4px' }}>⚙️ <strong>Placement Coordinator</strong> - Manage all placement activities</li>
                <li style={{ marginBottom: '4px' }}>🎓 <strong>Alumni</strong> - Submit job requests, view assigned companies</li>
                <li>❌ <strong>Student</strong> - No access to placement portal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const maxApplications = Math.max(...(analyticsData?.yearWiseData.map(d => d.applications) || [200]));
    
    // Get actions from API (quickActions) only - NO FALLBACK
    const availableActions = quickActions;

    const totalApplications = analyticsData?.applications.length || 0;
    const totalPages = Math.ceil(totalApplications / applicationsPerPage);
    const startIndex = (currentPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    const displayedApplications = analyticsData?.applications.slice(startIndex, endIndex) || [];

    // Helper function to get user badge based on userType
    const getUserBadge = () => {
      switch(userType) {
        case 'admin':
          return { text: 'Admin', bg: '#ef4444' }; // Red
        case 'placement_coordinator':
          return { text: 'Coordinator', bg: '#8b5cf6' }; // Purple
        case 'alumni':
          return { text: 'Alumni', bg: '#7c3aed' }; // Blue
        case 'student':
          return { text: 'Student', bg: '#6b7280' }; // Gray
        default:
          return { text: userType, bg: '#6b7280' };
      }
    };

    if (authLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '18px',
          color: '#7c3aed'
        }}>
          Authenticating...
        </div>
      );
    }

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

    const badge = getUserBadge();

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
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: badge.bg,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  textTransform: 'capitalize'
                }}>
                  {badge.text}
                </span>
              </p>
              {roleNames.length > 0 && (
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Roles: {roleNames.join(', ')}
                </p>
              )}
            </div>
            
            {/* Three-dot menu at top-right */}
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
                  {/* Show Admin Dashboard only for admin users */}
                  {userType === 'admin' && (
                    <button 
                      className="dropdown-item"
                      onClick={handleAdminDashboardClick}
                    >
                      <Shield size={18} />
                      <span>Admin Dashboard</span>
                    </button>
                  )}
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
                  <Award className="analytics-icon" size={24} />
                  <div className="analytics-value">{analyticsData.overview.successRate}%</div>
                  <div className="analytics-label">Success Rate</div>
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
                                background: barColors[index % barColors.length]
                              }}
                            />
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
                        borderRadius: '6px'
                      }}>
                        <span>🎓</span> Alumni
                      </div>
                    )}
                    <div className="recruiter-logo">
                      {company.is_alumni_company ? '🎓' : '🏢'}
                    </div>
                    <h4 className="recruiter-name">
                      {company.name || company.company_name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions from API - PURE DATABASE! */}
          <div className="quick-actions-section">
            <h3 className="section-title">
              {userType === 'alumni' && !hasRequestedPlacement ? 'Get Started' : 'Quick Actions'}
            </h3>
            <div className="quick-actions-grid">
              {availableActions.map((action, index) => {
                const IconComponent = iconMap[action.icon] || HelpCircle;
                
                return (
                  <div 
                    key={action.id ? `${action.id}-${index}` : `action-${index}`}
                    className={`action-card ${action.completed ? 'action-card-completed' : ''}`}
                    onClick={() => handleQuickAction(action)}
                  >
                    <div className="action-icon">
                      <IconComponent size={24} />
                    </div>
                    <h4 className="action-title">{action.title}</h4>
                    <span className={`action-badge ${action.completed ? 'action-badge-completed' : ''}`}>
                      {action.badge || 'Access'}
                    </span>
                    <p className="action-text">{action.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Applications */}
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
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    if (authLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div className="dashboard-spinner"></div>
          <p style={{ marginLeft: '10px' }}>Authenticating...</p>
        </div>
      );
    }

    if (accessDenied) {
      return <AccessDeniedView />;
    }

    if (view === 'email-entry') {
      return <EmailEntryView />;
    }

    // Get email from state or localStorage
    const currentEmail = userEmail || localStorage.getItem('userEmail');
    console.log('📧 Current email for components:', currentEmail);

    if (userType === 'admin' || userType === 'placement_coordinator' || userType === 'alumni') {
      switch (view) {
        case 'dashboard':
          return <DashboardView />;
          
        case 'admin-dashboard':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <AdminDashboard />
            </div>
          );
          
        case 'assigned-companies':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <AssignedCompanies userEmail={currentEmail} />
            </div>
          );
          
        case 'add-company':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <CompanyRegistrationForm onCompanyAdded={handleCompanyAdded} />
            </div>
          );
          
        case 'all-companies':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <Companies />
            </div>
          );
          
        case 'interview-results':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <InterviewResults />
            </div>
          );
          
        case 'interview-results-view':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <InterviewResultsView onBackToDashboard={handleBackToDashboard} />
            </div>
          );
          
        case 'alumni-feedback-display':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <AlumniFeedbackDisplay />
            </div>
          );
          
        case 'alumni-job-requests':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <AlumniJobRequestsDisplay onBackToDashboard={handleBackToDashboard} />
            </div>
          );
          
        case 'placement-feedback':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <PlacementFeedbackForm />
            </div>
          );
          
        case 'placement-data-request':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <PlacementDataRequestForm 
                userEmail={currentEmail}
                onSubmitSuccess={handlePlacementRequestSubmit}
              />
            </div>
          );
          
        case 'requester-feedback':
          return (
            <div className="component-wrapper">
              <SimpleBackButton />
              <RequesterFeedbackForm userEmail={currentEmail} />
            </div>
          );
          
        default:
          return <DashboardView />;
      }
    }

    return <EmailEntryView />;
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