import React, { useState, useEffect } from "react";
import "./OverallWebinarReport.css";

// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const OverallWebinarReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [domains, setDomains] = useState([]);
  const [webinarReports, setWebinarReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch domains data
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/domains`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setDomains(data);
        
        // Fetch webinar reports for each domain
        data.forEach(domain => {
          fetchWebinarReports(domain.id);
        });
        
      } catch (err) {
        setError(err.message);
        console.error("Error fetching domains:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  // Fetch webinar reports for a specific domain
  const fetchWebinarReports = async (domainId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/webinars/domain/${domainId}${searchTerm ? `?search=${searchTerm}` : ''}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWebinarReports(prev => ({
        ...prev,
        [domainId]: data
      }));
      
    } catch (err) {
      console.error(`Error fetching reports for domain ${domainId}:`, err);
      // Keep existing data if available, otherwise set empty array
      if (!webinarReports[domainId]) {
        setWebinarReports(prev => ({
          ...prev,
          [domainId]: []
        }));
      }
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (domains.length > 0) {
        domains.forEach(domain => {
          fetchWebinarReports(domain.id);
        });
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Sample fallback data (remove in production)
  const fallbackDomains = [
    { id: 'd1', name: 'Full Stack Development', conducted: 4 },
    { id: 'd2', name: 'Artificial Intelligence', conducted: 2 },
    { id: 'd3', name: 'Cyber Security', conducted: 4 },
    { id: 'd4', name: 'Data Science', conducted: 4 },
    { id: 'd5', name: 'Cloud Computing', conducted: 4 },
    { id: 'd6', name: 'Embedded Systems', conducted: 4 },
    { id: 'd7', name: 'DevOps', conducted: 4 }
  ];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle error state
  if (error) {
    return (
      <div className="report-container">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <h2 className="report-title">Overall Webinar Report</h2>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Alumni, Topic, etc."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading && <div className="search-loading">Loading...</div>}
      </div>

      {/* Loading State */}
      {loading && domains.length === 0 && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading webinar reports...</p>
        </div>
      )}

      {/* Domain-wise Detailed Reports */}
      {(domains.length > 0 ? domains : fallbackDomains).map((domain) => (
        <div key={domain.id} className="domain-section">
          <div className="domain-header">
            <h3 className="domain-title">Detailed Report for {domain.name}</h3>
            <span className="domain-count">
              {webinarReports[domain.id]?.length || 0} Webinars
            </span>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Alumni Name</th>
                  <th>Batch</th>
                  <th>Designation</th>
                  <th>Webinar Topic</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Registered Count</th>
                  <th>Attended Count</th>
                  <th>Prize Winner Details</th>
                </tr>
              </thead>

              <tbody>
                {loading && !webinarReports[domain.id] ? (
                  // Loading rows
                  Array(Math.min(3, domain.conducted))
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index} className="loading-row">
                        <td colSpan="9">
                          <div className="loading-placeholder"></div>
                        </td>
                      </tr>
                    ))
                ) : webinarReports[domain.id] && webinarReports[domain.id].length > 0 ? (
                  // Actual data rows
                  webinarReports[domain.id].map((webinar, index) => (
                    <tr key={index}>
                      <td>{webinar.alumniName || "N/A"}</td>
                      <td>{webinar.batch || "N/A"}</td>
                      <td>{webinar.designation || "N/A"}</td>
                      <td>{webinar.topic || "N/A"}</td>
                      <td>{formatDate(webinar.date)}</td>
                      <td>{formatTime(webinar.time)}</td>
                      <td>{webinar.registeredCount || 0}</td>
                      <td>{webinar.attendedCount || 0}</td>
                      <td>
                        {webinar.prizeWinners && webinar.prizeWinners.length > 0 ? (
                          <ul className="winner-list">
                            {webinar.prizeWinners.map((winner, idx) => (
                              <li key={idx}>{winner}</li>
                            ))}
                          </ul>
                        ) : (
                          "No winners"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // No data or empty state
                  <tr>
                    <td colSpan="9" className="no-data">
                      {searchTerm ? "No results found" : "No webinar data available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Back Link */}
      <a href="/dashboard" className="back-link">← Back to Dashboard</a>
    </div>
  );
};

export default OverallWebinarReport;