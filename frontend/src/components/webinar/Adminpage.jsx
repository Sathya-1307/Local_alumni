import React, { useState, useEffect } from 'react';
import './Common.css';
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validation helper functions
const validateDomain = (value) => {
  const trimmed = value.trim();

  if (!trimmed) return "Domain cannot be empty.";
  if (trimmed.length < 3) return "Domain must be at least 3 characters.";
  if (trimmed.length > 50) return "Domain cannot exceed 50 characters.";
  if (!/^[A-Za-z0-9]+$/.test(trimmed))
    return "Domain must contain only English letters and numbers. Spaces, punctuation, emojis, and other languages are not allowed.";

  return "";
};

const Adminpage = () => {
  const [activeView, setActiveView] = useState(null);
  const [showRemoveDomain, setShowRemoveDomain] = useState(false);
  const [domains, setDomains] = useState([{ department: '', domain: '' }]);
  const [activeCoordinatorView, setActiveCoordinatorView] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [showAddDepartmentForm, setShowAddDepartmentForm] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCoordinatorData, setStudentCoordinatorData] = useState({ name: '', department: '', phoneNumber: '' });
  const [studentCoordinatorLoading, setStudentCoordinatorLoading] = useState(false);
  const [studentEmailError, setStudentEmailError] = useState('');
  const [deptCoordinator, setDeptCoordinator] = useState({ name: '', email: '', department: '', phoneNumber: '' });
  const [deptCoordinatorLoading, setDeptCoordinatorLoading] = useState(false);
  const [deptCoordinatorErrors, setDeptCoordinatorErrors] = useState({ name: '', email: '', department: '', phoneNumber: '' });
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [phaseId, setPhaseId] = useState('');
  const [startingDate, setStartingDate] = useState('');
  const [endingDate, setEndingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [webinars, setWebinars] = useState([]);
  const [webinarsLoading, setWebinarsLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [speakerSearchTerm, setSpeakerSearchTerm] = useState('');
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ phaseIds: [], domains: [], batches: [], departments: [] });
  const [selectedFilters, setSelectedFilters] = useState({ phaseId: '', domain: '', speakerName: '', batch: '', department: '' });
  const [lastPhaseDomains, setLastPhaseDomains] = useState([]);

  // Fetch current phase on component mount
  useEffect(() => {
    const fetchCurrentPhase = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/current-phase`);
        const data = await response.json();
        setCurrentPhase(data);
      } catch (error) {
        console.error('Error fetching current phase:', error);
      } finally {
        setPhaseLoading(false);
      }
    };

    fetchCurrentPhase();
  }, []);

  // Fetch last phase domains when phase view is active
  useEffect(() => {
    if (activeView === 'phase') {
      const fetchLastPhaseDomains = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/phases`);
          const data = await response.json();
          if (data.success && data.phases && data.phases.length > 0) {
            // Sort phases by createdAt descending to get the most recently created phase
            const sortedPhases = data.phases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const lastPhase = sortedPhases[0];
            setLastPhaseDomains(lastPhase.domains || []);
          }
        } catch (error) {
          console.error('Error fetching last phase domains:', error);
        }
      };

      fetchLastPhaseDomains();
    }
  }, [activeView]);

  // Fetch webinars, filter options, and speakers when webinar view is active
  useEffect(() => {
    if (activeView === 'webinar') {
      const fetchWebinars = async () => {
        setWebinarsLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/webinars`);
          const webinarsData = await response.json();

          // Fetch phone numbers for each speaker
          const webinarsWithPhones = await Promise.all(
            webinarsData.map(async (webinar) => {
              if (webinar.speaker?.email) {
                try {
                  const memberResponse = await fetch(`${API_BASE_URL}/api/coordinators/member-by-email?email=${webinar.speaker.email}`);
                  const memberData = await memberResponse.json();
                  return {
                    ...webinar,
                    speaker: {
                      ...webinar.speaker,
                      phoneNumber: memberData.contact_no || 'N/A'
                    }
                  };
                } catch (error) {
                  console.error('Error fetching phone for speaker:', webinar.speaker.email, error);
                  return {
                    ...webinar,
                    speaker: {
                      ...webinar.speaker,
                      phoneNumber: 'N/A'
                    }
                  };
                }
              }
              return {
                ...webinar,
                speaker: {
                  ...webinar.speaker,
                  phoneNumber: 'N/A'
                }
              };
            })
          );

          setWebinars(webinarsWithPhones);
        } catch (error) {
          console.error('Error fetching webinars:', error);
        } finally {
          setWebinarsLoading(false);
        }
      };

      const fetchFilterOptions = async () => {
        try {
          console.log('Fetching filter options...');
          const response = await fetch(`${API_BASE_URL}/api/filter-options`);
          console.log('Filter options response status:', response.status);
          const data = await response.json();
          console.log('Filter options data:', data);
          setFilterOptions(data);
        } catch (error) {
          console.error('Error fetching filter options:', error);
        }
      };

      const fetchSpeakers = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/speakers`);
          const speakersData = await response.json();
          setSpeakers(speakersData);
        } catch (error) {
          console.error('Error fetching speakers:', error);
        }
      };

      fetchWebinars();
      fetchFilterOptions();
      fetchSpeakers();
    }
  }, [activeView]);

  // Fetch speakers when speakers view is active
  useEffect(() => {
    if (activeView === 'speakers') {
      const fetchSpeakers = async () => {
        setSpeakersLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/speakers`);
          const speakersData = await response.json();
          setSpeakers(speakersData);
        } catch (error) {
          console.error('Error fetching speakers:', error);
        } finally {
          setSpeakersLoading(false);
        }
      };

      fetchSpeakers();
    }
  }, [activeView]);

  // Fetch coordinators when coordinators view is active
  useEffect(() => {
    if (activeView === 'coordiators') {
      fetchCoordinators();
    }
  }, [activeView]);

  const handleCreatePhase = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    const newErrors = {};

    if (!phaseId.trim()) {
      newErrors.phaseId = 'Phase ID is required.';
    } else if (!/^\d+$/.test(phaseId)) {
      newErrors.phaseId = "Phase ID must contain only numbers.";
    } else if (phaseId.length > 4) {
      newErrors.phaseId = "Phase ID cannot exceed 4 digits.";
    } else {
      // Check if Phase ID already exists
      try {
        const response = await fetch(`${API_BASE_URL}/api/phases`);
        const data = await response.json();
        if (response.ok && data.success) {
          const existingPhase = data.phases.find(phase => phase.phaseId === parseInt(phaseId));
          if (existingPhase) {
            newErrors.phaseId = "Phase ID already exists. Please choose a different ID.";
          }
        }
      } catch (error) {
        console.error('Error checking phase uniqueness:', error);
        // Don't block submission if uniqueness check fails, let backend handle it
      }
    }

    if (!startingDate) {
      newErrors.startingDate = 'Starting date is required.';
    }

    if (!endingDate) {
      newErrors.endingDate = 'Ending date is required.';
    }

    // Validate dates if both are provided
    if (startingDate && endingDate) {
      const start = new Date(startingDate);
      const end = new Date(endingDate);
      if (isNaN(start)) {
        newErrors.startingDate = "Please enter a valid starting date.";
      }
      if (isNaN(end)) {
        newErrors.endingDate = "Please enter a valid ending date.";
      }
      if (!isNaN(start) && !isNaN(end) && end < start) {
        newErrors.endingDate = "Ending date cannot be earlier than starting date.";
      }
    }

    // Validate domains
    const validDomains = domains.filter(d => d.department && d.domain);
    if (validDomains.length === 0) {
      newErrors.domains = 'Please add at least one domain with department and domain name.';
    } else {
      // Validate each domain
      for (let i = 0; i < domains.length; i++) {
        const d = domains[i];
        if (d.department && d.domain) {
          const error = validateDomain(d.domain);
          if (error) {
            newErrors[`domain_${i}`] = `Domain Error (${d.department}): ${error}`;
          }
        }
      }
    }

    // Set errors if any
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const phaseData = {
        phaseId: parseInt(phaseId),
        startingDate,
        endingDate,
        domains: validDomains
      };

      const response = await fetch(`${API_BASE_URL}/api/webinar-phases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(phaseData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Phase created successfully!');
        // Reset form
        setPhaseId('');
        setStartingDate('');
        setEndingDate('');
        setDomains([{ department: '', domain: '' }]);
        setErrors({});
      } else {
        setMessage(result.message || 'Failed to create phase.');
      }
    } catch (error) {
      console.error('Error creating phase:', error);
      setMessage('An error occurred while creating the phase.');
    } finally {
      setLoading(false);
    }
  };

  // Handle student email change with validation and auto-fetch
  const handleStudentEmailChange = async (email) => {
    setStudentEmail(email);
    setStudentEmailError('');

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setStudentEmailError('Please enter a valid email address.');
      setStudentCoordinatorData({ name: '', department: '', phoneNumber: '' });
      return;
    }

    if (!email.trim()) {
      setStudentCoordinatorData({ name: '', department: '', phoneNumber: '' });
      return;
    }

    setStudentCoordinatorLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/coordinators/member-by-email?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (data.found) {
        setStudentCoordinatorData({
          name: data.name || '',
          department: data.department || '',
          phoneNumber: data.contact_no || ''
        });
        setStudentEmailError('');
      } else {
        setStudentCoordinatorData({ name: '', department: '', phoneNumber: '' });
        setStudentEmailError('Email not found in member database. Please enter a valid registered email.');
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      setStudentCoordinatorData({ name: '', department: '', phoneNumber: '' });
      setStudentEmailError('Error fetching student details. Please try again.');
    } finally {
      setStudentCoordinatorLoading(false);
    }
  };

  // Handle adding student coordinator
  const handleAddStudentCoordinator = async () => {
    // Clear previous errors
    setStudentEmailError('');

    // Validate email
    if (!studentEmail.trim()) {
      setStudentEmailError('Email is required.');
      document.querySelector('input[placeholder="Enter student email to fetch details"]').focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail.trim())) {
      setStudentEmailError('Please enter a valid email address.');
      document.querySelector('input[placeholder="Enter student email to fetch details"]').focus();
      return;
    }

    // Check if student data was successfully fetched
    if (!studentCoordinatorData.name || !studentCoordinatorData.department) {
      setStudentEmailError('Please enter a valid registered email to fetch student details.');
      document.querySelector('input[placeholder="Enter student email to fetch details"]').focus();
      return;
    }

    // Check for duplicates
    const existingCoordinator = coordinators.find(coord =>
      coord.email.toLowerCase() === studentEmail.trim().toLowerCase() && coord.role === 'student'
    );
    if (existingCoordinator) {
      setStudentEmailError('This student is already registered as a coordinator.');
      document.querySelector('input[placeholder="Enter student email to fetch details"]').focus();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/coordinators/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: studentEmail.trim(), role: 'student' }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Student coordinator added successfully!');
        setStudentEmail('');
        setStudentCoordinatorData({ name: '', department: '', phoneNumber: '' });
        setStudentEmailError('');
        setShowAddStudentForm(false);
        // Refresh coordinators list
        fetchCoordinators();
      } else {
        setStudentEmailError(result.message || 'Failed to add student coordinator.');
        document.querySelector('input[placeholder="Enter student email to fetch details"]').focus();
      }
    } catch (error) {
      console.error('Error adding student coordinator:', error);
      setStudentEmailError('An error occurred while adding the student coordinator.');
      document.querySelector('input[placeholder="Enter student email to fetch details"]').focus();
    }
  };

  // Handle email change for department coordinator auto-fetch
  const handleDeptCoordinatorEmailChange = async (email) => {
    setDeptCoordinator({ ...deptCoordinator, email });
    setDeptCoordinatorErrors({ ...deptCoordinatorErrors, email: '' });

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setDeptCoordinatorErrors({ ...deptCoordinatorErrors, email: 'Please enter a valid email address.' });
      setDeptCoordinator({
        name: '',
        email: email.trim(),
        department: '',
        phoneNumber: ''
      });
      return;
    }

    if (!email.trim()) {
      setDeptCoordinator({
        name: '',
        email: '',
        department: '',
        phoneNumber: ''
      });
      return;
    }

    setDeptCoordinatorLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/coordinators/member-by-email?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (data.found) {
        setDeptCoordinator({
          name: data.name || '',
          email: email.trim(),
          department: data.department || '',
          phoneNumber: data.contact_no || ''
        });
        setDeptCoordinatorErrors({ ...deptCoordinatorErrors, email: '' });
      } else {
        // Clear other fields if member not found
        setDeptCoordinator({
          name: '',
          email: email.trim(),
          department: '',
          phoneNumber: ''
        });
        setDeptCoordinatorErrors({ ...deptCoordinatorErrors, email: 'Email not found in member database. Please enter a valid registered email.' });
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      // Clear other fields on error
      setDeptCoordinator({
        name: '',
        email: email.trim(),
        department: '',
        phoneNumber: ''
      });
      setDeptCoordinatorErrors({ ...deptCoordinatorErrors, email: 'Error fetching member details. Please try again.' });
    } finally {
      setDeptCoordinatorLoading(false);
    }
  };

  // Handle adding department coordinator
  const handleAddDepartmentCoordinator = async () => {
    // Clear previous errors
    setDeptCoordinatorErrors({ name: '', email: '', department: '', phoneNumber: '' });

    // Validate fields
    const newErrors = {};
    if (!deptCoordinator.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (!deptCoordinator.email.trim()) {
      newErrors.email = 'Email is required.';
    }
    if (!deptCoordinator.department.trim()) {
      newErrors.department = 'Department is required.';
    }
    if (!deptCoordinator.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required.';
    }

    // Set errors if any
    if (Object.keys(newErrors).length > 0) {
      setDeptCoordinatorErrors(newErrors);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/coordinators/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: deptCoordinator.email.trim(),
          role: 'department',
          name: deptCoordinator.name.trim(),
          department: deptCoordinator.department.trim(),
          phoneNumber: deptCoordinator.phoneNumber.trim()
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Department coordinator added successfully!');
        setDeptCoordinator({ name: '', email: '', department: '', phoneNumber: '' });
        setDeptCoordinatorErrors({ name: '', email: '', department: '', phoneNumber: '' });
        setShowAddDepartmentForm(false);
        // Refresh coordinators list
        fetchCoordinators();
      } else {
        alert(result.message || 'Failed to add department coordinator.');
      }
    } catch (error) {
      console.error('Error adding department coordinator:', error);
      alert('An error occurred while adding the department coordinator.');
    }
  };

  // Fetch coordinators
  const fetchCoordinators = async () => {
    setCoordinatorsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/coordinators`);
      const data = await response.json();
      setCoordinators(data);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
    } finally {
      setCoordinatorsLoading(false);
    }
  };

  // Handle deleting coordinator
  const handleDeleteCoordinator = async (coordinatorId, coordinatorName) => {
    if (!window.confirm(`Are you sure you want to delete coordinator "${coordinatorName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/coordinators/${coordinatorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Coordinator deleted successfully!');
        // Refresh coordinators list
        fetchCoordinators();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete coordinator.');
      }
    } catch (error) {
      console.error('Error deleting coordinator:', error);
      alert('An error occurred while deleting the coordinator.');
    }
  };

  const filteredWebinars = webinars.filter(webinar => {
    const { phaseId, domain, speakerName, batch, department } = selectedFilters;
    return (
      (!phaseId || webinar.phaseId === parseInt(phaseId)) &&
      (!domain || webinar.domain === domain) &&
      (!speakerName || webinar.speaker?.name?.toLowerCase().startsWith(speakerName.toLowerCase())) &&
      (!batch || webinar.speaker?.batch === batch) &&
      (!department || webinar.speaker?.department === department)
    );
  });

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name?.toLowerCase().includes(speakerSearchTerm.toLowerCase())
  );

  const renderContent = () => {
  switch (activeView) {
    case "phase":
      return (
        <div className="form-card">
          <h2
            className="form-title"
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Phase Management
          </h2>

          <div className="form-fields">
            <div className="form-group">
              <label>Phase ID</label>
              <input
                type="number"
                placeholder="e.g., 1"
                className="input-field"
                min="1"
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
              />
              {errors.phaseId && (
                <div className="error-text">{errors.phaseId}</div>
              )}
            </div>

            <div className="form-group">
              <label>Starting Date</label>
              <input
                type="date"
                className="input-field"
                value={startingDate}
                onChange={(e) => setStartingDate(e.target.value)}
              />
              {errors.startingDate && (
                <div className="error-text">{errors.startingDate}</div>
              )}
            </div>

            <div className="form-group">
              <label>Ending Date</label>
              <input
                type="date"
                className="input-field"
                value={endingDate}
                onChange={(e) => setEndingDate(e.target.value)}
              />
              {errors.endingDate && (
                <div className="error-text">{errors.endingDate}</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: "bold" , fontSize: '20px', margin: 0 }}>Domain Details</h2>
              {lastPhaseDomains.length > 0 && (
                <button
                  className="submit1-btn"
                  onClick={() => {
                    if (window.confirm('This will replace current domain details with last phase domains. Continue?')) {
                      setDomains(lastPhaseDomains.map(d => ({ department: d.department, domain: d.domain })));
                    }
                  }}
                  style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                  Auto-fill from Last Phase
                </button>
              )}
            </div>
            {domains.map((domain, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: "0.5 1 0%" }}>
                      <label>Department</label>
                      <select
                        className="input-field"
                        style={{ width: "100%" }}
                        value={domain.department}
                        onChange={(e) => {
                          const newDomains = [...domains];
                          newDomains[index].department = e.target.value;
                          setDomains(newDomains);
                        }}
                      >
                        <option value="">Select</option>
                        <option value="IT">IT</option>
                        <option value="CSE">CSE</option>
                        <option value="EEE">EEE</option>
                        <option value="ECE">ECE</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                        <option value="AI & DS">AI & DS</option>
                      </select>
                    </div>

                  <div className="form-group" style={{ flex: '2 1 0%' }}>
                    <label>Domain </label>
                    <input
                      type="text"
                      placeholder="Domain"
                      className="input-field"
                      maxLength={50}
                      value={domain.domain}
                      onChange={(e) => {
                        const newDomains = [...domains];
                        newDomains[index].domain = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                        setDomains(newDomains);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const paste = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '');
                        const newDomains = [...domains];
                        newDomains[index].domain = paste;
                        setDomains(newDomains);
                      }}
                      onBlur={(e) => {
                        const newDomains = [...domains];
                        newDomains[index].domain = e.target.value.trim();
                        setDomains(newDomains);
                      }}
                    />
                    {errors[`domain_${index}`] && (
                      <div className="error-text">{errors[`domain_${index}`]}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                    <button
                      className="submit1-btn"
                      onClick={() => {
                        if (domains.length > 1) {
                          const newDomains = domains.filter((_, i) => i !== index);
                          setDomains(newDomains);
                        }
                      }}
                      disabled={domains.length <= 1}
                      style={{
                        fontSize: '16px',
                        padding: '6px 12px',
                        minWidth: '40px',
                        backgroundColor: domains.length <= 1 ? '#ccc' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: domains.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                      title="Remove this domain"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="submit1-btn"
                onClick={() => setDomains([...domains, { department: '', domain: '' }])}
              >
                +
              </button>
            </div>
            {message && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                borderRadius: '4px',
                backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
                color: message.includes('successfully') ? '#155724' : '#721c24',
                border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {message}
              </div>
            )}
            <button
              className="submit-btn"
              onClick={handleCreatePhase}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Phase'}
            </button>
          </div>
        );
     case 'webinar':
        return (
          <div className="form-card filter-card">
            <div className="filters">
              <select
                className="input-field"
                value={selectedFilters.phaseId}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, phaseId: e.target.value })}
              >
                <option value="">All Phases</option>
                {filterOptions.phases?.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>
              <select
                className="input-field"
                value={selectedFilters.domain}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, domain: e.target.value })}
              >
                <option value="">All Domains</option>
                {filterOptions.domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Speaker Name (starts with)"
                className="input-field"
                value={selectedFilters.speakerName}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, speakerName: e.target.value })}
              />
              <select
                className="input-field"
                value={selectedFilters.batch}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, batch: e.target.value })}
              >
                <option value="">All Batches</option>
                {filterOptions.batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              <select
                className="input-field"
                value={selectedFilters.department}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div style={{ overflowX: 'auto', width: '100%', marginTop: '1rem' }}>
              <table style={{ minWidth: "1200px", borderCollapse: "collapse", tableLayout: "fixed" }}>
    <thead>
      <tr style={{ backgroundColor: "#eee", paddingTop: "15px", paddingBottom: "15px" }}>
        <th style={{ minWidth: "100px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Phase ID</th>
        <th style={{ minWidth: "150px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Domain</th>
        <th style={{ minWidth: "200px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Webinar Topic</th>
        <th style={{ minWidth: "150px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Speaker Name</th>
        <th style={{ minWidth: "400px", padding: "10px", border: "1px solid #ddd", textAlign: "center", overflowX: "auto" }}>Speaker Email</th>
        <th style={{ minWidth: "120px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Speaker Phone Number</th>
        <th style={{ minWidth: "150px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Speaker Batch & Dept</th>
        <th style={{ minWidth: "180px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Speaker Designation & Company</th>
        <th style={{ minWidth: "100px", padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>City</th>
      </tr>
    </thead>

    <tbody>
      {webinarsLoading ? (
        <tr>
          <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
            Loading webinars...
          </td>
        </tr>
      ) : filteredWebinars.length === 0 ? (
        <tr>
          <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
            No webinars found
          </td>
        </tr>
      ) : (
        filteredWebinars.map((webinar, index) => (
          <tr key={index}>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{webinar.phaseId}</td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{webinar.domain}</td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{webinar.topic}</td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{webinar.speaker?.name || 'N/A'}</td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center", overflowX: "auto", whiteSpace: "nowrap" }}>{webinar.speaker?.email || 'N/A'}</td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{webinar.speaker?.phoneNumber || 'N/A'}</td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
              {webinar.speaker?.batch ? `${webinar.speaker.batch} & ${webinar.speaker.department || 'N/A'}` : 'N/A'}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
              {webinar.speaker?.designation ? `${webinar.speaker.designation} & ${webinar.speaker.companyName || 'N/A'}` : 'N/A'}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{webinar.alumniCity || 'N/A'}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
        </div>
          </div>
        );
      case 'coordiators':
        return (
          <div className="form-card">
            <h2 className="form-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Coordinators Management</h2>
            <div className="admin-buttons" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className={`submit1-btn ${activeCoordinatorView === 'student' ? 'active' : ''}`} onClick={() => { setActiveCoordinatorView('student'); setShowAddDepartmentForm(false); setShowAddStudentForm(false); }}>Student Coordinators</button>
                <button className={`submit1-btn ${activeCoordinatorView === 'department' ? 'active' : ''}`} onClick={() => { setActiveCoordinatorView('department'); setShowAddStudentForm(false); setShowAddDepartmentForm(false); }}>Department Coordinators</button>
            </div>
            {activeCoordinatorView === 'student' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{fontWeight: "bold" , fontSize: '30px' ,margin: 0}}>Student Coordinators</h3>
                        <button className="submit2-btn" onClick={() => setShowAddStudentForm(!showAddStudentForm)}>Add Coordinator</button>
                    </div>

                    {showAddStudentForm && (
                        <div className="form-fields" style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
                            <div className="form-group">
                                <label>Student Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter student email to fetch details"
                                    className={`input-field ${studentEmailError ? 'error' : ''}`}
                                    value={studentEmail}
                                    onChange={(e) => handleStudentEmailChange(e.target.value)}
                                    disabled={studentCoordinatorLoading}
                                />
                                {studentEmailError && (
                                    <div className="error-text">{studentEmailError}</div>
                                )}
                                {studentCoordinatorLoading && (
                                    <span style={{ marginLeft: '10px', color: '#666' }}>Fetching student details...</span>
                                )}
                            </div>

                            {studentCoordinatorData.name && (
                                <div className="form-group">
                                    <label>Student Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={studentCoordinatorData.name}
                                        readOnly
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                            )}

                            {studentCoordinatorData.department && (
                                <div className="form-group">
                                    <label>Department</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={studentCoordinatorData.department}
                                        readOnly
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                            )}

                            {studentCoordinatorData.phoneNumber && (
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={studentCoordinatorData.phoneNumber}
                                        readOnly
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                    />
                                </div>
                            )}

                            <button
                                className="submit-btn"
                                onClick={handleAddStudentCoordinator}
                                disabled={studentCoordinatorLoading || !!studentEmailError || !studentCoordinatorData.name}
                            >
                                Add
                            </button>
                        </div>
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#eee' }}>
                                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Student Name</th>
                                <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>Email</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Department</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Phone Number</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coordinatorsLoading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        Loading coordinators...
                                    </td>
                                </tr>
                            ) : coordinators.filter(coord => coord.role === 'student').length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        No student coordinators found
                                    </td>
                                </tr>
                            ) : (
                                coordinators.filter(coord => coord.role === 'student').map((coord, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.name || 'N/A'}</td>
                                        <td style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.email || 'N/A'}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.department || 'N/A'}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.phoneNumber || 'N/A'}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            <button
                                                className="coordinator-delete-btn"
                                                onClick={() => handleDeleteCoordinator(coord._id, coord.name)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeCoordinatorView === 'department' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{fontWeight: "bold" , fontSize: '30px' ,margin: 0}}>Department Coordinators</h3>
                        <button className="submit2-btn" onClick={() => setShowAddDepartmentForm(!showAddDepartmentForm)}>Add Coordinator</button>
                    </div>

                    {showAddDepartmentForm && (
                        <div className="form-fields" style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className={`input-field ${deptCoordinatorErrors.name ? 'error' : ''}`}
                                    value={deptCoordinator.name}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^A-Za-z]/g, '');
                                        setDeptCoordinator({ ...deptCoordinator, name: value });
                                        if (e.target.value !== value) {
                                            setDeptCoordinatorErrors({ ...deptCoordinatorErrors, name: 'Only English letters are allowed.' });
                                        } else {
                                            setDeptCoordinatorErrors({ ...deptCoordinatorErrors, name: '' });
                                        }
                                    }}
                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                                    onPaste={(e) => { e.preventDefault(); const paste = e.clipboardData.getData('text').replace(/[^A-Za-z]/g, ''); setDeptCoordinator({ ...deptCoordinator, name: paste }); setDeptCoordinatorErrors({ ...deptCoordinatorErrors, name: '' }); }}
                                    onBlur={(e) => setDeptCoordinator({ ...deptCoordinator, name: e.target.value.trim() })}
                                />
                                {deptCoordinatorErrors.name && (
                                    <div className="error-text">{deptCoordinatorErrors.name}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter email to auto-fetch details"
                                    className={`input-field ${deptCoordinatorErrors.email ? 'error' : ''}`}
                                    value={deptCoordinator.email}
                                    onChange={(e) => handleDeptCoordinatorEmailChange(e.target.value.replace(/[^A-Za-z0-9@.]/g, ''))}
                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                                    onPaste={(e) => { e.preventDefault(); const paste = e.clipboardData.getData('text').replace(/[^A-Za-z0-9@.]/g, ''); handleDeptCoordinatorEmailChange(paste); }}
                                    onBlur={(e) => setDeptCoordinator({ ...deptCoordinator, email: e.target.value.trim() })}
                                    disabled={deptCoordinatorLoading}
                                />
                                {deptCoordinatorErrors.email && (
                                    <div className="error-text">{deptCoordinatorErrors.email}</div>
                                )}
                                {deptCoordinatorLoading && <span style={{ marginLeft: '10px', color: '#666' }}>Fetching details...</span>}
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    placeholder="Department"
                                    className={`input-field ${deptCoordinatorErrors.department ? 'error' : ''}`}
                                    value={deptCoordinator.department}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^A-Za-z]/g, '');
                                        setDeptCoordinator({ ...deptCoordinator, department: value });
                                        if (e.target.value !== value) {
                                            setDeptCoordinatorErrors({ ...deptCoordinatorErrors, department: 'Only English letters are allowed.' });
                                        } else {
                                            setDeptCoordinatorErrors({ ...deptCoordinatorErrors, department: '' });
                                        }
                                    }}
                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                                    onPaste={(e) => { e.preventDefault(); const paste = e.clipboardData.getData('text').replace(/[^A-Za-z]/g, ''); setDeptCoordinator({ ...deptCoordinator, department: paste }); setDeptCoordinatorErrors({ ...deptCoordinatorErrors, department: '' }); }}
                                    onBlur={(e) => setDeptCoordinator({ ...deptCoordinator, department: e.target.value.trim() })}
                                />
                                {deptCoordinatorErrors.department && (
                                    <div className="error-text">{deptCoordinatorErrors.department}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    className={`input-field ${deptCoordinatorErrors.phoneNumber ? 'error' : ''}`}
                                    value={deptCoordinator.phoneNumber}
                                    onChange={(e) => setDeptCoordinator({ ...deptCoordinator, phoneNumber: e.target.value.replace(/[^0-9]/g, '') })}
                                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                                    onPaste={(e) => { e.preventDefault(); const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, ''); setDeptCoordinator({ ...deptCoordinator, phoneNumber: paste }); }}
                                    onBlur={(e) => setDeptCoordinator({ ...deptCoordinator, phoneNumber: e.target.value.trim() })}
                                />
                                {deptCoordinatorErrors.phoneNumber && (
                                    <div className="error-text">{deptCoordinatorErrors.phoneNumber}</div>
                                )}
                            </div>
                            <button className="submit-btn" onClick={handleAddDepartmentCoordinator}>Add</button>
                        </div>
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#eee' }}>
                                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>Faculty Name</th>
                                <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>Email</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Department</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Phone Number</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coordinatorsLoading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        Loading coordinators...
                                    </td>
                                </tr>
                            ) : coordinators.filter(coord => coord.role === 'department').length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        No department coordinators found
                                    </td>
                                </tr>
                            ) : (
                                coordinators.filter(coord => coord.role === 'department').map((coord, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.name || 'N/A'}</td>
                                        <td style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.email || 'N/A'}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.department || 'N/A'}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{coord.phoneNumber || 'N/A'}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            <button
                                                className="coordinator-delete-btn"
                                                onClick={() => handleDeleteCoordinator(coord._id, coord.name)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
          </div>
        );
    default:
      return null;
  }
};

return (
    <div className="student-form-page">
      <div className="background-orbs">
        <div className="orb orb-purple"></div>
        <div className="orb orb-blue"></div>
        <div className="orb orb-pink"></div>
      </div>
      <div className="form-wrapper">
        <div>
          <div className="form-header">
            <h1 className="form-title">Admin Dashboard</h1>
            {/* Current Phase Display */}
            {!phaseLoading && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: currentPhase?.found ? '#e8f5e8' : '#fff3cd',
                border: `1px solid ${currentPhase?.found ? '#c3e6cb' : '#ffeaa7'}`,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                {currentPhase?.found ? (
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
                      Current Active Phase: {currentPhase.displayText}
                    </h3>
                    <p style={{ margin: 0, color: '#155724', fontSize: '0.9rem' }}>
                      Phase ID: {currentPhase.phaseId} | Domains: {currentPhase.domains?.length || 0}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>
                      No Active Phase Found
                    </h3>
                    <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                      {currentPhase?.message || 'Please create a phase to get started.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="admin-buttons">
            <button className="submit-btn" onClick={() => setActiveView('phase')}>Phase Management</button>
            <button className="submit-btn" onClick={() => setActiveView('webinar')}>Webinar Details</button>
            {/* <button className="submit-btn" onClick={() => setActiveView('domain')}>Domain Management</button> */}
            <button className="submit-btn" onClick={() => setActiveView('coordiators')}>Coordinators Management</button>
          </div>
          <div className="content-area">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Adminpage;