import React, { useState, useEffect } from 'react';
import {
  User,
  Compass,
  Globe,
  Mail,
  Phone,
  GraduationCap,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

import { useNavigate, useParams } from "react-router-dom";
import Popup from './Popup';
import './Common.css';

// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function StudentRequestForm() {
  const navigate = useNavigate();
  const { email: encodedEmail } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    department: '',
    domain: '',
    topic: '',
    reason: '',
    phaseId: null,
    isRobot: false
  });

  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [domainOptions, setDomainOptions] = useState([]);

  // Extract email from URL and set in formData
  useEffect(() => {
    if (encodedEmail) {
      try {
        const email = atob(encodedEmail);
        setFormData(prev => ({
          ...prev,
          email: email
        }));
      } catch (error) {
        console.error('Error decoding email:', error);
      }
    }
  }, [encodedEmail]);

  // -------------------------------------------------
  // 🔥 Auto-fill: Name + Contact + Department by Email
  // -------------------------------------------------
  useEffect(() => {
    const fetchMemberByEmail = async () => {
      if (!formData.email || formData.email.length < 5) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/member-by-email?email=${encodeURIComponent(formData.email)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.found) {
          setFormData(prev => ({
            ...prev,
            name: data.name || "",
            contact: data.contact_no || "",
            department: data.department || ""
          }));
        }

      } catch (error) {
        console.error("Error fetching member:", error);
      }
    };

    fetchMemberByEmail();
  }, [formData.email]);

  // Fetch current phase
  useEffect(() => {
    const fetchCurrentPhase = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/current-phase`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCurrentPhase(data.found ? `${data.phaseId}` : data.message);
        if (data.found) {
          setFormData(prev => ({
            ...prev,
            phaseId: data.phaseId
          }));
          // Set domain options from the current phase
          if (data.domains && Array.isArray(data.domains)) {
            const options = data.domains.map(domain => ({
              value: domain.domain,
              label: domain.domain.toUpperCase()
            }));
            setDomainOptions(options);
          }
        }
        setPhaseLoading(false);
      } catch (error) {
        console.error('Error fetching current phase:', error);
        setPhaseLoading(false);
      }
    };
    fetchCurrentPhase();
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'topic') {
      // Apply validation: Allow English letters, numbers, spaces. Block punctuation, emojis, other languages, line breaks, multi-line paste.
      const maxLength = 150;
      const minLength = 10;
      const filteredValue = value.replace(/[^\w\s]/g, '').slice(0, maxLength);
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
      // Clear error if now valid
      if (filteredValue.length >= minLength && filteredValue.length <= maxLength) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    } else if (name === 'reason') {
      // Apply validation: Allow English letters, numbers, spaces, and specific punctuation: ., !, ?, ', ", (, ), -. Block emojis, other languages, line breaks, multi-line paste.
      const maxLength = 500;
      const minLength = 30;
      const filteredValue = value.replace(/[^\w\s.,!?'"()-]/g, '').slice(0, maxLength);
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
      // Clear error if now valid
      if (filteredValue.length >= minLength && filteredValue.length <= maxLength) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      // Clear error for other fields if they have value
      if (value && errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    }
  };

  // Submit Form
  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.isRobot) {
      setPopup({ show: true, message: 'Please verify that you are not a robot', type: 'error' });
      return;
    }

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.domain) newErrors.domain = 'Domain is required';
    if (!formData.topic) newErrors.topic = 'Topic is required';
    else if (formData.topic.length < 10) newErrors.topic = 'Topic must be at least 10 characters long';
    else if (formData.topic.length > 150) newErrors.topic = 'Topic must not exceed 150 characters';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    else if (formData.reason.length < 30) newErrors.reason = 'Reason must be at least 30 characters long';
    else if (formData.reason.length > 500) newErrors.reason = 'Reason must not exceed 500 characters';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/submit-student-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            domain: formData.domain,
            topic: formData.topic,
            reason: formData.reason,
            phaseId: formData.phaseId,
          }),
        });

        if (response.ok) {
          setPopup({ show: true, message: 'Form submitted successfully! 🎉', type: 'success' });

          // Reset form data after successful submission
          setFormData({
            name: '',
            email: '',
            contact: '',
            department: '',
            domain: '',
            topic: '',
            reason: '',
            phaseId: null,
            isRobot: false
          });
          setErrors({});
        } else {
          const errorData = await response.json();
          setPopup({ show: true, message: errorData.error || 'Failed to submit form', type: 'error' });
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setPopup({ show: true, message: 'Failed to submit form', type: 'error' });
      }
    }
  };

  return (
    <div className="student-form-page">
      <div className="background-orbs">
        <div className="orb orb-purple"></div>
        <div className="orb orb-blue animation-delay-2000"></div>
        <div className="orb orb-pink animation-delay-4000"></div>
      </div>

      <div className="form-wrapper">
        <div >

          <button className="back-btn" onClick={() => navigate("/webinar-dashboard")}>
            <ArrowLeft className="back-btn-icon" /> <span className="back-btn-text">Back to Dashboard</span>
          </button>

          <div className="form-header">
            <div className="icon-wrapper">
              <GraduationCap className="header-icon" />
            </div>
            <h1 className="form-title">Webinar Request Form</h1>
              <div className="webinar-subtitle">
                {phaseLoading ? 'Loading current phase...' : `Phase: ${currentPhase}`}
              </div>
          </div>

          <div className="form-card">
            <div className="form-fields">

              {/* NAME */}
              <div className="form-group">
                <label className="field-label">
                  <User className="field-icon" /> Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Auto fetched from email..."
                  className="input-field"
                  readOnly
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label className="field-label">
                  <Mail className="field-icon" /> Personal Email ID <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input-field"
                   readOnly
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>


              {/* CONTACT */}
              <div className="form-group">
                <label className="field-label">
                  <Phone className="field-icon" /> Contact No <span>*</span>
                </label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Auto fetched from email..."
                  className="input-field"
                  readOnly
                />
                {errors.contact && <div className="error-text">{errors.contact}</div>}
              </div>

              {/* DEPARTMENT */}
              <div className="form-group">
                <label className="field-label">
                  <Compass className="field-icon" /> Department <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Auto fetched or enter manually"
                  className="input-field"
                  readOnly
                />
                {errors.department && <div className="error-text">{errors.department}</div>}
              </div>

              {/* DOMAIN */}
              <div className="form-group">
                <label className="field-label">
                  <Globe className="field-icon" /> Domain <span className="required">*</span>
                </label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="" disabled>Select Domain</option>
                  {domainOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.domain && <div className="error-text">{errors.domain}</div>}
              </div>

              {/* TOPIC */}
              <div className="form-group">
                <label className="field-label">
                  <MessageSquare className="field-icon" /> Topic <span className="required">*</span>
                </label>
                <textarea
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="Add topic details"
                  rows="4"
                  className="textarea-field"
                ></textarea>
                {errors.topic && <div className="error-text">{errors.topic}</div>}
              </div>

              {/* REASON */}
              <div className="form-group">
                <label className="field-label">
                  <MessageSquare className="field-icon" /> Reason for Requesting the Topic <span className="required">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Explain why you are requesting this topic"
                  rows="4"
                  className="textarea-field"
                ></textarea>
                {errors.reason && <div className="error-text">{errors.reason}</div>}
              </div>

              {/* CAPTCHA */}
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="isRobot"
                  checked={formData.isRobot}
                  onChange={handleChange}
                  className="checkbox-field"
                />
                <label className="checkbox-label">I'm not a robot</label>
              </div>

              {/* SUBMIT */}
              <button onClick={handleSubmit} className="submit-btn">
                Submit
              </button>

            </div>
          </div>

          <p className="form-footer">Designed with 💜 for Alumni Network</p>

        </div>
      </div>

      {popup.show && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
}