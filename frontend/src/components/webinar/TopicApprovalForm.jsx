import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import stringSimilarity from 'string-similarity';
import Popup from './Popup';
import './Common.css';
import '../WebinarDashboard.css';

// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function TopicApprovalForm() {
  const navigate = useNavigate();
  const [selectedPhase, setSelectedPhase] = useState('');
  const [isPhaseDropdownOpen, setIsPhaseDropdownOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApprovalPopupVisible, setIsApprovalPopupVisible] = useState(false);
  const [approvalPopupMessage, setApprovalPopupMessage] = useState('');
  const [phases, setPhases] = useState([]);
  const [phasesLoading, setPhasesLoading] = useState(true);

  // Fetch all phases on component mount
  useEffect(() => {
    const fetchPhases = async () => {
      try {
        setPhasesLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/phases`);
        const data = await response.json();
        const phasesArray = data.phases || (Array.isArray(data) ? data : []);
        if (Array.isArray(phasesArray) && phasesArray.length > 0) {
          const phaseNames = phasesArray.map(phase => `Phase ${phase.phaseId}`).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
          setPhases(phaseNames);
          if (phaseNames.length > 0 && !selectedPhase) {
            setSelectedPhase(phaseNames[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching phases:', error);
      } finally {
        setPhasesLoading(false);
      }
    };
    fetchPhases();
  }, []);

  // Fetch topic approvals when selectedPhase changes
  useEffect(() => {
    if (selectedPhase) {
      fetchTopicApprovals(selectedPhase);
    }
  }, [selectedPhase]);

  const fetchTopicApprovals = async (phase = selectedPhase) => {
    try {
      setLoading(true);
      const url = phase
        ? `${API_BASE_URL}/api/topic-approvals?phase=${encodeURIComponent(phase)}`
        : `${API_BASE_URL}/api/topic-approvals`;
      const response = await fetch(url);
      const data = await response.json();
      setTopics(data.map(item => ({
        ...item,
        totalRequested: item.total_requested,
        status: item.approval
      })));
    } catch (error) {
      console.error('Error fetching topic approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseChange = (phase) => {
    setSelectedPhase(phase);
    setIsPhaseDropdownOpen(false);
    fetchTopicApprovals(phase);
  };

  const handleApprove = async (index) => {
    const topic = topics[index];
    const newStatus = topic.status === "Approved" ? "On Hold" : "Approved";

    try {
      const response = await fetch(`${API_BASE_URL}/api/topic-approvals/${topic._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approval: newStatus }),
      });

      if (response.ok) {
        const updatedTopics = [...topics];
        updatedTopics[index].status = newStatus;
        setTopics(updatedTopics);

        // Show approval popup
        setApprovalPopupMessage(`Topic "${topic.topic}" is now ${newStatus}.`);
        setIsApprovalPopupVisible(true);
      }
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  };

  const handleView = async (topic) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/student-requests/${encodeURIComponent(topic.domain)}/${encodeURIComponent(topic.topic)}`);
      const students = await response.json();

      // Fetch member details for each student email
      const studentsWithDetails = await Promise.all(
        students.map(async (student, index) => {
          try {
            const memberResponse = await fetch(`${API_BASE_URL}/api/member-by-email?email=${encodeURIComponent(student.email)}`);
            const memberData = await memberResponse.json();

            return {
              serialNumber: index + 1,
              email: student.email,
              name: memberData.found ? memberData.name : 'N/A',
              department: memberData.found ? memberData.department : 'N/A',
              topic: student.topic,
              reason: student.reason
            };
          } catch (error) {
            console.error('Error fetching member details for email:', student.email, error);
            return {
              serialNumber: index + 1,
              email: student.email,
              name: 'N/A',
              department: 'N/A',
              topic: student.topic,
              reason: student.reason
            };
          }
        })
      );

      setSelectedTopic({
        ...topic,
        students: studentsWithDetails
      });
      setIsPopupOpen(true);
    } catch (error) {
      console.error('Error fetching student requests:', error);
    }
  };

  return (
    <div className="student-form-page">
      <div className="form-wrapper">
        <div>
          <button className="back-btn" onClick={() => navigate("/webinar-dashboard")}>
            <ArrowLeft className="back-btn-icon" /> Back to Dashboard
          </button>

          <div className="form-header">
            <div className="icon-wrapper">
              <CheckCircle className="header-icon" />
            </div>
            <h1 className="form-title topic-approval-header">Requested Topic Approval</h1>
          </div>

          {/* Phase Dropdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem',marginRight:'10.5rem' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={selectedPhase}
                onChange={(e) => handlePhaseChange(e.target.value)}
                className="phase-dropdown"
                style={{
                  appearance: 'none',
                  backgroundColor: 'white',
                  border: '2px solid #7c3aed',
                  borderRadius: '8px',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#5b21b6',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '150px'
                }}
              >
                {phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
              <div style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#5b21b6'
              }}>
               ▼
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg" style={{ maxWidth: '80%', margin: '0 auto' }}>
            <table className="w-full topic-approval-table" style={{ borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', backgroundColor: 'transparent', fontSize: '1.1rem' }}>
              <thead className="bg-gradient-to-r from-purple-600 to-blue-500">
                <tr>
                  <th className="px-6 py-5 text-left text-2xl font-semibold text-white uppercase tracking-wide" style={{ width: '25%' }}>DOMAIN</th>
                  <th className="px-6 py-5 text-left text-2xl font-semibold text-white uppercase tracking-wide" style={{ width: '18%' }}>TOPIC</th>
                  <th className="px-6 py-5 text-center text-2xl font-semibold text-white uppercase tracking-wide" style={{ width: '12%' }}>TOTAL REQUESTED</th>
                  <th className="px-6 py-5 text-center text-2xl font-semibold text-white uppercase tracking-wide" style={{ width: '12%' }}>STATUS</th>
                  <th className="px-6 py-5 text-center text-2xl font-semibold text-white uppercase tracking-wide" style={{ width: '16%' }}>ACTION</th>
                  <th className="px-6 py-5 text-center text-2xl font-semibold text-white uppercase tracking-wide" style={{ width: '17%' }}>DETAILS</th>
                </tr>
              </thead>
              <br></br>
              <tbody style={{ backgroundColor: 'transparent' }}>
                {topics.map((item, index) => (
                   
                  <tr key={index} className="hover:bg-purple-50 transition-colors " style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'transparent', marginBottom: '0.5rem', display: 'table-row' }}>
                    <td className="px-6 py-6  text-2xl font-medium text-gray-900" style={{ width: '25%' ,}}>{item.domain} </td>
                    <td className="px-6 py-6 text-2xl text-gray-700" style={{ width: '18%' }}>{item.topic}</td>
                    <td className="px-6 py-6 text-2xl font-semibold text-center text-gray-900" style={{ width: '12%' }}>{item.totalRequested}</td>
                    <td className="px-6 py-6 text-center" style={{ width: '12%' }}>
                      <span
                        className={`inline-flex px-4 py-2 text-base font-semibold rounded-full ${
                          item.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center" style={{ width: '16%' }}>
                      <button
                        onClick={() => handleApprove(index)}
                        disabled={item.status === "Approved"}
                        className={`inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white transition-all whitespace-nowrap ${
                          item.status === "Approved"
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                        }`}
                      >
                        ✓ Approve
                      </button>
                    </td>
                    <td className="px-6 py-6 text-center" style={{ width: '17%' }}>
                      <button
                        onClick={() => handleView(item)}
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all whitespace-nowrap"
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View
                      </button>
                    </td>
                  </tr>
              
                  
                ))
                
                }
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500">
            Designed with 💜 for Alumni Network
          </div>
        </div>
      </div>

      {/* Popup */}
      {isPopupOpen && selectedTopic && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Students Requested for "{selectedTopic.topic}"</h3>
            </div>

            <div className="modal-body">
              <div className="stats-grid">
                <div className="stat">
                  <div className="label">Domain</div>
                  <div className="value">{selectedTopic.domain}</div>
                </div>
                <div className="stat">
                  <div className="label">Total Requested</div>
                  <div className="value">{selectedTopic.totalRequested}</div>
                </div>
                <div className="stat">
                  <div className="label">Status</div>
                  <div className="value">{selectedTopic.status}</div>
                </div>
              </div>

              <h4 style={{ marginTop: '24px', marginBottom: '16px', color: '#5b21b6', fontWeight: '600', fontSize: '18px' }}>Student Details</h4>

              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-5 gap-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold p-4 text-center" style={{ borderRadius: '8px 8px 0 0' }}>
                <div>Serial Number</div>
                <div>Name</div>
                <div>Email</div>
                <div>Department</div>
                <div>Reason</div>
              </div>

              {/* Mobile Header */}
              <div className="md:hidden bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold p-4 text-center">
                <h5 className="text-sm">Student Details</h5>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200" style={{ backgroundColor: 'white', borderRadius: '0 0 8px 8px' }}>
                {selectedTopic.students.map((student, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 items-center hover:bg-purple-50 transition-colors"
                  >
                    {/* Mobile */}
                    <div className="md:hidden space-y-2">
                      <div className="font-semibold text-purple-800">#{student.serialNumber} - {student.name}</div>
                      <div className="text-sm text-gray-700">{student.email}</div>
                      <div className="text-sm text-gray-600">Department: {student.department}</div>
                      <div className="text-sm text-gray-600">Reason: {student.reason}</div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block text-gray-800 font-medium text-center">{student.serialNumber}</div>
                    <div className="hidden md:block text-gray-700 text-center">{student.name}</div>
                    <div className="hidden md:block text-gray-700 text-center">{student.email}</div>
                    <div className="hidden md:block text-gray-700 text-center font-semibold">{student.department}</div>
                    <div className="hidden md:block text-gray-700 text-center">{student.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setIsPopupOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Popup */}
      {isApprovalPopupVisible && (
        <Popup
          message={approvalPopupMessage}
          type="success"
          onClose={() => setIsApprovalPopupVisible(false)}
        />
      )}
    </div>
  );
}