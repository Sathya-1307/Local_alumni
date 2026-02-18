// ---------- FILE: WebinarDashboard.jsx ----------
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import './WebinarDashboard.css';
// import './Adminpage';
import './webinar/Common.css';
import { GraduationCap, ArrowLeft, MoreVertical, Users, Briefcase} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import MentorshipDashboard from './MentorshipDashboard';
import WebinarAlumniFeedbackForm from "./webinar/WebinarAlumniFeedbackForm";
import WebinarCompletedDetailsForm from "./webinar/WebinarCompletedDetailsForm";
import StudentRequestForm from "./webinar/StudentRequestForm";
import WebinarSpeakerAssignmentForm from "./webinar/WebinarSpeakerAssignmentForm";
import WebinarStudentFeedbackForm from "./webinar/WebinarStudentFeedbackForm";
import TopicApprovalForm from './webinar/TopicApprovalForm';
import WebinarCircular from './webinar/WebinarCircular';

// ADDED: Decryption function that matches other dashboards
const decryptEmail = (encryptedEmail) => {
  try {
    return decodeURIComponent(atob(encryptedEmail));
  } catch (error) {
    console.error('Error decrypting email:', error);
    return encryptedEmail;
  }
};

/*WebinarDashboard.jsx
  
  - Single-file React component that implements ALL requested options:
    1) Charts (bar / doughnut / line)
    2) Advanced UI (sidebar, animations, glass cards)
    3) Table view with sorting, pagination, search
    4) College-theme toggle (example styles) to match provided UI
    5) Phase-wise tabs and domain popups with speaker counts

  Usage:
    - place this file and the CSS file in the same folder
    - install recharts: `npm i recharts`
    - import and render <WebinarDashboard /> from your app
*/

// -----------------------
// Context (phase selection)
// -----------------------
const PhaseContext = createContext();
export const usePhase = () => useContext(PhaseContext);

const generatePhases = () => {
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
  // Add more phases as needed in future
  return basePhases;
};

const PhaseProvider = ({ children }) => {
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(''); // Default empty, set after fetch

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/phases`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Handle API response format: { success: true, phases: [...] }
        const phasesArray = data.phases || (Array.isArray(data) ? data : []);
        if (Array.isArray(phasesArray) && phasesArray.length > 0) {
          const phaseNames = phasesArray.map(p => `Phase ${p.phaseId}`).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
          setPhases(phaseNames);
          if (phaseNames.length > 0) {
            setSelectedPhase(phaseNames[0]);
          }
        } else {
          console.warn('No phases found from API, using fallback phases');
          // Fallback to generated phases if API returns empty or invalid data
          const fallbackPhases = generatePhases();
          setPhases(fallbackPhases);
          if (fallbackPhases.length > 0) {
            setSelectedPhase(fallbackPhases[0]);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching phases:', error);
        // Fallback to generated phases on error
        const fallbackPhases = generatePhases();
        setPhases(fallbackPhases);
        if (fallbackPhases.length > 0) {
          setSelectedPhase(fallbackPhases[0]);
        }
      });
  }, []);

  return (
    <PhaseContext.Provider value={{ phases, selectedPhase, setSelectedPhase }}>
      {children}
    </PhaseContext.Provider>
  );
};

// -----------------------
// Seed data (example)
// -----------------------
const seedPhases = {
  'Phase 1': {
    months: ['Jun 2023', 'Jul 2023', 'Aug 2023', 'Sep 2023'],
    domains: [
      { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4, requestedTopics: ['Machine Learning Basics', 'Neural Networks'], approvedTopics: ['Deep Learning', 'AI Ethics'], completedTopics: ['Python for AI', 'Data Preprocessing'] },
      { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 2, postponed: 0, totalSpeakers: 0, newSpeakers: 2, requestedTopics: ['Machine Learning Basics', 'Neural Networks'], approvedTopics: ['Deep Learning', 'AI Ethics'], completedTopics: ['Python for AI', 'Data Preprocessing'] },
      { id: 'd3', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 2, requestedTopics: ['Network Security', 'Ethical Hacking'], approvedTopics: ['Cryptography', 'Penetration Testing'], completedTopics: ['Firewall Basics', 'Secure Coding'] },
      { id: 'd4', name: 'ROBOTIC AND AUTOMATION', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4, requestedTopics: ['Statistics for Data Science', 'Big Data'], approvedTopics: ['Machine Learning Models', 'Data Visualization'], completedTopics: ['Intro to Pandas', 'Regression Analysis'] },
      { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4, requestedTopics: ['AWS Basics', 'Docker Containers'], approvedTopics: ['Kubernetes', 'Serverless Computing'], completedTopics: ['Cloud Storage', 'Microservices'] },
      { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4, requestedTopics: ['Arduino Programming', 'IoT Basics'], approvedTopics: ['RTOS', 'Sensor Integration'], completedTopics: ['Microcontrollers', 'Embedded C'] },
      { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 0, newSpeakers: 4, requestedTopics: ['Version Control', 'Continuous Integration'], approvedTopics: ['CI/CD Pipelines', 'Automation Tools'], completedTopics: ['Git Basics', 'Jenkins Setup'] }
    ]
  },
  'Phase 2': {
    months: ['Dec 2023', 'Jan 2024', 'Feb 2024', 'Mar 2024'],
    domains: [
      { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4, requestedTopics: ['Vue.js Basics', 'MongoDB Fundamentals'], approvedTopics: ['Advanced Vue', 'GraphQL'], completedTopics: ['Intro to Vue', 'REST APIs'] },
      { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 2, postponed: 0, totalSpeakers: 2, newSpeakers: 3, requestedTopics: ['Computer Vision', 'Reinforcement Learning'], approvedTopics: ['NLP', 'AI in Healthcare'], completedTopics: ['TensorFlow Basics', 'Model Training'] },
      { id: 'd3', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 2, newSpeakers: 3, requestedTopics: ['Web Security', 'Forensics'], approvedTopics: ['Blockchain Security', 'Incident Response'], completedTopics: ['Encryption', 'Vulnerability Assessment'] },
      { id: 'd4', name: 'ROBOTIC AND AUTOMATION', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 3, requestedTopics: ['Time Series Analysis', 'Big Data Analytics'], approvedTopics: ['Deep Learning for Data', 'Data Engineering'], completedTopics: ['NumPy Basics', 'Data Cleaning'] },
      { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4, requestedTopics: ['Azure Basics', 'Microservices'], approvedTopics: ['DevOps', 'Cloud Security'], completedTopics: ['AWS Lambda', 'Container Orchestration'] },
      { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4, requestedTopics: ['Raspberry Pi', 'FPGA Programming'], approvedTopics: ['IoT Protocols', 'Real-time Systems'], completedTopics: ['Arduino Advanced', 'Sensor Networks'] },
      { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 4, newSpeakers: 4, requestedTopics: ['Version Control', 'Continuous Integration'], approvedTopics: ['CI/CD Pipelines', 'Automation Tools'], completedTopics: ['Git Basics', 'Jenkins Setup'] }
    ]
  },
  'Phase 3': {
    months: ['Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024'],
    domains: [
      { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned:4, conducted: 4, postponed: 0, totalSpeakers: 8, newSpeakers: 4, requestedTopics: ['Angular Basics', 'Django Fundamentals'], approvedTopics: ['Advanced Angular', 'RESTful APIs'], completedTopics: ['Intro to Angular', 'Backend Development'] },
      { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 5, newSpeakers: 4, requestedTopics: ['Generative AI', 'Robotics'], approvedTopics: ['AI Automation', 'Ethics in AI'], completedTopics: ['PyTorch Basics', 'AI Applications'] },
      { id: 'd3', name: 'CLOUD COMPUTING', planned: 4, conducted: 3, postponed: 1, totalSpeakers: 5, newSpeakers: 3, requestedTopics: ['Cloud Security', 'Malware Analysis'], approvedTopics: ['Zero Trust', 'Digital Forensics'], completedTopics: ['Secure Networks', 'Threat Detection'] },
      { id: 'd4', name: 'ROBOTIC AND AUTOMATION', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 7, newSpeakers: 4, requestedTopics: ['Predictive Analytics', 'Data Mining'], approvedTopics: ['Big Data Tools', 'Advanced Visualization'], completedTopics: ['Scikit-learn', 'Data Warehousing'] },
      { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 4, conducted: 4, postponed: 0, totalSpeakers:8, newSpeakers: 4, requestedTopics: ['GCP Basics', 'Edge Computing'], approvedTopics: ['Multi-cloud', 'Cloud Architecture'], completedTopics: ['Serverless Functions', 'Cloud Migration'] },
      { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 10, newSpeakers: 4, requestedTopics: ['Wearable Tech', 'Automotive Systems'], approvedTopics: ['IoT Security', 'Embedded Linux'], completedTopics: ['Raspberry Pi Projects', 'Embedded Programming'] },
      { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 8, newSpeakers: 4, requestedTopics: ['Version Control', 'Continuous Integration'], approvedTopics: ['CI/CD Pipelines', 'Automation Tools'], completedTopics: ['Git Basics', 'Jenkins Setup'] }
    ]
  },
  'Phase 4': {
    months: ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'],
    domains: [
      { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned: 6, conducted: 6, postponed: 0, totalSpeakers: 12, newSpeakers: 5, requestedTopics: ['Svelte Basics', 'PostgreSQL Fundamentals'], approvedTopics: ['Advanced Svelte', 'GraphQL APIs'], completedTopics: ['Intro to Svelte', 'Database Optimization'] },
      { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 5, conducted: 5, postponed: 0, totalSpeakers: 9, newSpeakers: 5, requestedTopics: ['Quantum Computing', 'AI in Finance'], approvedTopics: ['Quantum AI', 'Financial Modeling'], completedTopics: ['Quantum Basics', 'AI Trading'] },
      { id: 'd3', name: 'CLOUD COMPUTING', planned: 5, conducted: 4, postponed: 1, totalSpeakers: 8, newSpeakers: 4, requestedTopics: ['AI Security', 'Quantum Cryptography'], approvedTopics: ['AI Threat Detection', 'Quantum Security'], completedTopics: ['AI Vulnerabilities', 'Quantum Encryption'] },
      { id: 'd4', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 5, conducted: 4, postponed: 1, totalSpeakers: 11, newSpeakers: 4, requestedTopics: ['Quantum Data Analysis', 'AI-Driven Insights'], approvedTopics: ['Quantum ML', 'AI Data Mining'], completedTopics: ['Quantum Statistics', 'AI Data Processing'] },
      { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 5, conducted: 4, postponed: 1, totalSpeakers: 12, newSpeakers: 4, requestedTopics: ['Quantum Cloud', 'AI Cloud Services'], approvedTopics: ['Quantum Computing Cloud', 'AI Cloud'], completedTopics: ['Quantum Infrastructure', 'AI Cloud Deployment'] },
      { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 5, conducted: 4, postponed: 1, totalSpeakers: 14, newSpeakers: 4, requestedTopics: ['Quantum Embedded', 'AI Embedded Systems'], approvedTopics: ['Quantum IoT', 'AI Sensors'], completedTopics: ['Quantum Chips', 'AI Embedded Programming'] },
      { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 5, conducted: 4, postponed: 1, totalSpeakers: 12, newSpeakers: 4, requestedTopics: ['Version Control', 'Continuous Integration'], approvedTopics: ['CI/CD Pipelines', 'Automation Tools'], completedTopics: ['Git Basics', 'Jenkins Setup'] }
    ]
  },
  'Phase 5': {
    months: ['Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025'],
    domains: [
      { id: 'd1', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 17, newSpeakers: 4, requestedTopics: ['Blockchain Development', 'Web3 Basics'], approvedTopics: ['Smart Contracts', 'Decentralized Apps'], completedTopics: ['Blockchain Fundamentals', 'Web3 Integration'] },
      { id: 'd2', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 14, newSpeakers: 3, requestedTopics: ['AGI Development', 'AI Ethics Advanced'], approvedTopics: ['General AI', 'AI Governance'], completedTopics: ['AGI Concepts', 'Ethical AI Deployment'] },
      { id: 'd3', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 12, newSpeakers: 4, requestedTopics: ['Blockchain Security', 'Web3 Threats'], approvedTopics: ['Crypto Security', 'DeFi Security'], completedTopics: ['Blockchain Vulnerabilities', 'Web3 Encryption'] },
      { id: 'd4', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 15, newSpeakers: 4, requestedTopics: ['Blockchain Data', 'Web3 Analytics'], approvedTopics: ['Crypto Data Analysis', 'DeFi Data'], completedTopics: ['Blockchain Statistics', 'Web3 Data Mining'] },
      { id: 'd5', name: 'ELECTRICAL POWER SYSTEM', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 16, newSpeakers: 3, requestedTopics: ['Blockchain Cloud', 'Web3 Infrastructure'], approvedTopics: ['Decentralized Cloud', 'Web3 Hosting'], completedTopics: ['Blockchain Cloud Services', 'Web3 Deployment'] },
      { id: 'd6', name: 'EMBEDDED SYSTEMS', planned: 4, conducted: 3, postponed:1, totalSpeakers: 18, newSpeakers: 3, requestedTopics: ['Blockchain IoT', 'Web3 Embedded'], approvedTopics: ['Smart Device Security', 'Decentralized IoT'], completedTopics: ['Blockchain Sensors', 'Web3 Embedded Systems'] },
      { id: 'd7', name: 'STRUCTURAL ENGINEERING', planned: 4, conducted: 4, postponed: 0, totalSpeakers: 16, newSpeakers: 4, requestedTopics: ['Version Control', 'Continuous Integration'], approvedTopics: ['CI/CD Pipelines', 'Automation Tools'], completedTopics: ['Git Basics', 'Jenkins Setup'] }
    ]
  },

};

// Generate initial data for new phases after Phase 5
const generateInitialData = (phaseNumber, phaseDetails) => {
  const prevPhaseNumber = phaseNumber - 1;
  let prevPhase = `Phase ${prevPhaseNumber}`;
  let prevData = seedPhases[prevPhase] || phaseDetails[prevPhase];
  if (!prevData) {
    // If prevPhase not in seed or phaseDetails, use the last seed phase
    const seedPhaseNumbers = Object.keys(seedPhases).map(p => parseInt(p.split(' ')[1])).sort((a,b)=>b-a);
    prevPhase = `Phase ${seedPhaseNumbers[0]}`;
    prevData = seedPhases[prevPhase];
  }
  if (!prevData) return null;

  const monthMappings = {
    6: ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'],
    7: ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'],
    8: ['Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027'],
    // Add more phases as needed
  };

  return {
    months: monthMappings[phaseNumber] || [],
    domains: prevData.domains.map(d => ({
      ...d,
      planned: 0,
      conducted: 0,
      postponed: 0,
      totalSpeakers: 0, // Start from 0 for new phases
      newSpeakers: 0,
      requestedTopics: [],
      approvedTopics: [],
      completedTopics: []
    }))
  };
};

// -----------------------
// Utility helpers
// -----------------------
const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6366f1'];

function paginate(array, page = 1, pageSize = 5) {
  const start = (page - 1) * pageSize;
  return array.slice(start, start + pageSize);
}

// Get phase date range
function getPhaseDateRange(phase) {
  const ranges = {
    'Phase 1': { start: new Date('2023-06-01'), end: new Date('2023-09-30') },
    'Phase 2': { start: new Date('2023-12-01'), end: new Date('2024-03-31') },
    'Phase 3': { start: new Date('2024-07-01'), end: new Date('2024-10-31') },
    'Phase 4': { start: new Date('2025-01-01'), end: new Date('2025-04-30') },
    'Phase 5': { start: new Date('2025-07-01'), end: new Date('2025-10-31') },
    'Phase 6': { start: new Date('2025-12-01'), end: new Date('2026-03-31') },
    'Phase 7': { start: new Date('2026-07-01'), end: new Date('2026-10-31') },
    'Phase 8': { start: new Date('2027-01-01'), end: new Date('2027-04-30') },
  };
  return ranges[phase] || { start: new Date('2023-01-01'), end: new Date('2023-12-31') };
}

// Check if phase is future (not started yet)
function isPhaseFuture(phase) {
  const range = getPhaseDateRange(phase);
  const now = new Date();
  return now < range.start;
}

// -----------------------
// Main Dashboard
// -----------------------
export default function WebinarDashboard() {
  return (
    <PhaseProvider>
      <DashboardShell />
    </PhaseProvider>
  );
}

function DashboardShell() {
  const navigate = useNavigate();
  const { phases, selectedPhase, setSelectedPhase } = usePhase();
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [view, setView] = useState('overview'); // overview, webinars, table, analytics
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [collegeTheme, setCollegeTheme] = useState('default'); // default or college
  const [dynamicPhaseData, setDynamicPhaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [phaseDetails, setPhaseDetails] = useState({});
  const [searchParams] = useSearchParams();
  // ADDED: Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);

  // When phase changes reset page
  useEffect(() => setPage(1), [selectedPhase, view]);

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

  // Redirect to login if no userEmail (check both URL params and localStorage)
  useEffect(() => {
    const encodedEmail = searchParams.get('email');
    const storedEmail = localStorage.getItem('userEmail');
    
    if (!encodedEmail && !storedEmail) {
      navigate('/');
    }
  }, [searchParams, navigate]);

  // UPDATED: Extract and decrypt user email from URL params or localStorage
  useEffect(() => {
    let email = null;
    const encodedEmail = searchParams.get('email');
    
    if (encodedEmail) {
      try {
        // Try the proper decryption method first
        email = decryptEmail(decodeURIComponent(encodedEmail));
        console.log('Email decrypted from URL:', email);
        setUserEmail(email);
        localStorage.setItem('userEmail', email);
      } catch (error) {
        console.error('Error decrypting email from URL:', error);
        // Fallback to simple atob
        try {
          email = atob(encodedEmail);
          setUserEmail(email);
          localStorage.setItem('userEmail', email);
        } catch (fallbackError) {
          console.error('Fallback decryption also failed:', fallbackError);
        }
      }
    } else {
      // Check localStorage if no email in URL
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        email = storedEmail;
        setUserEmail(storedEmail);
      }
    }
    
    if (email) {
      // Fetch user details
      fetch(`${API_BASE_URL}/api/member-by-email?email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(memberData => {
          if (memberData.found) {
            setUserName(memberData.name);
          }
        })
        .catch(error => {
          console.error('Error fetching user details:', error);
        });
      // Check if user is admin (specific email only)
      fetch(`${API_BASE_URL}/api/coordinators`)
        .then(response => response.json())
        .then(coordinators => {
          setCoordinators(coordinators);
          const isAdmin = email.toLowerCase().trim() === 'anithait@nec.edu.in';
          setIsAdmin(isAdmin);
          localStorage.setItem('isAdmin', isAdmin.toString());
        })
        .catch(error => {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          localStorage.setItem('isAdmin', 'false');
        });

      // Fetch speakers
      fetch(`${API_BASE_URL}/api/speakers`)
        .then(response => response.json())
        .then(speakers => {
          setSpeakers(speakers);
        })
        .catch(error => {
          console.error('Error fetching speakers:', error);
        });
    }
  }, [searchParams]);

  // Fetch current phase
  useEffect(() => {
    const fetchCurrentPhase = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/current-phase`);
        const data = await response.json();
        setCurrentPhase(data.found ? data.displayText : data.message);
        setPhaseLoading(false);
      } catch (error) {
        console.error('Error fetching current phase:', error);
        setPhaseLoading(false);
      }
    };
    fetchCurrentPhase();
  }, []);

  // Fetch phase details
  useEffect(() => {
    const fetchPhaseDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/phases`);
        const data = await response.json();
        const details = {};
        if (Array.isArray(data)) {
          data.forEach(phase => {
            details[`Phase ${phase.phaseId}`] = phase.domains;
          });
        } else {
          console.error('Expected array from /api/phases in fetchPhaseDetails, got:', data);
        }
        setPhaseDetails(details);
      } catch (error) {
        console.error('Error fetching phase details:', error);
      }
    };
    fetchPhaseDetails();
  }, []);

  // Fetch dynamic phase data from API
  useEffect(() => {
    // Don't fetch if selectedPhase is empty or if it exists in seedPhases
    if (!selectedPhase) {
      setDynamicPhaseData(null);
      setLoading(false);
      return;
    }
    
    if (seedPhases[selectedPhase]) {
      setDynamicPhaseData(null);
      return;
    }
    
    // Only fetch if we have a valid selectedPhase
    setLoading(true);
    // Fetch dashboard stats directly from API
    fetch(`${API_BASE_URL}/api/dashboard-stats?phase=${selectedPhase}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.domains) {
          setDynamicPhaseData(data);
        } else {
          console.error('Invalid data structure from dashboard-stats API', data);
          setDynamicPhaseData(null);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error(`Error fetching ${selectedPhase} data:`, error);
        setDynamicPhaseData(null);
        setLoading(false);
      });
  }, [selectedPhase]);

  // ADDED: Encryption function for email
  const encryptEmail = (email) => {
    try {
      return btoa(encodeURIComponent(email));
    } catch (error) {
      console.error('Error encrypting email:', error);
      return email;
    }
  };

  // ADDED: Handle Mentorship navigation with email
  const handleMentorshipClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      const encryptedEmail = encryptEmail(userEmail);
      navigate(`/dashboard?email=${encodeURIComponent(encryptedEmail)}`);
    } else {
      navigate('/dashboard');
    }
  };

  // ADDED: Handle Placement navigation with email
  const handlePlacementClick = () => {
    setShowDropdown(false);
    if (userEmail) {
      const encryptedEmail = encryptEmail(userEmail);
      window.open(`http://localhost:5173/alumnimain/placement-dashboard?email=${encodeURIComponent(encryptedEmail)}`, '_blank');
    } else {
      window.open('http://localhost:5173/alumnimain/placement-dashboard', '_blank');
    }
  };

  const downloadOverallReport = async () => {
    const columnWidths = [20, 8, 8, 8, 10, 10]; // Domain, Planned, Conducted, Postponed, Total Speakers, New Speakers

    // Fetch webinar data
    let webinars = [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/webinars`);
      webinars = await response.json();
    } catch (error) {
      console.error('Error fetching webinars:', error);
      webinars = [];
    }

    // Filter webinars by phase date range
    const phaseRange = getPhaseDateRange(selectedPhase);
    const phaseWebinars = webinars.filter(webinar => {
      const webinarDate = new Date(webinar.webinarDate);
      return webinarDate >= phaseRange.start && webinarDate <= phaseRange.end;
    });

    // Filter to only conducted webinars (those with attendedCount > 0)
    const conductedWebinars = phaseWebinars.filter(webinar => webinar.attendedCount && webinar.attendedCount > 0);

    // Fetch prize winner details for webinars with prizeWinnerEmail
    const webinarsWithPrizeWinners = await Promise.all(
      conductedWebinars.map(async (webinar) => {
        if (webinar.prizeWinnerEmail) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/member-by-email?email=${encodeURIComponent(webinar.prizeWinnerEmail)}`);
            const memberData = await response.json();
            if (memberData.found) {
              return {
                ...webinar,
                prizeWinnerName: memberData.name,
                prizeWinnerBatch: memberData.batch
              };
            }
          } catch (error) {
            console.error('Error fetching prize winner details:', error);
          }
        }
        return webinar;
      })
    );

    // Group webinars by domain
    const domainMappings = {
      'fullstack_development': 'Full Stack Development (IT department)',
      'artificial_intelligence': 'Artificial Intelligence & Data Science (AI & DS department)',
      'cyber_security': 'Cloud Computing (CSE department)',
      'data_science': 'Artificial Intelligence & Data Science (AI & DS department)',
      'cloud_computing': 'Cloud Computing (CSE department)',
      'embedded_systems': 'Embedded Systems (ECE department)',
      'devops': 'Structural Engineering (CIVIL department)'
    };

    const webinarsByDomain = {};
    webinarsWithPrizeWinners.forEach(webinar => {
      const domainName = domainMappings[webinar.domain] || webinar.domain;
      if (!webinarsByDomain[domainName]) {
        webinarsByDomain[domainName] = [];
      }
      webinarsByDomain[domainName].push(webinar);
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906,
                height: 16838,
              },
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: [
            /* ---------------- HEADER ---------------- */
            new Paragraph({
              children: [new TextRun({ text: "NATIONAL ENGINEERING COLLEGE", bold: true, size: 34, font: 'Times New Roman' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "(An Autonomous Institution, Affiliated to Anna University–Chennai)", size: 24, font: 'Times New Roman' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "K.R. NAGAR, KOVILPATTI – 628 503", size: 24, font: 'Times New Roman' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "NEC ALUMNI ASSOCIATION", bold: true, size: 30, font: 'Times New Roman' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 },
            }),
            /* ---------------- REPORT TITLE ---------------- */
            new Paragraph({
              children: [new TextRun({ text: `Overall Webinar Report - ${selectedPhase}`, bold: true, size: 28, font: 'Times New Roman' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            /* ---------------- DATE ---------------- */
            new Paragraph({
              children: [new TextRun({ text: `Generated on: ${new Date().toLocaleDateString()}`, size: 24, font: 'Times New Roman' })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 300 },
            }),
            /* ---------------- SUMMARY ---------------- */
            new Paragraph({
              children: [new TextRun({ text: "Summary Statistics", bold: true, size: 26, font: 'Times New Roman' })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Planned Webinars: ${totals.planned}`, size: 24, font: 'Times New Roman' }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Conducted Webinars: ${totals.conducted}`, size: 24, font: 'Times New Roman' }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Postponed Webinars: ${totals.postponed}`, size: 24, font: 'Times New Roman' }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Speakers: ${Number(totals.totalSpeakers) + Number(totals.newSpeakers)}`, size: 24, font: 'Times New Roman' }),
              ],
              spacing: { after: 400 },
            }),
            /* ---------------- MAIN TABLE ---------------- */
            new Paragraph({
              children: [new TextRun({ text: "Domain-wise Details", bold: true, size: 26, font: 'Times New Roman' })],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: "pct" },
              alignment: AlignmentType.CENTER,
              borders: {
                top: { style: "single", size: 1 },
                bottom: { style: "single", size: 1 },
                left: { style: "single", size: 1 },
                right: { style: "single", size: 1 },
                insideVertical: { style: "single", size: 1 },
                insideHorizontal: { style: "single", size: 1 },
              },
              rows: [
                /* HEADERS */
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({ width: { size: columnWidths[0], type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Domain", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: columnWidths[1], type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Planned", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: columnWidths[2], type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Conducted", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: columnWidths[3], type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Postponed", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: columnWidths[4], type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Total Speakers", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ width: { size: columnWidths[5], type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "New Speakers", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                  ],
                }),
                /* DATA ROWS */
                ...phaseData.domains.map((domain) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: columnWidths[0], type: "pct" },
                        children: [new Paragraph({ text: domain.name, alignment: AlignmentType.LEFT })]
                      }),
                      new TableCell({
                        width: { size: columnWidths[1], type: "pct" },
                        children: [new Paragraph({ text: domain.planned.toString(), alignment: AlignmentType.CENTER })]
                      }),
                      new TableCell({
                        width: { size: columnWidths[2], type: "pct" },
                        children: [new Paragraph({ text: domain.conducted.toString(), alignment: AlignmentType.CENTER })]
                      }),
                      new TableCell({
                        width: { size: columnWidths[3], type: "pct" },
                        children: [new Paragraph({ text: domain.postponed.toString(), alignment: AlignmentType.CENTER })]
                      }),
                      new TableCell({
                        width: { size: columnWidths[4], type: "pct" },
                        children: [new Paragraph({ text: (Number(domain.totalSpeakers) + Number(domain.newSpeakers)).toString(), alignment: AlignmentType.CENTER })]
                      }),
                      new TableCell({
                        width: { size: columnWidths[5], type: "pct" },
                        children: [new Paragraph({ text: domain.newSpeakers.toString(), alignment: AlignmentType.CENTER })]
                      }),
                    ],
                  })
                ),
              ],
            }),
            /* ---------------- DETAILED DOMAIN REPORTS ---------------- */
            ...Object.keys(webinarsByDomain).map((domainName) => {
              const domainWebinars = webinarsByDomain[domainName];
              return [
                new Paragraph({
                  children: [new TextRun({ text: `Detailed Report for ${domainName}`, bold: true, size: 26, font: 'Times New Roman' })],
                  spacing: { after: 200, before: 400 },
                }),
                new Table({
                  width: { size: 100, type: "pct" },
                  alignment: AlignmentType.CENTER,
                  borders: {
                    top: { style: "single", size: 1 },
                    bottom: { style: "single", size: 1 },
                    left: { style: "single", size: 1 },
                    right: { style: "single", size: 1 },
                    insideVertical: { style: "single", size: 1 },
                    insideHorizontal: { style: "single", size: 1 },
                  },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: [
                        new TableCell({ width: { size: 12, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Alumni Name", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 8, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Batch", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 12, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Designation", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 16, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Webinar Topic", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 8, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 8, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Time", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 10, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Registered Count", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 10, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Attended Count", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                        new TableCell({ width: { size: 30, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Prize Winner Details", bold: true, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
                      ],
                    }),
                    ...domainWebinars.map((webinar) =>
                      new TableRow({
                        children: [
                          new TableCell({ width: { size: 12, type: "pct" }, children: [new Paragraph({ text: webinar.speaker?.name || "TBD", alignment: AlignmentType.LEFT })] }),
                          new TableCell({ width: { size: 8, type: "pct" }, children: [new Paragraph({ text: webinar.speaker?.batch || "", alignment: AlignmentType.CENTER })] }),
                          new TableCell({ width: { size: 12, type: "pct" }, children: [new Paragraph({ text: webinar.speaker?.designation || "", alignment: AlignmentType.LEFT })] }),
                          new TableCell({ width: { size: 16, type: "pct" }, children: [new Paragraph({ text: webinar.topic || "", alignment: AlignmentType.LEFT })] }),
                          new TableCell({ width: { size: 8, type: "pct" }, children: [new Paragraph({ text: webinar.webinarDate ? new Date(webinar.webinarDate).toLocaleDateString() : "", alignment: AlignmentType.CENTER })] }),
                          new TableCell({ width: { size: 8, type: "pct" }, children: [new Paragraph({ text: webinar.time || "N/A", alignment: AlignmentType.CENTER })] }),
                          new TableCell({ width: { size: 10, type: "pct" }, children: [new Paragraph({ text: webinar.registeredCount?.toString() || "0", alignment: AlignmentType.CENTER })] }),
                          new TableCell({ width: { size: 10, type: "pct" }, children: [new Paragraph({ text: webinar.attendedCount?.toString() || "0", alignment: AlignmentType.CENTER })] }),
                          new TableCell({ width: { size: 30, type: "pct" }, children: [new Paragraph({ text: webinar.prizeWinnerName ? webinar.prizeWinnerName + '\n(Batch - ' + (webinar.prizeWinnerBatch || "") + ')' : "", alignment: AlignmentType.LEFT })] }),
                        ],
                      })
                    ),
                  ],
                }),
              ];
            }).flat(),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Overall_Report_${selectedPhase.replace(' ', '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const getPhaseData = (phase) => {
    if (!phase) {
      return { domains: [] };
    }
    if (isPhaseFuture(phase)) {
      const phaseNumber = parseInt(phase.split(' ')[1]);
      if (phaseDetails[phase]) {
        const monthMappings = {
          6: ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'],
          7: ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'],
          8: ['Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027'],
          // Add more phases as needed
        };
        return {
          months: monthMappings[phaseNumber] || [],
          domains: phaseDetails[phase].map((d, idx) => ({
            id: `d${idx + 1}`,
            name: d.domain,
            planned: 0,
            conducted: 0,
            postponed: 0,
            totalSpeakers: 0,
            newSpeakers: 0,
            requestedTopics: [],
            approvedTopics: [],
            completedTopics: []
          }))
        };
      } else {
        return generateInitialData(phaseNumber, phaseDetails) || { domains: [] };
      }
    } else if (dynamicPhaseData && !seedPhases[phase]) {
      return dynamicPhaseData;
    } else if (seedPhases[phase]) {
      return seedPhases[phase];
    } else {
      const phaseNumber = parseInt(phase.split(' ')[1]);
      const data = generateInitialData(phaseNumber, phaseDetails);
      return data || { domains: [] };
    }
  };

  const phaseData = getPhaseData(selectedPhase);

  // Derived totals
  const totals = useMemo(() => {
    const planned = phaseData.domains.reduce((s, d) => s + d.planned, 0);
    const conducted = phaseData.domains.reduce((s, d) => s + d.conducted, 0);
    const postponed = phaseData.domains.reduce((s, d) => s + d.postponed, 0);
    const totalSpeakers = phaseData.domains.reduce((s, d) => s + d.totalSpeakers, 0);
    const newSpeakers = phaseData.domains.reduce((s, d) => s + d.newSpeakers, 0);
    return { planned, conducted, postponed, totalSpeakers, newSpeakers };
  }, [phaseData]);

  // Table data (search + sort)
  const tableData = useMemo(() => {
    let arr = phaseData.domains.map(d => ({ ...d }));
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(d => d.name.toLowerCase().includes(s));
    }
    arr.sort((a, b) => {
      const k = sortBy.key;
      const dir = sortBy.dir === 'asc' ? 1 : -1;
      if (a[k] < b[k]) return -1 * dir;
      if (a[k] > b[k]) return 1 * dir;
      return 0;
    });
    return arr;
  }, [phaseData, search, sortBy]);

  const paged = paginate(tableData, page, pageSize);
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));

  return (
    <div className={`wb-root ${collegeTheme === 'college' ? 'theme-college' : ''}`}>
      <main className="wb-main">
        <div className="form-header">
            <div className="icon-wrapper">
              <GraduationCap className="header-icon" />
            </div>
            <h1 className="form-title text-3xl font-extrabold">
              WELCOME BACK!! {userName || 'User'} 👋
            </h1>
          </div>
        <header className="wb-header">
          <div className="header-left">
            {isAdmin && (
              <button
                className="btn-primary"
                onClick={() => navigate("/admin")}
              >
                Admin Access
              </button>
            )}
          </div>

          <div className="header-right">
            {/* ADDED: Three-dot menu */}
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
                    onClick={handleMentorshipClick}
                  >
                    <Users size={18} />
                    <span>Mentorship</span>
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={handlePlacementClick}
                  >
                    <Briefcase size={18} />
                    <span>Placement</span>
                  </button>
                </div>
              )}
            </div>
            
            {isAdmin && (
              <button
                className="btn-primary"
                onClick={downloadOverallReport}
              >
                Overall Report
              </button>
            )}
            {(!isAdmin || userEmail === 'anithait@nec.edu.in') && (
              <select
                className="phase-select"
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
              >
                {phases.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>
        <section className="wb-content">
          {view === 'overview' && (
            <div>
              <div>
                <br></br>
                {(!isAdmin || userEmail === 'anithait@nec.edu.in') && 
                (
                  <div className="webinar-subtitle">
                    {phaseLoading ? 'Loading current phase...' : `Current Phase: ${currentPhase}`}
                  </div>
                )
                }
                <div className="webinars-header">
                  <h3>Domain Webinars Overview</h3>
                  <p className="muted">Manage and track webinars across different domains</p>
                </div>
                <div className="header-center2">
                  <div className="stats-mini">
                    <div>
                      <div className="muted">Planned</div>
                      <div className="large">{totals.planned}</div>
                      </div>
                      <div>
                        <div className="muted">Conducted</div>
                        <div className="large">{totals.conducted}</div>
                      </div>
                    <div>
                      <div className="muted">Speakers</div>
                        <div className="large">
                          {Number(totals.totalSpeakers) + Number(totals.newSpeakers)}
                        </div>
                    </div>
                  </div>
                </div>
                <div className="list-cards">
                  {phaseData.domains.map((d, idx) => {
                    const progressPercentage = d.planned > 0 ? (d.conducted / d.planned) * 100 : 0;
                    return (
                      <div key={d.id} className="webinar-card">
                        <div className="webinar-card-header">
                          <div className="webinar-icon">🎓</div>
                          <h4>{d.name}</h4>
                          <div className="webinar-status">
                            <span className={`status-dot ${progressPercentage === 100 ? 'completed' : progressPercentage > 50 ? 'in-progress' : 'pending'}`}></span>
                          </div>
                        </div>
                        <div className="webinar-stats">
                          <div className="stat-item">
                            <span className="stat-label">Planned</span>
                            <span className="stat-value planned">{d.planned}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Conducted</span>
                            <span className="stat-value conducted">{d.conducted}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Postponed</span>
                            <span className="stat-value postponed">{d.postponed}</span>
                          </div>
                        </div>
                        <div className="webinar-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
                          </div>
                          <span className="progress-text">{Math.round(progressPercentage)}% Complete</span>
                        </div>
                        <div className="webinar-speakers">
                          <div className="speaker-info">
                            <span className="speaker-icon">👥</span>
                              <span>
                                Total Speakers:{Number(d.totalSpeakers) + Number(d.newSpeakers)}
                              </span>
                          </div>
                        </div>
                        <div className="webinar-actions">
                          <button onClick={() => setSelectedDomain(d)} className="btn-primary small">View Details</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Popup for domain details */}
        {selectedDomain && (
          <div className="modal-overlay" onClick={() => setSelectedDomain(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedDomain.name}</h3>
                <div className="muted">Phase: {selectedPhase}</div>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4b3f91', fontSize: '1.2rem' }}>Progress Overview</h4>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${selectedDomain.planned > 0 ? (selectedDomain.conducted / selectedDomain.planned) * 100 : 0}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.9rem', color: '#6b7280' }}>
                    <span>Conducted: {selectedDomain.conducted}</span>
                    <span>Planned: {selectedDomain.planned}</span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat">
                    <div className="label">Planned Webinars</div>
                    <div className="value" style={{ color: '#3b82f6' }}>{selectedDomain.planned}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Conducted Webinars</div>
                    <div className="value" style={{ color: '#10b981' }}>{selectedDomain.conducted}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Postponed Webinars</div>
                    <div className="value" style={{ color: '#f59e0b' }}>{selectedDomain.postponed}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Total Speakers</div>
                    <div className="value">{selectedDomain.totalSpeakers}</div>
                  </div>
                  <div className="stat">
                    <div className="label">New Speakers</div>
                    <div className="value">{selectedDomain.newSpeakers}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Completion Rate</div>
                    <div className="value">{selectedDomain.planned > 0 ? Math.round((selectedDomain.conducted / selectedDomain.planned) * 100) : 0}%</div>
                  </div>
                </div>

                {selectedPhase === 'Phase 6' && (
                <div className="stats-grid">
                  <div className="stat">
                    <div className="label">Requested Topics</div>
                    <div className="value">{typeof selectedDomain.requestedTopics === 'number' ? selectedDomain.requestedTopics : selectedDomain.requestedTopics?.length || 0}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Approved Topics</div>
                    <div className="value">{typeof selectedDomain.approvedTopics === 'number' ? selectedDomain.approvedTopics : selectedDomain.approvedTopics?.length || 0}</div>
                  </div>
                </div>
                )}

                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setSelectedDomain(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
<div className="quick-actions-section">
  <h3 className="qa-title">Quick Actions</h3>

  <div className="qa-grid">
  {speakers.length === 0 || !speakers.some(speaker => speaker.email.toLowerCase() === userEmail.toLowerCase()) && (
    <div className="qa-card" onClick={() => {
      if (!userEmail) {
        alert("Please log in first");
        return;
      }
      navigate(`/student-request/${btoa(userEmail)}`);
    }} style={{ cursor: "pointer" }}>
        <div className="qa-icon">📄</div>
        <h4 className="qa-heading">Student Request Form</h4>
        <span className="qa-tag">Request</span>
        <p className="qa-desc">
          Submit student requests for webinars, topics, domains and speaker preferences.
        </p>
      </div>
  )}
    <div className="qa-card" onClick={() => {
      if (!userEmail) {
        alert("Please log in first");
        return;
      }
      navigate(`/webinar-events/${btoa(userEmail)}`);
    }} style={{ cursor: "pointer" }}>
        <div className="qa-icon">👩🏼‍🎓</div>
        <h4 className="qa-heading">Webinar Events</h4>
        <span className="qa-tag">view</span>
        <p className="qa-desc">
          Join our webinar event to learn, engage, and gain valuable insights from experts.
        </p>
    </div>
  {(coordinators.some(coord => coord.email === userEmail) || isAdmin) && (
    <div className="qa-card" onClick={() => {
      if (!userEmail) {
        alert("Please log in first");
        return;
      }
      navigate(`/speaker-assignment/${btoa(userEmail)}`);
    }} style={{ cursor: "pointer" }}>
      <div className="qa-icon">🧑‍🏫</div>
      <h4 className="qa-heading">Speaker Assignment Form</h4>
      <span className="qa-tag">Assignment</span>
      <p className="qa-desc">
        Assign speakers to webinars and manage availability, schedules and confirmations.
      </p>
    </div>
  )}
  {(coordinators.some(coord => coord.email === userEmail) || isAdmin) && (
    <div className="qa-card" onClick={() => {
      if (!userEmail) {
        alert("Please log in first");
        return;
      }
      navigate(`/requested-topic-approval/${btoa(userEmail)}`);
    }} style={{ cursor: "pointer" }}>
        <div className="qa-icon">✅</div>
        <h4 className="qa-heading">Requested Topic Approval</h4>
        <span className="qa-tag">Approval</span>
        <p className="qa-desc">
          Review and approve requested webinar topics from students and faculty.
        </p>
    </div>
  )}
  {speakers.length > 0 && speakers.some(speaker => speaker.email.toLowerCase() === userEmail.toLowerCase()) && (
    <div className="qa-card" onClick={() => {
      if (!userEmail) {
        alert("Please log in first");
        return;
      }
      navigate(`/alumni-feedback/${btoa(userEmail)}`);
    }} style={{ cursor: "pointer" }}>
        <div className="qa-icon">🏫</div>
        <h4 className="qa-heading">Alumni Feedback Form</h4>
        <span className="qa-tag">Feedback</span>
        <p className="qa-desc">
          Collect and manage alumni feedback regarding sessions and overall engagement.
        </p>
      </div>
  )}
  </div>
</div>

        <footer className="wb-footer">
  <div className="footer-inner">

    <p className="footer-sub">
      Structured Analytics • Performance Tracking • Institutional Insights
    </p>

    <div className="footer-social">
      <a href="#" aria-label="Twitter">
        <i className="fab fa-twitter"></i> Twitter
      </a>
      <a href="#" aria-label="LinkedIn">
        <i className="fab fa-linkedin"></i> LinkedIn
      </a>
      <a href="#" aria-label="GitHub">
        <i className="fab fa-github"></i> GitHub
      </a>
    </div>

    <div className="footer-bottom">
      © 2024 All Rights Reserved • SDMCET Webinar Analytics
    </div>

  </div>
</footer>
          <p className="form-footer">Designed with 💜 for Alumni Network</p>

      </main>

    </div>
  );
}

// End of JSX file