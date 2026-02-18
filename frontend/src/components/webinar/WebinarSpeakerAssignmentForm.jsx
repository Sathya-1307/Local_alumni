import { Building2, Clock, Compass, Globe, Upload, Calendar, X ,User,ArrowLeft, MapPin} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import './Common.css';
import Popup from './Popup';

// Add API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const typeOptions = [
  { value: "Full Stack Development", label: "FULL STACK DEVELOPMENT" },
  { value: "Cloud Computing", label: "CLOUD COMPUTING" },
  { value: "Artificial Intelligence & Data Science", label: "ARTIFICIAL INTELLIGENCE & DATA SCIENCE" },
  { value: "Robotic and Automation", label: "ROBOTIC AND AUTOMATION" },
  { value: "Electrical Power System", label: "ELECTRICAL POWER SYSTEM" },
  { value: "Embedded Systems", label: "EMBEDDED SYSTEMS" },
  { value: "Structural Engineering", label: "STRUCTURAL ENGINEERING" }
];

export default function WebinarSpeakerAssignmentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', name: '', department: '', batch: '', designation: '', companyName: '', speakerPhoto: null, domain: '', topic: '', webinarVenue: '', alumniCity: '', webinarType: 'In Person', meetingLink: ''
  });
  const [slots, setSlots] = useState([{ deadline: '2024-12-15', webinarDate: '', time: '9:30-10:30' }]);
  const [showPoster, setShowPoster] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [domains, setDomains] = useState([]);
  const [errors, setErrors] = useState({});
  const [existingWebinars, setExistingWebinars] = useState([]);

  const designationRef = useRef(null);
  const companyNameRef = useRef(null);
  const alumniCityRef = useRef(null);
  const webinarVenueRef = useRef(null);
  const meetingLinkRef = useRef(null);
  const speakerPhotoRef = useRef(null);

  const refs = {
    designation: designationRef,
    companyName: companyNameRef,
    alumniCity: alumniCityRef,
    webinarVenue: webinarVenueRef,
    meetingLink: meetingLinkRef,
    speakerPhoto: speakerPhotoRef,
  };

  useEffect(() => {
    if (formData.speakerPhoto) {
      const url = URL.createObjectURL(formData.speakerPhoto);
      setPhotoURL(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.speakerPhoto]);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!formData.domain) {
        setTopics([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/topic-approvals`);
        const data = await response.json();
        console.log('Fetched topic approvals:', data);
        console.log('formData.domain:', formData.domain);
        const filteredTopics = data.filter(topic => {
          const topicDomainNormalized = topic.domain.toLowerCase().replace(/\s*\([^)]*\)\s*$/, '');
          const formDomainNormalized = formData.domain.toLowerCase().replace(/\s*\([^)]*\)\s*$/, '');
          const domainMatch = topicDomainNormalized === formDomainNormalized;
          const approvalMatch = topic.approval === 'Approved' || topic.approval === 'On Hold';
          console.log(`Topic: ${topic.topic}, domain: ${topic.domain}, approval: ${topic.approval}, domainMatch: ${domainMatch}, approvalMatch: ${approvalMatch}`);
          return domainMatch && approvalMatch;
        });
        console.log('Filtered topics:', filteredTopics);
        setTopics(filteredTopics);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };
    fetchTopics();
  }, [formData.domain]);

  useEffect(() => {
    const fetchCurrentPhase = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/current-phase`);
        const data = await response.json();
        if (data.found) {
          setCurrentPhase(data);
          setFormData(prev => ({ ...prev, phaseId: data.phaseId }));
        }
      } catch (error) {
        console.error('Error fetching current phase:', error);
      }
    };
    fetchCurrentPhase();
  }, []);

  useEffect(() => {
    if (currentPhase && currentPhase.domains) {
      const phaseDomains = currentPhase.domains.map(domain => ({
        value: domain.domain,
        label: domain.domain.toUpperCase()
      }));
      setDomains(phaseDomains);
    } else {
      // If no current phase, use static domains
      setDomains(typeOptions.map(option => ({
        value: option.value,
        label: option.label
      })));
    }
  }, [currentPhase]);

  useEffect(() => {
    const fetchExistingWebinars = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/webinars`);
        const data = await response.json();
        setExistingWebinars(data);
      } catch (error) {
        console.error('Error fetching existing webinars:', error);
      }
    };
    fetchExistingWebinars();
  }, []);

  const sanitizeText = (value) =>
    value
      .replace(/\s+/g, " ")
      .trim();

  const validateAlphabeticField = (field, value) => {
    const cleaned = sanitizeText(value);
    const alphaRegex = /^[A-Za-z ]+$/;

    if (!cleaned) return "This field is required";
    if (!alphaRegex.test(cleaned)) return "Only English letters and spaces are allowed";
    if (cleaned.length < 2) return "Minimum 2 characters required";
    if (cleaned.length > 50) return "Maximum 50 characters allowed";
    if (/(.)\1{3,}/.test(cleaned)) return "Repeated characters not allowed";

    return "";
  };

  const validateMeetingLink = (value) => {
    const cleaned = value.trim();
    const urlRegex = /^(https:\/\/)[^\s]+$/i;

    if (!cleaned) return "Meeting link is required";
    if (!urlRegex.test(cleaned))
      return "Enter a valid URL starting with https://";
    return "";
  };

  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "designation":
      case "companyName":
      case "alumniCity":
      case "webinarVenue":
        error = validateAlphabeticField(field, value);
        break;

      case "meetingLink":
        error = validateMeetingLink(value);
        break;

      default:
        return true;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    let newValue = files ? files[0] : value;

    if (!files && typeof value === "string") {
      // Filter input for alphabetic fields to only allow English letters and spaces
      if (['designation', 'companyName', 'alumniCity', 'webinarVenue'].includes(name)) {
        newValue = value.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, " ");
      } else {
        newValue = value.replace(/\s+/g, " ");
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (errors[name]) validateField(name, newValue);
  };

  const handleSlotChange = (index, field, value) => {
    const updated = [...slots];
    updated[index][field] = value;

    // If webinarDate is changed, ensure deadline is before it
    if (field === 'webinarDate' && updated[index].deadline && new Date(updated[index].deadline) >= new Date(value)) {
      updated[index].deadline = ''; // Reset deadline if it's not before the new webinar date
    }

    setSlots(updated);
  };

  const removeSlot = index => setSlots(slots.filter((_, i) => i !== index));

  const fetchMemberDetails = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/member-by-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data.found) {
        setFormData(prev => ({
          ...prev,
          name: data.name,
          department: data.department,
          batch: data.batch
        }));
      } else {
        setPopup({ show: true, message: 'Alumni not found with this email', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setPopup({ show: true, message: 'Error fetching alumni details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    const fieldsToValidate = ['designation', 'companyName', 'alumniCity', 'webinarVenue'];
    let hasErrors = false;
    let firstErrorField = null;

    // Only validate meetingLink if webinarType is Online
    if (formData.webinarType === 'Online') {
      fieldsToValidate.push('meetingLink');
    }

    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        hasErrors = true;
        if (!firstErrorField) firstErrorField = field;
      }
    });

    // Validate speaker photo
    if (!formData.speakerPhoto) {
      setErrors(prev => ({ ...prev, speakerPhoto: "Speaker photo is required" }));
      hasErrors = true;
      if (!firstErrorField) firstErrorField = 'speakerPhoto';
    } else {
      setErrors(prev => ({ ...prev, speakerPhoto: "" }));
    }

    if (hasErrors) {
      if (refs[firstErrorField]?.current) {
        refs[firstErrorField].current.focus();
      }
      setPopup({ show: true, message: 'Please correct the errors in the form', type: 'error' });
      return;
    }

    if (!formData.email || !formData.name || !formData.department || !formData.batch || !formData.designation ||
        !formData.companyName || !formData.speakerPhoto || !formData.domain || !formData.topic ||
        (formData.webinarType === 'Online' && !formData.meetingLink) || slots.some(s => !s.deadline || !s.webinarDate || !s.time)) {
      setPopup({ show: true, message: 'Please fill all required fields', type: 'error' });
      return;
    }



    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('designation', formData.designation.trim());
      formDataToSend.append('companyName', formData.companyName.trim());
      formDataToSend.append('alumniCity', formData.alumniCity.trim());
      formDataToSend.append('domain', formData.domain);
      formDataToSend.append('topic', formData.topic);
      formDataToSend.append('webinarVenue', formData.webinarVenue.trim());
      formDataToSend.append('meetingLink', formData.meetingLink.trim());
      formDataToSend.append('speakerPhoto', formData.speakerPhoto);
      formDataToSend.append('phaseId', formData.phaseId);
      formDataToSend.append('slots', JSON.stringify(slots));

      const response = await fetch(`${API_BASE_URL}/api/assign-speaker`, {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setPopup({ show: true, message: 'Speaker assigned successfully! 🎉', type: 'success' });
      } else {
        const errorData = await response.json();
        setPopup({ show: true, message: errorData.error || 'Error assigning speaker', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setPopup({ show: true, message: 'Error assigning speaker', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePoster = () => {
    if (!formData.name || !formData.department || !formData.batch || !formData.designation ||
        !formData.companyName || !formData.speakerPhoto || !formData.domain || !formData.topic ||
        slots.some(s => !s.deadline || !s.webinarDate || !s.time)) {
      alert("Please fill all required fields before generating the poster");
      return;
    }
    setShowPoster(!showPoster);
  };

  return (
    <div className="student-form-page">
      {/* Background Orbs */}
      <div className="background-orbs">
        <div className="orb orb-purple"></div>
        <div className="orb orb-blue animation-delay-2000"></div>
        <div className="orb orb-pink animation-delay-4000"></div>
      </div>

      <div className="form-wrapper">
        <div >
          <button className="back-btn" onClick={() => navigate("/webinar-dashboard")}>
            <ArrowLeft className="back-btn-icon" /> Back to Dashboard
          </button>
          <div className="form-header">
            <div className="icon-wrapper">
              <Building2 className="header-icon" />
            </div>
            <h1 className="form-title">Speaker Assignment Form</h1>
            {currentPhase && (
              <p className="current-phase">Current Phase: {currentPhase.phaseId}</p>
            )}
          </div>
          <div className="form-card">
            <div className="form-fields">
              <h2 className="section-heading">Speaker Details</h2>
                <div className="form-row" style={{ display: "flex", gap: "20px" }}>
                  
                  {/* Email Field */}
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="field-label">
                      <User className="field-icon" /> Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={(e) => fetchMemberDetails(e.target.value)}
                      placeholder="Enter alumni email"
                      className="input-field"
                    />
                    {loading && (
                      <p className="text-sm text-gray-500 mt-1">Fetching details...</p>
                    )}
                  </div>

                  {/* Name Field */}
                  <div className="form-group" style={{ flex: 1 }}>
                   <label className="field-label">
                      <User className="field-icon" /> Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter name"
                      className="input-field"
                      readOnly
                    />
                  </div>

                </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="field-label">
                    <Building2 className="field-icon" /> Department <span className="required">*</span>
                  </label>
                  <input type="text" name="department" value={formData.department} readOnly className="input-field bg-gray-100" />
                </div>
              <div className="form-group">
                <label className="field-label">
                    <Globe className="field-icon" /> Batch <span className="required">*</span>
                  </label>
                  <input type="text" name="batch" value={formData.batch} readOnly className="input-field bg-gray-100" />
                </div>

              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="field-label">
                    <Compass className="field-icon" /> Designation <span className="required">*</span>
                  </label>
                  <input
                    ref={designationRef}
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Enter designation"
                    maxLength="50"
                    className={`input-field ${errors.designation ? 'border-red-500' : ''}`}
                  />
                  {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
                </div>
              <div className="form-group">
                <label className="field-label">
                    <Building2 className="field-icon" /> Company Name <span className="required">*</span>
                  </label>
                  <input
                    ref={companyNameRef}
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    maxLength="50"
                    className={`input-field ${errors.companyName ? 'border-red-500' : ''}`}
                  />
                  {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                </div>
              </div>
              

              {/* Company + Photo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="field-label">
                    <Globe className="field-icon" /> Alumni City <span className="required">*</span>
                  </label>
                  <input
                    ref={alumniCityRef}
                    type="text"
                    name="alumniCity"
                    value={formData.alumniCity}
                    onChange={handleChange}
                    onBlur={(e) => validateField("alumniCity", e.target.value)}
                    placeholder="Enter city"
                    maxLength="50"
                    className={`input-field ${errors.alumniCity ? 'border-red-500' : ''}`}
                  />
                  {errors.alumniCity && <p className="text-red-500 text-sm mt-1">{errors.alumniCity}</p>}
                </div>
              <div className="form-group">
                <label className="field-label">
                    <Upload className="field-icon" /> Speaker Photo <span className="required">*</span>
                  </label>
                  <input type="file" name="speakerPhoto" id="speaker-photo-upload" accept="image/*" className="input-field hidden" onChange={handleChange} />
                  <label
                    ref={speakerPhotoRef}
                    htmlFor="speaker-photo-upload"
                    className={`field-label input-field cursor-pointer flex items-center gap-2 ${errors.speakerPhoto ? 'border-red-500' : ''}`}
                  >
                    <Upload className="field-icon" /> {formData.speakerPhoto ? formData.speakerPhoto.name : "Choose photo or drag here"}
                  </label>
                  {errors.speakerPhoto && <p className="text-red-500 text-sm mt-1">{errors.speakerPhoto}</p>}
                </div>
              </div>

              {/* Domain */}
              <h2 className="section-heading">Webinar Details</h2>
              <div className="form-group">
                <label className="field-label">
                  <Globe className="field-icon" /> Domain <span className="required">*</span>
                </label>

                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Domain</option>
                  {domains.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Webinar Topic */}
              <div className="form-group">
                <label className="field-label">
                  <Building2 className="field-icon" /> Webinar Topic <span className="required">*</span>
                </label>

                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Webinar Topic</option>
                  {topics.map(topic => (
                    <option key={topic._id} value={topic.topic}>{topic.topic}</option>
                  ))}
                </select>
              </div>

              {/* Webinar Venue and Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="field-label">
                    <MapPin className="field-icon" /> Webinar Venue <span className="required">*</span>
                  </label>
                  <input
                    ref={webinarVenueRef}
                    type="text"
                    name="webinarVenue"
                    value={formData.webinarVenue}
                    onChange={handleChange}
                    placeholder="Enter venue"
                    maxLength="50"
                    className={`input-field ${errors.webinarVenue ? 'border-red-500' : ''}`}
                  />
                  {errors.webinarVenue && <p className="text-red-500 text-sm mt-1">{errors.webinarVenue}</p>}
                </div>
                {/* Webinar Type */}
              <div className="form-group">
                <label className="field-label">
                  <Globe className="field-icon" /> Webinar Type <span className="required">*</span>
                </label>
                <select
                  name="webinarType"
                  value={formData.webinarType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="In Person">In Person</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              </div>

              {/* Meeting Link - Only show if Online */}
              {formData.webinarType === 'Online' && (
                <div className="form-group">
                  <label className="field-label">
                    <Globe className="field-icon" /> Meeting Link <span className="required">*</span>
                  </label>
                  <input
                    ref={meetingLinkRef}
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleChange}
                    placeholder="Enter meeting link (https://...)"
                    className={`input-field ${errors.meetingLink ? 'border-red-500' : ''}`}
                  />
                  {errors.meetingLink && <p className="text-red-500 text-sm mt-1">{errors.meetingLink}</p>}
                </div>
              )}
              {/* Assign Slot */}
              <h2 className="section-heading">Assign Slot</h2>
              {slots.map((slot, i) => (
                <div key={i} className="slot-card relative grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* <button type="button" onClick={() => removeSlot(i)} className="remove-slot absolute top-2 right-2">
                    <X className="field-icon" />
                  </button> */}
                  <div className="form-group">
                    <label className="field-label">
                      <Calendar className="field-icon" /> WebinarDate <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={slot.webinarDate}
                      onChange={e => handleSlotChange(i, "webinarDate", e.target.value)}
                      placeholder="Select date"
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">
                      <Calendar className="field-icon" /> Deadline <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={slot.deadline}
                      onChange={e => handleSlotChange(i, "deadline", e.target.value)}
                      placeholder="Select date"
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                      max={slot.webinarDate || undefined}
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">
                      <Clock className="field-icon" /> Time <span className="required">*</span>
                    </label>
                    <select value={slot.time} onChange={e => handleSlotChange(i, "time", e.target.value)} className="input-field">
                      <option value="">Select time slot</option>
                      <option value="9:30-10:30">9:30-10:30</option>
                      <option value="10:30-11:30">10:30-11:30</option>
                      <option value="11:30-12:30">11:30-12:30</option>
                      <option value="12:30-1:30">12:30-1:30</option>
                      <option value="1:30-2:30">1:30-2:30</option>
                      <option value="2:30-3:30">2:30-3:30</option>
                      <option value="3:30-4:30">3:30-4:30</option>
                    </select>
                  </div>
                </div>
              ))}

              {/* Buttons */}
              <button onClick={handleSubmit} className="submit-btn">Assign Speaker</button>
            </div>
          </div>

          <p className="form-footer">Designed with 💜 for Alumni Network</p>

          {showPoster && (
            <div className="mt-8 flex justify-center">
              <WebinarPoster
                alumniPhoto={photoURL}
                webinarTopic={formData.domain}
                webinarDate={slots[0]?.webinarDate || ''}
                webinarTime={slots[0]?.time || ''}
                webinarVenue={formData.webinarVenue}
                alumniName={formData.name}
                alumniDesignation={formData.designation}
                alumniCompany={formData.companyName}
                alumniCity={formData.alumniCity}
                alumniBatch={formData.batch}
                alumniDepartment={formData.department}
              />
            </div>
          )}

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