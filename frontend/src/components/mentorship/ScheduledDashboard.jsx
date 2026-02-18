// -----------------------------------------------------------
// SCHEDULED DASHBOARD — THEMED VERSION
// Updated to match the provided theme design system
// -----------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // CHANGED: useLocation instead of useParams
import axios from 'axios';
import './ScheduledDashboard.css';

export default function ScheduledDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [submittedMentees, setSubmittedMentees] = useState({});
  const [statusesMap, setStatusesMap] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [userRole, setUserRole] = useState(''); // Added userRole state
  const [editModalOpen, setEditModalOpen] = useState(false); // Edit modal state
  const [selectedMeeting, setSelectedMeeting] = useState(null); // Selected meeting for editing
  const [editFormData, setEditFormData] = useState({}); // Form data for editing
  const [userMeetings, setUserMeetings] = useState([]); // CHANGED: Renamed from mentorMeetings to userMeetings
  const [uniqueUserDates, setUniqueUserDates] = useState([]); // Store unique dates for the logged-in user
  const [userEmail, setUserEmail] = useState(''); // Store user email
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const location = useLocation(); // CHANGED: useLocation to get query params

  useEffect(() => {
    // Get email from query parameters
    const urlParams = new URLSearchParams(location.search);
    const emailFromUrl = urlParams.get('email');
    
    if (emailFromUrl) {
      // Email is already decrypted from previous page
      const decodedEmail = decodeURIComponent(emailFromUrl);
      setUserEmail(decodedEmail);
      localStorage.setItem('userEmail', decodedEmail);
      
      // Get user role from localStorage
      const storedRole = localStorage.getItem('userRole') || '';
      setUserRole(storedRole);
      
      fetchScheduledData(decodedEmail);
      preloadStatuses();
      preloadApprovalStatuses();
      
      // Fetch all meetings for the user (both mentor and mentee)
      fetchAllMeetingsForUser(decodedEmail);
    } else {
      // Fallback to localStorage
      const storedEmail = localStorage.getItem('userEmail') || '';
      if (storedEmail) {
        setUserEmail(storedEmail);
        const storedRole = localStorage.getItem('userRole') || '';
        setUserRole(storedRole);
        
        fetchScheduledData(storedEmail);
        preloadStatuses();
        preloadApprovalStatuses();
        
        // Fetch all meetings for the user (both mentor and mentee)
        fetchAllMeetingsForUser(storedEmail);
      } else {
        // No email found, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [location.search, navigate]);

  // Function to extract unique dates for the logged-in user
  const extractUserDates = (meetingsData) => {
    if (!meetingsData || meetingsData.length === 0) return [];
    
    const userDatesSet = new Set();
    
    meetingsData.forEach(meeting => {
      if (meeting.date) {
        // Extract just the date part (YYYY-MM-DD)
        const dateOnly = meeting.date.slice(0, 10);
        userDatesSet.add(dateOnly);
      }
    });
    
    // Convert Set to array and sort dates
    return Array.from(userDatesSet).sort();
  };

  // Update uniqueUserDates when meetings change
  useEffect(() => {
    if (meetings.length > 0) {
      const userDates = extractUserDates(meetings);
      setUniqueUserDates(userDates);
    } else {
      setUniqueUserDates([]);
    }
  }, [meetings]);

  // ✅ NEW FUNCTION: Check if meeting is completed and approved (DISABLE FOR ALL)
  const isMeetingCompletedAndApproved = (meetingId) => {
    const meetingStatuses = statusesMap[meetingId] || [];
    
    // Check if ANY mentee has status "Completed" AND statusApproval "Approved"
    const hasCompletedAndApproved = meetingStatuses.some(s => 
      s.status === "Completed" && s.statusApproval === "Approved"
    );
    
    return hasCompletedAndApproved; // Return true to disable button
  };

  // ✅ UPDATED FUNCTION: Fetch all meetings for user (both mentor and mentee)
  const fetchAllMeetingsForUser = async (userEmail) => {
    try {
      // Fetch all meetings for this user (as both mentor and mentee)
      const meetingsRes = await axios.get(`${API_BASE_URL}/api/meetings/scheduled/${encodeURIComponent(userEmail)}`);
      
      if (meetingsRes.data?.meetings?.length > 0) {
        // Flatten the meetings array to get individual date entries
        const flattenedMeetings = meetingsRes.data.meetings.flatMap(meeting => 
          (meeting.dates || []).map(dateEntry => ({
            meeting_id: dateEntry.meeting_id || dateEntry._id,
            date: dateEntry.date,
            time: meeting.time,
            duration_minutes: meeting.duration_minutes || meeting.duration || 60,
            platform: meeting.platform,
            meeting_link: meeting.meeting_link,
            agenda: meeting.agenda,
            mentees: meeting.mentees || [],
            mentor: meeting.mentor || { name: "Unknown", email: "-" }
          }))
        );
        
        // Filter out entries without meeting_id
        const validMeetings = flattenedMeetings.filter(m => m.meeting_id);
        setUserMeetings(validMeetings);
        
        console.log("Fetched user meetings:", validMeetings.length);
      } else {
        console.log("No meetings found for user");
        setUserMeetings([]);
      }
    } catch (err) {
      console.error("Failed to fetch user meetings:", err);
      // Fallback: Try to get meetings from the current meetings state
      if (meetings.length > 0) {
        // Use the meetings already fetched for display
        const flattened = meetings.map(m => ({
          meeting_id: m.meetingId,
          date: m.date,
          time: m.time,
          duration_minutes: parseInt(m.duration) || 60,
          platform: m.platform,
          meeting_link: m.meeting_link,
          agenda: m.agenda || "-",
          mentees: m.mentees,
          mentor: m.mentor
        }));
        
        setUserMeetings(flattened);
        console.log("Using fallback meetings:", flattened.length);
      } else {
        setUserMeetings([]);
      }
    }
  };

  const fetchScheduledData = async (userEmail) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/meetings/scheduled/${encodeURIComponent(userEmail)}`
      );
      const data = res.data;

      if (!data?.meetings?.length) {
        setMeetings([]);
        setUniqueUserDates([]);
        return;
      }

      const normalized = data.meetings.flatMap((meeting) => {
        const mentorObj = meeting.mentor || { _id: null, name: "Mentor", email: "-" };

        const menteeList = (meeting.mentees || []).map((mt) => ({
          _id: mt._id || null,
          name: mt.name || mt.basic?.name || "Mentee",
          email: mt.email || mt.basic?.email_id || "-"
        }));

        // Check if this meeting involves the current user
        const isMentorUser = userEmail?.toLowerCase() === mentorObj.email?.toLowerCase();
        const isMenteeInMeeting = menteeList.some(mentee => 
          mentee.email?.toLowerCase() === userEmail?.toLowerCase()
        );

        // Only include meetings where the current user is either mentor or mentee
        if (!isMentorUser && !isMenteeInMeeting) {
          return [];
        }

        return (meeting.dates || []).map((d) => ({
          mentor: { _id: mentorObj._id, name: mentorObj.name, email: mentorObj.email },
          mentees: Array.from(new Map(menteeList.map((mt) => [mt._id || mt.email, mt])).values()),
          date: d?.date ? new Date(d.date).toISOString() : null,
          meetingId: String(d?.meeting_id || d?._id || `${meeting._id}_${Date.now()}`),
          time: meeting.time || "",
          duration: meeting.duration_minutes || meeting.duration || "60",
          platform: meeting.platform || "-",
          meeting_link: meeting.meeting_link || "",
          agenda: meeting.agenda || "-"
        }));
      }).filter(meeting => meeting !== null && meeting !== undefined); // Filter out empty arrays

      setMeetings(normalized);
    } catch (err) {
      console.error("Failed to fetch scheduled data", err);
      setMeetings([]);
      setUniqueUserDates([]);
    }
  };

  const preloadStatuses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/meeting-status/all`);
      const statuses = res.data.statuses || [];

      const map = {};
      statuses.forEach((s) => {
        const mId = String(s.meeting_id);
        const menteeId = String(s.mentee_user_id);
        if (!map[mId]) map[mId] = [];
        map[mId].push(menteeId);
      });

      setSubmittedMentees(map);
    } catch (err) {
      console.error("Failed to preload statuses", err);
    }
  };

  const preloadApprovalStatuses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/meeting-status/all`);
      const statuses = res.data.statuses || [];

      const map = {};
      statuses.forEach((s) => {
        const mId = String(s.meeting_id);
        if (!map[mId]) map[mId] = [];
        map[mId].push(s);
      });

      setStatusesMap(map);
    } catch (err) {
      console.error("Failed to preload approval statuses", err);
    }
  };

  const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr) return { dateFormatted: "-", timeFormatted: "-" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { dateFormatted: "-", timeFormatted: "-" };

    return {
      dateFormatted: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      timeFormatted: timeStr
        ? new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : "-"
    };
  };

  // Format date for display in filter
  const formatDateForFilter = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Check if user is mentor
  const isMentor = () => {
    return userRole.toLowerCase() === 'mentor';
  };

  // Handle Edit button click
  const handleEditButtonClick = () => {
    // First try to fetch meetings if array is empty
    if (userMeetings.length === 0 && userEmail) {
      fetchAllMeetingsForUser(userEmail);
    }
    
    setEditModalOpen(true);
    
    // Pre-select the first meeting if available
    if (userMeetings.length > 0 && !selectedMeeting) {
      const firstMeeting = userMeetings[0];
      setSelectedMeeting(firstMeeting);
      setEditFormData({
        meeting_date: firstMeeting.date ? new Date(firstMeeting.date).toISOString().split('T')[0] : "",
        meeting_time: firstMeeting.time || ""
      });
    }
  };

  // Handle meeting selection from dropdown
  const handleMeetingSelect = (e) => {
    const meetingId = e.target.value;
    if (!meetingId) {
      setSelectedMeeting(null);
      setEditFormData({});
      return;
    }
    
    const meeting = userMeetings.find(m => String(m.meeting_id) === String(meetingId));
    if (meeting) {
      setSelectedMeeting(meeting);
      setEditFormData({
        meeting_date: meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : "",
        meeting_time: meeting.time || ""
      });
    }
  };

  // Handle form input changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit updated meeting data - SIMPLIFIED (only date and time)
  const handleEditSubmit = async () => {
    if (!selectedMeeting || !selectedMeeting.meeting_id) {
      alert('Please select a meeting to edit');
      return;
    }

    // ✅ CHECK: Don't allow editing if meeting is completed AND approved
    const meetingId = selectedMeeting.meeting_id;
    if (isMeetingCompletedAndApproved(meetingId)) {
      alert('Cannot edit date/time for completed and approved meetings');
      setEditModalOpen(false);
      return;
    }

    try {
      console.log('Updating meeting date/time:', meetingId, editFormData);
      
      // Send only date and time
      const updateData = {
        meeting_date: editFormData.meeting_date,
        meeting_time: editFormData.meeting_time
      };

      await axios.put(`${API_BASE_URL}/api/meetings/meeting/${meetingId}`, updateData);
      
      alert('Meeting date/time updated successfully!');
      setEditModalOpen(false);
      
      // Refresh data
      if (userEmail) {
        fetchScheduledData(userEmail);
        fetchAllMeetingsForUser(userEmail);
      }
    } catch (error) {
      console.error('Failed to update meeting:', error);
      alert('Failed to update meeting: ' + (error.response?.data?.message || error.message));
    }
  };

  const goToUpdate = (mentor, dateStr, meetingTime, mentees, meetingId) => {
    if (!mentor?._id) return alert("Invalid mentor");
    if (!meetingId) return alert("Meeting ID missing");

    const menteeEmail = mentees?.[0]?.email;
    if (!menteeEmail) return alert("Invalid mentee");

    const dateObj = new Date(dateStr);
    if (meetingTime) {
      const [h, m] = meetingTime.split(":");
      dateObj.setHours(h, m);
    }

    navigate(
      `/meeting_updatation?mentorId=${encodeURIComponent(mentor._id)}` +
        `&mentorEmail=${encodeURIComponent(mentor.email)}` +
        `&menteeEmail=${encodeURIComponent(menteeEmail)}` +
        `&scheduledDate=${encodeURIComponent(dateObj.toISOString())}` +
        `&meetingTime=${encodeURIComponent(meetingTime || "")}` +
        `&meetingId=${encodeURIComponent(meetingId)}`
    );
  };

  const handleMinutesAction = async (statusId, action) => {
    try {
      setActionLoadingId(statusId);
      await axios.post(`${API_BASE_URL}/api/meeting-status/approve-reject`, {
        statusId,
        action
      });

      alert(`Minutes ${action} successfully`);
      preloadStatuses();
      preloadApprovalStatuses();
    } catch (err) {
      console.error("Minutes update failed", err);
      alert("Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    // Check if this meeting is relevant to the logged-in user
    const isMentorUser = userEmail?.toLowerCase() === m.mentor?.email?.toLowerCase();
    const isMenteeInMeeting = m.mentees?.some(mentee => 
      mentee.email?.toLowerCase() === userEmail?.toLowerCase()
    );
    
    // Skip meetings that don't involve the current user
    if (!isMentorUser && !isMenteeInMeeting) {
      return false;
    }

    const meetingStatuses = statusesMap[m.meetingId] || [];
    let overallStatus = "Pending";

    if (meetingStatuses.some(s => s.status === "Completed")) overallStatus = "Completed";
    else if (meetingStatuses.some(s => s.status === "Postponed")) overallStatus = "Postponed";
    else if (meetingStatuses.some(s => s.status === "Cancelled")) overallStatus = "Cancelled";

    const statusMatch = statusFilter === 'All' || overallStatus === statusFilter;
    const dateMatch = dateFilter === 'All' || (m.date && m.date.startsWith(dateFilter));

    return statusMatch && dateMatch;
  });

  return (
    <div className="dashboard-wrapper">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Home Button */}
      <button className="home-button" onClick={() => navigate("/dashboard")}>
        <span className="tab-icon">🏠</span>
        <span className="tab-text">Dashboard</span>
      </button>

      {/* EDIT BUTTON - Visible to both mentors and mentees */}
      <button 
        className="edit-meeting-button" 
        onClick={handleEditButtonClick}
        title="Edit Meeting Date and Time"
      >
        <span className="edit-icon">✏️</span>
        <span className="edit-text">Edit Meeting</span>
      </button>

      {/* Edit Meeting Modal - SIMPLIFIED (Only Date and Time) */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Meeting Date & Time</h2>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Select Meeting:</label>
                <select 
                  className="meeting-select"
                  onChange={handleMeetingSelect}
                  value={selectedMeeting?.meeting_id || ""}
                >
                  <option value="">-- Select a meeting --</option>
                  {userMeetings.length === 0 ? (
                    <option value="" disabled>Loading meetings...</option>
                  ) : (
                    userMeetings.map((meeting, index) => {
                      const meetingDate = meeting.date ? new Date(meeting.date) : new Date();
                      const formattedDate = meetingDate.toLocaleDateString();
                      
                      // ✅ Check if this meeting is completed and approved
                      const isLocked = isMeetingCompletedAndApproved(meeting.meeting_id);
                      
                      // Show mentor name and mentee count for better identification
                      const mentorName = meeting.mentor?.name || "Unknown Mentor";
                      const menteeCount = meeting.mentees?.length || 0;
                      
                      return (
                        <option 
                          key={meeting.meeting_id || `meeting-${index}`} 
                          value={meeting.meeting_id}
                          disabled={isLocked}
                        >
                          {formattedDate} at {meeting.time || "TBD"} 
                         
                          {isLocked && " - Completed & Approved"}
                        </option>
                      );
                    })
                  )}
                </select>
                {userMeetings.length === 0 && (
                  <p className="no-meetings-text">No meetings found. Schedule meetings first.</p>
                )}
              </div>

              {selectedMeeting && (
                <>
                  <div className="form-group">
                    <label>New Date:</label>
                    <input
                      type="date"
                      name="meeting_date"
                      value={editFormData.meeting_date || ""}
                      onChange={handleEditFormChange}
                      className="edit-input"
                      min={new Date().toISOString().split('T')[0]} // Optional: restrict to future dates
                    />
                  </div>

                  <div className="form-group">
                    <label>New Time:</label>
                    <input
                      type="time"
                      name="meeting_time"
                      value={editFormData.meeting_time || ""}
                      onChange={handleEditFormChange}
                      className="edit-input"
                    />
                  </div>

                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setEditModalOpen(false)}>
                      Cancel
                    </button>
                    <button 
                      className="save-btn" 
                      onClick={handleEditSubmit}
                      disabled={isMeetingCompletedAndApproved(selectedMeeting.meeting_id)}
                    >
                      {isMeetingCompletedAndApproved(selectedMeeting.meeting_id) ? "Cannot Edit - Meeting Completed & Approved" : "Update Date & Time"}
                    </button>
                  </div>
                </>
              )}

              {!selectedMeeting && userMeetings.length > 0 && (
                <div className="select-meeting-prompt">
                  <p>Please select a meeting from the dropdown above to edit its date and time.</p>
                  <p className="edit-note">
                    <strong>Note:</strong> Completed & Approved meetings cannot be edited. They are disabled in the dropdown.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-container">
        <h1>Scheduled Mentorship Dashboard</h1>
        <p className="user-info-text">Viewing meetings for: {userEmail}</p>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date:</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="All">All Dates</option>
              {uniqueUserDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateForFilter(d)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="glass-card" style={{textAlign: 'center', padding: '40px'}}>
            <p>No scheduled meetings found for {userEmail}</p>
            {dateFilter !== 'All' && (
              <p className="no-meetings-hint">
                No meetings on {formatDateForFilter(dateFilter)}. Try selecting "All Dates" or check other dates.
              </p>
            )}
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredMeetings.map((m) => {
              const { dateFormatted, timeFormatted } = parseDateTime(m.date, m.time);
              const mentorEmail = m.mentor.email;
              const isMentorUser = userEmail?.toLowerCase() === mentorEmail?.toLowerCase();

              const meetingStatuses = statusesMap[m.meetingId] || [];

              let approvalBadge = null;
              
              // ✅ UPDATED LOGIC: Check approval status first
              const pendingStatus = meetingStatuses.find((s) => s.statusApproval === "Pending");
              const approvedStatus = meetingStatuses.find((s) => s.statusApproval === "Approved");
              const rejectedStatus = meetingStatuses.find((s) => s.statusApproval === "Rejected");
              
              // Check meeting statuses
              const hasPostponedStatus = meetingStatuses.some(s => s.status === "Postponed");
              const hasCancelledStatus = meetingStatuses.some(s => s.status === "Cancelled");
              const hasCompletedStatus = meetingStatuses.some(s => s.status === "Completed");

              // Show "Rejected" if approval status is rejected (highest priority)
              if (rejectedStatus) {
                approvalBadge = "Rejected";
              }
              // Show "Postponed" only if status is Postponed AND approval is Approved
              else if (hasPostponedStatus && approvedStatus) {
                approvalBadge = "Postponed";
              }
              // Show "Cancelled" if status is Cancelled
              else if (hasCancelledStatus) {
                approvalBadge = "Cancelled";
              }
              // Show "Approved" if meeting is completed and approved
              else if (hasCompletedStatus && approvedStatus) {
                approvalBadge = "Approved";
              }
              // Otherwise, show the approval status
              else {
                if (pendingStatus) approvalBadge = pendingStatus.statusApproval;
                if (approvedStatus) approvalBadge = approvedStatus.statusApproval;
              }

              // Find the mentee that matches the logged-in user (if not mentor)
              const targetMentee = !isMentorUser
                ? m.mentees.find((mt) => mt.email?.toLowerCase() === userEmail?.toLowerCase())
                : m.mentees[0]; // For mentors, show first mentee

              const isSubmitted =
                !isMentorUser && submittedMentees[m.meetingId]?.includes(targetMentee?._id);

              // ✅ UPDATED: Check if meeting is completed and approved (for ALL users)
              const isMeetingLocked = isMeetingCompletedAndApproved(m.meetingId);
              const disableReason = isMeetingLocked 
                ? "Meeting completed and approved - cannot update" 
                : "";

              const mentorMinutes = isMentorUser
                ? meetingStatuses.filter((s) => s.statusApproval !== "Rejected")
                : [];

              const menteeMinutes = !isMentorUser
                ? meetingStatuses.filter((s) => s.statusApproval === "Approved")
                : [];

              return (
                <div key={m.meetingId} className="mentor-card glass-card">
                  {approvalBadge && (
                    <div className={`approval-badge ${approvalBadge.toLowerCase()}`}>
                      {approvalBadge}
                    </div>
                  )}

                  <div className="mentor-header card-header">
                    <div className="mentor-avatar">
                      {m.mentor.name[0]}
                    </div>
                    <div className="mentor-info">
                      <h2>{m.mentor.name}</h2>
                      <p>{mentorEmail}</p>
                    </div>
                  </div>

                  <div className="mentees-container">
                    <h4>Mentees:</h4>
                    {m.mentees.map((mt) => {
                      const isCurrentUser = mt.email?.toLowerCase() === userEmail?.toLowerCase();
                      return (
                        <p 
                          key={mt._id || mt.email}
                          className={isCurrentUser ? 'current-user-mentee' : ''}
                        >
                          {mt.name} ({mt.email})
                          {isCurrentUser && <span className="you-badge"> (You)</span>}
                        </p>
                      );
                    })}
                  </div>

                  <div className="meeting-block">
                    <p><strong>Date:</strong> {dateFormatted}</p>
                    <p><strong>Time:</strong> {timeFormatted}</p>
                    <p><strong>Duration:</strong> {m.duration} minutes</p>
                    <p><strong>Platform:</strong> {m.platform}</p>
                    <p><strong>Meeting Link:</strong> {m.meeting_link || "Not provided"}</p>
                    

                    {targetMentee && (
                      <button
                        className="update-meeting-btn"
                        disabled={isMeetingLocked}  // ✅ Disable based on meeting ID check
                        title={isMeetingLocked ? disableReason : "Update meeting status"}
                        onClick={() =>
                          goToUpdate(m.mentor, m.date, m.time, [targetMentee], m.meetingId)
                        }
                      >
                        Update Meeting
                      </button>
                    )}

                    {mentorMinutes.length > 0 && (
                      <div className="meeting-minutes-section">
                        {mentorMinutes.map((s) => (
                          <div key={s._id} className="minutes-card">
                            <p><strong>Status:</strong> <span className="status-indicator status-completed">{s.status}</span></p>
                            <p><strong>Minutes:</strong> {s.meeting_minutes}</p>

                            {isMentorUser && s.statusApproval === "Pending" && (
                              <div className="action-buttons">
                                <button
                                  className="approve-btn"
                                  disabled={actionLoadingId === s._id}
                                  onClick={() => handleMinutesAction(s._id, "Approved")}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  className="reject-btn"
                                  disabled={actionLoadingId === s._id}
                                  onClick={() => handleMinutesAction(s._id, "Rejected")}
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {menteeMinutes.length > 0 && (
                      <div className="meeting-minutes-section">
                        {menteeMinutes.map((s) => (
                          <div key={s._id} className="minutes-card">
                            <p><strong>Status:</strong> <span className="status-indicator status-completed">{s.status}</span></p>
                            <p><strong>Minutes:</strong> {s.meeting_minutes}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}