import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiAward,
  FiUpload,
  FiDownload
} from "react-icons/fi";
import { ArrowLeft,Phone,Globe } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from 'xlsx';
import "./Common.css";
import Popup from './Popup';

// Add API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const WebinarCompletedDetailsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    domain: "",
    chosenTopic: "",
    prizeWinnerEmail: "",
    name: "",
    department: "",
    batch: "",
     contact: "",
     attendedCount: "",
  });

  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [canDownloadCertificate, setCanDownloadCertificate] = useState(false);

  // Fetch webinar details on component mount
  useEffect(() => {
    const fetchWebinarDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/webinars/${id}`);
        const webinar = await response.json();

        if (response.ok) {
          setFormData((prev) => ({
            ...prev,
            domain: webinar.domain || "",
            chosenTopic: webinar.topic || "",
          }));
        } else {
          console.error('Error fetching webinar:', webinar.error);
          setPopup({ show: true, message: 'Error loading webinar details', type: 'error' });
        }
      } catch (error) {
        console.error('Error fetching webinar:', error);
        setPopup({ show: true, message: 'Error loading webinar details', type: 'error' });
      }
    };

    if (id) {
      fetchWebinarDetails();
    }
  }, [id]);

  // Fetch student details based on prizeWinnerEmail
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!formData.prizeWinnerEmail || formData.prizeWinnerEmail.length < 5)
        return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/member-by-email?email=${formData.prizeWinnerEmail}`
        );
        const data = await res.json();

        console.log("Fetched member:", data);

        if (data?.found) {
          setFormData((prev) => ({
            ...prev,
            name: data.name || "",
            department: data.department || "",
            batch: data.batch || "",
            contact: data.contact_no || "",
          }));
          setErrors(prev => ({ ...prev, prizeWinnerEmail: null }));
        } else {
          console.log("No member found for entered email");
          setErrors(prev => ({ ...prev, prizeWinnerEmail: "Unregistered email. Please enter a registered email address." }));
          setFormData((prev) => ({
            ...prev,
            name: "",
            department: "",
            batch: "",
            contact: "",
          }));
        }
      } catch (err) {
        console.error("Error fetching member:", err);
      }
    };

    fetchMemberDetails();
  }, [formData.prizeWinnerEmail]);

  // Handle input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'attendedCount') {
      // Allow only positive integers
      const trimmedValue = value.trim();
      if (trimmedValue === '' || (/^\d+$/.test(trimmedValue) && parseInt(trimmedValue) > 0)) {
        setFormData({ ...formData, [name]: trimmedValue });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, attendanceFile: "File size must be less than 2MB" }));
        setAttendanceFile(null);
        setAttendanceData([]);
        return;
      }

      setErrors(prev => ({ ...prev, attendanceFile: null }));
      setAttendanceFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setAttendanceData(jsonData);
        console.log('Parsed Excel data:', jsonData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Check if prize winner can download certificate
  useEffect(() => {
    if (formData.prizeWinnerEmail && attendanceData.length > 0) {
      const winnerData = attendanceData.find(row =>
        row.Email?.toLowerCase() === formData.prizeWinnerEmail.toLowerCase()
      );
      if (winnerData && winnerData.Duration) {
        // Parse duration - assuming it's in minutes or "HH:MM" format
        let durationMinutes = 0;
        if (typeof winnerData.Duration === 'number') {
          durationMinutes = winnerData.Duration;
        } else if (typeof winnerData.Duration === 'string') {
          // Handle "HH:MM" format
          const timeMatch = winnerData.Duration.match(/(\d+):(\d+)/);
          if (timeMatch) {
            durationMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
          } else {
            durationMinutes = parseFloat(winnerData.Duration) || 0;
          }
        }
        setCanDownloadCertificate(durationMinutes > 30);
      } else {
        setCanDownloadCertificate(false);
      }
    }
  }, [formData.prizeWinnerEmail, attendanceData]);

  // Handle certificate download
  const handleDownloadCertificate = () => {
    // This would typically call an API to generate and download the certificate
    alert('Certificate download functionality would be implemented here');
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.attendedCount)
      newErrors.attendedCount = "Attended Count is required";
    if (!formData.prizeWinnerEmail)
      newErrors.prizeWinnerEmail = "Prize Winner Email is required";
    if (!attendanceFile)
      newErrors.attendanceFile = "Attendance Excel file is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/webinars/${id}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attendedCount: parseInt(formData.attendedCount),
            prizeWinnerEmail: formData.prizeWinnerEmail,
            attendanceData: attendanceData,
          }),
        });

        if (response.ok) {
          setPopup({ show: true, message: 'Webinar completion details saved successfully! 🎉', type: 'success' });
          // Navigate back to webinar events after success
          setTimeout(() => {
            navigate('/webinar-events');
          }, 2000);
        } else {
          const errorData = await response.json();
          setPopup({ show: true, message: errorData.error || 'Failed to save webinar details', type: 'error' });
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setPopup({ show: true, message: 'Failed to save webinar details', type: 'error' });
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
        <div>
          <div className="form-card">
            <br></br>
            <h2 className="webinar-subtitle">
              Document of the Completed Webinar are needed to be filled out
              here.
            </h2>
            <br></br>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-fields">
                <div className="form-group">
                  <label className="field-label">
                    <Globe className="field-icon" /> Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    readOnly
                    className="input-field readonly"
                    placeholder="Auto-filled from webinar details"
                  />
                </div>
                {/* Topic */}
                <div className="form-group">
                  <label className="field-label">
                    <FiBookOpen className="field-icon" /> Chosen Topic
                  </label>
                  <input
                    type="text"
                    value={formData.chosenTopic}
                    readOnly
                    className="input-field readonly"
                    placeholder="Auto-filled from webinar details"
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">
                    <FiAward className="field-icon" /> Attended Count <span>*</span>
                  </label>
                  <input
                    type="number"
                    name="attendedCount"
                    value={formData.attendedCount}
                    onChange={handleInputChange}
                    placeholder="Attended Count of the Students"
                    className="input-field"
                    min="1"
                    required
                  />
                  {errors.attendedCount && (
                    <div className="error-text">{errors.attendedCount}</div>
                  )}
                </div>

                {/* Attendance File Upload */}
                <div className="form-group">
                  <label className="field-label">
                    <FiUpload className="field-icon" /> Attendance Excel File <span>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="input-field"
                    required
                  />
                  <small className="help-text">
                    Upload Excel file with Email and Duration columns. Certificate download will be enabled for attendees with duration {'>'} 30 minutes.
                  </small>
                  {errors.attendanceFile && (
                    <div className="error-text">{errors.attendanceFile}</div>
                  )}
                </div>
                {/* Prize Winner Email */}
                <div className="form-group">
                  <label className="field-label">
                    <FiMail className="field-icon" /> Prize Winner Email{" "}
                    <span>*</span>
                  </label>
                  <input
                    type="email"
                    name="prizeWinnerEmail"
                    placeholder="Enter email"
                    value={formData.prizeWinnerEmail}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                  {errors.prizeWinnerEmail && (
                    <div className="error-text">
                      {errors.prizeWinnerEmail}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="form-group">
                  <label className="field-label">
                    <FiUser className="field-icon" /> Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    readOnly
                    placeholder="Fetched automatically"
                    className="input-field readonly"
                  />
                </div>

                {/* Department */}
                <div className="form-group">
                  <label className="field-label">
                    <FiBookOpen className="field-icon" /> Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    placeholder="Fetched automatically"
                    className="input-field readonly"
                  />
                </div>

                {/* Batch */}
                <div className="form-group">
                  <label className="field-label">
                    <FiAward className="field-icon" /> Batch
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    readOnly
                    placeholder="Fetched automatically"
                    className="input-field readonly"
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">
                    <Phone className="field-icon" /> Contact No <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="Auto fetched from email..."
                    className="input-field"
                    readOnly
                  />
                  {errors.contact && (
                    <div className="error-text">{errors.contact}</div>
                  )}
                </div>

                <button type="submit" className="submit-btn">
                  Submit
                </button>
              </div>
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
};

export default WebinarCompletedDetailsForm;