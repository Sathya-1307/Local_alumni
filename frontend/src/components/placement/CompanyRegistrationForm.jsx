import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Plus, XCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px 15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  wrapper: {
    maxWidth: '1000px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '25px 20px',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    boxShadow: '0 20px 60px rgba(139, 92, 246, 0.25)',
    '@media (min-width: 768px)': {
      borderRadius: '24px',
      padding: '40px'
    }
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  icon: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
    fontSize: '28px',
    boxShadow: '0 10px 28px rgba(139, 92, 246, 0.32)',
    '@media (min-width: 768px)': {
      width: '70px',
      height: '70px',
      borderRadius: '15px',
      fontSize: '35px'
    }
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '6px',
    lineHeight: '1.3',
    '@media (min-width: 768px)': {
      fontSize: '28px'
    }
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.4',
    '@media (min-width: 768px)': {
      fontSize: '14px'
    }
  },
  alert: {
    padding: '12px 16px',
    marginBottom: '20px',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  successAlert: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #a7f3d0'
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '15px',
    marginBottom: '18px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: '1fr 1fr'
    }
  },
  group: {
    marginBottom: '18px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  labelIcon: {
    color: '#8b5cf6'
  },
  asterisk: {
    color: '#ef4444'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: '#8b5cf6'
    },
    '&:disabled': {
      backgroundColor: '#f9fafb',
      cursor: 'not-allowed',
      opacity: '0.7'
    }
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '100px',
    '&:focus': {
      borderColor: '#8b5cf6'
    },
    '&:disabled': {
      backgroundColor: '#f9fafb',
      cursor: 'not-allowed',
      opacity: '0.7'
    }
  },
  fileInput: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    '&:disabled': {
      backgroundColor: '#f9fafb',
      cursor: 'not-allowed',
      opacity: '0.7'
    }
  },
  hint: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '6px',
    marginLeft: '4px',
    '@media (min-width: 768px)': {
      fontSize: '12px'
    }
  },
  fileHint: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '6px',
    marginLeft: '4px',
    '@media (min-width: 768px)': {
      fontSize: '12px'
    }
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover:not(:disabled)': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)'
    },
    '&:disabled': {
      background: '#9ca3af',
      cursor: 'not-allowed',
      opacity: '0.7'
    }
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '11px',
    color: '#9ca3af',
    '@media (min-width: 768px)': {
      fontSize: '12px',
      marginTop: '25px'
    }
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: '8px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  radioInput: {
    margin: '0'
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px',
    padding: '10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    minHeight: '50px',
    transition: 'all 0.3s ease',
    '&:focus-within': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  skillTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    animation: 'slideIn 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  skillTagRemove: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0.8',
    transition: 'opacity 0.2s, transform 0.2s',
    borderRadius: '50%',
    '&:hover': {
      opacity: '1',
      transform: 'scale(1.1)',
      background: 'rgba(255, 255, 255, 0.2)'
    },
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed'
    }
  },
  skillInputWrapper: {
    display: 'flex',
    gap: '8px',
    marginTop: '5px'
  },
  skillInput: {
    flex: '1',
    transition: 'all 0.3s ease',
    '&:focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  addSkillButton: {
    padding: '10px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, transform 0.2s',
    fontWeight: '500',
    minWidth: '44px',
    '&:hover:not(:disabled)': {
      background: '#059669',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    '&:active:not(:disabled)': {
      transform: 'translateY(0)'
    },
    '&:disabled': {
      background: '#9ca3af',
      cursor: 'not-allowed',
      opacity: '0.6'
    }
  },
  inputError: {
    borderColor: '#dc2626 !important',
    boxShadow: '0 0 0 1px #dc2626 !important',
    '&:focus': {
      borderColor: '#dc2626 !important',
      boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.2) !important'
    }
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  buttonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed !important'
  }
};

// Define keyframes for animation
const keyframes = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-5px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

// Create a style element and append to head
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = keyframes;
  document.head.appendChild(styleEl);
}

const CompanyRegistrationForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    isAlumniCompany: false,
    jobRole: '',
    requiredSkills: [],
    ctcOffered: '',
    location: '',
    deadline: '',
    applicationLink: '',
    jobDescription: '',
  });
  
  const [currentSkill, setCurrentSkill] = useState('');
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deadlineError, setDeadlineError] = useState('');
  const skillInputRef = useRef(null);

  // Get current date and time in required format (YYYY-MM-DDTHH:mm)
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Validate deadline date
  const validateDeadline = (deadlineValue) => {
    if (!deadlineValue) {
      setDeadlineError('Deadline is required');
      return false;
    }

    const selectedDate = new Date(deadlineValue);
    const currentDate = new Date();

    // Remove milliseconds for accurate comparison
    selectedDate.setMilliseconds(0);
    currentDate.setMilliseconds(0);

    if (selectedDate <= currentDate) {
      setDeadlineError('Deadline must be a future date and time');
      return false;
    }

    // Optional: Add minimum days validation
    const minDays = 1; // At least 1 day from now
    const minDate = new Date(currentDate);
    minDate.setDate(currentDate.getDate() + minDays);
    
    if (selectedDate < minDate) {
      setDeadlineError(`Deadline must be at least ${minDays} day(s) from now`);
      return false;
    }

    // Optional: Add maximum days validation (e.g., not more than 1 year)
    const maxDays = 365;
    const maxDate = new Date(currentDate);
    maxDate.setDate(currentDate.getDate() + maxDays);
    
    if (selectedDate > maxDate) {
      setDeadlineError(`Deadline cannot be more than ${maxDays} days from now`);
      return false;
    }

    setDeadlineError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'deadline') {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateDeadline(value);
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle skill input
  const handleSkillInputChange = (e) => {
    setCurrentSkill(e.target.value);
  };

  // Add skill on Enter, Comma, or Tab
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addSkill();
    }
  };

  // Add new skill tag
  const addSkill = () => {
    const skill = currentSkill.trim();
    if (skill && !formData.requiredSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }));
      setCurrentSkill('');
    }
  };

  // Remove skill tag
  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Add skill on button click
  const handleAddSkillClick = () => {
    addSkill();
    skillInputRef.current?.focus();
  };

  const handleFileChange = (e) => {
    setPoster(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Validate deadline before submission
    if (!validateDeadline(formData.deadline)) {
      setMessage({ 
        text: 'Please fix the deadline error before submitting!', 
        type: 'error' 
      });
      setLoading(false);
      return;
    }

    // Check if at least one skill is added
    if (formData.requiredSkills.length === 0) {
      setMessage({ 
        text: 'Please add at least one required skill!', 
        type: 'error' 
      });
      skillInputRef.current?.focus();
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Convert requiredSkills array to comma-separated string
      const skillsetString = formData.requiredSkills.join(', ');
      
      // Add all form data
      Object.keys(formData).forEach(key => {
        if (key === 'requiredSkills') {
          formDataToSend.append(key, skillsetString);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (poster) {
        formDataToSend.append('poster', poster);
      }

      console.log('Sending form data:', Object.fromEntries(formDataToSend));

      const response = await axios.post(
      `${API_BASE_URL}/api/company/register`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Response:', response.data);
      
      if (response.data.success) {
        setMessage({ 
          text: 'Company registered successfully!', 
          type: 'success' 
        });
        
        // Reset form completely
        setFormData({
          companyName: '',
          isAlumniCompany: false,
          jobRole: '',
          requiredSkills: [],
          ctcOffered: '',
          location: '',
          deadline: '',
          applicationLink: '',
          jobDescription: '',
        });
        setCurrentSkill('');
        setPoster(null);
        setDeadlineError('');
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        setMessage({ 
          text: error.response.data.message || 'Error registering company', 
          type: 'error' 
        });
      } else if (error.request) {
        setMessage({ 
          text: 'No response from server. Please check if backend is running.', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: 'Error setting up request: ' + error.message, 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Set min attribute for datetime input
  const minDateTime = getCurrentDateTime();

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.icon}>🏢</div>
          <h2 style={styles.title}> Company Onboarding</h2>
          <p style={styles.subtitle}>
            Register a new company and job role for campus placements
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div style={{
            ...styles.alert,
            ...(message.type === 'success' ? styles.successAlert : styles.errorAlert)
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                <span style={styles.labelIcon}>🏢</span>
                Company Name <span style={styles.asterisk}>*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div>
              <label style={styles.label}>
                <span style={styles.labelIcon}>💼</span>
                Job Role <span style={styles.asterisk}>*</span>
              </label>
              <input
                type="text"
                name="jobRole"
                value={formData.jobRole}
                onChange={handleChange}
                placeholder="Enter job role"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {/* Alumni Company Radio Button */}
          <div style={styles.group}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🎓</span>
              Alumni Company? <span style={styles.asterisk}>*</span>
            </label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="isAlumniCompany"
                  value="true"
                  checked={formData.isAlumniCompany === true}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.radioInput}
                />
                <span>Yes</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="isAlumniCompany"
                  value="false"
                  checked={formData.isAlumniCompany === false}
                  onChange={handleChange}
                  disabled={loading}
                  style={styles.radioInput}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Skillset with Tags */}
          <div style={styles.group}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>⚡</span>
              Required Skills <span style={styles.asterisk}>*</span>
            </label>
            
            {/* Skills Tags Container */}
            <div style={styles.skillsContainer}>
              {formData.requiredSkills.map((skill, index) => (
                <div key={index} style={styles.skillTag}>
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    style={styles.skillTagRemove}
                    disabled={loading}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Skill Input with Add Button */}
            <div style={styles.skillInputWrapper}>
              <input
                ref={skillInputRef}
                type="text"
                value={currentSkill}
                onChange={handleSkillInputChange}
                onKeyDown={handleSkillKeyDown}
                style={{...styles.input, ...styles.skillInput}}
                placeholder="Type a skill and press Enter or comma"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddSkillClick}
                style={styles.addSkillButton}
                disabled={loading || !currentSkill.trim()}
              >
                <Plus size={18} />
              </button>
            </div>
            <p style={styles.hint}>
              Press Enter, Tab, or comma to add skill. Click on skill to remove.
            </p>
          </div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                <span style={styles.labelIcon}>💰</span>
                CTC Offered <span style={styles.asterisk}>*</span>
              </label>
              <input
                type="text"
                name="ctcOffered"
                value={formData.ctcOffered}
                onChange={handleChange}
                placeholder="e.g., 8 LPA"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📍</span>
                Location <span style={styles.asterisk}>*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Job location"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📅</span>
                Application Deadline <span style={styles.asterisk}>*</span>
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={minDateTime}
                required
                style={{
                  ...styles.input,
                  ...(deadlineError ? styles.inputError : {})
                }}
                disabled={loading}
              />
              {deadlineError && (
                <div style={styles.errorMessage}>
                  ⚠️ {deadlineError}
                </div>
              )}
              <p style={styles.hint}>
                Select a future date and time (at least 1 day from now)
              </p>
            </div>
            <div>
              <label style={styles.label}>
                <span style={styles.labelIcon}>🔗</span>
                Application Link <span style={styles.asterisk}>*</span>
              </label>
              <input
                type="url"
                name="applicationLink"
                value={formData.applicationLink}
                onChange={handleChange}
                placeholder="Apply / registration link"
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>📝</span>
              Job Description <span style={styles.asterisk}>*</span>
            </label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Enter detailed job description..."
              rows="4"
              required
              style={styles.textarea}
              disabled={loading}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🖼️</span>
              Company Poster
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              style={styles.fileInput}
              disabled={loading}
            />
            <p style={styles.fileHint}>
              Drag and drop or click to upload poster / brochure (Max 5MB)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || deadlineError}
            style={{
              ...styles.submitButton,
              ...(deadlineError ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Registering...' : 'Add Company'}
          </button>
        </form>

        <div style={styles.footer}>
          {loading && 'Processing... Please wait'}
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistrationForm;