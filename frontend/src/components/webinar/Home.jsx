// Frontend - AlumniDashboard.js (updated version)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

// Import your logo images
import AlumniLogo from '../../assets/Nec-alumni-association.jpeg';
import NECLogo from '../../assets/NEC-college Logo.png';

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

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('webinars');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [dashboardData, setDashboardData] = useState({
    mentors: [],
    mentees: [],
    meetings: [],
    assignments: []
  });
  const [placementData, setPlacementData] = useState({
    mappings: [],
    companies: [],
    placementRequests: [],
    applications: []
  });
  const [webinarData, setWebinarData] = useState({
    webinars: [],
    domains: [],
    totals: {
      planned: 0,
      conducted: 0,
      postponed: 0,
      totalSpeakers: 0,
      newSpeakers: 0
    }
  });
  
  const [mentorshipStats, setMentorshipStats] = useState({
    totalMentors: 0,
    totalMentees: 0,
    totalMeetings: 0,
    completedMeetings: 0
  });
  
  const [placementStats, setPlacementStats] = useState({
    totalApplications: 0,
    selected: 0,
    rejected: 0,
    pending: 0,
    inProgress: 0,
    successRate: 0
  });

  const [webinarStats, setWebinarStats] = useState({
    totalPlanned: 0,
    totalConducted: 0,
    totalSpeakers: 0,
    totalNewSpeakers: 0
  });

  const [currentPhase, setCurrentPhase] = useState('');
  const [phases, setPhases] = useState([]);

  // Get email from URL on component mount
  useEffect(() => {
    const getEmailFromURL = () => {
      // Check URL parameters for encrypted email
      const urlParams = new URLSearchParams(location.search);
      const encryptedEmailFromUrl = urlParams.get('email');
      
      if (encryptedEmailFromUrl) {
        try {
          // Decrypt the email from URL
          const decryptedEmail = decryptEmail(decodeURIComponent(encryptedEmailFromUrl));
          if (decryptedEmail && decryptedEmail.includes('@')) {
            // Store in localStorage for future use
            localStorage.setItem('userEmail', decryptedEmail);
            console.log('User email decrypted from URL and stored:', decryptedEmail);

            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            return decryptedEmail;
          }
        } catch (error) {
          console.error('Error decrypting email from URL:', error);
        }
      }
      
      // Get email from localStorage (fallback)
      const storedEmail = localStorage.getItem('userEmail') || '';
      return storedEmail;
    };

    const email = getEmailFromURL();
    setUserEmail(email);
  }, [location.search]);


  const handleLogout = () => {
    // Remove email from localStorage
    localStorage.removeItem('userEmail');

    // Clear user email state
    setUserEmail('');

    // Refresh the page
    window.location.reload();

    console.log('User logged out successfully');
  };

  // Helper function to generate encrypted email parameter for URL
  const getEncryptedEmailParam = () => {
    if (!userEmail) return '';
    const encrypted = encryptEmail(userEmail);
    return encodeURIComponent(encrypted);
  };

  // UPDATED: Navigation function WITHOUT alert
  const navigateWithEmail = (path) => {
    if (userEmail) {
      // Log to console for debugging (optional)
      console.log('User email (decrypted):', userEmail);
      
      // Encrypt and navigate without showing alert
      const encryptedParam = getEncryptedEmailParam();
      navigate(`${path}?email=${encryptedParam}`);
    } else {
      window.location.reload();
    }
  };

  // Fetch phases and current phase
  useEffect(() => {
    const fetchPhases = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/phases`);
        const data = await response.json();
        
        if (data && Array.isArray(data.phases)) {
          const phaseNames = data.phases.map(p => `Phase ${p.phaseId}`).sort((a, b) => 
            parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1])
          );
          setPhases(phaseNames);
          
          if (phaseNames.length > 0) {
            try {
              const currentPhaseRes = await fetch(`${API_BASE_URL}/api/current-phase`);
              const currentPhaseData = await currentPhaseRes.json();
              
              if (currentPhaseData.found) {
                setCurrentPhase(currentPhaseData.displayText);
              } else {
                const now = new Date();
                let currentPhaseName = 'Phase 1';
                
                if (now >= new Date('2025-10-01')) {
                  currentPhaseName = 'Phase 6';
                } else if (now >= new Date('2025-07-01')) {
                  currentPhaseName = 'Phase 5';
                } else if (now >= new Date('2025-01-01')) {
                  currentPhaseName = 'Phase 4';
                } else if (now >= new Date('2024-07-01')) {
                  currentPhaseName = 'Phase 3';
                } else if (now >= new Date('2024-01-01')) {
                  currentPhaseName = 'Phase 2';
                }
                
                setCurrentPhase(currentPhaseName);
              }
            } catch (error) {
              console.error('Error fetching current phase:', error);
              setCurrentPhase('Phase 1');
            }
          }
        } else {
          generateFallbackPhases();
        }
      } catch (error) {
        console.error('Error fetching phases:', error);
        generateFallbackPhases();
      }
    };

    const generateFallbackPhases = () => {
      const basePhases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];
      const now = new Date();
      
      if (now >= new Date('2025-10-01')) {
        basePhases.push('Phase 6');
      }
      if (now >= new Date('2026-10-01')) {
        basePhases.push('Phase 7');
      }
      if (now >= new Date('2027-10-01')) {
        basePhases.push('Phase 8');
      }
      
      setPhases(basePhases);
      
      const nowDate = new Date();
      let currentPhaseName = 'Phase 1';
      
      if (nowDate >= new Date('2025-10-01')) {
        currentPhaseName = 'Phase 6';
      } else if (nowDate >= new Date('2025-07-01')) {
        currentPhaseName = 'Phase 5';
      } else if (nowDate >= new Date('2025-01-01')) {
        currentPhaseName = 'Phase 4';
      } else if (nowDate >= new Date('2024-07-01')) {
        currentPhaseName = 'Phase 3';
      } else if (nowDate >= new Date('2024-01-01')) {
        currentPhaseName = 'Phase 2';
      }
      
      setCurrentPhase(currentPhaseName);
    };

    fetchPhases();
  }, []);

  // Fetch mentorship data
  useEffect(() => {
    const fetchMentorshipData = async () => {
      try {
        const [mentorsRes, menteesRes, meetingsRes, assignmentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/dashboard/mentors`),
          axios.get(`${API_BASE_URL}/api/dashboard/mentees`),
          axios.get(`${API_BASE_URL}/api/dashboard/meetings`),
          axios.get(`${API_BASE_URL}/api/dashboard/assignments`)
        ]);

        if (mentorsRes.data.success && menteesRes.data.success && 
            meetingsRes.data.success && assignmentsRes.data.success) {
          
          setDashboardData({
            mentors: mentorsRes.data.mentors || [],
            mentees: menteesRes.data.mentees || [],
            meetings: meetingsRes.data.meetings || [],
            assignments: assignmentsRes.data.assignments || []
          });

          const totalMentors = mentorsRes.data.stats?.total || 0;
          const totalMentees = menteesRes.data.stats?.total || 0;
          const meetingStats = meetingsRes.data.stats || {};
          
          setMentorshipStats({
            totalMentors,
            totalMentees,
            totalMeetings: meetingStats.total || 0,
            completedMeetings: meetingStats.completed || 0
          });
        }
      } catch (error) {
        console.error('Error fetching mentorship data:', error);
      }
    };

    fetchMentorshipData();
  }, []);

  // Fetch placement data
  useEffect(() => {
    const fetchPlacementData = async () => {
      setLoading(true);
      try {
        const timestamp = Date.now();
        const [mappingsRes, companiesRes, placementRequestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/company-mapping?_t=${timestamp}`),
          axios.get(`${API_BASE_URL}/api/company-mapping/available-companies?_t=${timestamp}`),
          axios.get(`${API_BASE_URL}/api/job-requests?_t=${timestamp}`)
        ]);

        if (mappingsRes.data.success && companiesRes.data.success) {
          const mappings = mappingsRes.data.data || [];
          const companies = companiesRes.data.data || [];
          const placementRequests = placementRequestsRes.data.success ? placementRequestsRes.data.data : [];

          setPlacementData({
            mappings,
            companies,
            placementRequests,
            applications: formatApplications(mappings)
          });

          const selectedCount = mappings.filter(m => m.alumni_status === 'Selected').length;
          const rejectedCount = mappings.filter(m => m.alumni_status === 'Rejected').length;
          const pendingCount = mappings.filter(m => m.alumni_status === 'Not Applied').length;
          const inProgressCount = mappings.filter(m => 
            m.alumni_status === 'In Process' || m.alumni_status === 'Applied'
          ).length;
          
          const totalApplications = mappings.length;
          const successRate = totalApplications > 0 
            ? Math.round((selectedCount / totalApplications) * 100)
            : 0;

          setPlacementStats({
            totalApplications,
            selected: selectedCount,
            rejected: rejectedCount,
            pending: pendingCount,
            inProgress: inProgressCount,
            successRate
          });
        }
      } catch (error) {
        console.error('Error fetching placement data:', error);
        setPlacementData({
          mappings: [],
          companies: [],
          placementRequests: [],
          applications: []
        });
        setPlacementStats({
          totalApplications: 0,
          selected: 0,
          rejected: 0,
          pending: 0,
          inProgress: 0,
          successRate: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlacementData();
    const interval = setInterval(fetchPlacementData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch webinar data
  useEffect(() => {
    const fetchWebinarData = async () => {
      try {
        setLoading(true);
        
        if (!currentPhase) {
          console.log('Waiting for current phase to be determined...');
          setLoading(false);
          return;
        }

        console.log('Fetching webinar data for phase:', currentPhase);

        const dashboardRes = await fetch(`${API_BASE_URL}/api/dashboard-stats?phase=${encodeURIComponent(currentPhase)}`);
        
        if (dashboardRes.ok) {
          const statsData = await dashboardRes.json();
          
          if (statsData && statsData.domains && Array.isArray(statsData.domains)) {
            const domains = statsData.domains;
            
            const planned = domains.reduce((sum, domain) => sum + (Number(domain.planned) || 0), 0);
            const conducted = domains.reduce((sum, domain) => sum + (Number(domain.conducted) || 0), 0);
            const postponed = domains.reduce((sum, domain) => sum + (Number(domain.postponed) || 0), 0);
            const totalSpeakers = domains.reduce((sum, domain) => sum + (Number(domain.totalSpeakers) || 0), 0);
            const newSpeakers = domains.reduce((sum, domain) => sum + (Number(domain.newSpeakers) || 0), 0);

            const webinarsRes = await fetch(`${API_BASE_URL}/api/webinars`);
            let allWebinars = [];
            
            if (webinarsRes.ok) {
              const webinarsData = await webinarsRes.json();
              allWebinars = Array.isArray(webinarsData) ? webinarsData : [];
            }

            const recentWebinars = allWebinars
              .filter(w => w.webinarDate)
              .sort((a, b) => new Date(b.webinarDate) - new Date(a.webinarDate))
              .slice(0, 6);

            const now = new Date();
            const upcomingWebinars = allWebinars
              .filter(w => w.webinarDate && new Date(w.webinarDate) > now)
              .sort((a, b) => new Date(a.webinarDate) - new Date(b.webinarDate))
              .slice(0, 3);

            setWebinarData({
              webinars: recentWebinars,
              upcomingWebinars: upcomingWebinars,
              domains: domains,
              totals: {
                planned,
                conducted,
                postponed,
                totalSpeakers,
                newSpeakers
              }
            });

            setWebinarStats({
              totalPlanned: planned,
              totalConducted: conducted,
              totalSpeakers: totalSpeakers + newSpeakers,
              totalNewSpeakers: newSpeakers
            });
          } else {
            throw new Error('Invalid dashboard stats response');
          }
        } else {
          throw new Error(`Dashboard API error: ${dashboardRes.status}`);
        }
      } catch (error) {
        console.error('Error fetching webinar data:', error);
        useFallbackWebinarData();
      } finally {
        setLoading(false);
      }
    };

    const useFallbackWebinarData = () => {
      console.log('Using fallback webinar data');
      
      const seedData = {
        'Phase 1': {
          domains: [
            { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4 },
            { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 2, postponed: 0, totalSpeakers: 0, newSpeakers: 2 },
            { id: 'd3', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 2 },
            { id: 'd4', name: 'ROBOTIC AND AUTOMATION', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4 },
            { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4 },
            { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4 },
            { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4 }
          ]
        },
        'Phase 2': {
          domains: [
            { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4 },
            { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 2, postponed: 0, totalSpeakers: 2, newSpeakers: 3 },
            { id: 'd3', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 2, newSpeakers: 3 },
            { id: 'd4', name: 'ROBOTIC AND AUTOMATION', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 3 },
            { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4 },
            { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4 },
            { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4 }
          ]
        }
      };

      const phaseData = seedData[currentPhase] || seedData['Phase 1'];
      const domains = phaseData.domains || [];
      
      const planned = domains.reduce((sum, domain) => sum + domain.planned, 0);
      const conducted = domains.reduce((sum, domain) => sum + domain.conducted, 0);
      const totalSpeakers = domains.reduce((sum, domain) => sum + (domain.totalSpeakers + domain.newSpeakers), 0);
      const newSpeakers = domains.reduce((sum, domain) => sum + domain.newSpeakers, 0);

      const sampleWebinars = [
        { 
          id: 1, 
          topic: 'AI in Healthcare', 
          speaker: { name: 'Dr. Smith' }, 
          attendedCount: 120, 
          webinarDate: '2024-12-15',
          status: 'Completed'
        },
        { 
          id: 2, 
          topic: 'Data Science Career Roadmap', 
          speaker: { name: 'Jane Doe' }, 
          attendedCount: 95, 
          webinarDate: '2024-11-20',
          status: 'Completed'
        }
      ];

      setWebinarData({
        webinars: sampleWebinars,
        domains: domains,
        totals: {
          planned,
          conducted,
          postponed: 0,
          totalSpeakers,
          newSpeakers
        }
      });

      setWebinarStats({
        totalPlanned: planned,
        totalConducted: conducted,
        totalSpeakers,
        totalNewSpeakers: newSpeakers
      });
    };

    if (currentPhase) {
      fetchWebinarData();
    }
    
    const interval = setInterval(() => {
      if (currentPhase) {
        fetchWebinarData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPhase]);

  // Format applications from mappings data
  const formatApplications = (mappings) => {
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

    return Array.from(applicationsMap.values());
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
      'pending': { class: 'status-pending', icon: '⏳', label: 'Pending' },
      'inProgress': { class: 'status-progress', icon: '🔄', label: 'In Progress' },
      'completed': { class: 'status-approved', icon: '✅', label: 'Selected' },
      'rejected': { class: 'status-rejected', icon: '✕', label: 'Rejected' }
    };
    return colors[status] || colors.pending;
  };

  const statusConfig = {
    'APPROVED': { class: 'status-approved', icon: '✓', label: 'Approved' },
    'HOLD': { class: 'status-hold', icon: '⏸', label: 'On Hold' },
    'ACTIVE': { class: 'status-active', icon: '●', label: 'Active' },
    'SCHEDULED': { class: 'status-scheduled', icon: '📅', label: 'Scheduled' },
    'ON HOLD': { class: 'status-onhold', icon: '⏸', label: 'On Hold' },
    'OFFERED': { class: 'status-offered', icon: '🎉', label: 'Offered' },
    'IN PROGRESS': { class: 'status-progress', icon: '⏳', label: 'In Progress' },
    'REJECTED': { class: 'status-rejected', icon: '✕', label: 'Rejected' },
    'Scheduled': { class: 'status-scheduled', icon: '📅', label: 'Scheduled' },
    'Completed': { class: 'status-completed', icon: '✓', label: 'Completed' },
    'pending': { class: 'status-pending', icon: '⏳', label: 'Pending' }
  };

  // Get recent webinars
  const getRecentWebinars = () => {
    return webinarData.webinars.map((webinar, index) => {
      let speakerName = 'Speaker TBD';
      if (webinar.speaker) {
        if (typeof webinar.speaker === 'string') {
          speakerName = webinar.speaker;
        } else if (webinar.speaker.name) {
          speakerName = webinar.speaker.name;
        }
      }
      
      let status = 'Scheduled';
      if (webinar.status) {
        status = webinar.status;
      } else if (webinar.attendedCount && webinar.attendedCount > 0) {
        status = 'Completed';
      }
      
      return {
        id: webinar.id || webinar._id || index,
        title: webinar.topic || webinar.title || `Webinar ${index + 1}`,
        speaker: speakerName,
        attendedCount: webinar.attendedCount || 0,
        date: webinar.webinarDate || webinar.date || new Date().toISOString(),
        status: status
      };
    });
  };

  const DashboardCard = ({ icon, title, description, onClick, buttonText = "Go to Dashboard", stats = [] }) => (
    <div className="dashboard-access-card">
      <div className="dashboard-card-header">
        <div className="dashboard-icon">{icon}</div>
        <h3>{title}</h3>
      </div>
      <p className="dashboard-description">{description}</p>
      {stats.length > 0 && (
        <div className="dashboard-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
      <button className="dashboard-button" onClick={onClick}>
        {buttonText} →
      </button>
    </div>
  );

  // UPDATED: Now will navigate directly without showing alert
  const renderDashboardAccess = () => {
    switch(selectedTab) {
      case 'webinars':
        return (
          <DashboardCard
            icon="🎓"
            title="Webinar Dashboard"
            description={`Manage webinar requests, speaker assignments, and topic approvals for ${currentPhase || 'current phase'}`}
            onClick={() => navigateWithEmail('/webinar-dashboard')}
            stats={[
              { value: webinarStats.totalPlanned, label: 'Total Planned' },
              { value: webinarStats.totalConducted, label: 'Total Conducted' },
              { value: webinarStats.totalSpeakers, label: 'Total Speakers' }
            ]}
          />
        );
      case 'mentorships':
        return (
          <DashboardCard
            icon="🤝"
            title="Mentorship Dashboard"
            description="Manage mentorship programs, track progress, and handle mentor-mentee assignments."
            onClick={() => navigateWithEmail('/dashboard')}
            stats={[
              { value: mentorshipStats.totalMentors, label: 'Total Mentors' },
              { value: mentorshipStats.totalMentees, label: 'Total Mentees' },
              { value: mentorshipStats.completedMeetings, label: 'Completed Meetings' }
            ]}
          />
        );
      case 'placements':
        return (
          <DashboardCard
            icon="💼"
            title="Placement Dashboard"
            description="View and manage placement data, company registrations, and alumni employment records."
            onClick={() => navigateWithEmail('/placement-dashboard')}
            stats={[
              { value: placementStats.totalApplications, label: 'Total Applications' },
              { value: placementStats.selected, label: 'Selected' },
              { value: `${placementStats.successRate}%`, label: 'Success Rate' }
            ]}
          />
        );
      default:
        return null;
    }
  };

  // Format mentor-mentee assignments for display
  const getMentorshipData = () => {
    return dashboardData.assignments.map((assignment, index) => ({
      id: assignment._id,
      mentor: assignment.mentorDetails?.name || 'Unknown Mentor',
      mentees: assignment.mentees?.map(mentee => mentee.name) || [],
      meetings: assignment.meetings || 0,
      status: 'ACTIVE',
      topic: 'Mentorship Program',
      postponed: 0,
      duration: 'Ongoing'
    }));
  };

  // Get recent applications (limited to 6)
  const getRecentApplications = () => {
    return placementData.applications.slice(0, 6).map(app => ({
      id: app.id,
      alumni: app.name,
      company: app.company,
      status: app.status === 'completed' ? 'SELECTED' : 
              app.status === 'rejected' ? 'REJECTED' :
              app.status === 'inProgress' ? 'IN PROGRESS' : 'PENDING',
      package: app.ctc,
      position: app.role,
      date: app.date,
      location: 'N/A'
    }));
  };

  const DataCard = ({ item, type, onClick }) => {
    const getCardContent = () => {
      switch(type) {
        case 'webinars':
          return (
            <>
              <div className="data-card-header">
                <h4>{item.title}</h4>
                <span className={`status-badge ${statusConfig[item.status]?.class}`}>
                  {statusConfig[item.status]?.icon} {statusConfig[item.status]?.label}
                </span>
              </div>
              <div className="data-card-body">
                <div className="data-info">
                  <span className="info-icon">🎤</span>
                  <span>{item.speaker}</span>
                </div>
                <div className="data-info">
                  <span className="info-icon">👥</span>
                  <span>{item.attendedCount} Attended</span>
                </div>
                <div className="data-info">
                  <span className="info-icon">📅</span>
                  <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </>
          );
        case 'mentorships':
          return (
            <>
              <div className="data-card-header">
                <h4>{item.mentor}</h4>
                <span className={`status-badge ${statusConfig[item.status]?.class}`}>
                  {statusConfig[item.status]?.icon} {statusConfig[item.status]?.label}
                </span>
              </div>
              <div className="data-card-body">
                <div className="data-info">
                  <span className="info-icon">👨‍🏫</span>
                  <span>Mentor</span>
                </div>
                <div className="data-info">
                  <span className="info-icon">👨‍🎓</span>
                  <span>{item.mentees.length} Mentees</span>
                </div>
                <div className="data-info">
                  <span className="info-icon">🤝</span>
                  <span>{item.meetings} Meetings</span>
                </div>
              </div>
              <div className="mentee-list">
                <span className="mentee-label">Assigned Mentees:</span>
                <div className="mentee-tags">
                  {item.mentees.slice(0, 2).map((mentee, idx) => (
                    <span key={idx} className="mentee-tag">{mentee}</span>
                  ))}
                  {item.mentees.length > 2 && (
                    <span className="mentee-tag">+{item.mentees.length - 2} more</span>
                  )}
                </div>
              </div>
            </>
          );
        case 'placements':
          const statusColors = getStatusColor(item.status.toLowerCase());
          return (
            <>
              <div className="data-card-header">
                <h4>{item.alumni}</h4>
                <span className={`status-badge ${statusColors.class}`}>
                  {statusColors.icon} {statusColors.label}
                </span>
              </div>
              <div className="data-card-body">
                <div className="data-info">
                  <span className="info-icon">🏢</span>
                  <span>{item.company}</span>
                </div>
                <div className="data-info">
                  <span className="info-icon">💼</span>
                  <span>{item.position}</span>
                </div>
                <div className="data-info">
                  <span className="info-icon">💰</span>
                  <span>{item.package}</span>
                </div>
              </div>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="data-card" onClick={() => onClick(item)}>
        {getCardContent()}
        <div className="data-card-footer">
          <span className="view-details">View Details →</span>
        </div>
      </div>
    );
  };

  const renderDataGrid = () => {
    if (loading && selectedTab === 'placements') {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      );
    }

    let data = [];
    if (selectedTab === 'webinars') {
      data = getRecentWebinars();
    } else if (selectedTab === 'mentorships') {
      data = getMentorshipData();
    } else if (selectedTab === 'placements') {
      data = getRecentApplications();
    }
    
    if (data.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No data available for {selectedTab}</p>
        </div>
      );
    }

    return (
      <div className="data-grid">
        {data.map(item => (
          <DataCard
            key={item.id}
            item={item}
            type={selectedTab}
            onClick={setSelectedItem}
          />
        ))}
      </div>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedItem) return null;

    const getModalContent = () => {
      switch(selectedTab) {
        case 'webinars':
          return (
            <>
              <h3>{selectedItem.title}</h3>
              <div className="modal-grid">
                <div className="modal-item">
                  <span className="modal-label">Status</span>
                  <span className={`modal-value ${statusConfig[selectedItem.status]?.class}`}>
                    {statusConfig[selectedItem.status]?.icon} {selectedItem.status}
                  </span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Speaker</span>
                  <span className="modal-value highlight">{selectedItem.speaker}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Date</span>
                  <span className="modal-value">
                    {new Date(selectedItem.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Attended Count</span>
                  <span className="modal-value">{selectedItem.attendedCount} Participants</span>
                </div>
                <div className="modal-item full-width">
                  <span className="modal-label">Current Phase</span>
                  <span className="modal-value highlight">{currentPhase}</span>
                </div>
              </div>
            </>
          );
        case 'mentorships':
          return (
            <>
              <h3>Mentorship Assignment Details</h3>
              <div className="modal-grid">
                <div className="modal-item">
                  <span className="modal-label">Mentor</span>
                  <span className="modal-value highlight">{selectedItem.mentor}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Status</span>
                  <span className={`modal-value ${statusConfig[selectedItem.status]?.class}`}>
                    {statusConfig[selectedItem.status]?.icon} {selectedItem.status}
                  </span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Total Mentees</span>
                  <span className="modal-value">{selectedItem.mentees.length}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Meetings</span>
                  <span className="modal-value highlight">{selectedItem.meetings}</span>
                </div>
                <div className="modal-item full-width">
                  <span className="modal-label">Assigned Mentees</span>
                  <div className="mentees-list">
                    {selectedItem.mentees.map((mentee, index) => (
                      <div key={index} className="mentee-item">
                        <span className="mentee-name">{mentee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          );
        case 'placements':
          const statusColors = getStatusColor(selectedItem.status.toLowerCase());
          return (
            <>
              <h3>Application Details</h3>
              <div className="modal-grid">
                <div className="modal-item">
                  <span className="modal-label">Alumni</span>
                  <span className="modal-value highlight">{selectedItem.alumni}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Company</span>
                  <span className="modal-value highlight">{selectedItem.company}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Status</span>
                  <span className={`modal-value ${statusColors.class}`}>
                    {statusColors.icon} {statusColors.label}
                  </span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Position</span>
                  <span className="modal-value">{selectedItem.position}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Package</span>
                  <span className="modal-value highlight">{selectedItem.package}</span>
                </div>
                <div className="modal-item">
                  <span className="modal-label">Date</span>
                  <span className="modal-value">
                    {new Date(selectedItem.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedItem(null)}>×</button>
          {getModalContent()}
          <div className="modal-actions">
            <button 
              className="modal-button secondary"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="alumni-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-container">
            {/* Left Logo - NEC College */}
            <div className="logo-side left-logo">
              <img 
                src={NECLogo} 
                alt="NEC College Logo" 
                className="college-logo"
              />
            </div>

            {/* Center Title */}
            <div className="center-title">
              <h1>NEC Alumni Association</h1>
              <p className="subtitle">Empowering Connections, Inspiring Success</p>
              {userEmail && (
                <p className="user-email-info">
                  <span>Logged in as: </span>
                  <span className="email-value">{userEmail}</span>
                </p>
              )}
            </div>

            {/* Right Logo - Alumni Association */}
            <div className="logo-side right-logo">
              <img 
                src={AlumniLogo} 
                alt="NEC Alumni Association Logo" 
                className="alumni-logo"
              />
            </div>
          </div>

           {userEmail && (
            <button 
              className="logout-button" 
              onClick={handleLogout}
              title="Logout"
            >
              <span className="logout-text">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="dashboard-tabs">
        <div className="tabs-container">
          {['webinars', 'mentorships', 'placements'].map(tab => (
            <button
              key={tab}
              className={`tab ${selectedTab === tab ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab)}
            >
              <span className="tab-icon">
                {tab === 'webinars' ? '🎓' : tab === 'mentorships' ? '🤝' : '💼'}
              </span>
              <span className="tab-text">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Dashboard Access Section */}
          <section className="dashboard-access-section">
            <div className="section-header">
              <h2>Management Portal</h2>
              <p>Access comprehensive management tools for each module</p>
              {selectedTab === 'webinars' && currentPhase && (
                <p className="current-phase-info">
                  <span className="phase-label">Current Phase:</span>
                  <span className="phase-value">{currentPhase}</span>
                </p>
              )}
            </div>
            {renderDashboardAccess()}
          </section>

          {/* Data Preview Section */}
          <section className="data-preview-section">
            <div className="section-header">
              <h2>Recent {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}</h2>
              {selectedTab === 'mentorships' && (
                <p className="subtitle">Showing mentor-mentee assignments from real-time data</p>
              )}
              {selectedTab === 'placements' && (
                <p className="subtitle">Showing recent placement applications from real-time data</p>
              )}
              {selectedTab === 'webinars' && (
                <p className="subtitle">Showing recent webinar events from {currentPhase || 'current phase'}</p>
              )}
              <p>Click on any item to view detailed information</p>
            </div>
            {renderDataGrid()}
          </section>
        </div>
      </main>

      {/* Details Modal */}
      {renderDetailsModal()}
    </div>
  );
};

export default AlumniDashboard;