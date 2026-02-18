// Frontend - RequesterFeedbackForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RequesterFeedbackForm.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RequesterFeedbackForm = ({ userEmail }) => {
  const [feedback, setFeedback] = useState("");
  const [autoData, setAutoData] = useState({
    userId: "",
    name: "",
    batch: "",
    mobile: "",
  });
  const [userRequest, setUserRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  // Fetch user details and check request on component mount
  useEffect(() => {
    if (userEmail) {
      fetchUserDetailsAndRequest();
      checkIfFeedbackSubmitted();
    }
  }, [userEmail]);

  // Check if user has already submitted feedback
  const checkIfFeedbackSubmitted = async () => {
    try {
      const encodedEmail = encodeURIComponent(userEmail);
      const userRes = await axios.get(
        `${API_BASE_URL}/api/members/email/${encodedEmail}`
      );

      if (userRes.data.success && userRes.data.member) {
        const userId = userRes.data.member._id;
        
        // Check if this user has submitted feedback
        const feedbackRes = await axios.get(
          `${API_BASE_URL}/api/requester-feedback/user/${userId}`
        );

        if (feedbackRes.data.success && feedbackRes.data.feedbacks.length > 0) {
          setHasSubmittedFeedback(true);
        }
      }
    } catch (err) {
      console.log("Error checking feedback status:", err);
    }
  };

  // Fetch user details and their job request
  const fetchUserDetailsAndRequest = async () => {
    try {
      setLoading(true);
      
      const encodedEmail = encodeURIComponent(userEmail);
      
      // Fetch user details
      const userRes = await axios.get(
        `${API_BASE_URL}/api/members/email/${encodedEmail}`
      );

      if (userRes.data.success && userRes.data.member) {
        const userId = userRes.data.member._id;
        
        if (!userId) {
          alert("User ID not found!");
          return;
        }

        setAutoData({
          userId: userId,
          name: userRes.data.member.name || "",
          batch: userRes.data.member.batch || "",
          mobile: userRes.data.member.mobile || "",
        });

        // Fetch user's job requests (most recent one)
        const requestsRes = await axios.get(
          `${API_BASE_URL}/api/job-requests/user/${userId}`
        );

        if (requestsRes.data.success && requestsRes.data.data && requestsRes.data.data.length > 0) {
          // Get the most recent request
          const mostRecentRequest = requestsRes.data.data[0];
          setUserRequest(mostRecentRequest);
        } else {
          setUserRequest(null);
        }
      } else {
        alert("User not found with this email!");
      }
    } catch (err) {
      console.log("Error fetching user:", err);
      alert("Error fetching user details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      alert("Please enter feedback!");
      return;
    }

    if (!autoData.userId) {
      alert("User details not loaded!");
      return;
    }

    if (!userRequest) {
      alert("No job request found. Please submit a job request first!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/requester-feedback/submit-feedback`,
        {
          alumni_user_id: autoData.userId,
          request_id: parseInt(userRequest.request_id),
          feedback_text: feedback
        }
      );

      if (response.data.success) {
        alert(`Feedback submitted successfully! Thank you for your feedback.`);
        setFeedback("");
        setHasSubmittedFeedback(true);
      } else {
        alert("Failed to submit feedback: " + response.data.message);
      }
    } catch (err) {
      console.error("Full error:", err);
      
      if (err.response) {
        alert(`Error: ${err.response.data.message || "Server error"}`);
      } else {
        alert("Error submitting feedback. Please try again.");
      }
    }
  };

  // If user has already submitted feedback
  if (hasSubmittedFeedback) {
    return (
      <div className="feedback-container">
        <div className="feedback-wrapper">
          <div className="feedback-header">
            <div className="feedback-icon" style={{ fontSize: '64px' }}>✅</div>
            <h2 className="feedback-title">Feedback Already Submitted</h2>
            <p className="feedback-subtitle">
              You have already submitted your feedback for your job request.
            </p>
          </div>
          <div style={{
            padding: '30px',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <p style={{ color: '#16a34a', fontSize: '16px', margin: 0 }}>
              Thank you for your valuable feedback! 🎉
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no job request found
  if (!loading && !userRequest) {
    return (
      <div className="feedback-container">
        <div className="feedback-wrapper">
          <div className="feedback-header">
            <div className="feedback-icon" style={{ fontSize: '64px' }}>⚠️</div>
            <h2 className="feedback-title">No Job Request Found</h2>
            <p className="feedback-subtitle">
              You need to submit a placement data request before providing feedback.
            </p>
          </div>
          <div style={{
            padding: '30px',
            background: 'rgba(234, 179, 8, 0.1)',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <p style={{ color: '#ca8a04', fontSize: '16px', marginBottom: '15px' }}>
              Please submit your placement data request first from the dashboard.
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Once your request is submitted, you'll be able to provide feedback here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-wrapper">
        <div className="feedback-header">
          <div className="feedback-icon">💼</div>
          <h2 className="feedback-title">Alumni Feedback</h2>
          <p className="feedback-subtitle">
            Share your feedback on the job request process
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7c3aed' }}>
            <p>Loading your details...</p>
          </div>
        ) : (
          <>
            {/* User Email Display */}
            <div className="feedback-field">
              <label className="feedback-label">
                <span className="feedback-label-icon">📧</span>
                Email ID
              </label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="feedback-input-disabled"
              />
            </div>

            {/* Auto-filled fields */}
            <div className="feedback-grid">
              <div className="feedback-field">
                <label className="feedback-label">Name</label>
                <input
                  type="text"
                  value={autoData.name}
                  disabled
                  className="feedback-input-disabled"
                />
              </div>
              <div className="feedback-field">
                <label className="feedback-label">Batch</label>
                <input
                  type="text"
                  value={autoData.batch}
                  disabled
                  className="feedback-input-disabled"
                />
              </div>
            </div>

            {/* Feedback section */}
            <div className="feedback-section">
              <label className="feedback-label">
                <span className="feedback-label-icon">💬</span>
                Feedback <span className="required-star">*</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience with the job request process, coordinator support, and any suggestions for improvement..."
                rows="6"
                className="feedback-textarea"
                required
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              className="feedback-submit-button"
              disabled={!autoData.userId || !userRequest || !feedback.trim()}
            >
              Submit Feedback
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RequesterFeedbackForm;