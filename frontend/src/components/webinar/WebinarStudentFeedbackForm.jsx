import React, { useState, useEffect } from "react";
import { GraduationCap, User, Mail, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Popup from './Popup';
import "./Common.css";

// Add API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function WebinarStudentFeedbackForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    webinar: "",
    speaker: "",
    q1: "",
    q2: "",
    feedback: "",
    phaseId: "",
    isRobot: false,
  });

  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  const validateFeedback = (value) => {
    const trimmed = value.trim();

    // Check if empty
    if (trimmed === "") return "Feedback is required";

    // Check minimum length (1 character)
    if (trimmed.length < 1) return "Feedback must be at least 1 character long";

    // Check maximum length (500 characters)
    if (trimmed.length > 500) return "Feedback cannot exceed 500 characters";

    // Check for line breaks
    if (value.includes('\n') || value.includes('\r')) return "Line breaks are not allowed";

    return "";
  };

  // Function to filter input - allow English letters, numbers, spaces, punctuation
  const filterFeedbackInput = (value) => {
    // Remove line breaks and carriage returns
    let filtered = value.replace(/[\n\r]/g, '');

    // Allow: English letters (a-z, A-Z), numbers (0-9), spaces, and common punctuation
    // Block: emojis, Tamil letters, other non-English characters
    filtered = filtered.replace(/[^\w\s.,!?'"()-]/g, '');

    return filtered;
  };

  // Auto-fill Name when Email is typed
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!formData.email || formData.email.length < 5) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/member-by-email?email=${formData.email}`
        );
        const data = await res.json();

        console.log("Fetched member:", data);

        if (data?.found) {
          setFormData((prev) => ({
            ...prev,
            name: data.name || "",
          }));
        } else {
          console.log("No member found for entered email");
        }
      } catch (err) {
        console.error("Error fetching member:", err);
      }
    };

    fetchMemberDetails();
  }, [formData.email]);

  // Auto-fill webinar, speaker, phaseId, and email from URL params
  useEffect(() => {
    const topic = searchParams.get('topic');
    const speaker = searchParams.get('speaker');
    const phaseId = searchParams.get('phaseId');
    const email = searchParams.get('email');

    if (topic && speaker) {
      setFormData((prev) => ({
        ...prev,
        webinar: topic,
        speaker: speaker,
        phaseId: phaseId || "",
        ...(email && { email: email }),
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    // Apply input filtering for feedback field
    if (name === 'feedback') {
      newValue = filterFeedbackInput(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate feedback field
    if (name === 'feedback') {
      const error = validateFeedback(newValue);
      setErrors(prev => ({ ...prev, feedback: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.isRobot) {
      setPopup({ show: true, message: 'Please verify that you are not a robot', type: 'error' });
      return;
    }

    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.webinar) newErrors.webinar = 'Webinar is required';
    if (!formData.speaker) newErrors.speaker = 'Speaker is required';
    if (!formData.q1) newErrors.q1 = 'Please rate the quality of the webinar';
    if (!formData.q2) newErrors.q2 = 'Please rate the speaker';
    if (!formData.feedback) newErrors.feedback = 'Feedback is required';
    else {
      const feedbackError = validateFeedback(formData.feedback);
      if (feedbackError) newErrors.feedback = feedbackError;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/submit-student-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            webinar: formData.webinar,
            speaker: formData.speaker,
            q1: parseInt(formData.q1),
            q2: parseInt(formData.q2),
            feedback: formData.feedback,
            phaseId: parseInt(formData.phaseId),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setPopup({ show: true, message: 'Feedback submitted successfully! 🎉', type: 'success' });

          // Reset form data after successful submission
          setFormData({
            name: "",
            email: "",
            webinar: "",
            speaker: "",
            q1: "",
            q2: "",
            feedback: "",
            phaseId: "",
            isRobot: false,
          });
        } else {
          setPopup({ show: true, message: data.error || 'Failed to submit feedback', type: 'error' });
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        setPopup({ show: true, message: 'Network error. Please try again.', type: 'error' });
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
            <ArrowLeft className="back-btn-icon" /> Back to Dashboard
          </button>

          <div className="form-header">
            <div className="icon-wrapper">
              <GraduationCap className="header-icon" />
            </div>
            <h1 className="form-title">Student Feedback Form</h1>
            <p className="webinar-subtitle">
              Provide your feedback for the attended webinar
            </p>
          </div>

          <div className="form-card">
            <form className="form-fields" onSubmit={handleSubmit} noValidate>
              
              {/* Email */}
              <div className="form-group">
                <label className="field-label">
                  <Mail className="field-icon" /> Personal Email ID{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input-field"
                  required
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="field-label">
                  <User className="field-icon" /> Name{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Auto fetched from email"
                  className="input-field"
                  required
                  readOnly
                />
              </div>

              {/* Webinar */}
              <div className="form-group">
                <label className="field-label">Webinar Attended <span className="required">*</span></label>
                <input
                  type="text"
                  name="webinar"
                  value={formData.webinar}
                  onChange={handleChange}
                  placeholder="Auto filled from webinar card"
                  className="input-field"
                  readOnly
                />
              </div>

              {/* Speaker */}
              <div className="form-group">
                <label className="field-label">Speaker <span className="required">*</span></label>
                <input
                  type="text"
                  name="speaker"
                  value={formData.speaker}
                  onChange={handleChange}
                  placeholder="Auto filled from webinar card"
                  className="input-field"
                  readOnly
                />
              </div>

              {/* Ratings */}
              <div className="form-group">
                <label className="field-label">
                  1. Rate the quality of the webinar <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label key={val}>
                      <input type="radio" name="q1" value={val} onChange={handleChange} /> {val}
                    </label>
                  ))}
                </div>
                {errors.q1 && <div className="error-text">{errors.q1}</div>}
              </div>

              <div className="form-group">
                <label className="field-label">
                  2. Rate the speaker <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <label key={val}>
                      <input type="radio" name="q2" value={val} onChange={handleChange} /> {val}
                    </label>
                  ))}
                </div>
                {errors.q2 && <div className="error-text">{errors.q2}</div>}
              </div>

              {/* Feedback */}
              <div className="form-group">
                <label className="field-label">
                  Additional feedback <span className="required">*</span>
                </label>
                <textarea
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleChange}
                  placeholder="Write your feedback..."
                  className="textarea-field"
                ></textarea>
                {errors.feedback && <div className="error-text">{errors.feedback}</div>}
              </div>

              {/* Robot Check */}
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

              <button type="submit" className="submit-btn">
                Submit Feedback
              </button>

            </form>
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