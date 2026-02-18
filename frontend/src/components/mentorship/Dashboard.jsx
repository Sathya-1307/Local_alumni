import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  PauseCircle, 
  TrendingUp, 
  Award, 
  Clock, 
  Calendar, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Building, 
  Search, 
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Target,
  Users as UsersIcon,
  UserCheck,
  CalendarCheck,
  XCircle,
  Activity,
  MoreVertical,
  Video,
  Briefcase as BriefcaseIcon
} from 'lucide-react';
import './MentorshipDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const REFRESH_INTERVALS = {
  STATS: 30000,
  PHASE_STATS: 60000,
  MENTORS: 60000,
  MENTEES: 60000,
  MEETINGS: 30000,
  ASSIGNMENTS: 120000
};

// ADDED: Encryption/Decryption functions
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

export default function RealTimeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchMentor, setSearchMentor] = useState('');
  const [activePhase, setActivePhase] = useState('');
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [currentMentorIndex, setCurrentMentorIndex] = useState(0);
  const [currentPhaseGraphIndex, setCurrentPhaseGraphIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshIntervals, setRefreshIntervals] = useState(REFRESH_INTERVALS);
  const [authLoading, setAuthLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Real-time data states
  const [dashboardStats, setDashboardStats] = useState({
    totalMentors: 0,
    totalMentees: 0,
    newMentorsThisWeek: 0,
    newMenteesThisWeek: 0,
    totalMeetings: 0,
    upcomingMeetings: 0
  });
  
  const [phaseStats, setPhaseStats] = useState([]);
  const [mentorshipPhases, setMentorshipPhases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [mentorCapacityData, setMentorCapacityData] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [allMentees, setAllMentees] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  
  const [meetingStats, setMeetingStats] = useState({
    completed: 0,
    postponed: 0,
    scheduled: 0
  });

  const [timers, setTimers] = useState({});

  // UPDATED: Function to check user's actual role with hardcoded emails
  const checkUserRole = useCallback(async (email) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // Check hardcoded emails first
      if (cleanEmail === "rampriya-aids@nec.edu.in") {
        return 'coordinator';
      }
      if (cleanEmail === "admin@gmail.com") {
        return 'admin';
      }
      
      // Use the same login endpoint to get user's actual role
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email: cleanEmail });
      
      if (res.data.success) {
        // The existing endpoint returns role: "mentor", "mentee", or "new_user"
        return res.data.role || 'new_user';
      }
      return 'new_user'; // fallback
    } catch (error) {
      console.error('Error checking user role:', error);
      return 'new_user'; // fallback
    }
  }, []);

  // ADDED: Get email from URL on component mount
  useEffect(() => {
    const getEmailAndAuthenticate = async () => {
      setAuthLoading(true);
      
      // Check URL parameters for encrypted email
      const urlParams = new URLSearchParams(location.search);
      const encryptedEmailFromUrl = urlParams.get('email');
      
      let email = '';
      
      if (encryptedEmailFromUrl) {
        try {
          // Decrypt the email from URL
          const decryptedEmail = decryptEmail(decodeURIComponent(encryptedEmailFromUrl));
          if (decryptedEmail && decryptedEmail.includes('@')) {
            email = decryptedEmail;
            localStorage.setItem('userEmail', email);
            console.log('User email decrypted from URL in dashboard:', email);
          }
        } catch (error) {
          console.error('Error decrypting email from URL:', error);
        }
      } else {
        // Get email from localStorage (fallback)
        email = localStorage.getItem('userEmail') || '';
      }
      
      if (email) {
        const role = await checkUserRole(email);
        setUserEmail(email);
        setUserRole(role);
        localStorage.setItem('userRole', role);
        console.log('User authenticated in dashboard:', { email, role });
        
        // Clean URL after successful authentication
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // No email found, redirect to home
        navigate('/');
      }
      
      setAuthLoading(false);
    };

    getEmailAndAuthenticate();
  }, [location.search, navigate, checkUserRole]);

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

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset mentor index when search changes
  useEffect(() => {
    setCurrentMentorIndex(0);
  }, [searchMentor]);

  // Set active phase to first phase when phases are loaded
  useEffect(() => {
    if (mentorshipPhases.length > 0 && !activePhase) {
      setActivePhase(mentorshipPhases[0].id);
    }
  }, [mentorshipPhases, activePhase]);

  // Real-time data fetching functions
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`);
      if (res.data.success) {
        setDashboardStats(res.data.stats);
        setLastUpdated(res.data.lastUpdated || new Date());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchPhaseStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/phase-stats`);
      if (res.data.success) {
        setPhaseStats(res.data.phases || []);
      }
    } catch (error) {
      console.error('Error fetching phase stats:', error);
    }
  }, []);

  const fetchAllMentors = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/mentors`);
      if (res.data.success) {
        setAllMentors(res.data.mentors || []);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  }, []);

  const fetchAllMentees = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/mentees`);
      if (res.data.success) {
        setAllMentees(res.data.mentees || []);
      }
    } catch (error) {
      console.error('Error fetching mentees:', error);
    }
  }, []);

  const fetchAllAssignments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/assignments`);
      if (res.data.success) {
        setAllAssignments(res.data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }, []);

  const fetchAllMeetings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/meetings`);
      if (res.data.success) {
        setAllMeetings(res.data.meetings || []);
        setMeetingStats(res.data.stats);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  }, []);

  const fetchAllFeedbacks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/feedbacks`);
      if (res.data.success) {
        setAllFeedbacks(res.data.feedbacks || []);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  }, []);

  // Setup real-time intervals (only if authenticated)
  useEffect(() => {
    if (!userEmail || !userRole) return;
    
    const initialFetch = async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchPhaseStats(),
          fetchAllMentors(),
          fetchAllMentees(),
          fetchAllAssignments(),
          fetchAllMeetings(),
          fetchAllFeedbacks()
        ]);
      } catch (error) {
        console.error('Initial fetch error:', error);
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    };

    initialFetch();

    const intervalStats = setInterval(fetchDashboardStats, refreshIntervals.STATS);
    const intervalPhaseStats = setInterval(fetchPhaseStats, refreshIntervals.PHASE_STATS);
    const intervalMentors = setInterval(fetchAllMentors, refreshIntervals.MENTORS);
    const intervalMentees = setInterval(fetchAllMentees, refreshIntervals.MENTEES);
    const intervalAssignments = setInterval(fetchAllAssignments, refreshIntervals.ASSIGNMENTS);
    const intervalMeetings = setInterval(fetchAllMeetings, refreshIntervals.MEETINGS);

    setTimers({
      stats: intervalStats,
      phaseStats: intervalPhaseStats,
      mentors: intervalMentors,
      mentees: intervalMentees,
      assignments: intervalAssignments,
      meetings: intervalMeetings
    });

    return () => {
      Object.values(timers).forEach(timer => clearInterval(timer));
    };
  }, [userEmail, userRole]);

  // Calculate derived data from real-time data
  useEffect(() => {
    if (allMeetings.length > 0) {
      const formattedSessions = allMeetings.map((meeting, index) => {
        const firstDate = meeting.meeting_dates?.[0];
        return {
          id: meeting._id || `meeting-${index}`,
          mentorName: meeting.mentorDetails?.name || 'Mentor',
          menteeName: meeting.mentees?.[0]?.name || 'Mentee',
          date: firstDate?.date || meeting.createdAt,
          time: meeting.meeting_time || '10:00 AM',
          status: meeting.status?.toLowerCase() || 'scheduled',
          topic: meeting.agenda || 'Mentorship Session',
          phase: meeting.phaseId || 'phase_2024_h2',
          duration: meeting.duration_minutes ? `${meeting.duration_minutes} mins` : '60 mins',
          meetingType: meeting.platform || 'Virtual'
        };
      });
      setSessions(formattedSessions);
    }
  }, [allMeetings]);

  useEffect(() => {
    if (allAssignments.length > 0) {
      const capacityMap = {};
      allAssignments.forEach(assignment => {
        const mentorId = assignment.mentor_user_id;
        if (!capacityMap[mentorId]) {
          capacityMap[mentorId] = {
            id: mentorId,
            name: assignment.mentorDetails?.name || 'Unknown Mentor',
            menteeCount: 0,
            maxCapacity: 3,
            mentees: [],
            sessionsCompleted: 0,
            sessionsUpcoming: 0
          };
        }
        capacityMap[mentorId].menteeCount += assignment.mentees?.length || 0;
        capacityMap[mentorId].mentees = [
          ...capacityMap[mentorId].mentees,
          ...(assignment.mentees?.map(m => m.name) || [])
        ];
      });
      
      setMentorCapacityData(Object.values(capacityMap));
    }
  }, [allAssignments]);

  useEffect(() => {
    if (phaseStats && phaseStats.length > 0) {
      const formattedPhases = phaseStats.map((phase) => ({
        id: `phase_${phase.phaseId}`,
        phaseId: phase.phaseId,
        name: phase.phaseName || `Phase ${phase.phaseId}`,
        period: phase.startDate && phase.endDate 
          ? `${new Date(phase.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(phase.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
          : 'Not specified',
        status: phase.isActive ? 'active' : 'completed',
        totalMeetings: phase.stats?.totalMeetings || 0,
        completedMeetings: phase.stats?.completedMeetings || 0,
        postponedMeetings: phase.stats?.cancelledOrPostponed || 0,
        mentorsActive: phase.stats?.totalMentors || 0,
        menteesActive: phase.stats?.totalMentees || 0,
        newMentors: 0,
        newMentees: 0
      }));
      setMentorshipPhases(formattedPhases);
    }
  }, [phaseStats]);

  const getPhaseGraphData = useCallback(() => {
    if (!phaseStats || phaseStats.length === 0) {
      return {
        phases: ['Phase 1', 'Phase 2', 'Phase 3'],
        mentors: [0, 0, 0],
        mentees: [0, 0, 0]
      };
    }
    
    return {
      phases: phaseStats.map(phase => phase.phaseName || `Phase ${phase.phaseId}`),
      mentors: phaseStats.map(phase => phase.stats?.totalMentors || 0),
      mentees: phaseStats.map(phase => phase.stats?.totalMentees || 0)
    };
  }, [phaseStats]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchPhaseStats(),
        fetchAllMentors(),
        fetchAllMentees(),
        fetchAllAssignments(),
        fetchAllMeetings(),
        fetchAllFeedbacks()
      ]);
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  // Check if user is coordinator
  const isCoordinator = () => {
    return userRole.toLowerCase() === 'coordinator' || userRole.toLowerCase() === 'admin';
  };

  // Handle Phase button click
  const handlePhaseButtonClick = () => {
    navigate('/admin_dashboard');
  };

  // FIXED: Navigation function for other pages - PASS DECRYPTED EMAIL (NOT encrypted)
  const navigateWithEmail = (path) => {
    if (userEmail) {
      // PASS DECRYPTED EMAIL DIRECTLY IN URL (not encrypted)
      navigate(`${path}?email=${encodeURIComponent(userEmail)}`);
    } else {
      navigate(path);
    }
  };

  // ADDED: Get encrypted email for external URLs (for Webinar/Placement only)
  const getEncryptedEmailParam = () => {
    if (userEmail) {
      const encryptedEmail = encryptEmail(userEmail);
      return `?email=${encodeURIComponent(encryptedEmail)}`;
    }
    return '';
  };

  // UPDATED: Handle Webinar navigation with ENCRYPTED email
  const handleWebinarClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      // ENCRYPT email for Webinar
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/webinar-dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/webinar-dashboard');
    }
  };

  // UPDATED: Handle Placement navigation with ENCRYPTED email
  const handlePlacementClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      // ENCRYPT email for Placement
      const encryptedEmail = encryptEmail(userEmail);
      window.open(`http://localhost:5173/alumnimain/placement-dashboard?email=${encodeURIComponent(encryptedEmail)}`, '_blank');
    } else {
      window.open('http://localhost:5173/alumnimain/placement-dashboard', '_blank');
    }
  };

  // Filter sessions for the carousel based on status only
  const filteredSessionsByStatus = sessions.filter(session => {
    return filterStatus === 'all' || session.status === filterStatus;
  });

  // Filter phases based on active phase filter
  const filteredPhases = activePhase ? mentorshipPhases.filter(phase => 
    phase.id === activePhase
  ) : [];

  // Filter mentor capacity data based on search
  const filteredMentorCapacity = mentorCapacityData.filter(mentor => 
    mentor.name.toLowerCase().includes(searchMentor.toLowerCase())
  );

  // Quick actions based on user role
  const allQuickActions = [
    {
      id: 1,
      title: 'Register New Mentee',
      description: 'Add a new mentee to the program',
      icon: UserPlus,
      path: '/menteeregistration',
      color: '#3b82f6',
      roles: ['new_user']
    },
    {
      id: 2,
      title: 'Register New Mentor',
      description: 'Add a new mentor to the program',
      icon: GraduationCap,
      path: '/mentorregistration',
      color: '#8b5cf6',
      roles: ['new_user']
    },
    {
      id: 3,
      title: 'Assign Mentee to Mentor',
      description: 'Assign mentees to available mentors',
      icon: Users,
      path: '/menteementor_assign',
      color: '#10b981',
      roles: ['coordinator', 'admin']
    },
    {
      id: 4,
      title: 'Schedule Meeting',
      description: 'Schedule mentorship sessions',
      icon: Calendar,
      path: '/mentor_scheduling',
      color: '#f59e0b',
      roles: ['mentor','mentee']
    },
    {
      id: 5,
      title: 'View Scheduled Meetings',
      description: 'View all scheduled meetings',
      icon: CalendarCheck,
      path: '/scheduled_dashboard',
      color: '#8b5cf6',
      roles: ['mentee', 'mentor', 'admin']
    },
    {
      id: 6,
      title: 'Program Feedback',
      description: 'Collect and view program feedback',
      icon: MessageSquare,
      path: '/program_feedback',
      color: '#ec4899',
      roles: ['mentee', 'mentor', 'admin']
    },
    {
      id: 7,
      title: 'Phase Management',
      description: 'Manage mentorship phases and semesters',
      icon: BarChart3,
      path: '/admin_dashboard',
      color: '#8b5cf6',
      roles: ['coordinator', 'admin']
    },
    {
      id: 9,
      title: 'Coordinator Dashboard',
      description: 'Advanced analytics and management tools',
      icon: Building,
      path: '/co-ordinator',
      color: '#ef4444',
      roles: ['coordinator', 'admin']
    }
  ];

  const getFilteredQuickActions = () => {
    if (!userRole) return [];
    
    return allQuickActions.filter(action => {
      return action.roles.includes(userRole);
    });
  };

  const quickActions = getFilteredQuickActions();

  const handleQuickActionClick = (action) => {
    if (action.id === 5 && userEmail) {
      navigateWithEmail(`/scheduled_dashboard`);
    } else {
      navigateWithEmail(action.path);
    }
  };

  // Carousel navigation functions
  const nextSession = () => {
    setCurrentSessionIndex((prevIndex) => 
      prevIndex === filteredSessionsByStatus.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSession = () => {
    setCurrentSessionIndex((prevIndex) => 
      prevIndex === 0 ? filteredSessionsByStatus.length - 1 : prevIndex - 1
    );
  };

  const goToSession = (index) => {
    setCurrentSessionIndex(index);
  };

  const nextMentor = () => {
    setCurrentMentorIndex((prevIndex) => 
      prevIndex === filteredMentorCapacity.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevMentor = () => {
    setCurrentMentorIndex((prevIndex) => 
      prevIndex === 0 ? filteredMentorCapacity.length - 1 : prevIndex - 1
    );
  };

  const goToMentor = (index) => {
    setCurrentMentorIndex(index);
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return { background: '#dcfce7', color: '#166534', border: '#bbf7d0' };
      case 'upcoming': 
      case 'scheduled': return { background: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
      case 'postponed': 
      case 'cancelled': return { background: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case 'active': return { background: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
      default: return { background: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'upcoming': 
      case 'scheduled': return <Calendar size={16} />;
      case 'postponed': 
      case 'cancelled': return <PauseCircle size={16} />;
      case 'active': return <Activity size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getPhaseStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'upcoming': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCapacityColor = (count, max) => {
    const percentage = (count / max) * 100;
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'coordinator': return '#8b5cf6';
      case 'mentor': return '#3b82f6';
      case 'mentee': return '#10b981';
      case 'new_user': return '#f59e0b';
      case 'admin': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleDisplayName = (role) => {
    if (!role) return 'Loading...';
    
    switch(role) {
      case 'coordinator': return 'Coordinator';
      case 'mentor': return 'Mentor';
      case 'mentee': return 'Mentee';
      case 'new_user': return 'New User';
      case 'admin': return 'Admin';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Format time since last update
  const formatTimeSince = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    return new Date(date).toLocaleTimeString();
  };

  // Render phase distribution graph
  const renderPhaseDistributionGraph = () => {
    const graphData = getPhaseGraphData();
    const maxValue = Math.max(...graphData.mentors, ...graphData.mentees, 1);
    
    return (
      <div className="phase-distribution-graph">
        <div className="graph-header">
          <h3 className="graph-title">Phase-wise Distribution</h3>
          <div className="graph-legend">
            <div className="legend-item">
              <div className="legend-dot mentor-dot"></div>
              <span>Mentors</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot mentee-dot"></div>
              <span>Mentees</span>
            </div>
          </div>
        </div>
        
        <div className="graph-bars-container">
          <div className="graph-y-axis">
            <div className="y-axis-label">Count</div>
            <div className="y-axis-scale">
              {[Math.ceil(maxValue * 0.75), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.25), 0].map((value, idx) => (
                <div key={idx} className="y-axis-tick">
                  <span className="tick-label">{value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="graph-bars">
            {graphData.phases.map((phase, index) => {
              const mentorHeight = (graphData.mentors[index] / maxValue) * 100;
              const menteeHeight = (graphData.mentees[index] / maxValue) * 100;
              
              return (
                <div key={index} className="bar-group">
                  <div className="bar-label">{phase}</div>
                  <div className="bars-container">
                    <div 
                      className="bar mentor-bar"
                      style={{ height: `${mentorHeight}%` }}
                      title={`${graphData.mentors[index]} mentors`}
                    >
                      <span className="bar-value">{graphData.mentors[index]}</span>
                    </div>
                    <div 
                      className="bar mentee-bar"
                      style={{ height: `${menteeHeight}%` }}
                      title={`${graphData.mentees[index]} mentees`}
                    >
                      <span className="bar-value">{graphData.mentees[index]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="graph-footer">
          <div className="graph-stats">
            <div className="stat-item">
              <span className="stat-label">Total Mentors:</span>
              <span className="stat-value">{graphData.mentors.reduce((a, b) => a + b, 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Mentees:</span>
              <span className="stat-value">{graphData.mentees.reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Phase Performance Cards - Professional Version
  const renderPhasePerformanceCards = () => {
    if (filteredPhases.length === 0) {
      return (
        <div className="phases-empty-state">
          <div className="empty-state">
            <div className="empty-icon"><BarChart3 size={48} /></div>
            <p className="empty-text">
              {activePhase ? 'No data found for selected phase' : 'Please select a phase'}
            </p>
          </div>
        </div>
      );
    }

    return filteredPhases.map(phase => {
      const apiPhase = phaseStats?.find(p => 
        String(p.phaseId) === String(phase.phaseId)
      );
      
      const stats = apiPhase?.stats || {};
      
      return (
        <div key={phase.id} className="phase-performance-container">
          {/* Phase Header */}
          <div className="phase-performance-header">
            <div className="phase-title-section">
              <div className="phase-title-wrapper">
                <h3 className="phase-title">{phase.name}</h3>
                <span className="phase-period">{phase.period}</span>
              </div>
            </div>
            <div className={`phase-status-badge ${phase.status}`}>
              <span className="status-dot"></span>
              {phase.status.toUpperCase()}
            </div>
          </div>

          {/* Phase Stats Cards */}
          <div className="phase-stats-cards">
            {/* Mentors Card */}
            <div className="phase-stat-card mentors-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <span className="icon-symbol"><UsersIcon size={24} /></span>
                </div>
                <span className="stat-card-label">MENTORS</span>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{stats.totalMentors || 0}</div>
                <div className="stat-card-trend">
                  <span className="trend-icon">→</span>
                  <span className="trend-text">Active</span>
                </div>
              </div>
            </div>

            {/* Mentees Card */}
            <div className="phase-stat-card mentees-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <span className="icon-symbol"><GraduationCap size={24} /></span>
                </div>
                <span className="stat-card-label">MENTEES</span>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{stats.totalMentees || 0}</div>
                <div className="stat-card-trend">
                  <span className="trend-icon">→</span>
                  <span className="trend-text">Active</span>
                </div>
              </div>
            </div>

            {/* Meetings Card */}
            <div className="phase-stat-card meetings-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <span className="icon-symbol"><Calendar size={24} /></span>
                </div>
                <span className="stat-card-label">MEETINGS</span>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{stats.totalMeetings || 0}</div>
                <div className="stat-card-trend">
                  <span className="trend-icon">→</span>
                  <span className="trend-text">Scheduled</span>
                </div>
              </div>
            </div>

            {/* Completed Card */}
            <div className="phase-stat-card completed-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <span className="icon-symbol"><CheckCircle size={24} /></span>
                </div>
                <span className="stat-card-label">COMPLETED</span>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{stats.completedMeetings || 0}</div>
                <div className="stat-card-trend">
                  <span className="trend-icon">↑</span>
                  <span className="trend-text">Success</span>
                </div>
              </div>
            </div>

            {/* Postponed Card */}
            <div className="phase-stat-card postponed-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <span className="icon-symbol"><PauseCircle size={24} /></span>
                </div>
                <span className="stat-card-label">POSTPONED</span>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{stats.cancelledOrPostponed || 0}</div>
                <div className="stat-card-trend">
                  <span className="trend-icon">↓</span>
                  <span className="trend-text">Rescheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  // Show auth loading
  if (authLoading) {
    return (
      <div className="mentorship-dashboard-wrapper">
        <div className="dashboard-loading-container">
          <div className="dashboard-spinner"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="mentorship-dashboard-wrapper">
        <div className="dashboard-loading-container">
          <div className="dashboard-spinner"></div>
          <p>Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentorship-dashboard-wrapper">
      <div className="dashboard-animated-bg">
        <div className="dashboard-gradient-orb dashboard-orb-1"></div>
        <div className="dashboard-gradient-orb dashboard-orb-2"></div>
        <div className="dashboard-gradient-orb dashboard-orb-3"></div>
      </div>
      
      <div className="dashboard-container">
        {/* Header */}
     <div className="dashboard-header">
  <div className="header-content">
    <div className="header-top">
      <div className="logo-section">
        <div className="logo">M</div>
        <h1 className="title">Mentorship Dashboard</h1>
        
        {/* MOVED: Three-dot menu to top-right */}
        <div className="header-menu">
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
                onClick={handlePlacementClick}
              >
                <BriefcaseIcon size={18} />
                <span>Placement</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <br/>
      <div className="user-info">
        <div className="role-badge">
          {getRoleDisplayName(userRole)}
        </div>
        {userEmail && (
          <div className="email-display">
            <span className="email-label">Logged in as:</span>
            <span className="email-value">{userEmail}</span>
          </div>
        )}
        {/* REMOVED: Menu button from here */}
      </div>
    </div>
  </div>
</div>

        {/* Stats Grid */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Users size={36} /></div>
              <div className="stat-value">{dashboardStats.totalMentors}</div>
              <div className="stat-label">Active Mentors</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon"><GraduationCap size={36} /></div>
              <div className="stat-value">{dashboardStats.totalMentees}</div>
              <div className="stat-label">Active Mentees</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={36} /></div>
              <div className="stat-value">{meetingStats?.completed || 0}</div>
              <div className="stat-label">Completed Meetings</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon"><PauseCircle size={36} /></div>
              <div className="stat-value">{meetingStats?.postponed || 0}</div>
              <div className="stat-label">Cancelled/Postponed</div>
            </div>
          </div>
        </div>

        {/* Phase Filter */}
        <div className="section-header">
          <h2 className="section-title">Program Phases Performance</h2>
        </div>
        
        <div className="phase-filter-section">
          <div className="filter-container">
            <div className="filter-title">Select Phase</div>
            <div className="filter-buttons">
              {mentorshipPhases.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`filter-btn ${activePhase === phase.id ? 'active' : ''}`}
                >
                  {phase.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Program Phases Performance - Professional Cards Version */}
        <div className="phases-section">
          <div className="phases-performance-wrapper">
            {renderPhasePerformanceCards()}
          </div>
        </div>

        {/* Current Mentors */}
        <div className="mentors-section">
          <div className="search-container">
            <div className="search-header">
              <div>
                <h2 className="search-title">Current Mentors ({allMentors.length})</h2>
              </div>
            </div>
            
            <div className="search-box">
              <span className="search-icon"><Search size={18} /></span>
              <input
                type="text"
                placeholder="Search mentor..."
                value={searchMentor}
                onChange={(e) => setSearchMentor(e.target.value)}
                className="search-input"
              />
              {searchMentor && (
                <button onClick={() => setSearchMentor('')} className="clear-search">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          <div className="mentor-carousel">
            <div className="carousel-controls">
              <div className="carousel-info">
                <span className="carousel-counter">
                  {searchMentor 
                    ? `Found ${filteredMentorCapacity.length} mentor${filteredMentorCapacity.length !== 1 ? 's' : ''}` 
                    : `Mentor ${currentMentorIndex + 1} of ${filteredMentorCapacity.length}`
                  }
                </span>
              </div>
              
              {!searchMentor && filteredMentorCapacity.length > 1 && (
                <div className="carousel-buttons">
                  <button onClick={prevMentor} className="carousel-btn"><ChevronLeft size={20} /></button>
                  <button onClick={nextMentor} className="carousel-btn"><ChevronRight size={20} /></button>
                </div>
              )}
            </div>
            
            <div className="mentor-cards">
              {filteredMentorCapacity.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className={`mentor-card ${index === currentMentorIndex ? 'active' : 'inactive'}`}
                >
                  <h3 className="mentor-name">{mentor.name}</h3>
                  
                  <div className="capacity-meter">
                    <div className="capacity-info">
                      <span className="capacity-count">{mentor.menteeCount}/{mentor.maxCapacity} mentees</span>
                      <span className="capacity-percentage">
                        {Math.round((mentor.menteeCount / mentor.maxCapacity) * 100)}% capacity
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{
                          width: `${Math.min((mentor.menteeCount / mentor.maxCapacity) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="mentees-list">
                    <span className="mentee-label">Mentees</span>
                    {mentor.mentees.length > 0 ? (
                      <div className="mentee-tags">
                        {mentor.mentees.slice(0, 3).map((mentee, idx) => (
                          <span key={idx} className="mentee-tag">{mentee}</span>
                        ))}
                        {mentor.mentees.length > 3 && (
                          <span className="mentee-tag">+{mentor.mentees.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="no-mentees">No mentees assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!searchMentor && filteredMentorCapacity.length > 1 && (
              <div className="carousel-indicators">
                {filteredMentorCapacity.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToMentor(index)}
                    className={`carousel-indicator ${index === currentMentorIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
            <p className="search-subtitle">Quick access for {getRoleDisplayName(userRole)} role</p>
          </div>
          
          <div className="actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div 
                  key={action.id} 
                  className="action-item"
                  onClick={() => handleQuickActionClick(action)}
                >
                  <div className="action-icon">
                    <Icon size={24} />
                  </div>
                  <div className="action-content">
                    <h3 className="action-title">{action.title}</h3>
                    <span className="action-role">{getRoleDisplayName(userRole)}</span>
                    <p className="action-description">{action.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}