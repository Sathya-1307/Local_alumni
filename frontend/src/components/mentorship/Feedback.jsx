import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ProgramFeedback.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ProgramFeedbackForm() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from URL params or localStorage
  const getEmailFromSource = () => {
    const params = new URLSearchParams(location.search);
    const urlEmail = params.get('email');
    if (urlEmail) return decodeURIComponent(urlEmail);
    
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) return storedEmail;
    
    return "";
  };

  const [formData, setFormData] = useState({
    email: getEmailFromSource(),
    name: "",
    role: "",
    programOrganization: 0,
    matchingProcess: 0,
    supportProvided: 0,
    overallSatisfaction: 0,
    generalFeedback: "",
    suggestions: "",
    participateAgain: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailFetched, setEmailFetched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailTimeoutRef = useRef(null);

  // Auto-scroll to top when submitted
  useEffect(() => {
    if (submitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitted]);

  // Fetch user data when email is available on component mount
  useEffect(() => {
    if (formData.email && formData.email.trim()) {
      const trimmedEmail = formData.email.toLowerCase().trim();
      if (/\S+@\S+\.\S+/.test(trimmedEmail)) {
        setTimeout(() => {
          fetchUserByEmail(trimmedEmail);
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    // Autofetch name based on email
    if (name === "email") {
      setEmailFetched(false);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);

      const trimmed = value.trim();
      if (!trimmed) {
        setFormData((prev) => ({ ...prev, name: "" }));
        return;
      }

      emailTimeoutRef.current = setTimeout(() => {
        if (/\S+@\S+\.\S+/.test(trimmed)) {
          fetchUserByEmail(trimmed.toLowerCase());
        }
      }, 600);
    }
  };

  const fetchUserByEmail = async (email) => {
    try {
      setLoadingEmail(true);
      const res = await fetch(
        `${API_BASE_URL}/api/program-feedback/get-user-by-email?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (res.ok && data.name) {
        setFormData((prev) => ({ ...prev, name: data.name }));
        setEmailFetched(true);
      } else {
        setFormData((prev) => ({ ...prev, name: "" }));
        setEmailFetched(false);
        setErrors((prev) => ({ ...prev, email: data.message || "Email not found" }));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: "Connection failed. Is backend running?" }));
      setFormData((prev) => ({ ...prev, name: "" }));
      setEmailFetched(false);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleRatingChange = (category, rating) => {
    setFormData((prev) => ({ ...prev, [category]: rating }));
    if (errors[category]) setErrors((prev) => ({ ...prev, [category]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.name) newErrors.name = "Name not found";
    if (!formData.role) newErrors.role = "Role is required";
    if (formData.programOrganization === 0) newErrors.programOrganization = "Rating required";
    if (formData.matchingProcess === 0) newErrors.matchingProcess = "Rating required";
    if (formData.supportProvided === 0) newErrors.supportProvided = "Rating required";
    if (formData.overallSatisfaction === 0) newErrors.overallSatisfaction = "Rating required";
    if (!formData.generalFeedback) newErrors.generalFeedback = "General feedback required";
    if (!formData.suggestions) newErrors.suggestions = "Suggestions required";
    if (!formData.participateAgain) newErrors.participateAgain = "Select an option";

    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/program-feedback/submit-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          role: formData.role,
          programOrganization: formData.programOrganization,
          matchingProcess: formData.matchingProcess,
          supportProvided: formData.supportProvided,
          overallSatisfaction: formData.overallSatisfaction,
          generalFeedback: formData.generalFeedback,
          suggestions: formData.suggestions,
          participateAgain: formData.participateAgain,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setFormData({
            email: formData.email, // Keep the email
            name: "",
            role: "",
            programOrganization: 0,
            matchingProcess: 0,
            supportProvided: 0,
            overallSatisfaction: 0,
            generalFeedback: "",
            suggestions: "",
            participateAgain: "",
          });
          setErrors({});
          setEmailFetched(false);
          setSubmitted(false);
        }, 2500);
      } else {
        alert(data.message || "Failed to submit feedback");
      }
    } catch (err) {
      alert("Check backend or internet connection");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ category, value, label, error }) => (
    <div className="rating-group">
      <label className="label">{label} <span className="required">*</span></label>
      <div className="star-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="star-button"
            disabled={submitting || submitted}
          >
            <svg viewBox="0 0 24 24" className={`star ${star <= value ? "star-filled" : "star-empty"}`}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        ))}
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="form-wrapper">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <button className="dashboard-btn" onClick={handleGoBack}>
        ← Back to Dashboard
      </button>

      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">Program Feedback</h1>
          <p className="form-subtitle">
            {formData.email ? `Providing feedback as: ${formData.email}` : "Share your experience with us"}
          </p>
        </div>

        <div className="form-card">
          {/* Enhanced Success Message */}
          {submitted && (
            <div className="success-message-container">
              <div className="success-message">
                <div className="success-icon">✓</div>
                <div className="success-content">
                  <h3 className="success-title">Feedback Submitted Successfully!</h3>
                  <p className="success-text">
                    Thank you for sharing your valuable feedback. Your input helps us improve the mentorship program.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="form-content">
            {/* EMAIL - Read-only if auto-filled */}
            <div className="form-group">
              <label className="label">Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. your.email@example.com"
                className={`input ${errors.email ? "input-error" : ""} ${getEmailFromSource() ? 'disabled-input' : ''}`}
                disabled={submitting || submitted || (!!getEmailFromSource())}
                readOnly={!!getEmailFromSource()}
              />
              {getEmailFromSource() && (
                <small className="info-text">Email auto-filled from dashboard</small>
              )}
              {loadingEmail && <small className="loading-text">Searching user...</small>}
              {errors.email && <span className="error-text">{errors.email}</span>}
              {emailFetched && !errors.email && <small style={{ color: "#10b981" }}>User found!</small>}
            </div>

            {/* NAME */}
            <div className="form-group">
              <label className="label">Name <span className="required">*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                disabled 
                className="input disabled-input" 
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* ROLE */}
            <div className="form-group">
              <label className="label">Role <span className="required">*</span></label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`select ${errors.role ? "input-error" : ""}`}
                disabled={submitting || submitted}
              >
                <option value="">-- Select Role --</option>
                <option value="Mentor">Mentor</option>
                <option value="Mentee">Mentee</option>
                <option value="Coordinator">Coordinator</option>
              </select>
              {errors.role && <span className="error-text">{errors.role}</span>}
            </div>

            {/* STAR RATINGS */}
            <StarRating 
              category="programOrganization" 
              value={formData.programOrganization} 
              label="Program Organization" 
              error={errors.programOrganization} 
            />
            <StarRating 
              category="matchingProcess" 
              value={formData.matchingProcess} 
              label="Matching Process" 
              error={errors.matchingProcess} 
            />
            <StarRating 
              category="supportProvided" 
              value={formData.supportProvided} 
              label="Support Provided" 
              error={errors.supportProvided} 
            />
            <StarRating 
              category="overallSatisfaction" 
              value={formData.overallSatisfaction} 
              label="Overall Satisfaction" 
              error={errors.overallSatisfaction} 
            />

            {/* GENERAL FEEDBACK */}
            <div className="form-group">
              <label className="label">General Feedback <span className="required">*</span></label>
              <textarea
                name="generalFeedback"
                value={formData.generalFeedback}
                onChange={handleChange}
                rows="4"
                className={`textarea ${errors.generalFeedback ? "input-error" : ""}`}
                disabled={submitting || submitted}
                placeholder="What did you like about the program? Any specific experiences to share?"
              />
              {errors.generalFeedback && <span className="error-text">{errors.generalFeedback}</span>}
            </div>

            {/* SUGGESTIONS */}
            <div className="form-group">
              <label className="label">Suggestions <span className="required">*</span></label>
              <textarea
                name="suggestions"
                value={formData.suggestions}
                onChange={handleChange}
                rows="4"
                className={`textarea ${errors.suggestions ? "input-error" : ""}`}
                disabled={submitting || submitted}
                placeholder="How can we improve the program? Any features or processes you'd like to see changed?"
              />
              {errors.suggestions && <span className="error-text">{errors.suggestions}</span>}
            </div>

            {/* PARTICIPATE AGAIN */}
            <div className="form-group">
              <label className="label">Would you participate again? <span className="required">*</span></label>
              <select
                name="participateAgain"
                value={formData.participateAgain}
                onChange={handleChange}
                className={`select ${errors.participateAgain ? "input-error" : ""}`}
                disabled={submitting || submitted}
              >
                <option value="">-- Select Option --</option>
                <option value="Yes">Yes, definitely</option>
                <option value="Maybe">Maybe, depending on circumstances</option>
                <option value="No">No, probably not</option>
              </select>
              {errors.participateAgain && <span className="error-text">{errors.participateAgain}</span>}
            </div>

            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={submitting || loadingEmail || submitted}
            >
              {submitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Submitting...
                </>
              ) : submitted ? (
                "Submitted!"
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}