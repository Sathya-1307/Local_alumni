import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDashboard() {
  const [phases, setPhases] = useState([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Fetch all phases and counts
  const fetchPhases = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/phase`);
      const phasesData = res.data.phases;

      // Fetch mentee and mentor counts for each phase
      const phasesWithCounts = await Promise.all(
        phasesData.map(async (phase) => {
          try {
            const [menteeRes, mentorRes] = await Promise.all([
              axios.get(
                `${API_BASE_URL}/api/phase/mentee-count?phaseId=${phase.phaseId}`
              ),
              axios.get(
                `${API_BASE_URL}/api/phase/mentor-count?phaseId=${phase.phaseId}`
              ),
            ]);

            return {
              ...phase,
              menteeCount: menteeRes.data.count || 0,
              mentorCount: mentorRes.data.count || 0,
            };
          } catch (err) {
            console.error("Error fetching counts for phase", phase.phaseId, err);
            return {
              ...phase,
              menteeCount: 0,
              mentorCount: 0,
            };
          }
        })
      );

      setPhases(phasesWithCounts);
    } catch (err) {
      console.error("Error fetching phases:", err);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  // Handle creating a new phase
  const handleCreatePhase = async () => {
    setError("");
    if (!name || !startDate || !endDate) {
      return setError("All fields are required");
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/phase`, {
        name,
        startDate,
        endDate,
      });

      // Reset form
      setName("");
      setStartDate("");
      setEndDate("");

      // Refresh list
      fetchPhases();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating phase");
    }

    setLoading(false);
  };

  // Helper to check phase status
  const getPhaseStatus = (start, end) => {
    const now = new Date();
    const startD = new Date(start);
    const endD = new Date(end);

    if (now > endD) return "completed";
    if (now >= startD && now <= endD) return "ongoing";
    return "upcoming";
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "ongoing":
        return "status-ongoing";
      case "upcoming":
        return "status-upcoming";
      default:
        return "";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate("/dashboard");
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Back Button */}
      <button className="back-button" onClick={handleBackClick}>
        <span className="back-icon">←</span>
        <span className="back-text">Back to Home</span>
      </button>

      <div className="admin-container">
        <h1 className="admin-title">Phase Management Dashboard</h1>

        {/* Create New Phase Form */}
        <div className="create-phase-card glass-card">
          <h2 className="section-title">Create New Phase</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="create-phase-form">
            <input
              type="text"
              placeholder="Phase Name (e.g., Phase 5)"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              onClick={handleCreatePhase}
              disabled={loading}
              className="create-phase-btn"
            >
              {loading ? "Creating..." : "Create Phase"}
            </button>
          </div>
        </div>

        {/* Existing Phases Grid */}
        <div className="phases-section">
          <h2 className="section-title">Existing Phases</h2>
          
          {phases.length === 0 ? (
            <div className="empty-state glass-card">
              <p>No phases created yet. Create your first phase above!</p>
            </div>
          ) : (
            <div className="phases-grid">
              {phases.map((phase) => {
                const status = getPhaseStatus(phase.startDate, phase.endDate);
                return (
                  <div key={phase.phaseId} className="phase-card glass-card">
                    <div className="phase-header">
                      <div className="phase-avatar">
                        P{phase.phaseId}
                      </div>
                      <div className="phase-info">
                        <h3>{phase.name}</h3>
                        <div className={`status-pill ${getStatusColor(status)}`}>
                          {status.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="phase-dates">
                      <div className="date-item">
                        <span className="date-label">Start Date</span>
                        <span className="date-value">{formatDate(phase.startDate)}</span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">End Date</span>
                        <span className="date-value">{formatDate(phase.endDate)}</span>
                      </div>
                    </div>

                    <div className="phase-stats">
                      <div className="stat-item">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                          <span className="stat-label">Mentees</span>
                          <span className="stat-value">{phase.menteeCount}</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon">🧑‍🏫</div>
                        <div className="stat-info">
                          <span className="stat-label">Mentors</span>
                          <span className="stat-value">{phase.mentorCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="phase-id">
                      <span className="id-label">Phase ID:</span>
                      <span className="id-value">{phase.phaseId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}