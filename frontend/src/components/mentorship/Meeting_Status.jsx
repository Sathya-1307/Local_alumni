import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './MeetingStatus.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MeetingStatusUpdateForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mentorEmailParam = searchParams.get('mentorEmail');
  const scheduledDateParam = searchParams.get('scheduledDate');
  const menteeEmailParam = searchParams.get('menteeEmail');
  const meetingIdParam = searchParams.get('meetingId');

  const [formData, setFormData] = useState({
    mentorEmail: mentorEmailParam || '',
    menteeEmail: menteeEmailParam || '',
    scheduledDate: scheduledDateParam || '',
    meetingStatus: '',
    meetingMinutes: '',
    postponedReason: '',
    phaseId: null, // ✅ Added phaseId
    phaseName: ''  // ✅ Added phaseName for display
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Added for button state
  const [menteeId, setMenteeId] = useState('');
  const [phases, setPhases] = useState([]); // ✅ Added phases state
  const [loadingPhase, setLoadingPhase] = useState(false); // ✅ Added loading state

  // Auto-scroll to top when submitted
  useEffect(() => {
    if (submitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitted]);

  // ================================
  // FETCH PHASES AND CURRENT ACTIVE PHASE
  // ================================
  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      setLoadingPhase(true);
      const res = await axios.get(`${API_BASE_URL}/api/phase`);
      const data = res.data;
      
      if (data.phases) {
        setPhases(data.phases);
        const currentPhase = data.phases.find(
          (p) => new Date(p.startDate) <= new Date() && new Date() <= new Date(p.endDate)
        );
        
        if (currentPhase) {
          setFormData((prev) => ({
            ...prev,
            phaseId: currentPhase.phaseId,
            phaseName: `${currentPhase.name} (${new Date(currentPhase.startDate).toLocaleDateString()} - ${new Date(currentPhase.endDate).toLocaleDateString()})`,
          }));
        } else {
          console.warn("No active phase found");
          setErrors(prev => ({ ...prev, phaseId: "No active phase found" }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch phases:", err);
      setErrors(prev => ({ ...prev, phaseId: "Failed to load phase information" }));
    } finally {
      setLoadingPhase(false);
    }
  };

  // ================================
  // FETCH MENTEE _id FROM EMAIL
  // ================================
  useEffect(() => {
    if (!mentorEmailParam || !scheduledDateParam || !menteeEmailParam) {
      alert("Missing required information. Redirecting to dashboard.");
      navigate("/scheduled_dashboard");
      return;
    }

    const fetchMenteeId = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/meeting-status/mentee/by-email?email=${encodeURIComponent(menteeEmailParam)}`
        );

        if (!res.data || !res.data._id) {
          throw new Error("Mentee not found");
        }

        setMenteeId(res.data._id);
      } catch (err) {
        console.error("❌ Error fetching mentee ID:", err);
        alert("Mentee not found. Redirecting to dashboard.");
        navigate("/scheduled_dashboard");
      }
    };

    fetchMenteeId();
  }, [mentorEmailParam, scheduledDateParam, menteeEmailParam, navigate]);

  // ================================
  // HANDLE INPUT CHANGE
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ================================
  // VALIDATION
  // ================================
  const validate = () => {
    const newErrors = {};
    
    if (!formData.meetingStatus) newErrors.meetingStatus = "Select meeting status";
    
    // ✅ Added phaseId validation
    if (!formData.phaseId) newErrors.phaseId = "No active phase found";

    if (formData.meetingStatus === "Completed" && !formData.meetingMinutes)
      newErrors.meetingMinutes = "Meeting minutes required";

    if (formData.meetingStatus === "Postponed" && !formData.postponedReason)
      newErrors.postponedReason = "Reason required";

    return newErrors;
  };

  // ================================
  // SUBMIT UPDATED STATUS
  // ================================
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!menteeId) {
      alert("Mentee ID missing. Cannot submit.");
      return;
    }

    // ✅ Check for phaseId before submission
    if (!formData.phaseId) {
      alert("No active phase found. Cannot update meeting status.");
      return;
    }

    setSubmitting(true);

    try {
      // ✅ Updated to include phaseId in the request
      await axios.post(`${API_BASE_URL}/api/meeting-status/update`, {
        mentorEmail: formData.mentorEmail,
        menteeIds: [menteeId],
        meetingId: meetingIdParam,
        status: formData.meetingStatus,
        meetingMinutes: formData.meetingMinutes || "",
        postponedReason: formData.postponedReason || "",
        phaseId: formData.phaseId // ✅ Added phaseId
      });

      setSubmitted(true);
      // Reset form after showing success message
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          meetingStatus: '',
          meetingMinutes: '',
          postponedReason: ''
        }));
        setErrors({});
        setSubmitted(false);
        setSubmitting(false);
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert(err.response?.data?.message || "Failed to update status");
      setSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper">
      <button onClick={() => navigate('/dashboard')} className="back-btn-corner">
        ← Back
      </button>

      <div className="form-container">
        <h1>Update Meeting Status</h1>
        
        {/* Enhanced Success Message */}
        {submitted && (
          <div className="success-message-container">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <div className="success-content">
                <h3 className="success-title">Meeting Status Updated Successfully!</h3>
                <p className="success-text">
                  Meeting status has been updated to <strong>{formData.meetingStatus}</strong>. 
                  You will be redirected to dashboard shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Added Phase Information Display */}
        <div className="form-group">
          <label>Current Phase *</label>
          {loadingPhase ? (
            <div className="loading-phase">
              <small>Loading phase information...</small>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={formData.phaseName || "No active phase found"}
                readOnly
                className={`input disabled-input ${!formData.phaseId ? 'input-warning' : ''}`}
              />
              {errors.phaseId && <p className="error-text">{errors.phaseId}</p>}
              {formData.phaseId && (
                <small style={{ color: "#8b5cf6", fontWeight: "600" }}>
                  ✓ Active phase selected
                </small>
              )}
            </>
          )}
        </div>

        <div className="form-group">
          <label>Mentor Email *</label>
          <input type="email" value={formData.mentorEmail} readOnly className="input" />
        </div>

        <div className="form-group">
          <label>Mentee Email *</label>
          <input type="email" value={formData.menteeEmail} readOnly className="input" />
        </div>

        <div className="form-group">
          <label>Scheduled Date *</label>
          <input
            type="text"
            value={new Date(formData.scheduledDate).toLocaleDateString()}
            readOnly
            className="input"
          />
        </div>

        <div className="form-group">
          <label>Meeting Status *</label>
          <select
            name="meetingStatus"
            value={formData.meetingStatus}
            onChange={handleChange}
            className="select"
            disabled={!formData.phaseId || submitting || submitted} // Added disabling states
          >
            <option value="">-- Select --</option>
            <option value="Completed">Completed</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {errors.meetingStatus && <p className="error-text">{errors.meetingStatus}</p>}
        </div>

        {formData.meetingStatus === "Completed" && (
          <div className="form-group">
            <label>Meeting Minutes *</label>
            <textarea
              name="meetingMinutes"
              value={formData.meetingMinutes}
              onChange={handleChange}
              className="textarea"
              disabled={!formData.phaseId || submitting || submitted}
            />
            {errors.meetingMinutes && <p className="error-text">{errors.meetingMinutes}</p>}
          </div>
        )}

        {formData.meetingStatus === "Postponed" && (
          <div className="form-group">
            <label>Postponed Reason *</label>
            <textarea
              name="postponedReason"
              value={formData.postponedReason}
              onChange={handleChange}
              className="textarea"
              disabled={!formData.phaseId || submitting || submitted}
            />
            {errors.postponedReason && <p className="error-text">{errors.postponedReason}</p>}
          </div>
        )}

        <button 
          onClick={handleSubmit} 
          className="submit-btn" 
          disabled={!formData.meetingStatus || !formData.phaseId || submitting || submitted}
        >
          {submitting ? (
            <>
              <span className="loading-spinner"></span>
              Updating...
            </>
          ) : submitted ? (
            "Updated!"
          ) : !formData.phaseId ? (
            "No Active Phase"
          ) : (
            "Update Status"
          )}
        </button>
      </div>
    </div>
  );
}