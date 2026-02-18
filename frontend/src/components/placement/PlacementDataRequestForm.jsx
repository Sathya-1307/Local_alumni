import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, GraduationCap, MapPin, Zap, Building2, Clock, DollarSign, MessageSquare, Paperclip, CheckCircle, AlertCircle, X, Loader2, XCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define styles as JavaScript objects
const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px 15px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundOrb: {
    position: 'fixed',
    borderRadius: '50%',
    filter: 'blur(60px)',
    opacity: 0.6,
    zIndex: 0,
  },
  orb1: {
    width: '300px',
    height: '300px',
    background: 'linear-gradient(135deg, #c4b5fd 0%, #a5b4fc 100%)',
    top: '10%',
    left: '10%',
  },
  orb2: {
    width: '400px',
    height: '400px',
    background: 'linear-gradient(135deg, #a5b4fc 0%, #93c5fd 100%)',
    bottom: '10%',
    right: '10%',
  },
  orb3: {
    width: '250px',
    height: '250px',
    background: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)',
    top: '50%',
    left: '80%',
  },
  wrapper: {
    maxWidth: '1000px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '25px 20px',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    boxShadow: '0 20px 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    position: 'relative',
    zIndex: 1,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  wrapperHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 30px 80px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  icon: {
    width: '70px',
    height: '70px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    color: 'white',
    fontSize: '32px',
    boxShadow: '0 12px 32px rgba(139, 92, 246, 0.32), 0 4px 8px rgba(139, 92, 246, 0.1), inset 0 -2px 0 rgba(0, 0, 0, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px',
    lineHeight: 1.3,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: '500',
    maxWidth: '500px',
    margin: '0 auto',
  },
  group: {
    marginBottom: '24px',
  },
  groupRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    transition: 'color 0.2s ease',
  },
  required: {
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: '2px',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#f9fafb',
    color: '#1f2937',
  },
  inputFocus: {
    borderColor: '#8b5cf6',
    background: 'white',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.1)',
    transform: 'translateY(-1px)',
  },
  inputDisabled: {
    background: '#f3f4f6',
    color: '#6b7280',
    cursor: 'not-allowed',
    borderColor: '#d1d5db',
    opacity: 0.7,
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#f9fafb',
    color: '#1f2937',
    minHeight: '120px',
    resize: 'vertical',
    lineHeight: 1.5,
  },
  fileInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#f9fafb',
    color: '#1f2937',
    cursor: 'pointer',
  },
  inputHint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '6px',
    marginLeft: '4px',
    lineHeight: 1.4,
  },
  fileHint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '6px',
    marginLeft: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  inputIcon: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8b5cf6',
  },
  checkboxWrapper: {
    margin: '30px 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#4b5563',
    padding: '12px 16px',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    transition: 'all 0.3s ease',
    userSelect: 'none',
  },
  checkboxLabelHover: {
    background: '#f1f5f9',
    borderColor: '#cbd5e1',
    transform: 'translateY(-1px)',
  },
  checkboxInput: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: '#8b5cf6',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  submitButton: {
    width: '100%',
    padding: '18px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    letterSpacing: '0.5px',
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  submitButtonHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 32px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
  submitButtonActive: {
    transform: 'translateY(-1px)',
  },
  submitButtonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px',
    fontSize: '12px',
    color: '#9ca3af',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  // Toaster styles
  toaster: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    maxWidth: '400px',
    width: 'calc(100% - 40px)',
  },
  toasterSuccess: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  toasterError: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  toasterContent: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  toasterIcon: {
    marginRight: '12px',
    flexShrink: 0,
  },
  toasterMessage: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: 1.4,
  },
  toasterClose: {
    marginLeft: '12px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
    flexShrink: 0,
  },
  toasterCloseHover: {
    background: 'rgba(255, 255, 255, 0.3)',
  },
  // Skillset styles
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
  },
  skillTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
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
    opacity: 0.8,
    transition: 'opacity 0.2s',
  },
  skillTagRemoveDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  skillInputWrapper: {
    display: 'flex',
    gap: '8px',
  },
  skillAddButton: {
    padding: '10px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  skillAddButtonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

// Create keyframes for animations
const keyframes = `
  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.05);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.95);
    }
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes checkPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes skillSlideIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Add keyframes to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = keyframes;
  document.head.appendChild(styleSheet);
}

// Helper function for input focus effects
const handleInputFocus = (e) => {
  const target = e.target;
  target.style.borderColor = '#8b5cf6';
  target.style.background = 'white';
  target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.1)';
  target.style.transform = 'translateY(-1px)';
};

const handleInputBlur = (e) => {
  const target = e.target;
  target.style.borderColor = '#e5e7eb';
  target.style.background = '#f9fafb';
  target.style.boxShadow = 'none';
  target.style.transform = 'translateY(0)';
};


  export default function AlumniJobRequestForm({ userEmail, onSubmitSuccess }) {
  // Initialize formData with the email from props
  const [formData, setFormData] = useState({
    email: userEmail || '', // Use the email from placement portal
    location: '',
    skillset: [],
    company: '',
    experience: '',
    ctc: '',
    message: '',
    attachment: null,
    isRobot: false
  });

  const [skillInput, setSkillInput] = useState('');
  const [displayData, setDisplayData] = useState({
    name: '',
    contact: '',
    batch: ''
  });

  const [userId, setUserId] = useState(null);
  const [toaster, setToaster] = useState({
    show: false,
    type: '',
    message: ''
  });

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wrapperHover, setWrapperHover] = useState(false);
  const [isHovering, setIsHovering] = useState({});

  // Use refs for better DOM access
  const submitButtonRef = useRef(null);
  const checkboxLabelRef = useRef(null);
  const skillTagRemoveRefs = useRef([]);
  const skillAddButtonRef = useRef(null);
  const toasterCloseRef = useRef(null);

  // Auto-fill user data when component mounts or email changes
  useEffect(() => {
    if (userEmail) {
      setFormData(prev => ({
        ...prev,
        email: userEmail
      }));
      
      // Automatically fetch user details
      autoFillUserDetails(userEmail);
    }
  }, [userEmail]);

  const autoFillUserDetails = async (email) => {
    if (!email) return;
    
    setIsAutoFilling(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/members/email/${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.member) {
        setUserId(data.member._id);
        
        setDisplayData({
          name: data.member.name || '',
          contact: data.member.mobile || '',
          batch: data.member.batch || ''
        });
        
        showToaster("success", "✨ User details auto-filled successfully!");
      } else {
        showToaster("error", "❌ User not found in database. Please use registered email.");
        setUserId(null);
        setDisplayData({ name: '', contact: '', batch: '' });
      }
    } catch (err) {
      console.error('Auto-fill error:', err);
      showToaster("error", "Auto-fill not available. Please check your connection.");
      setUserId(null);
      setDisplayData({ name: '', contact: '', batch: '' });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
  };

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skillset.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillset: [...prev.skillset, skill]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skillset: prev.skillset.filter(skill => skill !== skillToRemove)
    }));
  };

  const showToaster = (type, message) => {
    setToaster({ show: true, type, message });
    setTimeout(() => {
      setToaster({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Remove handleEmailBlur since we auto-fill on mount
  // Keep only manual refresh if needed
  const handleManualEmailCheck = async () => {
    await autoFillUserDetails(formData.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.isRobot) {
      showToaster('error', 'Please verify that you are not a robot!');
      return;
    }

    if (!userId) {
      showToaster('error', 'Please use a registered email address!');
      return;
    }

    // Validate required fields
    const requiredFields = ['email', 'location', 'company', 'experience', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missingFields.length > 0) {
      showToaster('error', `Please fill all required fields!`);
      return;
    }

    // Validate skillset has at least one skill
    if (formData.skillset.length === 0) {
      showToaster('error', 'Please add at least one skill!');
      return;
    }

    if (!formData.attachment) {
      showToaster('error', 'Please upload your resume!');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('userId', userId);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('skillset', JSON.stringify(formData.skillset));
      formDataToSend.append('company', formData.company);
      formDataToSend.append('experience', formData.experience);
      
      if (formData.ctc && formData.ctc.trim() !== '') {
        formDataToSend.append('ctc', formData.ctc);
      }
      
      formDataToSend.append('message', formData.message);
      formDataToSend.append('attachment', formData.attachment);

      const response = await fetch(`${API_BASE_URL}/api/job-requests`, {
        method: 'POST',
        body: formDataToSend,
      });

      let result;
      
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        showToaster('error', 'Server response error. Please try again.');
        return;
      }

      if (response.ok && result.success) {
        showToaster('success', '🎉 Job request submitted successfully!');
        
        // Call the success callback if provided
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        
        setTimeout(() => {
          setFormData({
            email: userEmail || '', // Keep the email from props
            location: '',
            skillset: [],
            company: '',
            experience: '',
            ctc: '',
            message: '',
            attachment: null,
            isRobot: false
          });
          setSkillInput('');
          setDisplayData({ name: '', contact: '', batch: '' });
          setUserId(null);
          
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
        }, 1000);
      } else {
        showToaster('error', result.message || `Failed to submit: ${response.status}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showToaster('error', 'Cannot connect to server. Make sure backend is running on port 5000.');
      } else {
        showToaster('error', 'An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine screen size for responsive styles
  const isTabletOrLarger = typeof window !== 'undefined' && window.innerWidth >= 768;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  return (
    <div style={styles.container}>
      {/* Animated Background Orbs */}
      <div style={{
        ...styles.backgroundOrb,
        ...styles.orb1,
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div style={{
        ...styles.backgroundOrb,
        ...styles.orb2,
        animation: 'float 25s ease-in-out infinite reverse'
      }} />
      <div style={{
        ...styles.backgroundOrb,
        ...styles.orb3,
        animation: 'float 30s ease-in-out infinite'
      }} />

      {/* Toaster Notification */}
      {toaster.show && (
        <div style={{
          ...styles.toaster,
          ...(toaster.type === 'success' ? styles.toasterSuccess : styles.toasterError),
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={styles.toasterContent}>
            {toaster.type === 'success' ? (
              <CheckCircle style={styles.toasterIcon} size={20} />
            ) : (
              <AlertCircle style={styles.toasterIcon} size={20} />
            )}
            <span style={styles.toasterMessage}>{toaster.message}</span>
            <button
              ref={toasterCloseRef}
              onClick={() => setToaster({ show: false, type: '', message: '' })}
              style={styles.toasterClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        style={{
          ...styles.wrapper,
          ...(wrapperHover ? styles.wrapperHover : {}),
          ...(isTabletOrLarger ? {
            borderRadius: '28px',
            padding: '40px',
            margin: '30px auto'
          } : {}),
          ...(isMobile ? {
            padding: '20px 15px',
            borderRadius: '20px'
          } : {})
        }}
        onMouseEnter={() => setWrapperHover(true)}
        onMouseLeave={() => setWrapperHover(false)}
      >
        {/* Header */}
        <div style={{...styles.header, animation: 'fadeInUp 0.6s ease-out'}}>
          <div style={{...styles.icon, animation: 'iconPulse 2s ease-in-out infinite'}}>
            <GraduationCap size={isTabletOrLarger ? 32 : 28} />
          </div>
          <h1 style={{
            ...styles.title,
            fontSize: isMobile ? '20px' : isTabletOrLarger ? '32px' : '24px'
          }}>
            Alumni Opportunity Requests
          </h1>
          <p style={{
            ...styles.subtitle,
            fontSize: isMobile ? '13px' : isTabletOrLarger ? '16px' : '14px'
          }}>
            Fill out all the Experience form
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
            {/* Email - Auto-filled from placement portal */}
            <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.3s both'}}>
              <label style={styles.label}>
                <Mail size={18} style={{ color: '#8b5cf6' }} />
                Personal Email ID <span style={styles.required}>*</span>
                {userEmail && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                    (Auto-filled from portal)
                  </span>
                )}
              </label>
              <div style={styles.inputWrapper}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={(e) => {
                    handleInputBlur(e);
                    handleManualEmailCheck();
                  }}
                  style={{
                    ...styles.input,
                    ...(isSubmitting ? styles.inputDisabled : {}),
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    fontSize: isMobile ? '14px' : '15px'
                  }}
                  placeholder="your.email@example.com"
                  required
                  disabled={isSubmitting}
                />
                {isAutoFilling && (
                  <Loader2 style={{
                    ...styles.inputIcon,
                    animation: 'spin 1s linear infinite'
                  }} size={20} />
                )}
                {userEmail && !isAutoFilling && (
                  <CheckCircle style={{
                    ...styles.inputIcon,
                    color: '#10b981'
                  }} size={20} />
                )}
              </div>
              <p style={{
                ...styles.inputHint,
                fontSize: isTabletOrLarger ? '13px' : '12px'
              }}>
                {isAutoFilling ? "🔄 Fetching user details..." : 
                 userEmail ? "✅ Email auto-filled from placement portal" : 
                 "✨ Your details will auto-fill if you're in our database"}
              </p>
            </div>

            {/* Display-only fields (auto-filled, not saved) */}
            {displayData.name && (
              <>
                <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.4s both'}}>
                  <label style={styles.label}>
                    <User size={18} style={{ color: '#8b5cf6' }} />
                    Name (Auto-filled)
                  </label>
                  <input
                    type="text"
                    value={displayData.name}
                    style={{
                      ...styles.input,
                      backgroundColor: '#f0f0f0',
                      cursor: 'not-allowed',
                      padding: isMobile ? '12px 14px' : '14px 16px',
                      fontSize: isMobile ? '14px' : '15px'
                    }}
                    disabled
                  />
                </div>

                <div style={{
                  ...styles.groupRow,
                  ...(isTabletOrLarger ? { gridTemplateColumns: '1fr 1fr' } : {})
                }}>
                  <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.5s both'}}>
                    <label style={styles.label}>
                      <Phone size={18} style={{ color: '#8b5cf6' }} />
                      Contact No (Auto-filled)
                    </label>
                    <input
                      type="tel"
                      value={displayData.contact}
                      style={{
                        ...styles.input,
                        backgroundColor: '#f0f0f0',
                        cursor: 'not-allowed',
                        padding: isMobile ? '12px 14px' : '14px 16px',
                        fontSize: isMobile ? '14px' : '15px'
                      }}
                      disabled
                    />
                  </div>
                  <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.6s both'}}>
                    <label style={styles.label}>
                      <GraduationCap size={18} style={{ color: '#8b5cf6' }} />
                      Batch (Auto-filled)
                    </label>
                    <input
                      type="text"
                      value={displayData.batch}
                      style={{
                        ...styles.input,
                        backgroundColor: '#f0f0f0',
                        cursor: 'not-allowed',
                        padding: isMobile ? '12px 14px' : '14px 16px',
                        fontSize: isMobile ? '14px' : '15px'
                      }}
                      disabled
                    />
                  </div>
                </div>
              </>
            )}

            {/* Preferred Location */}
            <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.7s both'}}>
              <label style={styles.label}>
                <MapPin size={18} style={{ color: '#8b5cf6' }} />
                Preferred Location <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{
                  ...styles.input,
                  ...(isSubmitting ? styles.inputDisabled : {}),
                  padding: isMobile ? '12px 14px' : '14px 16px',
                  fontSize: isMobile ? '14px' : '15px'
                }}
                placeholder="Bangalore, India"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Skillset as Tags */}
            <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.8s both'}}>
              <label style={styles.label}>
                <Zap size={18} style={{ color: '#8b5cf6' }} />
                Skillset <span style={styles.required}>*</span>
                <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '12px' }}>
                  ({formData.skillset.length} added)
                </span>
              </label>
              
              {/* Skills Tags Container */}
              <div style={styles.skillsContainer}>
                {formData.skillset.map((skill, index) => (
                  <div key={index} style={{
                    ...styles.skillTag,
                    animation: 'skillSlideIn 0.2s ease'
                  }}>
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={{
                        ...styles.skillTagRemove,
                        ...(isSubmitting ? styles.skillTagRemoveDisabled : {})
                      }}
                      disabled={isSubmitting}
                      ref={el => skillTagRemoveRefs.current[index] = el}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.opacity = '0.8';
                        }
                      }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Skills Input */}
              <div style={styles.skillInputWrapper}>
                <input
                  type="text"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onKeyDown={handleSkillInputKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={{
                    ...styles.input,
                    flex: 1,
                    ...(isSubmitting ? styles.inputDisabled : {}),
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    fontSize: isMobile ? '14px' : '15px'
                  }}
                  placeholder="Type a skill and press Enter or comma (e.g., 'React, Node.js')"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  ref={skillAddButtonRef}
                  style={{
                    ...styles.skillAddButton,
                    ...(isSubmitting || !skillInput.trim() ? styles.skillAddButtonDisabled : {}),
                    padding: isMobile ? '8px 12px' : '10px 16px'
                  }}
                  disabled={isSubmitting || !skillInput.trim()}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && skillInput.trim()) {
                      e.currentTarget.style.background = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && skillInput.trim()) {
                      e.currentTarget.style.background = '#10b981';
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <p style={{
                ...styles.inputHint,
                fontSize: isTabletOrLarger ? '13px' : '12px'
              }}>
                💡 Press Enter or comma to add a skill. Add at least one skill.
              </p>
            </div>

            {/* Current Company */}
            <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 0.9s both'}}>
              <label style={styles.label}>
                <Building2 size={18} style={{ color: '#8b5cf6' }} />
                Target Company <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{
                  ...styles.input,
                  ...(isSubmitting ? styles.inputDisabled : {}),
                  padding: isMobile ? '12px 14px' : '14px 16px',
                  fontSize: isMobile ? '14px' : '15px'
                }}
                placeholder="Tech Corp Inc."
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Experience & CTC */}
            <div style={{
              ...styles.groupRow,
              ...(isTabletOrLarger ? { gridTemplateColumns: '1fr 1fr' } : {})
            }}>
              <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 1.0s both'}}>
                <label style={styles.label}>
                  <Clock size={18} style={{ color: '#8b5cf6' }} />
                  Years of Experience <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={{
                    ...styles.input,
                    ...(isSubmitting ? styles.inputDisabled : {}),
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    fontSize: isMobile ? '14px' : '15px'
                  }}
                  placeholder="3 years"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 1.1s both'}}>
                <label style={styles.label}>
                  <DollarSign size={18} style={{ color: '#8b5cf6' }} />
                  Current CTC (Optional)
                </label>
                <input
                  type="text"
                  name="ctc"
                  value={formData.ctc}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={{
                    ...styles.input,
                    ...(isSubmitting ? styles.inputDisabled : {}),
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    fontSize: isMobile ? '14px' : '15px'
                  }}
                  placeholder="₹12 LPA (Optional)"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Message */}
            <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 1.2s both'}}>
              <label style={styles.label}>
                <MessageSquare size={18} style={{ color: '#8b5cf6' }} />
                Message <span style={styles.required}>*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={{
                  ...styles.textarea,
                  ...(isSubmitting ? styles.inputDisabled : {}),
                  padding: isMobile ? '12px 14px' : '14px 16px',
                  fontSize: isMobile ? '14px' : '15px'
                }}
                placeholder="Tell us about your job requirements..."
                rows="4"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Attachment */}
            <div style={{...styles.group, animation: 'slideIn 0.4s ease-out 1.3s both'}}>
              <label style={styles.label}>
                <Paperclip size={18} style={{ color: '#8b5cf6' }} />
                Resume Attachment <span style={styles.required}>*</span>
              </label>
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
                style={{
                  ...styles.fileInput,
                  ...(isSubmitting ? styles.inputDisabled : {}),
                  padding: isMobile ? '12px 14px' : '12px 16px',
                  fontSize: isMobile ? '14px' : '15px'
                }}
                accept=".pdf,.doc,.docx"
                required
                disabled={isSubmitting}
              />
              {formData.attachment && (
                <p style={{
                  ...styles.fileHint,
                  fontSize: isTabletOrLarger ? '13px' : '12px'
                }}>
                  📄 Selected: {formData.attachment.name}
                </p>
              )}
              <p style={{
                ...styles.fileHint,
                fontSize: isTabletOrLarger ? '13px' : '12px'
              }}>
                Upload your resume (PDF, DOC, DOCX) - Max 5MB
              </p>
            </div>

            {/* Robot Checkbox */}
            <div style={{...styles.checkboxWrapper, animation: 'fadeIn 0.5s ease-out 1.3s both'}}>
              <label 
                ref={checkboxLabelRef}
                style={styles.checkboxLabel}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <input
                  type="checkbox"
                  name="isRobot"
                  checked={formData.isRobot}
                  onChange={handleChange}
                  style={styles.checkboxInput}
                  required
                  disabled={isSubmitting}
                />
                I'm not a robot
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              ref={submitButtonRef}
              style={{
                ...styles.submitButton,
                ...(isSubmitting || !userId ? styles.submitButtonDisabled : {}),
                animation: 'fadeIn 0.5s ease-out 1.4s both',
                position: 'relative',
                padding: isMobile ? '16px' : '18px',
                fontSize: isMobile ? '15px' : '16px'
              }}
              disabled={isSubmitting || !userId}
              onMouseEnter={(e) => {
                if (!isSubmitting && userId) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && userId) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseDown={(e) => {
                if (!isSubmitting && userId) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseUp={(e) => {
                if (!isSubmitting && userId) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} />
                  Submitting...
                </>
              ) : (
                'Submit Job Request'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          ...styles.footer,
          fontSize: isTabletOrLarger ? '13px' : '12px',
          marginTop: isTabletOrLarger ? '40px' : '30px'
        }}>
          Alumni Job Request System
        </div>
      </div>
    </div>
  );
}