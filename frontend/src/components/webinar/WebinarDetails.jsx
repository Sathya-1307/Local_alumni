import React, { useState, useEffect } from  'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Common.css';
import { FiBookOpen } from "react-icons/fi";
import { ArrowLeft, Trash2 } from "lucide-react";
import WebinarCompletedDetailsForm from './WebinarCompletedDetailsForm';
import ConfirmationDialog from './ConfirmationDialog';
import Popup from './Popup';

// Add API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function WebinarDetails() {
  const { id, encodedUserEmail } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = decodeURIComponent(encodedUserEmail);
  const [webinar, setWebinar] = useState(location.state?.webinar || null);
  const [registrations, setRegistrations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(!webinar);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [popup, setPopup] = useState(null);

  const handleDeleteWebinar = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/webinars/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPopup({ message: 'Webinar deleted successfully!', type: 'success' });
        setTimeout(() => {
          navigate(`/webinar-events/${encodeURIComponent(userEmail)}`);
        }, 2000);
      } else {
        setPopup({ message: 'Failed to delete webinar.', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting webinar:', error);
      setPopup({ message: 'An error occurred while deleting the webinar.', type: 'error' });
    }
    setShowDeleteDialog(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'registration':
        return (
          <div className="form-card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Registered Students ({registrations.length})
            </h2>

            <div>
                <table style={{ width: "810px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#eee", paddingTop: "15px", paddingBottom: "15px" }}>
                    <th style={{  width: "250px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Name</th>
                    <th style={{  width: "250px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Email</th>
                    <th style={{  width: "180px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student  Department </th>
                    <th style={{  width: "180px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Batch</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 py-12">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No registrations found for this webinar.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((registration, index) => (
                      <tr key={registration._id || index} className="hover:bg-gray-50">
                        <td className="px-8 py-12 whitespace-nowrap text-lg font-medium text-gray-900 text-center">
                          {registration.userDetails?.name || 'N/A'}
                        </td>
                        <td className="px-8 py-12 whitespace-nowrap text-lg text-gray-500 text-center">
                          {registration.email}
                        </td>
                        <td className="px-8 py-12 whitespace-nowrap text-lg text-gray-500 text-center">
                          {registration.userDetails?.department || 'N/A'}
                        </td>
                        <td className="px-8 py-12 whitespace-nowrap text-lg text-gray-500 text-center">
                          {(() => {
                            console.log('Registration data:', registration);
                            console.log('UserDetails:', registration.userDetails);
                            console.log('Batch value:', registration.userDetails?.batch);
                            return registration.userDetails?.batch || 'N/A';
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'feedback':
        return (
          <div className="form-card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Student Feedback ({feedback.length})
            </h2>

            <div>
                <table style={{ width: "810px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#eee", paddingTop: "15px", paddingBottom: "15px" }}>
                    <th style={{  width: "250px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Name</th>
                    <th style={{  width: "250px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Email</th>
                    <th style={{  width: "180px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Department</th>
                    <th style={{  width: "180px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Student Batch</th>
                    <th style={{  width: "420px",padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Feedback</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedback.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No feedback found for this webinar.
                      </td>
                    </tr>
                  ) : (
                    feedback.map((item, index) => (
                      <tr key={item._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-6 whitespace-nowrap text-lg font-medium text-gray-900 text-center mb-2">
                          {item.student?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-lg text-gray-500 text-center">
                          {item.student?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-lg text-gray-500 text-center">
                          {item.student?.department || 'N/A'}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-lg text-gray-500 text-center">
                          {item.student?.batch || 'N/A'}
                        </td>
                        <td className="px-6 py-6 text-sm text-gray-500 text-center">
                          {item.feedback || 'No feedback provided'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'uploads':
        return <WebinarCompletedDetailsForm />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!webinar) {
      // Only fetch if webinar data wasn't passed via state
      const fetchData = async () => {
        try {
          // Fetch webinar details
          const webinarResponse = await fetch(`${API_BASE_URL}/api/webinars/${id}`);
          if (!webinarResponse.ok) {
            throw new Error('Failed to fetch webinar details');
          }
          const webinarData = await webinarResponse.json();
          setWebinar(webinarData);
        } catch (err) {
          console.error('Error fetching webinar details:', err);
          setError('Failed to load webinar details. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }

    // Fetch registrations with member details
    const fetchRegistrations = async () => {
      try {
        const registrationsResponse = await fetch(`${API_BASE_URL}/api/registrations/webinar/${id}/details`);
        if (!registrationsResponse.ok) {
          throw new Error('Failed to fetch registrations');
        }
        const registrationsData = await registrationsResponse.json();
        setRegistrations(registrationsData);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      }
    };

    fetchRegistrations();

    // Fetch feedback with member details (student feedback only)
    const fetchFeedback = async () => {
      try {
        // First get webinar details to get the topic
        let webinarTopic = webinar?.topic;
        if (!webinarTopic) {
          const webinarResponse = await fetch(`${API_BASE_URL}/api/webinars/${id}`);
          if (webinarResponse.ok) {
            const webinarData = await webinarResponse.json();
            webinarTopic = webinarData.topic;
          }
        }

        // Fetch student feedback by webinar topic
        const studentFeedbackResponse = await fetch(`${API_BASE_URL}/api/student-feedback/webinar/${encodeURIComponent(webinarTopic)}`);
        let studentFeedbackData = [];
        if (studentFeedbackResponse.ok) {
          studentFeedbackData = await studentFeedbackResponse.json();
        }

        // Format feedback data
        const formattedFeedback = studentFeedbackData.map((item) => ({
          ...item,
          student: {
            name: item.name,
            email: item.email,
            department: item.department,
            batch: item.batch
          }
        }));

        setFeedback(formattedFeedback);
      } catch (err) {
        console.error('Error fetching feedback:', err);
      }
    };

    fetchFeedback();
  }, [id, webinar]);

  if (loading) {
    return (
      <div className="student-form-page">
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Loading webinar details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-form-page">
        <div className="text-center py-8">
          <p className="text-lg text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 submit-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-form-page">
      {/* Background Animated Orbs */}
      <div className="background-orbs">
        <div className="orb orb-purple animation-delay-2000"></div>
        <div className="orb orb-blue animation-delay-4000"></div>
        <div className="orb orb-pink"></div>
      </div>

      {/* Main Container */}
      <div className="form-wrapper">
        <div>
          <button className="back-btn" onClick={() => navigate(`/webinar-events/${encodeURIComponent(userEmail)}`)}>
            <ArrowLeft className="back-btn-icon" /> Back to Webinar Events
          </button>

          {/* Header */}
          <div className="form-header">
            <div className="icon-wrapper">
              <FiBookOpen className="header-icon" />
            </div>
            <h1 className="form-title">Webinar Details</h1>
            <p className="webinar-subtitle">
              {webinar.topic}
            </p>
          </div>

          {/* Delete Button */}
          <div style={{ textAlign: 'right', margin: '20px 60px' }}>
            <button
              className="delete-btn"
              onClick={() => setShowDeleteDialog(true)}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '16px'
              }}
            >
              <Trash2 size={16} />
              Delete Webinar
            </button>
          </div>

          {/* Buttons Section */}
          <div className="admin-buttons">
            <button className="submit1-btn" onClick={() => setActiveView('registration')}>Webinar Registration Details</button>
            <button className="submit1-btn" onClick={() => setActiveView('feedback')}>Webinar Feedback Details</button>
            <button className="submit1-btn" onClick={() => setActiveView('uploads')}>Webinar Uploads</button>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {renderContent()}
          </div>

          <p className="form-footer">Designed with 💜 for Alumni Network</p>
        </div>
      </div>

      <ConfirmationDialog
        message="Are you sure you want to delete this webinar? This action cannot be undone."
        onConfirm={handleDeleteWebinar}
        onCancel={() => setShowDeleteDialog(false)}
        isOpen={showDeleteDialog}
      />

      {popup && (
        <Popup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}