// Frontend - PlacementFeedbackForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PlacementFeedbackForm.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PlacementFeedbackForm = () => {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [autoData, setAutoData] = useState({
    userId: "",        // MongoDB _id as string
    name: "",
    batch: "",
    mobile: "",
    hasRequested: false,
    requestStatus: null
  });
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [dropdownEmails, setDropdownEmails] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Function to validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fetch all placement request emails on component mount
  useEffect(() => {
    fetchPlacementRequestEmails();
  }, []);

  // Function to fetch all emails from placement requests
  const fetchPlacementRequestEmails = async () => {
    try {
      setLoadingEmails(true);

      const res = await axios.get(`${API_BASE_URL}/api/placement-requests`);

      if (res.data.success && res.data.data) {
        // Extract unique emails from placement requests
        const uniqueEmails = [...new Set(res.data.data
          .filter(item => item.userEmail && item.userEmail !== 'N/A')
          .map(item => item.userEmail))];
        
        setDropdownEmails(uniqueEmails);
      }
    } catch (err) {
      console.error("Error fetching placement request emails:", err);
    } finally {
      setLoadingEmails(false);
    }
  };

  // Fetch user details from backend
  const fetchUserDetails = async (emailValue) => {
    // Validate email format
    if (!isValidEmail(emailValue)) {
      setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
      return;
    }

    try {
      setLoading(true);
      
      // Encode email to handle special characters
      const encodedEmail = encodeURIComponent(emailValue);
      
      // First check if user has placement request
      const placementCheckRes = await axios.get(
        `${API_BASE_URL}/api/placement-requests/check/${encodedEmail}`
      );

      if (placementCheckRes.data.success && !placementCheckRes.data.hasRequested) {
        alert("This user has not submitted any placement request! Only users with placement requests can give feedback.");
        setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
        setEmail("");
        return;
      }

      // If user has placement request, fetch their details
      const res = await axios.get(
        `${API_BASE_URL}/api/members/email/${encodedEmail}`
      );

      console.log("Backend response:", res.data);

      if (res.data.success && res.data.member) {
        // Get MongoDB _id as string
        const userId = res.data.member._id;
        
        if (!userId) {
          alert("User ID not found!");
          setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
          return;
        }

        setAutoData({
          userId: userId, // MongoDB _id string
          name: res.data.member.name || "",
          batch: res.data.member.batch || "",
          mobile: res.data.member.mobile || "",
          hasRequested: placementCheckRes.data.hasRequested,
          requestStatus: placementCheckRes.data.requestStatus
        });
      } else {
        setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
        alert("User not found with this email!");
      }
    } catch (err) {
      console.log("Error fetching user:", err);
      setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
      
      if (err.response && err.response.status === 404) {
        alert("User not found with this email!");
      } else {
        alert("Error fetching user details. Please try again.");
      }
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  // Handle email input with debounce
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setShowDropdown(true);

    // Filter dropdown based on input
    if (value.trim()) {
      const filtered = dropdownEmails.filter(email => 
        email.toLowerCase().includes(value.toLowerCase())
      );
      // Update dropdown with filtered results
      // Keep all emails in state but only show filtered ones
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    // Only fetch if email looks valid (has @ and .)
    if (value.includes("@") && value.includes(".") && value.length > 5) {
      setTypingTimeout(
        setTimeout(() => {
          fetchUserDetails(value);
        }, 500)
      );
    } else {
      // Clear data if email is not valid
      setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
    }
  };

  // Handle email selection from dropdown
  const handleEmailSelect = (selectedEmail) => {
    setEmail(selectedEmail);
    setShowDropdown(false);
    fetchUserDetails(selectedEmail);
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      alert("Please enter feedback!");
      return;
    }

    if (!autoData.userId) {
      alert("Please enter a valid email to fetch user details!");
      return;
    }

    if (!autoData.hasRequested) {
      alert("This user has not submitted any placement request! Only users with placement requests can give feedback.");
      return;
    }

    try {
      // Submit feedback with MongoDB _id as string
      const response = await axios.post(
        `${API_BASE_URL}/api/feedback/submit-feedback`,
        {
          user_id: autoData.userId, // MongoDB _id as string
          feedback_text: feedback
        }
      );

      console.log("Submission response:", response.data);

      if (response.data.success) {
        alert(`Feedback submitted successfully! Feedback ID: ${response.data.feedback.feedback_id}`);
        
        // Reset form
        setEmail("");
        setFeedback("");
        setAutoData({ userId: "", name: "", batch: "", mobile: "", hasRequested: false, requestStatus: null });
      } else {
        alert("Failed to submit feedback: " + response.data.message);
      }
    } catch (err) {
      console.error("Full error:", err);
      
      if (err.response) {
        console.error("Server response error:", err.response.data);
        alert(`Error ${err.response.status}: ${err.response.data.message || "Server error"}`);
      } else if (err.request) {
        console.error("No response received:", err.request);
        alert("No response from server. Check your network.");
      } else {
        console.error("Request setup error:", err.message);
        alert("Error setting up request: " + err.message);
      }
    }
  };

  // Filter emails for dropdown based on input
  const filteredEmails = dropdownEmails.filter(item => 
    email.trim() === "" || item.toLowerCase().includes(email.toLowerCase())
  );

  return (
    <div className="feedback-container">
      <div className="feedback-wrapper">
        <div className="feedback-header">
          <div className="feedback-icon">⭐</div>
          <h2 className="feedback-title">Coordinator Feedback</h2>
          <p className="feedback-subtitle">
            Provide feedback for alumni who have submitted placement requests
          </p>
        </div>

        {/* Email input with dropdown */}
        <div className="feedback-field" style={{ position: 'relative' }}>
          <label className="feedback-label">
            <span className="feedback-label-icon">📧</span>
            Select Alumni Email <span className="required-star">*</span>
            {loadingEmails && <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>(Loading placement request users...)</span>}
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            onFocus={() => setShowDropdown(true)}
            placeholder="Select or type email of alumni with placement request"
            className="feedback-input"
            required
            list="email-list"
          />
          
          {/* Dropdown for email selection */}
          {showDropdown && filteredEmails.length > 0 && (
            <div className="email-dropdown">
              {filteredEmails.slice(0, 10).map((emailItem, index) => (
                <div
                  key={index}
                  className="dropdown-item"
                  onClick={() => handleEmailSelect(emailItem)}
                >
                  {emailItem}
                </div>
              ))}
              {filteredEmails.length > 10 && (
                <div className="dropdown-item" style={{ color: '#666', fontStyle: 'italic' }}>
                  ... and {filteredEmails.length - 10} more
                </div>
              )}
            </div>
          )}
          
          {loading && <p style={{ color: "blue", fontSize: "14px", marginTop: "5px" }}>Fetching user details...</p>}
          {email && !isValidEmail(email) && (
            <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
              Please enter a valid email address
            </p>
          )}
          {autoData.hasRequested && autoData.requestStatus && (
            <p style={{ color: "green", fontSize: "12px", marginTop: "5px" }}>
              ✓ User has placement request (Status: {autoData.requestStatus})
            </p>
          )}
          {email && isValidEmail(email) && !autoData.hasRequested && autoData.userId && (
            <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
              ✗ This user has not submitted any placement request
            </p>
          )}
        </div>

        {/* Auto-filled fields */}
        <div className="feedback-grid">
          <div className="feedback-field">
            <label className="feedback-label">Applicant ID </label>
            <input
              type="text"
              value={autoData.userId}
              disabled
              className="feedback-input-disabled"
              title="This is MongoDB _id stored in database"
            />
          </div>
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
          <div className="feedback-field">
            <label className="feedback-label">Mobile</label>
            <input
              type="text"
              value={autoData.mobile}
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
            placeholder="Write your detailed feedback here..."
            rows="4"
            className="feedback-textarea"
            required
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="feedback-submit-button"
          disabled={!autoData.userId || !feedback.trim() || !autoData.hasRequested}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

export default PlacementFeedbackForm;